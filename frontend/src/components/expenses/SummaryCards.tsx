import React, { useMemo } from 'react';
import { Grid, Paper, Stack, Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Savings,
  AccountBalanceWallet,
  AccountBalance,
} from '@mui/icons-material';
import { currencyFormat } from '../../utils/formatting';
import { getCardStyles, getIconBoxStyles, getLabelStyles, getValueStyles, getCaptionStyles, convertAmount } from './utils';
import { ExpenseTrackingColors, CategoryChartData, BudgetStatus, Transaction } from './types';
import { Budget, Account } from '../../services/api';

interface SummaryCardsProps {
  filteredExpenses: Transaction[];
  categoryChartData: CategoryChartData | null;
  budgetStatus: BudgetStatus | null;
  displayCurrency: string;
  exchangeRates: { [key: string]: number };
  allComparisonExpenses: Transaction[];
  filterStartDate: string;
  filterEndDate: string;
  colors: ExpenseTrackingColors;
  verticalLayout?: boolean;
  budgets?: Budget[];
  comparisonBudgetId?: string | null;
  accounts?: Account[];
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  filteredExpenses,
  categoryChartData,
  budgetStatus,
  displayCurrency,
  exchangeRates,
  allComparisonExpenses,
  filterStartDate,
  filterEndDate,
  colors,
  verticalLayout = false,
  budgets = [],
  comparisonBudgetId = null,
  accounts = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Create account currency map
  const accountCurrencyMap = useMemo(() => {
    if (!accounts || accounts.length === 0) return new Map();
    return new Map(accounts.map(a => [a.account_id, a.currency_code]));
  }, [accounts]);
  
  // Calculate trend for Total Spending card
  const spendingTrend = useMemo(() => {
    if (!categoryChartData || filteredExpenses.length === 0 || !filterStartDate || !filterEndDate) return null;
    
    const start = new Date(filterStartDate);
    const end = new Date(filterEndDate);
    const periodLength = end.getTime() - start.getTime();
    const previousPeriodStart = new Date(start.getTime() - periodLength - 1);
    const previousPeriodEnd = new Date(start.getTime() - 1);
    
    const previousPeriodExpenses = allComparisonExpenses.filter(expense => {
      const expenseDate = new Date(expense.transaction_date);
      return expenseDate >= previousPeriodStart && expenseDate <= previousPeriodEnd;
    });
    
    const previousTotal = previousPeriodExpenses.reduce((sum, expense) => {
      const accountCurrency = accountCurrencyMap.get(expense.account_id) || 'EUR';
      const convertedAmount = convertAmount(
        Math.abs(expense.amount),
        accountCurrency,
        displayCurrency,
        exchangeRates
      );
      return sum + convertedAmount;
    }, 0);
    
    const currentTotal = categoryChartData.total;
    const trend = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
    
    if (previousTotal === 0 && currentTotal === 0) return null;
    
    return {
      value: Math.abs(trend),
      isPositive: trend > 0,
    };
  }, [categoryChartData, filteredExpenses, allComparisonExpenses, filterStartDate, filterEndDate, displayCurrency, exchangeRates, accountCurrencyMap]);

  // Calculate total budgeted
  const totalBudgeted = useMemo(() => {
    if (!comparisonBudgetId || !budgets.length) return null;
    const selectedBudget = budgets.find(b => String(b.budget_id) === comparisonBudgetId);
    if (!selectedBudget) return null;
    return (selectedBudget.categories || []).reduce((sum: number, cat: any) => sum + (cat.budgeted_amount || 0), 0);
  }, [comparisonBudgetId, budgets]);

  // Calculate largest expense
  const largestExpense = useMemo(() => {
    if (filteredExpenses.length === 0) return null;
    
    const largest = filteredExpenses.reduce((max, expense) => {
      const accountCurrency = accountCurrencyMap.get(expense.account_id) || 'EUR';
      const amount = convertAmount(
        Math.abs(expense.amount),
        accountCurrency,
        displayCurrency,
        exchangeRates
      );
      const maxAccountCurrency = accountCurrencyMap.get(max.account_id) || 'EUR';
      const maxAmount = convertAmount(
        Math.abs(max.amount),
        maxAccountCurrency,
        displayCurrency,
        exchangeRates
      );
      return amount > maxAmount ? expense : max;
    });
    
    const accountCurrency = accountCurrencyMap.get(largest.account_id) || 'EUR';
    const amount = convertAmount(
      Math.abs(largest.amount),
      accountCurrency,
      displayCurrency,
      exchangeRates
    );
    
    return {
      amount,
      merchant: largest.merchant || largest.category || 'Unknown',
    };
  }, [filteredExpenses, displayCurrency, exchangeRates, accountCurrencyMap]);

