import React, { useState, useEffect, useMemo } from 'react';
import { 
  Container, 
  Box, 
  Grid, 
  Typography, 
  CircularProgress, 
  Alert, 
  Stack,
  Paper,
  Tooltip,
  Fade,
} from '@mui/material';
import { 
  AttachMoney,
  Timeline,
  AccountBalanceWallet,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api, Balance, Metrics, Account, Budget, Transaction } from '../services/api';
import { currencyFormat } from '../utils/formatting';
import { getDashboardPalette, PALETTE_BACKGROUNDS, PALETTE_TEXT_COLORS, PALETTE_SUBTEXT_COLORS } from '../config/colorPalettes';
import { useTheme } from '../contexts/ThemeContext';
import { useDashboard } from '../contexts/DashboardContext';
import {
  MetricsCards,
  NetWorthCard,
  DashboardHeader,
} from '../components/dashboard';
import { hexToRgba, getBorderOpacity } from '../components/dashboard/utils';

const Dashboard: React.FC = () => {
  const { colorPalette } = useTheme();
  const { selectedCurrency, setSelectedCurrency, selectedDate, setSelectedDate, currencies, setCurrencies, availableDates, setAvailableDates, formatDateForDisplay } = useDashboard();
  const navigate = useNavigate();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [allBalances, setAllBalances] = useState<Balance[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  
  // Monthly expense stored in EUR (like original)
  const [monthlyExpenseEur, setMonthlyExpenseEur] = useState<number>(() => {
    const stored = localStorage.getItem('monthlyExpenseEur');
    return stored ? parseFloat(stored) : 2000;
  });
  
  // Exchange rates (fallback if DB unavailable)
  const EXCHANGE_RATES: { [key: string]: number } = {
    'EUR': 1.0,
    'USD': 1.08,
    'GBP': 0.86,
    'CHF': 0.96,
    'CAD': 1.46
  };
  
  // Convert EUR to selected currency for display
  const monthlyExpense = monthlyExpenseEur * (EXCHANGE_RATES[selectedCurrency] || 1.0);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [currencyLoading, setCurrencyLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [accountTypes, setAccountTypes] = useState<{ cash_types: string[]; investment_types: string[] } | null>(null);
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]); // All transactions for daily chart
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>(() => {
    const stored = localStorage.getItem('dashboardSelectedBudgetId');
    return stored || '';
  });

  const colors = getDashboardPalette(colorPalette);
  const balanceCol = `balance_${selectedCurrency.toLowerCase()}` as keyof Balance;

  useEffect(() => {
    loadInitialData();
  }, []);

  // Reload data when currency changes (only if not manually triggered)
  useEffect(() => {
    // Skip on initial load (handled by loadInitialData)
    if (loading) return;
    // Skip if currency is being changed manually (handled in onChange)
    if (currencyLoading) return;
    
    // Always load latest data (current balances)
    loadLatestData(selectedCurrency);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurrency]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [currenciesData, accountTypesData, accountsData, budgetsData, transactionsData, allTransactionsData] = await Promise.all([
        api.getCurrencies().catch(() => ['EUR', 'GBP', 'USD', 'CHF']),
        api.getAccountTypeCategories().catch(() => ({ cash_types: ['Cash', 'Current', 'Checking', 'Savings'], investment_types: ['Investment', 'Stocks', 'Crypto', 'Pension'] })),
        api.getAccounts(),
        api.getBudgets().catch(() => []),
        api.getTransactions(undefined, 'expense').catch(() => []),
        api.getTransactions() // Get all transactions for daily chart calculation
      ]);
      setCurrencies(currenciesData);
      setAccountTypes(accountTypesData);
      setAccounts(accountsData);
      setBudgets(budgetsData);
      setTransactions(transactionsData);
      setAllTransactions(allTransactionsData);
      await loadLatestData();
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data. Make sure the backend API is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadLatestData = async (currency?: string) => {
    try {
      setError(null);
      const currencyToUse = currency || selectedCurrency;
      
      // Always get current balances (no date parameter = latest/current)
      const [balancesData, allBalancesData, metricsData] = await Promise.all([
        api.getBalances(currencyToUse), // Current balances (no date = latest)
        api.getBalances(currencyToUse), // All balances for charts
        api.getMetrics(currencyToUse) // Current metrics (no date = latest)
      ]);
      
      // Update all state at once to prevent intermediate renders
      setBalances(balancesData);
      setAllBalances(allBalancesData);
      setMetrics(metricsData);
      
      // Set current date for display
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
      
      // Extract dates for historical chart data
      const dates = [...new Set(allBalancesData.map(b => b.balance_date))].sort().reverse();
      setAvailableDates(dates);
    } catch (err) {
      console.error('Error loading latest data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
  };


  // Calculate MoM Growth (comparing current to previous month)
  const calculateMoMGrowth = () => {
    if (!allBalances.length || !metrics) return { absolute: 0, percent: 0, percentStr: '' };

    const dates = [...new Set(allBalances.map(b => b.balance_date))].sort().reverse();
    if (dates.length < 2) return { absolute: 0, percent: 0, percentStr: '' };

    // Get current (latest) date
    const currentDate = dates[0];
    if (!currentDate) return { absolute: 0, percent: 0, percentStr: '' };
    
    // Get previous month's date (approximately 30 days ago)
    const currentDateObj = new Date(currentDate);
    const previousMonthDateObj = new Date(currentDateObj);
    previousMonthDateObj.setMonth(previousMonthDateObj.getMonth() - 1);
    const previousMonthDateStr = previousMonthDateObj.toISOString().split('T')[0];
    
    // Find the closest date to one month ago
    const previousDate = dates.find(d => d <= previousMonthDateStr) || dates[dates.length - 1];
    if (!previousDate || previousDate === currentDate) {
      return { absolute: 0, percent: 0, percentStr: '' };
    }

    const previousBalances = allBalances.filter(b => b.balance_date === previousDate);
    const previousNetWorth = previousBalances.reduce((sum, b) => {
      const val = (b[balanceCol] as number) || 0;
      return sum + val;
    }, 0);

    if (previousNetWorth === 0) return { absolute: 0, percent: 0, percentStr: '' };

    const absolute = metrics.net_worth - previousNetWorth;
    const percent = (absolute / previousNetWorth) * 100;
    return { absolute, percent, percentStr: `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%` };
  };

  const momGrowth = calculateMoMGrowth();
  
  // Calculate monthly spending from 24th to 23rd of next month
  const calculateMonthlySpending = useMemo(() => {
    if (!transactions.length || !accounts.length) return 0;
    
    const now = new Date();
    const currentDay = now.getDate();
    let startDate: Date;
    let endDate: Date;
    
    // If current day is >= 24th, period is from 24th of current month to 23rd of next month
    // If current day is < 24th, period is from 24th of previous month to 23rd of current month
    if (currentDay >= 24) {
      startDate = new Date(now.getFullYear(), now.getMonth(), 24);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 23);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 24);
      endDate = new Date(now.getFullYear(), now.getMonth(), 23);
    }
    
    // Set time to end of day for endDate
    endDate.setHours(23, 59, 59, 999);
    
    const periodExpenses = transactions.filter(tx => {
      const txDate = new Date(tx.transaction_date);
      return txDate >= startDate && txDate <= endDate && tx.amount < 0;
    });
    
    // Convert to selected currency
    const convertAmount = (amount: number, fromCurrency: string, toCurrency: string): number => {
      if (fromCurrency === toCurrency) return amount;
      const fromRate = EXCHANGE_RATES[fromCurrency] || 1.0;
      const toRate = EXCHANGE_RATES[toCurrency] || 1.0;
      return amount * (toRate / fromRate);
    };
    
    let totalSpending = 0;
    periodExpenses.forEach(tx => {
      const account = accounts.find(a => a.account_id === tx.account_id);
      const txCurrency = account?.currency_code || 'EUR';
      const convertedAmount = convertAmount(Math.abs(tx.amount), txCurrency, selectedCurrency);
      totalSpending += convertedAmount;
    });
    
    return totalSpending;
  }, [transactions, accounts, selectedCurrency]);
  
  // Use calculated monthly spending if available, otherwise fall back to user input
  const monthlySpending = calculateMonthlySpending > 0 ? calculateMonthlySpending : monthlyExpense;
  
  // Calculate "needs" amount from selected budget
  const budgetNeeds = useMemo(() => {
    if (!selectedBudgetId || !budgets.length) return 0;
    const selectedBudget = budgets.find(b => b.budget_id.toString() === selectedBudgetId);
    if (!selectedBudget || !selectedBudget.categories) return 0;
    
    // Sum all categories with type "needs"
    const needsTotal = selectedBudget.categories
      .filter(cat => cat.type === 'needs')
      .reduce((sum, cat) => sum + (cat.budgeted_amount || cat.budgeted || 0), 0);
    
    // Convert to selected currency if needed
    if (selectedBudget.currency !== selectedCurrency) {
      const fromRate = EXCHANGE_RATES[selectedBudget.currency] || 1.0;
      const toRate = EXCHANGE_RATES[selectedCurrency] || 1.0;
      return needsTotal * (toRate / fromRate);
    }
    
    return needsTotal;
  }, [selectedBudgetId, budgets, selectedCurrency]);
  
  // Use budget needs for emergency fund calculation, fallback to monthlySpending if no budget selected
  const emergencyFundMonthly = budgetNeeds > 0 ? budgetNeeds : monthlySpending;
  const emergencyMonths = metrics && emergencyFundMonthly > 0 ? metrics.cash / emergencyFundMonthly : 0;
  
  // Calculate cash flow (money in vs money out) for the same period
  const cashFlow = useMemo(() => {
    if (!transactions.length || !accounts.length) return { moneyIn: 0, moneyOut: 0 };
    
    const now = new Date();
    const currentDay = now.getDate();
    let startDate: Date;
    let endDate: Date;
    
    if (currentDay >= 24) {
      startDate = new Date(now.getFullYear(), now.getMonth(), 24);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 23);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 24);
      endDate = new Date(now.getFullYear(), now.getMonth(), 23);
    }
    
    endDate.setHours(23, 59, 59, 999);
    
    const periodTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.transaction_date);
      return txDate >= startDate && txDate <= endDate;
    });
    
    const convertAmount = (amount: number, fromCurrency: string, toCurrency: string): number => {
      if (fromCurrency === toCurrency) return amount;
      const fromRate = EXCHANGE_RATES[fromCurrency] || 1.0;
      const toRate = EXCHANGE_RATES[toCurrency] || 1.0;
      return amount * (toRate / fromRate);
    };
    
    let moneyIn = 0;
    let moneyOut = 0;
    
    periodTransactions.forEach(tx => {
      const account = accounts.find(a => a.account_id === tx.account_id);
      const txCurrency = account?.currency_code || 'EUR';
      const convertedAmount = convertAmount(Math.abs(tx.amount), txCurrency, selectedCurrency);
      
      if (tx.amount > 0) {
        moneyIn += convertedAmount;
      } else if (tx.amount < 0) {
        moneyOut += convertedAmount;
      }
    });
    
    return { moneyIn, moneyOut };
  }, [transactions, accounts, selectedCurrency]);

  // Prepare chart data using balance data (same calculation as metrics API)
  const prepareChartData = () => {
    // Use balance-based approach - this uses the same exchange rates as metrics API
    // This ensures the chart matches the main net worth display
    if (!allBalances.length || !accountTypes) return null;

    const dates = [...new Set(allBalances.map(b => b.balance_date))].sort();
    const netWorthData: number[] = [];
    const cashData: number[] = [];
    const investmentData: number[] = [];

    dates.forEach(date => {
      const dateBalances = allBalances.filter(b => b.balance_date === date);
      let netWorth = 0;
      let cash = 0;
      let investments = 0;

      dateBalances.forEach(b => {
        // Use the converted balance directly from the API (same calculation as metrics uses)
        const val = (b[balanceCol] as number) || 0;
        netWorth += val;
        
        const cashTypesLower = accountTypes.cash_types.map(t => t.toLowerCase());
        const investmentTypesLower = accountTypes.investment_types.map(t => t.toLowerCase());
        
        if (cashTypesLower.includes(b.account_type.toLowerCase())) {
          cash += val;
        }
        if (investmentTypesLower.includes(b.account_type.toLowerCase())) {
          investments += val;
        }
      });

      netWorthData.push(netWorth);
      cashData.push(cash);
      investmentData.push(investments);
    });

    return { dates, netWorthData, cashData, investmentData };
  };

  const chartData = prepareChartData();

  // Calculate budget status
  const budgetStatus = useMemo(() => {
    if (!budgets.length || !transactions.length || !selectedBudgetId) return null;
    
    // Use the selected budget
    const selectedBudget = budgets.find(b => b.budget_id.toString() === selectedBudgetId);
    if (!selectedBudget) return null;
    
    // Get expenses for the 24th to 23rd period
    const now = new Date();
    const currentDay = now.getDate();
    let startDate: Date;
    let endDate: Date;
    
    // If current day is >= 24th, period is from 24th of current month to 23rd of next month
    // If current day is < 24th, period is from 24th of previous month to 23rd of current month
    if (currentDay >= 24) {
      startDate = new Date(now.getFullYear(), now.getMonth(), 24);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 23);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 24);
      endDate = new Date(now.getFullYear(), now.getMonth(), 23);
    }
    
    // Set time to end of day for endDate
    endDate.setHours(23, 59, 59, 999);
    
    const periodExpenses = transactions.filter(tx => {
      const txDate = new Date(tx.transaction_date);
      return txDate >= startDate && txDate <= endDate && tx.amount < 0;
    });
    
    if (periodExpenses.length === 0) return null;
    
    // Simple currency conversion using EXCHANGE_RATES
    const convertAmount = (amount: number, fromCurrency: string, toCurrency: string): number => {
      if (fromCurrency === toCurrency) return amount;
      const fromRate = EXCHANGE_RATES[fromCurrency] || 1.0;
      const toRate = EXCHANGE_RATES[toCurrency] || 1.0;
      return amount * (toRate / fromRate);
    };
    
    // Calculate prorated budget based on the date range
    const periodLength = endDate.getTime() - startDate.getTime();
    const daysInPeriod = Math.ceil(periodLength / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const budgetMultiplier = daysInPeriod / daysInMonth;
    
    const totalBudgeted = selectedBudget.categories.reduce((sum, cat) => sum + cat.budgeted_amount, 0) * budgetMultiplier;
    
    // Sum all expenses in the period (not just those matching budget categories)
    const totalActual = periodExpenses.reduce((sum, tx) => {
      // Get account currency
      const account = accounts.find(a => a.account_id === tx.account_id);
      const txCurrency = account?.currency_code || 'EUR';
      const convertedAmount = convertAmount(Math.abs(tx.amount), txCurrency, selectedBudget.currency);
      return sum + convertedAmount;
    }, 0);
    
    const remaining = totalBudgeted - totalActual;
    const isOverBudget = remaining < 0;
    
    return {
      totalBudgeted,
      totalActual,
      remaining: Math.abs(remaining),
      isOverBudget,
      currency: selectedBudget.currency,
      color: isOverBudget ? '#EF4444' : '#10B981',
    };
  }, [budgets, transactions, accounts, selectedBudgetId]);

  // Prepare donut chart data - must be at top level (hooks rules)
  const cashChartData = useMemo(() => {
    if (!balances.length || !accountTypes) return null;
    
    // Normalize account types to lowercase for comparison
    const cashTypesLower = accountTypes.cash_types.map(t => t.toLowerCase());
    
    const cashBalances = balances.filter(b =>
      cashTypesLower.includes(b.account_type.toLowerCase())
    );
    
    if (cashBalances.length === 0) {
      console.log('No cash balances found. Account types:', accountTypes.cash_types, 'Balances:', balances.map(b => ({ type: b.account_type, institution: b.institution })));
      return null;
    }
    
    const cashByInstitution = cashBalances.reduce((acc, b) => {
      // Try multiple ways to get the balance value
      let val = 0;
      if (balanceCol && b[balanceCol]) {
        val = (b[balanceCol] as number) || 0;
      } else if (b.balance_eur) {
        val = b.balance_eur || 0;
      } else if (b.amount) {
        val = b.amount || 0;
      }
      
      if (val !== 0) {
        acc[b.institution] = (acc[b.institution] || 0) + val;
      }
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Cash by Institution:', cashByInstitution, 'Balance column:', balanceCol, 'Sample balance:', cashBalances[0]);

    const cashData = Object.entries(cashByInstitution).map(([name, value]) => ({
      name,
      value,
      percent: ((value / Object.values(cashByInstitution).reduce((a, b) => a + b, 0)) * 100).toFixed(1),
    })).sort((a, b) => b.value - a.value);

    const totalCash = Object.values(cashByInstitution).reduce((a, b) => a + b, 0);
    return { cashData, totalCash };
  }, [balances, accountTypes, balanceCol]);

  const investmentChartData = useMemo(() => {
    if (!balances.length || !accountTypes) return null;
    
    // Normalize account types to lowercase for comparison
    const investmentTypesLower = accountTypes.investment_types.map(t => t.toLowerCase());
    
    const investmentBalances = balances.filter(b =>
      investmentTypesLower.includes(b.account_type.toLowerCase())
    );
    
    if (investmentBalances.length === 0) {
      console.log('No investment balances found. Account types:', accountTypes.investment_types, 'Balances:', balances.map(b => ({ type: b.account_type, institution: b.institution })));
      return null;
    }
    
    const investByInstitution = investmentBalances.reduce((acc, b) => {
      // Try multiple ways to get the balance value
      let val = 0;
      if (balanceCol && b[balanceCol]) {
        val = (b[balanceCol] as number) || 0;
      } else if (b.balance_eur) {
        val = b.balance_eur || 0;
      } else if (b.amount) {
        val = b.amount || 0;
      }
      
      if (val !== 0) {
        acc[b.institution] = (acc[b.institution] || 0) + val;
      }
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Investment by Institution:', investByInstitution, 'Balance column:', balanceCol, 'Sample balance:', investmentBalances[0]);

    const investData = Object.entries(investByInstitution).map(([name, value]) => ({
      name,
      value,
      percent: ((value / Object.values(investByInstitution).reduce((a, b) => a + b, 0)) * 100).toFixed(1),
    })).sort((a, b) => b.value - a.value);

    const totalInvest = Object.values(investByInstitution).reduce((a, b) => a + b, 0);
    return { investData, totalInvest };
  }, [balances, accountTypes, balanceCol]);

  const currencyChartData = useMemo(() => {
    if (!balances.length) return null;
    
    const currencySplit = balances.reduce((acc, b) => {
      const val = (b[balanceCol] as number) || 0;
      acc[b.currency_code] = (acc[b.currency_code] || 0) + val;
      return acc;
    }, {} as Record<string, number>);

    const currencyData = Object.entries(currencySplit).map(([name, value]) => ({
      name,
      value,
      percent: ((value / Object.values(currencySplit).reduce((a, b) => a + b, 0)) * 100).toFixed(1),
    })).sort((a, b) => b.value - a.value);

    const totalCurrency = Object.values(currencySplit).reduce((a, b) => a + b, 0);
    return { currencyData, totalCurrency };
  }, [balances, balanceCol]);

  // Show loading state
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        sx={{ 
          flex: 1,
          backgroundColor: PALETTE_BACKGROUNDS[colorPalette],
          pt: { xs: 10, sm: 11 },
          px: { xs: 1.5, sm: 3, md: 4 },
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: PALETTE_BACKGROUNDS[colorPalette],
          pt: { xs: 10, sm: 11 },
          pb: 4,
        }}
      >
        <Container maxWidth="xl">
          <Alert severity="error">{error}</Alert>
          <Typography variant="body2" sx={{ mt: 2, color: PALETTE_TEXT_COLORS[colorPalette] }}>
            Make sure the backend API is running at http://localhost:8000
          </Typography>
        </Container>
      </Box>
    );
  }

  // If no data, show message
  if (!metrics && !loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: PALETTE_BACKGROUNDS[colorPalette],
          pt: { xs: 10, sm: 11 },
          pb: 4,
        }}
      >
        <Container maxWidth="xl">
          <Alert severity="info">No data available. Please check your database connection.</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        backgroundColor: PALETTE_BACKGROUNDS[colorPalette],
        pt: { xs: 10, sm: 11 },
        pb: 6,
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: 1280, px: { xs: 2, sm: 3, lg: 4 } }}>
        <DashboardHeader
          budgets={budgets}
          selectedBudgetId={selectedBudgetId}
          onBudgetChange={(budgetId) => {
            setSelectedBudgetId(budgetId);
            if (budgetId) {
              localStorage.setItem('dashboardSelectedBudgetId', budgetId);
            } else {
              localStorage.removeItem('dashboardSelectedBudgetId');
            }
          }}
          currencies={currencies}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={async (newCurrency) => {
            setCurrencyLoading(true);
            try {
              await loadLatestData(newCurrency);
              setSelectedCurrency(newCurrency);
            } catch (error) {
              console.error('Error reloading data:', error);
              setSelectedCurrency(newCurrency);
            } finally {
              setCurrencyLoading(false);
            }
          }}
          currencyLoading={currencyLoading}
        />

        {/* Top Section: Net Worth Card (left) and Metric Cards (right) */}
        {chartData && metrics && (
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3}>
              {/* Net Worth Card - Left Side (3/5 of space on desktop) */}
              <Grid item xs={12} md={7}>
                <NetWorthCard
                  netWorth={metrics.net_worth}
                  change={momGrowth}
                  chartData={chartData}
                  selectedCurrency={selectedCurrency}
                  colorPalette={colorPalette}
                />
              </Grid>

              {/* Metric Cards - Right Side (2/5 of space on desktop) */}
              <Grid item xs={12} md={5}>
            <MetricsCards
              metrics={metrics}
              selectedCurrency={selectedCurrency}
              colorPalette={colorPalette}
              momGrowth={momGrowth}
              monthlyExpense={monthlySpending}
              emergencyMonths={emergencyMonths}
              emergencyFundMonthly={emergencyFundMonthly}
              budgetStatus={budgetStatus}
              cashFlow={cashFlow}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Horizontal Bar Charts Section */}
        {chartData && metrics && (
          <Box sx={{ mb: 6 }}>
            <Grid container spacing={3}>
              {/* Cash by Institution */}
              {cashChartData && cashChartData.cashData.length > 0 && cashChartData.totalCash > 0 && (
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0}
                    onClick={() => navigate('/accounts')}
                    sx={{ 
                      background: `linear-gradient(135deg, ${colors.card_bg} 0%, ${hexToRgba(colors.cash, 0.05)} 100%)`,
                      borderRadius: 4,
                      border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
                      p: 3,
                      overflow: 'hidden',
                      height: '100%',
                      position: 'relative',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: colors.cash + '40',
                        boxShadow: 3,
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                      <AttachMoney sx={{ color: colors.cash, fontSize: 20 }} />
                      <Typography
                        variant="h6"
                        sx={{
                          color: colors.card_text,
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          fontFamily: 'Inter, -apple-system, sans-serif',
                        }}
                      >
                        Cash by Institution
                      </Typography>
                    </Stack>
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                            sx={{
                            color: colors.card_subtext,
                            fontSize: '0.75rem',
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            mb: 0.5,
                          }}
                        >
                          Total Cash
                        </Typography>
                        <Typography
                          variant="h6"
                            sx={{
                            color: colors.card_text,
                            fontWeight: 700,
                            fontSize: '1.25rem',
                            fontFamily: 'Inter, -apple-system, sans-serif',
                          }}
                        >
                          {currencyFormat(cashChartData.totalCash, selectedCurrency)}
                        </Typography>
                      </Box>
                      
                      {/* Horizontal Bar Chart */}
                      <Box
                            sx={{
                          width: '100%',
                          height: 24,
                          backgroundColor: colors.card_bg,
                          borderRadius: 2,
                          overflow: 'hidden',
                          display: 'flex',
                          mb: 2,
                        }}
                      >
                        {cashChartData.cashData.map((item, idx) => {
                          const percentage = (item.value / cashChartData.totalCash) * 100;
                          return (
                            <Tooltip
                              key={idx}
                              title={
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {item.name}
                                  </Typography>
                                  <Typography variant="body2">
                                    {currencyFormat(item.value, selectedCurrency)}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                    {percentage.toFixed(1)}%
                                  </Typography>
                                </Box>
                              }
                              arrow
                              TransitionComponent={Fade}
                              placement="top"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Box
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                  width: `${percentage}%`,
                                  height: '100%',
                                  backgroundColor: colors.donut_colors[idx % colors.donut_colors.length],
                                  transition: 'width 0.3s ease, opacity 0.2s ease',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    opacity: 0.9,
                                    filter: 'brightness(1.1)',
                                  },
                                  '&:first-of-type': {
                                    borderTopLeftRadius: 8,
                                    borderBottomLeftRadius: 8,
                                  },
                                  '&:last-of-type': {
                                    borderTopRightRadius: 8,
                                    borderBottomRightRadius: 8,
                                  },
                                }}
                              />
                            </Tooltip>
                          );
                        })}
                      </Box>

                      {/* Legend */}
                          <Box 
                            sx={{ 
                              display: 'flex', 
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          gap: 2,
                        }}
                      >
                            {cashChartData.cashData.map((item, idx) => (
                          <Stack key={idx} direction="row" alignItems="center" spacing={1}>
                                <Box
                                  sx={{
                                width: 12,
                                height: 12,
                                    backgroundColor: colors.donut_colors[idx % colors.donut_colors.length],
                                borderRadius: 1,
                                    flexShrink: 0,
                                  }}
                                />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: colors.card_text,
                                fontSize: '0.75rem',
                                      fontFamily: 'Inter, -apple-system, sans-serif',
                                fontWeight: 500,
                                    }}
                                  >
                                    {item.name}
                                  </Typography>
                              </Stack>
                            ))}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              )}

              {/* Investments by Institution */}
              {investmentChartData && investmentChartData.investData.length > 0 && investmentChartData.totalInvest > 0 && (
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0}
                    onClick={() => navigate('/accounts')}
                    sx={{ 
                      background: `linear-gradient(135deg, ${colors.card_bg} 0%, ${hexToRgba(colors.investment, 0.05)} 100%)`,
                      borderRadius: 4,
                      border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
                      p: 3,
                      overflow: 'hidden',
                      height: '100%',
                      position: 'relative',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: colors.investment + '40',
                        boxShadow: 3,
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                      <Timeline sx={{ color: colors.investment, fontSize: 20 }} />
                      <Typography
                        variant="h6"
                        sx={{
                          color: colors.card_text,
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          fontFamily: 'Inter, -apple-system, sans-serif',
                        }}
                      >
                        Investments by Institution
                      </Typography>
                    </Stack>
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                            sx={{
                            color: colors.card_subtext,
                            fontSize: '0.75rem',
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            mb: 0.5,
                          }}
                        >
                          Total Investments
                        </Typography>
                        <Typography
                          variant="h6"
                            sx={{
                            color: colors.card_text,
                            fontWeight: 700,
                            fontSize: '1.25rem',
                            fontFamily: 'Inter, -apple-system, sans-serif',
                          }}
                        >
                          {currencyFormat(investmentChartData.totalInvest, selectedCurrency)}
                        </Typography>
                      </Box>
                      
                      {/* Horizontal Bar Chart */}
                      <Box
                            sx={{
                          width: '100%',
                          height: 24,
                          backgroundColor: colors.card_bg,
                          borderRadius: 2,
                          overflow: 'hidden',
                          display: 'flex',
                          mb: 2,
                        }}
                      >
                        {investmentChartData.investData.map((item, idx) => {
                          const percentage = (item.value / investmentChartData.totalInvest) * 100;
                          return (
                            <Tooltip
                              key={idx}
                              title={
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {item.name}
                                  </Typography>
                                  <Typography variant="body2">
                                    {currencyFormat(item.value, selectedCurrency)}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                    {percentage.toFixed(1)}%
                                  </Typography>
                                </Box>
                              }
                              arrow
                              TransitionComponent={Fade}
                              placement="top"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Box
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                  width: `${percentage}%`,
                                  height: '100%',
                                  backgroundColor: colors.donut_colors[idx % colors.donut_colors.length],
                                  transition: 'width 0.3s ease, opacity 0.2s ease',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    opacity: 0.9,
                                    filter: 'brightness(1.1)',
                                  },
                                  '&:first-of-type': {
                                    borderTopLeftRadius: 8,
                                    borderBottomLeftRadius: 8,
                                  },
                                  '&:last-of-type': {
                                    borderTopRightRadius: 8,
                                    borderBottomRightRadius: 8,
                                  },
                                }}
                              />
                            </Tooltip>
                          );
                        })}
                      </Box>

                      {/* Legend */}
                          <Box 
                            sx={{ 
                              display: 'flex', 
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          gap: 2,
                        }}
                      >
                            {investmentChartData.investData.map((item, idx) => (
                          <Stack key={idx} direction="row" alignItems="center" spacing={1}>
                                <Box
                                  sx={{
                                width: 12,
                                height: 12,
                                    backgroundColor: colors.donut_colors[idx % colors.donut_colors.length],
                                borderRadius: 1,
                                    flexShrink: 0,
                                  }}
                                />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: colors.card_text,
                                fontSize: '0.75rem',
                                      fontFamily: 'Inter, -apple-system, sans-serif',
                                fontWeight: 500,
                                    }}
                                  >
                                    {item.name}
                                  </Typography>
                              </Stack>
                            ))}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              )}

              {/* Holdings by Currency */}
              {currencyChartData && currencyChartData.currencyData.length > 0 && currencyChartData.totalCurrency > 0 && (
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0}
                    onClick={() => navigate('/accounts')}
                    sx={{ 
                      background: `linear-gradient(135deg, ${colors.card_bg} 0%, ${hexToRgba(colors.card_accent, 0.05)} 100%)`,
                      borderRadius: 4,
                      border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
                      p: 3,
                      overflow: 'hidden',
                      height: '100%',
                      position: 'relative',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: colors.card_accent + '40',
                        boxShadow: 3,
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                      <AccountBalanceWallet sx={{ color: colors.card_accent, fontSize: 20 }} />
                      <Typography
                        variant="h6"
                        sx={{
                          color: colors.card_text,
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          fontFamily: 'Inter, -apple-system, sans-serif',
                        }}
                      >
                        Holdings by Currency
                      </Typography>
                    </Stack>
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                            sx={{
                            color: colors.card_subtext,
                            fontSize: '0.75rem',
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            mb: 0.5,
                          }}
                        >
                          Total Holdings
                        </Typography>
                        <Typography
                          variant="h6"
                            sx={{
                            color: colors.card_text,
                            fontWeight: 700,
                            fontSize: '1.25rem',
                            fontFamily: 'Inter, -apple-system, sans-serif',
                          }}
                        >
                          {currencyFormat(currencyChartData.totalCurrency, selectedCurrency)}
                        </Typography>
                      </Box>
                      
                      {/* Horizontal Bar Chart */}
                      <Box
                            sx={{
                          width: '100%',
                          height: 24,
                          backgroundColor: colors.card_bg,
                          borderRadius: 2,
                          overflow: 'hidden',
                          display: 'flex',
                          mb: 2,
                        }}
                      >
                        {currencyChartData.currencyData.map((item, idx) => {
                          const percentage = (item.value / currencyChartData.totalCurrency) * 100;
                          return (
                            <Tooltip
                              key={idx}
                              title={
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {item.name}
                                  </Typography>
                                  <Typography variant="body2">
                                    {currencyFormat(item.value, selectedCurrency)}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                    {percentage.toFixed(1)}%
                                  </Typography>
                                </Box>
                              }
                              arrow
                              TransitionComponent={Fade}
                              placement="top"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Box
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                  width: `${percentage}%`,
                                  height: '100%',
                                  backgroundColor: colors.donut_colors[idx % colors.donut_colors.length],
                                  transition: 'width 0.3s ease, opacity 0.2s ease',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    opacity: 0.9,
                                    filter: 'brightness(1.1)',
                                  },
                                  '&:first-of-type': {
                                    borderTopLeftRadius: 8,
                                    borderBottomLeftRadius: 8,
                                  },
                                  '&:last-of-type': {
                                    borderTopRightRadius: 8,
                                    borderBottomRightRadius: 8,
                                  },
                                }}
                              />
                            </Tooltip>
                          );
                        })}
                      </Box>

                      {/* Legend */}
                          <Box 
                            sx={{ 
                              display: 'flex', 
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          gap: 2,
                        }}
                      >
                            {currencyChartData.currencyData.map((item, idx) => (
                          <Stack key={idx} direction="row" alignItems="center" spacing={1}>
                                <Box
                                  sx={{
                                width: 12,
                                height: 12,
                                    backgroundColor: colors.donut_colors[idx % colors.donut_colors.length],
                                borderRadius: 1,
                                    flexShrink: 0,
                                  }}
                                />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: colors.card_text,
                                fontSize: '0.75rem',
                                      fontFamily: 'Inter, -apple-system, sans-serif',
                                fontWeight: 500,
                                    }}
                                  >
                                    {item.name}
                                  </Typography>
                              </Stack>
                            ))}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              )}

            </Grid>
          </Box>
        )}

      </Container>
    </Box>
  );
};

export default Dashboard;
