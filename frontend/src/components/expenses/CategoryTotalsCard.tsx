import React, { useMemo } from 'react';
import { Grid, Paper, Stack, Box, Typography, IconButton, FormControl, Select, MenuItem } from '@mui/material';
import { ArrowBack, Add, Receipt, Business, CurrencyExchange, CompareArrows, Home, ShoppingBag, Savings } from '@mui/icons-material';
import { currencyFormat } from '../../utils/formatting';
import { getBorderOpacity, hexToRgba, iconMap } from '../budget/utils';
import { convertAmount, getCategoryColor, getCurrencyColor, getCategoryIcon, getCurrencyIcon } from './utils';
import { ExpenseTrackingColors, CategoryChartData } from './types';
import { Transaction, Account, Budget } from '../../services/api';

interface CategoryTotalsCardProps {
  categoryChartData: CategoryChartData | null;
  filteredExpenses: Transaction[];
  selectedCategory: string | null;
  categoryView: 'category' | 'currency' | 'merchant' | 'budget';
  displayCurrency: string;
  exchangeRates: { [key: string]: number };
  colors: ExpenseTrackingColors;
  colorPalette: string;
  accounts: Account[];
  budgets: Budget[];
  comparisonBudgetId: string | null;
  selectedBudgetType?: 'needs' | 'wants' | 'savings' | null;
  selectedBudgetCategory?: string | null;
  selectedCategoryForLinked?: string | null;
  selectedLinkedCategoryName?: string | null;
  onCategorySelect: (category: string | null) => void;
  onViewChange: (view: 'category' | 'currency' | 'merchant' | 'budget') => void;
  onBudgetTypeSelect?: (type: 'needs' | 'wants' | 'savings' | null) => void;
  onBudgetCategorySelect?: (category: string | null) => void;
  onCategoryForLinkedSelect?: (category: string | null) => void;
  onLinkedCategoryNameSelect?: (category: string | null) => void;
  onAddExpense: (prefillData?: Partial<Transaction>) => void;
  onExpenseClick: (expense: Transaction) => void;
  gridSize?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
}