  // Calculate average per day
  const avgPerDay = useMemo(() => {
    if (!categoryChartData || filteredExpenses.length === 0) return { avg: 0, days: 0 };
    const uniqueDates = new Set(filteredExpenses.map(e => e.transaction_date));
    const days = uniqueDates.size || 1;
    const avg = categoryChartData.total / days;
    return { avg, days };
  }, [categoryChartData, filteredExpenses]);

  if (filteredExpenses.length === 0) return null;

  return (
    <Grid container spacing={verticalLayout ? 2 : { xs: 2, md: 3 }} sx={{ mb: 3 }}>
      {/* Card 1: Total Budgeted */}
      <Grid item xs={6} sm={6}>
        <Paper 
          elevation={0} 
          sx={{
            ...getCardStyles(colors, colors.card_accent),
            ...(isMobile && {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }),
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
            <Box sx={getIconBoxStyles(colors.card_accent)}>
              <AccountBalance sx={{ color: colors.card_accent, fontSize: 20 }} />
            </Box>
            <Typography sx={getLabelStyles(colors)}>Total Budgeted</Typography>
          </Stack>
          <Typography sx={getValueStyles(colors)}>
            {totalBudgeted !== null && budgetStatus
              ? currencyFormat(totalBudgeted, budgetStatus.currency)
              : '—'}
          </Typography>
          {totalBudgeted !== null && budgetStatus ? (
            <Typography sx={getCaptionStyles(colors)}>
              {budgetStatus.currency}
            </Typography>
          ) : (
            <Typography sx={getCaptionStyles(colors)}>
              Select a budget
            </Typography>
          )}
        </Paper>
      </Grid>

      {/* Card 2: Budget Status */}
      <Grid item xs={6} sm={6}>
        <Paper
          elevation={0}
          sx={{
            ...getCardStyles(
              colors,
              budgetStatus ? budgetStatus.color : colors.card_accent,
              budgetStatus ? budgetStatus.color : undefined
            ),
            ...(isMobile && {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }),
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
            <Box sx={getIconBoxStyles(budgetStatus ? budgetStatus.color : colors.card_accent)}>
              <Savings sx={{ color: budgetStatus ? budgetStatus.color : colors.card_accent, fontSize: 20 }} />
            </Box>
            <Typography sx={getLabelStyles(colors)}>
              {budgetStatus ? 'Budget Status' : 'No Budget'}
            </Typography>
          </Stack>
          {budgetStatus ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <Typography sx={getValueStyles(colors, budgetStatus.color)}>
                {budgetStatus.isOverBudget ? '-' : ''}{currencyFormat(budgetStatus.remaining, budgetStatus.currency)}
              </Typography>
              <Typography sx={getCaptionStyles(colors)}>
                {budgetStatus.isOverBudget ? 'Overspent' : 'Remaining'}
              </Typography>
            </Box>
          ) : (
            <Typography
              sx={{
                color: colors.card_subtext,
                fontSize: '0.75rem',
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              Select a budget to track
            </Typography>
          )}
        </Paper>
      </Grid>

      {/* Card 3: Average Per Day */}
      <Grid item xs={6} sm={6}>
        <Paper 
          elevation={0} 
          sx={{
            ...getCardStyles(colors, colors.cash),
            ...(isMobile && {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }),
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
            <Box sx={getIconBoxStyles(colors.cash)}>
              <TrendingUp sx={{ color: colors.cash, fontSize: 20 }} />
            </Box>
            <Typography sx={getLabelStyles(colors)}>Avg Per Day</Typography>
          </Stack>
          <Typography sx={getValueStyles(colors)}>
            {currencyFormat(avgPerDay.avg, displayCurrency)}
          </Typography>
          <Typography sx={getCaptionStyles(colors)}>
            {avgPerDay.days} {avgPerDay.days === 1 ? 'day' : 'days'}
          </Typography>
        </Paper>
      </Grid>

      {/* Card 4: Largest Expense */}
      <Grid item xs={6} sm={6}>
        <Paper 
          elevation={0} 
          sx={{
            ...getCardStyles(colors, colors.investment),
            ...(isMobile && {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }),
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
            <Box sx={getIconBoxStyles(colors.investment)}>
              <AccountBalanceWallet sx={{ color: colors.investment, fontSize: 20 }} />
            </Box>
            <Typography sx={getLabelStyles(colors)}>Largest Expense</Typography>
          </Stack>
          {largestExpense ? (
            <>
              <Typography sx={getValueStyles(colors)}>
                {currencyFormat(largestExpense.amount, displayCurrency)}
              </Typography>
              <Typography sx={getCaptionStyles(colors)}>
                {largestExpense.merchant}
              </Typography>
            </>
          ) : (
            <Typography
              sx={{
                color: colors.card_subtext,
                fontSize: '0.75rem',
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              No data
            </Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