export const CategoryTotalsCard: React.FC<CategoryTotalsCardProps> = ({
  categoryChartData,
  filteredExpenses,
  selectedCategory,
  categoryView,
  displayCurrency,
  exchangeRates,
  colors,
  colorPalette,
  accounts,
  budgets,
  comparisonBudgetId,
  selectedBudgetType = null,
  selectedBudgetCategory = null,
  selectedCategoryForLinked = null,
  selectedLinkedCategoryName = null,
  onCategorySelect,
  onViewChange,
  onBudgetTypeSelect,
  onBudgetCategorySelect,
  onCategoryForLinkedSelect,
  onLinkedCategoryNameSelect,
  onAddExpense,
  onExpenseClick,
  gridSize = { xs: 12, md: 6 },
}) => {
  // Create account currency map
  const accountCurrencyMap = useMemo(() => {
    return new Map(accounts.map(a => [a.account_id, a.currency_code]));
  }, [accounts]);

  // Get selected budget
  const selectedBudget = useMemo(() => {
    return comparisonBudgetId ? budgets.find(b => String(b.budget_id) === comparisonBudgetId) : null;
  }, [comparisonBudgetId, budgets]);

  // Calculate actual spending by expense category (for budget view)
  const expenseSpending = useMemo(() => {
    if (!selectedBudget) return {};
    const spending: { [category: string]: number } = {};
    filteredExpenses.forEach(expense => {
      const accountCurrency = accountCurrencyMap.get(expense.account_id) || 'EUR';
      const convertedAmount = convertAmount(Math.abs(expense.amount), accountCurrency, selectedBudget.currency, exchangeRates);
      if (!spending[expense.category || '']) {
        spending[expense.category || ''] = 0;
      }
      spending[expense.category || ''] += convertedAmount;
    });
    return spending;
  }, [filteredExpenses, selectedBudget, exchangeRates, accountCurrencyMap]);

  // Match budget categories with actual spending using mappings
  const comparisonData = useMemo(() => {
    if (!selectedBudget) return [];
    return (selectedBudget.categories || []).map((category: any) => {
      let actual = 0;
      if (expenseSpending[category.name]) {
        actual += expenseSpending[category.name];
      }
      if (category.mapped_expense_categories && category.mapped_expense_categories.length > 0) {
        category.mapped_expense_categories.forEach((mappedCategory: string) => {
          if (expenseSpending[mappedCategory]) {
            actual += expenseSpending[mappedCategory];
          }
        });
      }
      const budgeted = category.budgeted_amount || 0;
      const percentage = budgeted > 0 ? (actual / budgeted) * 100 : 0;
      const remaining = budgeted - actual;
      const isOverspent = remaining < 0;
      const uniqueDates = new Set(filteredExpenses.map(e => e.transaction_date));
      const daysInPeriod = uniqueDates.size || 1;
      const dailyRate = daysInPeriod > 0 ? actual / daysInPeriod : 0;
      
      return {
        category: category.name,
        budgeted,
        actual,
        percentage,
        remaining,
        isOverspent,
        dailyRate,
        type: category.type,
        icon: category.icon,
      };
    });
  }, [selectedBudget, expenseSpending, filteredExpenses]);

  // Group by type (Needs, Wants, Savings)
  const displayData = useMemo(() => {
    if (!selectedBudget) return [];
    const groupedByType: { [type: string]: { budgeted: number; actual: number; items: typeof comparisonData } } = {};
    comparisonData.forEach(item => {
      if (!groupedByType[item.type]) {
        groupedByType[item.type] = { budgeted: 0, actual: 0, items: [] };
      }
      groupedByType[item.type].budgeted += item.budgeted;
      groupedByType[item.type].actual += item.actual;
      groupedByType[item.type].items.push(item);
    });
    
    return Object.keys(groupedByType).map(type => {
      const group = groupedByType[type];
      const percentage = group.budgeted > 0 ? (group.actual / group.budgeted) * 100 : 0;
      const remaining = group.budgeted - group.actual;
      const isOverspent = remaining < 0;
      const uniqueDates = new Set(filteredExpenses.map(e => e.transaction_date));
      const daysInPeriod = uniqueDates.size || 1;
      const dailyRate = daysInPeriod > 0 ? group.actual / daysInPeriod : 0;
      
      return {
        category: type.charAt(0).toUpperCase() + type.slice(1),
        budgeted: group.budgeted,
        actual: group.actual,
        percentage,
        remaining,
        isOverspent,
        dailyRate,
        type: type,
        icon: type === 'needs' ? 'home' : type === 'wants' ? 'shopping' : 'savings',
      };
    }).sort((a, b) => {
      const order = ['needs', 'wants', 'savings'];
      return order.indexOf(a.type) - order.indexOf(b.type);
    });
  }, [comparisonData, filteredExpenses]);

  // Get icon colors based on category type
  const getCategoryIconColor = (type: string, index: number) => {
    const typeColors: { [key: string]: string[] } = {
      'needs': colorPalette === 'Dark Mode' 
        ? ['#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8']
        : ['#1976D2', '#1E88E5', '#2196F3', '#42A5F5'],
      'wants': colorPalette === 'Dark Mode'
        ? ['#10B981', '#059669', '#047857', '#065F46']
        : ['#00897B', '#009688', '#26A69A', '#4DB6AC'],
      'savings': colorPalette === 'Dark Mode'
        ? ['#F59E0B', '#D97706', '#B45309', '#92400E']
        : ['#1976D2', '#1E88E5', '#2196F3', '#42A5F5'],
    };
    const typeColorArray = typeColors[type] || typeColors['needs'];
    return typeColorArray[index % typeColorArray.length];
  };

  // Sort items by amount (highest to lowest)
  const sortedItems = useMemo(() => {
    if (!categoryChartData) return [];
    return categoryChartData.labels.map((label, index) => ({
      label,
      amount: categoryChartData.values[index],
      count: categoryChartData.counts[index],
      color: categoryChartData.viewType === 'currency'
        ? getCurrencyColor(label, index, colorPalette, [])
        : getCategoryColor(label, index, colorPalette, []),
      originalIndex: index,
    })).sort((a, b) => b.amount - a.amount);
  }, [categoryChartData, colorPalette]);

  // Get expenses for selected category, currency, or merchant
  const selectedExpenses = useMemo(() => {
    if (!selectedCategory) return [];
    return filteredExpenses.filter(e => {
      if (categoryView === 'currency') {
        const accountCurrency = accountCurrencyMap.get(e.account_id) || 'EUR';
        return accountCurrency === selectedCategory;
      } else if (categoryView === 'merchant') {
        return e.merchant === selectedCategory;
      } else {
        return e.category === selectedCategory;
      }
    }).sort((a, b) => {
      const dateA = new Date(a.transaction_date).getTime();
      const dateB = new Date(b.transaction_date).getTime();
      return dateB - dateA; // Newest first
    });
  }, [selectedCategory, filteredExpenses, categoryView, accountCurrencyMap]);

  // Group expenses by date
  const expensesByDate = useMemo(() => {
    const grouped: { [date: string]: Transaction[] } = {};
    selectedExpenses.forEach(expense => {
      const dateKey = expense.transaction_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(expense);
    });
    return grouped;
  }, [selectedExpenses]);

  // Sort dates (newest first)
  const sortedDates = useMemo(() => {
    return Object.keys(expensesByDate).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [expensesByDate]);

  // Show budget vs actual view when categoryView is 'budget'
  if (categoryView === 'budget') {
    if (!selectedBudget || displayData.length === 0) {
      return (
        <Grid item xs={gridSize.xs || 12} sm={gridSize.sm} md={gridSize.md || 6} lg={gridSize.lg} xl={gridSize.xl}>
          <Paper
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${colors.card_bg} 0%, ${hexToRgba(colors.card_text, 0.02)} 100%)`,
              borderRadius: 4,
              border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                color: colors.card_subtext,
                fontFamily: 'Inter, -apple-system, sans-serif',
                textAlign: 'center',
              }}
            >
              {!selectedBudget ? 'Please select a budget to compare' : 'No budget data available'}
            </Typography>
          </Paper>
        </Grid>
      );
    }

    return (
      <Grid item xs={gridSize.xs || 12} sm={gridSize.sm} md={gridSize.md || 6} lg={gridSize.lg} xl={gridSize.xl}>
        <Paper
          elevation={0}
          sx={{
            background: `linear-gradient(135deg, ${colors.card_bg} 0%, ${hexToRgba(colors.card_text, 0.02)} 100%)`,
            borderRadius: 4,
            border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              borderColor: colors.card_subtext + '30',
              boxShadow: 3,
            },
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: colorPalette === 'Dark Mode'
                ? `linear-gradient(90deg, #60A5FA 0%, #10B981 50%, #F59E0B 100%)`
                : `linear-gradient(90deg, #1976D2 0%, #42A5F5 50%, #64B5F6 100%)`,
              borderRadius: '4px 4px 0 0',
            },
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <CompareArrows sx={{ color: colors.card_accent, fontSize: 22 }} />
              <Typography
                variant="h6"
                sx={{
                  color: colors.card_text,
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                Budget vs Actual
              </Typography>
            </Stack>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={categoryView}
                onChange={(e) => onViewChange(e.target.value as 'category' | 'currency' | 'merchant' | 'budget')}
                sx={{
                  color: colors.card_text,
                  backgroundColor: colors.card_bg,
                  fontSize: '0.875rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${colors.card_subtext}${getBorderOpacity(0.2)}`,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${colors.card_subtext}${getBorderOpacity(0.4)}`,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.card_accent,
                  },
                }}
              >
                <MenuItem value="category">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Receipt sx={{ fontSize: 18 }} />
                    <span>Category</span>
                  </Stack>
                </MenuItem>
                <MenuItem value="merchant">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Business sx={{ fontSize: 18 }} />
                    <span>Merchant</span>
                  </Stack>
                </MenuItem>
                <MenuItem value="currency">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CurrencyExchange sx={{ fontSize: 18 }} />
                    <span>Currency</span>
                  </Stack>
                </MenuItem>
                <MenuItem value="budget">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CompareArrows sx={{ fontSize: 18 }} />
                    <span>Budget vs Actual</span>
                  </Stack>
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Box
            sx={{
              maxHeight: 320,
              overflowY: 'auto',
              pr: 1,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: colorPalette === 'Dark Mode' ? '#1A1A1A' : '#F5F5F5',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: colors.card_subtext + '40',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: colors.card_subtext + '60',
                },
              },
            }}
          >
            <Stack spacing={2}>
              {displayData.map((item) => {
                const maxValue = Math.max(item.budgeted, item.actual);
                const budgetPercentage = maxValue > 0 ? (item.budgeted / maxValue) * 100 : 0;
                const actualPercentage = maxValue > 0 ? (item.actual / maxValue) * 100 : 0;
                
                return (
                  <Box key={item.category}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography
                        sx={{
                          color: colors.card_text,
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          fontFamily: 'Inter, -apple-system, sans-serif',
                        }}
                      >
                        {item.category}
                      </Typography>
                      <Typography
                        sx={{
                          color: item.isOverspent ? '#EF4444' : colors.card_text,
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          fontFamily: 'Inter, -apple-system, sans-serif',
                        }}
                      >
                        {item.isOverspent ? 'Overspent' : `${item.percentage.toFixed(0)}%`}
                      </Typography>
                    </Stack>
                    
                    {/* Budgeted Bar */}
                    <Box sx={{ mb: 0.5 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
                        <Typography
                          sx={{
                            color: colors.card_subtext,
                            fontSize: '0.75rem',
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            minWidth: 60,
                          }}
                        >
                          Budgeted
                        </Typography>
                        <Box
                          sx={{
                            flex: 1,
                            height: 8,
                            backgroundColor: `${colors.card_subtext}${getBorderOpacity(0.1)}`,
                            borderRadius: 4,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              width: `${budgetPercentage}%`,
                              height: '100%',
                              backgroundColor: colors.card_accent,
                              borderRadius: 4,
                            }}
                          />
                        </Box>
                        <Typography
                          sx={{
                            color: colors.card_text,
                            fontSize: '0.75rem',
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            fontWeight: 600,
                            minWidth: 70,
                            textAlign: 'right',
                          }}
                        >
                          {currencyFormat(item.budgeted, selectedBudget.currency)}
                        </Typography>
                      </Stack>
                    </Box>
                    
                    {/* Actual Bar */}
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography
                          sx={{
                            color: colors.card_subtext,
                            fontSize: '0.75rem',
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            minWidth: 60,
                          }}
                        >
                          Actual
                        </Typography>
                        <Box
                          sx={{
                            flex: 1,
                            height: 8,
                            backgroundColor: `${colors.card_subtext}${getBorderOpacity(0.1)}`,
                            borderRadius: 4,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              width: `${actualPercentage}%`,
                              height: '100%',
                              backgroundColor: item.isOverspent ? '#EF4444' : '#10B981',
                              borderRadius: 4,
                            }}
                          />
                        </Box>
                        <Typography
                          sx={{
                            color: item.isOverspent ? '#EF4444' : colors.card_text,
                            fontSize: '0.75rem',
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            fontWeight: 600,
                            minWidth: 70,
                            textAlign: 'right',
                          }}
                        >
                          {currencyFormat(item.actual, selectedBudget.currency)}
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Paper>
      </Grid>
    );
  }

  if (!categoryChartData) return null;

  const selectedItem = sortedItems.find(item => item.label === selectedCategory);
  const selectedItemColor = selectedItem?.color || colors.card_accent;

  return (
    <Grid item xs={gridSize.xs || 12} sm={gridSize.sm} md={gridSize.md || 6} lg={gridSize.lg} xl={gridSize.xl}>
      <Paper
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${colors.card_bg} 0%, ${hexToRgba(colors.card_text, 0.02)} 100%)`,
          borderRadius: 4,
          border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
          p: 3,
          height: '100%',
          minHeight: { md: 500 },
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            borderColor: colors.card_subtext + '30',
            boxShadow: 3,
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: colorPalette === 'Dark Mode'
              ? `linear-gradient(90deg, #60A5FA 0%, #10B981 50%, #F59E0B 100%)`
              : `linear-gradient(90deg, #1976D2 0%, #42A5F5 50%, #64B5F6 100%)`,
            borderRadius: '4px 4px 0 0',
          },
        }}
      >
        {selectedCategory ? (
          // Show expenses for selected category
          <>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton
                  size="small"
                  onClick={() => onCategorySelect(null)}
                  sx={{
                    color: colors.card_text,
                    '&:hover': {
                      backgroundColor: hexToRgba(colors.card_text, 0.1),
                    },
                  }}
                >
                  <ArrowBack />
                </IconButton>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: hexToRgba(selectedItemColor, 0.15),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: selectedItemColor,
                    flexShrink: 0,
                  }}
                >
                  {categoryView === 'currency'
                    ? React.cloneElement(getCurrencyIcon(selectedCategory), { sx: { fontSize: 18 } })
                    : categoryView === 'merchant'
                    ? <Business sx={{ fontSize: 18 }} />
                    : React.cloneElement(getCategoryIcon(selectedCategory), { sx: { fontSize: 18 } })}
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: colors.card_text,
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                  }}
                >
                  {selectedCategory}
                </Typography>
              </Stack>
              <IconButton
                size="small"
                onClick={() => {
                  const newExpenseData: Partial<Transaction> = {
                    transaction_date: new Date().toISOString().split('T')[0],
                    merchant: categoryView === 'merchant' ? selectedCategory : '',
                    category: categoryView === 'category' ? selectedCategory : '',
                    account_id: accounts[0]?.account_id || 0,
                  };
                  onAddExpense(newExpenseData);
                }}
                sx={{
                  color: colors.card_accent,
                  '&:hover': {
                    backgroundColor: hexToRgba(colors.card_accent, 0.1),
                  },
                }}
                title="Add Expense"
              >
                <Add />
              </IconButton>
            </Stack>
            <Box
              sx={{
                maxHeight: 320,
                overflowY: 'auto',
                pr: 1,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: colorPalette === 'Dark Mode' ? '#1A1A1A' : '#F5F5F5',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: colors.card_subtext + '40',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: colors.card_subtext + '60',
                  },
                },
              }}
            >
              <Stack spacing={2}>
                {selectedExpenses.length === 0 ? (
                  <Typography
                    sx={{
                      color: colors.card_subtext,
                      textAlign: 'center',
                      py: 3,
                      fontFamily: 'Inter, -apple-system, sans-serif',
                    }}
                  >
                    No expenses found.
                  </Typography>
                ) : (
                  sortedDates.map((dateKey) => {
                    const dateExpenses = expensesByDate[dateKey];
                    const dailyTotal = dateExpenses.reduce((sum, expense) => {
                      const accountCurrency = accountCurrencyMap.get(expense.account_id) || 'EUR';
                      return sum + convertAmount(Math.abs(expense.amount), accountCurrency, displayCurrency, exchangeRates);
                    }, 0);

                    const date = new Date(dateKey);
                    const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    return (
                      <Box key={dateKey}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, px: 0.5 }}>
                          <Typography
                            sx={{
                              color: colors.card_text,
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              fontFamily: 'Inter, -apple-system, sans-serif',
                            }}
                          >
                            {dateLabel}
                          </Typography>
                          <Typography
                            sx={{
                              color: colors.card_text,
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              fontFamily: 'Inter, -apple-system, sans-serif',
                            }}
                          >
                            {currencyFormat(dailyTotal, displayCurrency)}
                          </Typography>
                        </Stack>
                        <Stack spacing={0.5}>
                          {dateExpenses.map((expense) => {
                            const accountCurrency = accountCurrencyMap.get(expense.account_id) || 'EUR';
                            const convertedAmount = convertAmount(Math.abs(expense.amount), accountCurrency, displayCurrency, exchangeRates);
                            return (
                              <Box
                                key={expense.transaction_id}
                                onClick={() => onExpenseClick(expense)}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  p: 1.5,
                                  borderRadius: 2,
                                  backgroundColor: colorPalette === 'Dark Mode' ? '#1F1F1F' : '#FFFFFF',
                                  border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.15)}`,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    backgroundColor: colorPalette === 'Dark Mode' ? '#2A2A2A' : '#F8F8F8',
                                    borderColor: colors.card_subtext + '40',
                                  },
                                  transition: 'all 0.2s',
                                }}
                              >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography
                                    sx={{
                                      color: colors.card_text,
                                      fontWeight: 400,
                                      fontSize: '0.9rem',
                                      fontFamily: 'Inter, -apple-system, sans-serif',
                                    }}
                                  >
                                    {expense.merchant || 'Unknown'}
                                  </Typography>
                                </Box>
                                <Typography
                                  sx={{
                                    color: colors.card_text,
                                    fontWeight: 500,
                                    fontSize: '0.95rem',
                                    fontFamily: 'Inter, -apple-system, sans-serif',
                                  }}
                                >
                                  {currencyFormat(convertedAmount, displayCurrency)}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Stack>
                      </Box>
                    );
                  })
                )}
              </Stack>
            </Box>
          </>
        ) : (
          // Show category list
          <>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                {categoryView === 'currency' ? (
                  <CurrencyExchange sx={{ color: colors.card_accent, fontSize: 22 }} />
                ) : categoryView === 'merchant' ? (
                  <Business sx={{ color: colors.card_accent, fontSize: 22 }} />
                ) : categoryView === 'budget' ? (
                  <CompareArrows sx={{ color: colors.card_accent, fontSize: 22 }} />
                ) : (
                  <Receipt sx={{ color: colors.card_accent, fontSize: 22 }} />
                )}
                <Typography
                  variant="h6"
                  sx={{
                    color: colors.card_text,
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                  }}
                >
                  {categoryView === 'currency' ? 'By Currency' : categoryView === 'merchant' ? 'By Merchant' : categoryView === 'budget' ? 'Budget vs Actual' : 'By Category'}
                </Typography>
              </Stack>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={categoryView}
                  onChange={(e) => onViewChange(e.target.value as 'category' | 'currency' | 'merchant' | 'budget')}
                  sx={{
                    color: colors.card_text,
                    backgroundColor: colors.card_bg,
                    fontSize: '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${colors.card_subtext}${getBorderOpacity(0.2)}`,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${colors.card_subtext}${getBorderOpacity(0.4)}`,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_accent,
                    },
                  }}
                >
                  <MenuItem value="category">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Receipt sx={{ fontSize: 18 }} />
                      <span>Category</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="merchant">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Business sx={{ fontSize: 18 }} />
                      <span>Merchant</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="currency">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CurrencyExchange sx={{ fontSize: 18 }} />
                      <span>Currency</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="budget">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CompareArrows sx={{ fontSize: 18 }} />
                      <span>Budget vs Actual</span>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Box
              sx={{
                maxHeight: 320,
                overflowY: 'auto',
                pr: 1,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: colorPalette === 'Dark Mode' ? '#1A1A1A' : '#F5F5F5',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: colors.card_subtext + '40',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: colors.card_subtext + '60',
                  },
                },
              }}
            >
              <Stack spacing={0.5}>
                {sortedItems.map((item) => {
                  const percentage = categoryChartData.total > 0 
                    ? ((item.amount / categoryChartData.total) * 100).toFixed(0) 
                    : '0';
                  const transactionText = item.count === 1 ? 'transaction' : 'transactions';
                  return (
                    <Box
                      key={item.label}
                      onClick={() => onCategorySelect(item.label)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 1.5,
                        borderRadius: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: colorPalette === 'Dark Mode' ? '#2A2A2A' : '#FAFAFA',
                        },
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: hexToRgba(item.color, 0.15),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: item.color,
                          flexShrink: 0,
                        }}
                      >
                        {categoryView === 'currency'
                          ? React.cloneElement(getCurrencyIcon(item.label), { sx: { fontSize: 20 } })
                          : categoryView === 'merchant'
                          ? <Business sx={{ fontSize: 20 }} />
                          : React.cloneElement(getCategoryIcon(item.label), { sx: { fontSize: 20 } })}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            color: colors.card_text,
                            fontWeight: 500,
                            fontSize: '0.95rem',
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            mb: 0.25,
                          }}
                        >
                          {item.label}
                        </Typography>
                        <Typography
                          sx={{
                            color: colors.card_subtext,
                            fontSize: '0.75rem',
                            fontFamily: 'Inter, -apple-system, sans-serif',
                          }}
                        >
                          {item.count} {transactionText}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                        <Typography
                          sx={{
                            color: colors.card_text,
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            mb: 0.25,
                          }}
                        >
                          {currencyFormat(item.amount, displayCurrency)}
                        </Typography>
                        <Typography
                          sx={{
                            color: colors.card_subtext,
                            fontSize: '0.75rem',
                            fontFamily: 'Inter, -apple-system, sans-serif',
                          }}
                        >
                          {percentage}%
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          </>
        )}
      </Paper>
    </Grid>
  );
};



