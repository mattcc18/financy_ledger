import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Stack,
  Paper,
  IconButton,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { currencyFormat } from '../utils/formatting';
import { getDashboardPalette, PALETTE_BACKGROUNDS } from '../config/colorPalettes';
import { useTheme } from '../contexts/ThemeContext';
import { api, Transaction, Account, TransactionCreateRequest, TransactionUpdateRequest, Budget } from '../services/api';
import { useExpenseData, useTripExpenses, useComparisonExpenses, useMonthlyComparison } from '../components/expenses/hooks';
import {
  ExpenseTrackingHeader,
  SummaryCards,
  CategoryTotalsCard,
  ChartsSection,
  CumulativeSpendingCard,
  MonthlyComparisonChart,
  TripExpensesCard,
  ExpenseDialog,
} from '../components/expenses';
import { getOpacity, getBorderOpacity, hexToRgba } from '../components/budget/utils';
import { getPeriodDates as getPeriodDatesUtil, getCategoryColor, getCategoryIcon, getCurrencyColor, getCurrencyIcon } from '../components/expenses/utils';
import { DateRangeNavigator, ExpensesTable } from '../components/expense-tracking';

const ExpenseTracking: React.FC = () => {
  const { colorPalette } = useTheme();
  const colors = getDashboardPalette(colorPalette);
  
  // Expenses are now loaded via useExpenseData hook (server-side filtered)
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filterAccountId, setFilterAccountId] = useState<number | ''>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterCurrency, setFilterCurrency] = useState<string>('');
  
  // Default date range: 24th of current month to 23rd of next month
  const getDefaultDateRange = () => {
    const now = new Date();
    const currentDay = now.getDate();
    let startDate: Date;
    let endDate: Date;
    
    if (currentDay >= 24) {
      // If today is >= 24th, period is from 24th of current month to 23rd of next month
      startDate = new Date(now.getFullYear(), now.getMonth(), 24);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 23);
    } else {
      // If today is < 24th, period is from 24th of previous month to 23rd of current month
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 24);
      endDate = new Date(now.getFullYear(), now.getMonth(), 23);
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
  };
  
  const defaultDates = getDefaultDateRange();
  const [filterStartDate, setFilterStartDate] = useState<string>(defaultDates.start);
  const [filterEndDate, setFilterEndDate] = useState<string>(defaultDates.end);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState<{
    transaction_date: string;
    account_id: number;
    merchant: string;
    category: string;
    amount: number;
    description: string | null;
    trip_id: number | null;
  }>({
    account_id: 0,
    amount: 0,
    category: '',
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
    merchant: '',
    trip_id: null,
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [keepOpen, setKeepOpen] = useState<boolean>(false);
  const [displayCurrency, setDisplayCurrency] = useState<string>('GBP');
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({});
  const [showTable, setShowTable] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState<string | null>(null);
  const [selectedBudgetType, setSelectedBudgetType] = useState<'needs' | 'wants' | 'savings' | null>(null);
  const [selectedCategoryForLinked, setSelectedCategoryForLinked] = useState<string | null>(null);
  const [selectedLinkedCategoryName, setSelectedLinkedCategoryName] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [selectedTripCategory, setSelectedTripCategory] = useState<string | null>(null);
  const [categoryView, setCategoryView] = useState<'category' | 'currency' | 'merchant' | 'budget'>('category');
  const [comparisonBudgetId, setComparisonBudgetId] = useState<string>(() => {
    const stored = localStorage.getItem('defaultComparisonBudgetId');
    return stored || '';
  });
  
  // Load all expenses (no period filtering, we'll filter by date range client-side)
  const { expenses, loading: expensesLoading, error: expensesError, reload: reloadExpenses } = useExpenseData({
    selectedMonth: '', // Not used anymore
    frequency: 'monthly', // Not used anymore
    startDay: 24, // Not used anymore
    filterAccountId: filterAccountId || undefined,
    filterCategory: filterCategory || undefined,
    filterCurrency: filterCurrency || undefined,
    includeAllForTrips: true, // Load all expenses for date range filtering
  });

  // Load trip expenses separately (all expenses, independent of date filter)
  // Only load when trips section might be visible
  const { tripExpenses, loading: tripExpensesLoading } = useTripExpenses(true); // Always load for trips

  // Load all expenses for comparison (we'll filter by date range as needed)
  const { allComparisonExpenses, loading: comparisonExpensesLoading } = useComparisonExpenses({
    selectedMonth: '', // Not used anymore
    frequency: 'monthly', // Not used anymore
    startDay: 24, // Not used anymore
    displayCurrency,
    periodsToLoad: 1, // Just load current period
  });
  
  // Get categories from selected budget or from expenses
  const availableCategories = useMemo(() => {
    if (selectedBudgetId) {
      const budget = budgets.find(b => b.budget_id.toString() === selectedBudgetId);
      if (budget) {
        // Get unique category names from budget
        const budgetCategories = new Set(budget.categories.map(c => c.name));
        // Also include existing expense categories
        const expenseCategories = new Set(expenses.map(e => e.category));
        // Combine both
        return Array.from(new Set([...budgetCategories, ...expenseCategories])).sort();
      }
    }
    // If no budget selected, use expense categories
    const cats = new Set(expenses.map(e => e.category));
    return Array.from(cats).sort();
  }, [selectedBudgetId, budgets, expenses]);
  
  // Load exchange rates
  useEffect(() => {
    const loadExchangeRates = async () => {
      try {
        const ratesData = await api.getLatestExchangeRates('EUR');
        setExchangeRates(ratesData.rates);
      } catch (err) {
        console.error('Error loading exchange rates:', err);
        // Set fallback rates if API fails
        setExchangeRates({
          'EUR': 1.0,
          'GBP': 0.86,
          'USD': 1.08,
          'CHF': 0.96,
          'CAD': 1.46
        });
      }
    };
    
    loadExchangeRates();
  }, []);

  // Load accounts, budgets, and trips (these are small datasets, safe to load all)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [accountsData, budgetsData, tripsData] = await Promise.all([
          api.getAccounts(),
          api.getBudgets(),
          api.getTrips(),
        ]);
        setAccounts(accountsData);
        setBudgets(budgetsData);
        setTrips(tripsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Get unique categories for filter dropdown (from expenses only)
  const categories = useMemo(() => {
    const cats = new Set(expenses.map(e => e.category));
    return Array.from(cats).sort();
  }, [expenses]);
  
  const currencies = useMemo(() => {
    const currs = new Set(expenses.map(e => e.currency_code));
    return Array.from(currs).sort();
  }, [expenses]);

  // Helper function to convert expense amount to display currency
  // Using useCallback to ensure stable reference and proper currency conversion
  const convertAmount = useCallback((amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;
    if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) return amount;
    
    // Convert from source currency to EUR, then to target currency
    // If source is EUR, rate is 1.0, otherwise use inverse
    const toEur = fromCurrency === 'EUR' ? 1.0 : (1.0 / exchangeRates[fromCurrency]);
    const fromEur = toCurrency === 'EUR' ? 1.0 : exchangeRates[toCurrency];
    
    return amount * toEur * fromEur;
  }, [exchangeRates]);
  
  const handleOpenDialog = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setKeepOpen(false);
      setSelectedBudgetId(''); // Don't set budget when editing
      setFormData({
        account_id: transaction.account_id,
        amount: Math.abs(transaction.amount), // Expenses are negative, so convert to positive
        category: transaction.category || '',
        transaction_date: transaction.transaction_date,
        description: transaction.description || null,
        merchant: transaction.merchant || '',
        trip_id: transaction.trip_id,
      });
    } else {
      setEditingTransaction(null);
      setKeepOpen(false);
      setSelectedBudgetId(''); // Reset budget selection
      setFormData({
        account_id: accounts[0]?.account_id || 0,
        amount: 0,
        category: '',
        transaction_date: new Date().toISOString().split('T')[0],
        description: null,
        merchant: '',
        trip_id: null,
      });
    }
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTransaction(null);
    setKeepOpen(false);
    setFormData({
      account_id: 0,
      amount: 0,
      category: '',
      transaction_date: new Date().toISOString().split('T')[0],
      description: null,
      merchant: '',
      trip_id: null,
    });
  };
  
  const handleSaveTransaction = async () => {
    try {
      setSaving(true);
      setError(null);
      
      if (editingTransaction) {
        const updateData: TransactionUpdateRequest = {
          amount: -Math.abs(formData.amount), // Expenses should be negative
          category: formData.category,
          transaction_date: formData.transaction_date,
          description: formData.description || undefined,
          merchant: formData.merchant || undefined,
          trip_id: formData.trip_id,
        };
        await api.updateTransaction(editingTransaction.transaction_id, updateData);
      } else {
        const createData: TransactionCreateRequest = {
          account_id: formData.account_id,
          amount: -Math.abs(formData.amount), // Expenses should be negative
          transaction_type: 'expense',
          category: formData.category,
          transaction_date: formData.transaction_date,
          description: formData.description || undefined,
          merchant: formData.merchant || undefined,
          trip_id: formData.trip_id,
        };
        await api.createTransaction(createData);
      }
      
      // Reload expenses using the hook (will automatically apply period filters)
      await reloadExpenses();
      
      if (keepOpen && !editingTransaction) {
        // Keep dialog open and reset form, but keep date, account, currency, and budget
        const currentDate = formData.transaction_date;
        const currentAccountId = formData.account_id;
        const currentBudgetId = selectedBudgetId;
        setFormData({
          account_id: currentAccountId,
          amount: 0,
          category: '',
          transaction_date: currentDate, // Keep the date
          description: null,
          merchant: '',
          trip_id: null,
        });
        setSelectedBudgetId(currentBudgetId); // Keep budget selection
        // Focus on merchant field for quick entry
        setTimeout(() => {
          const merchantInput = document.querySelector('input[value=""]') as HTMLInputElement;
          if (merchantInput) merchantInput.focus();
        }, 100);
      } else {
        handleCloseDialog();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteTransaction = async (transactionId: number) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }
    
    try {
      setError(null);
      await api.deleteTransaction(transactionId);
      
      // Reload expenses using the hook (will automatically apply period filters)
      await reloadExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  // Helper to get previous period dates (for trend calculations)
  const getPreviousPeriodDates = useCallback(() => {
    if (!filterStartDate || !filterEndDate) return { start: null, end: null };
    
    const start = new Date(filterStartDate);
    const end = new Date(filterEndDate);
    const periodLength = end.getTime() - start.getTime();
    const previousPeriodStart = new Date(start.getTime() - periodLength - 1);
    const previousPeriodEnd = new Date(start.getTime() - 1);
    
    return { start: previousPeriodStart, end: previousPeriodEnd };
  }, [filterStartDate, filterEndDate]);

  // Navigate to previous month (maintains same day of month, e.g., 24th to 23rd)
  const handlePreviousMonth = useCallback(() => {
    if (!filterStartDate || !filterEndDate) return;
    
    const start = new Date(filterStartDate);
    const startDay = start.getDate(); // Get the day of month (e.g., 24)
    const end = new Date(filterEndDate);
    const endDay = end.getDate(); // Get the day of month (e.g., 23)
    
    // Move start date back by one month, keeping the same day
    const newStart = new Date(start.getFullYear(), start.getMonth() - 1, startDay);
    
    // Move end date back by one month, keeping the same day
    const newEnd = new Date(end.getFullYear(), end.getMonth() - 1, endDay);
    
    setFilterStartDate(newStart.toISOString().split('T')[0]);
    setFilterEndDate(newEnd.toISOString().split('T')[0]);
  }, [filterStartDate, filterEndDate]);

  // Navigate to next month (maintains same day of month, e.g., 24th to 23rd)
  const handleNextMonth = useCallback(() => {
    if (!filterStartDate || !filterEndDate) return;
    
    const start = new Date(filterStartDate);
    const startDay = start.getDate(); // Get the day of month (e.g., 24)
    const end = new Date(filterEndDate);
    const endDay = end.getDate(); // Get the day of month (e.g., 23)
    
    // Move start date forward by one month, keeping the same day
    const newStart = new Date(start.getFullYear(), start.getMonth() + 1, startDay);
    
    // Move end date forward by one month, keeping the same day
    const newEnd = new Date(end.getFullYear(), end.getMonth() + 1, endDay);
    
    setFilterStartDate(newStart.toISOString().split('T')[0]);
    setFilterEndDate(newEnd.toISOString().split('T')[0]);
  }, [filterStartDate, filterEndDate]);

  // Filter expenses based on selected date range
  const filteredExpenses = useMemo(() => {
    if (!filterStartDate || !filterEndDate) return expenses;
    
    const start = new Date(filterStartDate);
    const end = new Date(filterEndDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.transaction_date);
      return expenseDate >= start && expenseDate <= end;
    });
  }, [expenses, filterStartDate, filterEndDate]);

  // Calculate budget status for summary card
  const budgetStatus = useMemo(() => {
    if (!comparisonBudgetId) return null;
    const selectedBudget = budgets.find(b => b.budget_id.toString() === comparisonBudgetId);
    if (!selectedBudget) return null;
    
    // Use budgeted_amount if available, otherwise fall back to budgeted
    // Convert budget from budget currency to display currency
    const monthlyBudgetedInBudgetCurrency = selectedBudget.categories.reduce((sum, cat) => sum + (cat.budgeted_amount || cat.budgeted || 0), 0);
    const monthlyBudgeted = convertAmount(monthlyBudgetedInBudgetCurrency, selectedBudget.currency, displayCurrency);
    
    // Prorate budget based on date range
    let totalBudgeted = monthlyBudgeted;
    if (filterStartDate && filterEndDate) {
      const start = new Date(filterStartDate);
      const end = new Date(filterEndDate);
      const daysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Calculate days in the month that contains the start date
      const startMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      const daysInMonth = startMonth.getDate();
      
      // Prorate the monthly budget based on the number of days in the selected range
      // If the range spans multiple months, we'll use a simple average
      const monthsInRange = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
      const averageDaysPerMonth = daysInRange / monthsInRange;
      totalBudgeted = (monthlyBudgeted / daysInMonth) * daysInRange;
    }
    
    // Sum ALL expenses in the period (all spending, regardless of category)
    // Convert all expenses to display currency and sum them up
    const totalActual = filteredExpenses.reduce((sum, expense) => {
      const convertedAmount = convertAmount(Math.abs(expense.amount), expense.currency_code, displayCurrency);
      return sum + convertedAmount;
    }, 0);
    
    // Calculate remaining/overspent: Total Budgeted - Total Actual Spending
    const remaining = totalBudgeted - totalActual;
    const isOverBudget = remaining < 0;
    
    return {
      totalBudgeted,
      totalActual,
      remaining: Math.abs(remaining),
      isOverBudget,
      currency: displayCurrency, // Use display currency instead of budget currency
      color: isOverBudget ? '#EF4444' : '#10B981',
    };
  }, [comparisonBudgetId, budgets, filteredExpenses, convertAmount, filterStartDate, filterEndDate, displayCurrency]);

  // Calculate chart data for expenses by category, currency, or merchant (with currency conversion)
  const categoryChartData = useMemo(() => {
    // Use filtered expenses (trips are handled separately)
    const expensesToUse = filteredExpenses;
    
    if (expensesToUse.length === 0) return null;

    const totals: { [key: string]: number } = {};
    const counts: { [key: string]: number } = {};
    
    if (categoryView === 'currency') {
      // Group by currency
      expensesToUse.forEach(expense => {
        const currency = expense.currency_code;
        if (!totals[currency]) {
          totals[currency] = 0;
          counts[currency] = 0;
        }
        // Convert to display currency
        const convertedAmount = convertAmount(Math.abs(expense.amount), expense.currency_code, displayCurrency);
        totals[currency] += convertedAmount;
        counts[currency] += 1;
      });
    } else if (categoryView === 'merchant') {
      // Group by merchant
      expensesToUse.forEach(expense => {
        const merchant = expense.merchant || 'Unknown';
        if (!totals[merchant]) {
          totals[merchant] = 0;
          counts[merchant] = 0;
        }
        // Convert to display currency
        const convertedAmount = convertAmount(Math.abs(expense.amount), expense.currency_code, displayCurrency);
        totals[merchant] += convertedAmount;
        counts[merchant] += 1;
      });
    } else {
      // Group by category
      expensesToUse.forEach(expense => {
        if (!totals[expense.category]) {
          totals[expense.category] = 0;
          counts[expense.category] = 0;
        }
        // Convert to display currency
        const convertedAmount = convertAmount(Math.abs(expense.amount), expense.currency_code, displayCurrency);
        totals[expense.category] += convertedAmount;
        counts[expense.category] += 1;
      });
    }

    const labels = Object.keys(totals).sort();
    const values = labels.map(key => totals[key]);
    const countsArray = labels.map(key => counts[key]);
    const chartColors = categoryView === 'currency'
      ? labels.map((currency, index) => getCurrencyColor(currency, index, colorPalette, colors.donut_colors))
      : labels.map((item, index) => getCategoryColor(item, index, colorPalette, colors.donut_colors));
    const total = values.reduce((a, b) => a + b, 0);
    const hoverText = labels.map(key => 
      `${key}<br>${currencyFormat(totals[key], displayCurrency)}<br>${total > 0 ? ((totals[key] / total) * 100).toFixed(1) : '0.0'}%`
    );

    return { labels, values, colors: chartColors, hoverText, total, counts: countsArray, viewType: categoryView };
  }, [filteredExpenses, colorPalette, displayCurrency, exchangeRates, categoryView, colors.donut_colors, convertAmount]);

  // Calculate trip data separately (independent of date filter)
  // Use tripExpenses from useTripExpenses hook (all expenses, not period-filtered)
  const tripData = useMemo(() => {
    // Only include expenses with trip_id (filter out null, undefined, and 0)
    const tripExpensesFiltered = tripExpenses.filter(expense => 
      expense.trip_id && expense.trip_id !== 0
    );
    if (tripExpensesFiltered.length === 0) return null;

    const totals: { [key: string]: number } = {};
    const counts: { [key: string]: number } = {};
    const latestDates: { [key: string]: Date } = {};

    // Use filtered expenses only
    tripExpensesFiltered.forEach(expense => {
      const trip = expense.trip_id!.toString();
      if (!totals[trip]) {
        totals[trip] = 0;
        counts[trip] = 0;
        latestDates[trip] = new Date(expense.transaction_date);
      }
      const convertedAmount = convertAmount(Math.abs(expense.amount), expense.currency_code, displayCurrency);
      totals[trip] += convertedAmount;
      counts[trip] += 1;
      const expenseDate = new Date(expense.transaction_date);
      if (expenseDate > latestDates[trip]) {
        latestDates[trip] = expenseDate;
      }
    });

    const labels = Object.keys(totals);
    const values = labels.map(key => totals[key]);
    const countsArray = labels.map(key => counts[key]);
    const latestDatesArray = labels.map(key => latestDates[key]);
    const chartColors = labels.map((item, index) => getCategoryColor(item, index, colorPalette, colors.donut_colors));
    const total = values.reduce((a, b) => a + b, 0);
    const hoverText = labels.map(key => 
      `${key}<br>${currencyFormat(totals[key], displayCurrency)}<br>${total > 0 ? ((totals[key] / total) * 100).toFixed(1) : '0.0'}%`
    );

    return { labels, values, colors: chartColors, hoverText, total, counts: countsArray, latestDates: latestDatesArray };
  }, [tripExpenses, displayCurrency, exchangeRates, colorPalette, colors.donut_colors, convertAmount]);

  // Calculate spending over time data (with currency conversion) - cumulative
  const spendingOverTimeData = useMemo(() => {
    if (filteredExpenses.length === 0) return null;

    // Always group expenses by date (daily), regardless of view mode
    const dailyTotals: { [date: string]: number } = {};
    
    filteredExpenses.forEach(expense => {
      const date = expense.transaction_date;
      if (!dailyTotals[date]) {
        dailyTotals[date] = 0;
      }
      // Convert to display currency
      const convertedAmount = convertAmount(Math.abs(expense.amount), expense.currency_code, displayCurrency);
      dailyTotals[date] += convertedAmount;
    });

    const sortedDates = Object.keys(dailyTotals).sort();
    const dates = sortedDates.map(date => new Date(date));
    
    // Calculate cumulative amounts
    let cumulativeTotal = 0;
    const cumulativeAmounts = sortedDates.map(date => {
      cumulativeTotal += dailyTotals[date];
      return cumulativeTotal;
    });

    return { dates: dates.map(d => d.toISOString().split('T')[0]), amounts: cumulativeAmounts };
  }, [filteredExpenses, displayCurrency, exchangeRates, convertAmount]);

  // Calculate previous period's cumulative spending data
  const previousPeriodSpendingData = useMemo(() => {
    if (!allComparisonExpenses || allComparisonExpenses.length === 0) return null;
    if (!spendingOverTimeData || spendingOverTimeData.dates.length === 0) return null;

    if (!filterStartDate || !filterEndDate) return null;
    
    const start = new Date(filterStartDate);
    const end = new Date(filterEndDate);
    const periodLength = end.getTime() - start.getTime();
    const previousPeriodStart = new Date(start.getTime() - periodLength - 1);
    const previousPeriodEnd = new Date(start.getTime() - 1);

    // Filter expenses from previous period
    const previousPeriodExpenses = allComparisonExpenses.filter(expense => {
      const expenseDate = new Date(expense.transaction_date);
      return expenseDate >= previousPeriodStart && expenseDate <= previousPeriodEnd;
    });

    if (previousPeriodExpenses.length === 0) return null;

    // Group by date (daily)
    const dailyTotals: { [date: string]: number } = {};
    
    previousPeriodExpenses.forEach(expense => {
      const date = expense.transaction_date;
      if (!dailyTotals[date]) {
        dailyTotals[date] = 0;
      }
      // Convert to display currency (using local convertAmount which uses exchangeRates from closure)
      const convertedAmount = convertAmount(Math.abs(expense.amount), expense.currency_code, displayCurrency);
      dailyTotals[date] += convertedAmount;
    });

    const sortedDates = Object.keys(dailyTotals).sort();
    
    // Calculate cumulative amounts
    let cumulativeTotal = 0;
    const cumulativeAmounts = sortedDates.map(date => {
      cumulativeTotal += dailyTotals[date];
      return cumulativeTotal;
    });

    // Get the final cumulative total for the previous period
    const previousPeriodFinalTotal = cumulativeAmounts.length > 0 ? cumulativeAmounts[cumulativeAmounts.length - 1] : 0;

    // Align dates to current period's timeline
    // Map each day in previous period to corresponding day-of-period in current period
    const currentPeriodFirstDate = new Date(spendingOverTimeData.dates[0]);
    const currentPeriodLastDate = spendingOverTimeData.dates[spendingOverTimeData.dates.length - 1];
    const alignedDates: string[] = [];
    const alignedAmounts: number[] = [];
    
    // Map each previous period date to current period timeline
    sortedDates.forEach((date, index) => {
      const expenseDate = new Date(date);
      const daysSincePreviousStart = Math.floor((expenseDate.getTime() - previousPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
      const alignedDate = new Date(currentPeriodFirstDate);
      alignedDate.setDate(currentPeriodFirstDate.getDate() + daysSincePreviousStart);
      const alignedDateStr = alignedDate.toISOString().split('T')[0];
      
      // Only add if it's within the current period's date range
      if (alignedDateStr >= spendingOverTimeData.dates[0] && alignedDateStr <= currentPeriodLastDate) {
        alignedDates.push(alignedDateStr);
        alignedAmounts.push(cumulativeAmounts[index]);
      }
    });

    // Always ensure we start from the first date of current period
    if (alignedDates.length === 0 || alignedDates[0] !== spendingOverTimeData.dates[0]) {
      alignedDates.unshift(spendingOverTimeData.dates[0]);
      alignedAmounts.unshift(0);
    }

    // Always ensure we extend to the last date of current period
    const lastAlignedDate = alignedDates[alignedDates.length - 1];
    if (lastAlignedDate < currentPeriodLastDate) {
      alignedDates.push(currentPeriodLastDate);
      // Use the final cumulative total from the previous period
      alignedAmounts.push(previousPeriodFinalTotal);
    }

    return { dates: alignedDates, amounts: alignedAmounts };
  }, [allComparisonExpenses, filterStartDate, filterEndDate, displayCurrency, exchangeRates, spendingOverTimeData, convertAmount]);

  // Calculate monthly comparison bar chart data based on current date range
  // Duplicate the selected range pattern for 6 periods going backwards
  const monthlyComparisonData = useMemo(() => {
    if (!filterStartDate || !filterEndDate) return null;

    const periods: { start: Date; end: Date; label: string }[] = [];
    const currentStart = new Date(filterStartDate);
    const currentEnd = new Date(filterEndDate);
    
    // Calculate the period length in days
    const periodLengthDays = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Get the day of month from current period
    const startDay = currentStart.getDate();
    const endDay = currentEnd.getDate();
    
    // Generate 6 periods: 3 before, current (middle), 2 after
    // Current period should be in the middle (4th position)
    for (let i = 3; i >= -2; i--) {
      const periodStart = new Date(currentStart);
      periodStart.setMonth(periodStart.getMonth() - i);
      periodStart.setDate(startDay);
      
      const periodEnd = new Date(periodStart);
      // Calculate end date based on the same pattern (e.g., if current is 24th to 23rd, keep that pattern)
      if (endDay < startDay) {
        // End day is in next month (e.g., 24th to 23rd)
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(endDay);
      } else {
        // End day is in same month
        periodEnd.setDate(endDay);
      }
      periodEnd.setHours(23, 59, 59, 999);
      
      periodStart.setHours(0, 0, 0, 0);
      
      const label = periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      periods.push({ start: periodStart, end: periodEnd, label });
    }
    
    const labels: string[] = [];
    const values: number[] = [];
    const isCurrentPeriod: boolean[] = [];
    
    periods.forEach((period, index) => {
      // For the current period (index 3, middle position), use filteredExpenses to match donut chart
      let periodExpenses;
      const isCurrent = index === 3;
      if (isCurrent) {
        // Current period (middle) - use filteredExpenses to ensure it matches donut chart
        periodExpenses = filteredExpenses.filter(expense => expense.amount < 0);
      } else {
        // Other periods - use allComparisonExpenses
        periodExpenses = allComparisonExpenses.filter(expense => {
          const expenseDate = new Date(expense.transaction_date);
          return expenseDate >= period.start && expenseDate <= period.end && expense.amount < 0;
        });
      }
      
      const total = periodExpenses.reduce((sum, expense) => {
        const accountCurrency = expense.currency_code || accounts.find(a => a.account_id === expense.account_id)?.currency_code || 'EUR';
        return sum + convertAmount(Math.abs(expense.amount), accountCurrency, displayCurrency);
      }, 0);
      
      labels.push(period.label);
      values.push(total);
      isCurrentPeriod.push(isCurrent);
    });
    
    // Always return data even if all values are 0, so the chart can render
    return { labels, values, isCurrentPeriod };
  }, [allComparisonExpenses, filteredExpenses, filterStartDate, filterEndDate, displayCurrency, exchangeRates, accounts, convertAmount]);

  // Calculate spending trend for CumulativeSpendingCard
  const spendingTrend = useMemo(() => {
    if (!categoryChartData || filteredExpenses.length === 0) return null;
    
    if (!filterStartDate || !filterEndDate) return null;
    
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
      const convertedAmount = convertAmount(
        Math.abs(expense.amount),
        expense.currency_code,
        displayCurrency
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
  }, [categoryChartData, filteredExpenses, allComparisonExpenses, filterStartDate, filterEndDate, displayCurrency, exchangeRates, convertAmount]);
  
  return (
    <Box
      sx={{
        flex: 1,
        backgroundColor: PALETTE_BACKGROUNDS[colorPalette],
        pt: { xs: 10, sm: 11 },
        pb: 6,
        minHeight: '100vh',
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: 1280, px: { xs: 2, sm: 3, lg: 4 } }}>
        {/* Header */}
        <ExpenseTrackingHeader
          colors={colors}
          colorPalette={colorPalette}
          displayCurrency={displayCurrency}
          budgets={budgets}
          comparisonBudgetId={comparisonBudgetId}
          filterStartDate={filterStartDate}
          filterEndDate={filterEndDate}
          onCurrencyChange={(currency) => setDisplayCurrency(currency)}
          onBudgetSelect={(budgetId) => {
            setComparisonBudgetId(budgetId || '');
            if (budgetId) {
              localStorage.setItem('defaultComparisonBudgetId', budgetId);
            } else {
              localStorage.removeItem('defaultComparisonBudgetId');
            }
          }}
          onAddExpense={() => handleOpenDialog()}
          onFilterStartDateChange={(date) => setFilterStartDate(date)}
          onFilterEndDateChange={(date) => setFilterEndDate(date)}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <DateRangeNavigator
          filterStartDate={filterStartDate}
          filterEndDate={filterEndDate}
          onPrevious={handlePreviousMonth}
          onNext={handleNextMonth}
          colors={colors}
        />
        
        {/* Top Section: Cumulative Spending Card (left) and Summary Cards (right) */}
        {filteredExpenses.length > 0 && spendingOverTimeData && categoryChartData && (
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3}>
              {/* Cumulative Spending Card - Left Side (7/12 of space on desktop) */}
              <Grid item xs={12} md={7}>
                <CumulativeSpendingCard
                  totalSpending={categoryChartData.total}
                  spendingOverTimeData={spendingOverTimeData}
                  displayCurrency={displayCurrency}
                  colors={colors}
                  colorPalette={colorPalette}
                  spendingTrend={spendingTrend}
                />
              </Grid>

              {/* Summary Cards - Right Side (5/12 of space on desktop) */}
              <Grid item xs={12} md={5}>
                <SummaryCards
                  filteredExpenses={filteredExpenses}
                  categoryChartData={categoryChartData}
                  budgetStatus={budgetStatus}
                  displayCurrency={displayCurrency}
                  exchangeRates={exchangeRates}
                  allComparisonExpenses={allComparisonExpenses}
                  filterStartDate={filterStartDate}
                  filterEndDate={filterEndDate}
                  colors={colors}
                  verticalLayout={true}
                  budgets={budgets}
                  comparisonBudgetId={comparisonBudgetId}
                  accounts={accounts}
                />
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* Charts Section - Category Breakdown and Monthly Comparison */}
        {/* Separate section that breaks from top part */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {/* Category Totals Card - Left side, fills 7/12 of width (3/5 equivalent) */}
            {categoryChartData ? (
              <CategoryTotalsCard
                  categoryChartData={categoryChartData}
                  filteredExpenses={filteredExpenses}
                  selectedCategory={selectedCategory}
                  categoryView={categoryView}
                  displayCurrency={displayCurrency}
                  exchangeRates={exchangeRates}
                  colors={colors}
                  colorPalette={colorPalette}
                  accounts={accounts}
                  budgets={budgets}
                  comparisonBudgetId={comparisonBudgetId}
                  selectedBudgetType={selectedBudgetType}
                  selectedBudgetCategory={selectedBudgetCategory}
                  selectedCategoryForLinked={selectedCategoryForLinked}
                  selectedLinkedCategoryName={selectedLinkedCategoryName}
                  onCategorySelect={setSelectedCategory}
                  onViewChange={(view) => {
                    setCategoryView(view);
                    setSelectedCategory(null); // Clear selection when switching views
                    if (view !== 'budget') {
                      setSelectedBudgetType(null);
                      setSelectedBudgetCategory(null);
                      setSelectedCategoryForLinked(null);
                      setSelectedLinkedCategoryName(null);
                    }
                  }}
                  onBudgetTypeSelect={setSelectedBudgetType}
                  onBudgetCategorySelect={setSelectedBudgetCategory}
                  onCategoryForLinkedSelect={setSelectedCategoryForLinked}
                  onLinkedCategoryNameSelect={setSelectedLinkedCategoryName}
                  onAddExpense={(prefillData) => {
                    const newExpenseData = {
                      account_id: prefillData?.account_id || accounts[0]?.account_id || 0,
                      amount: prefillData?.amount || 0,
                      category: prefillData?.category || '',
                      transaction_date: prefillData?.transaction_date || new Date().toISOString().split('T')[0],
                      description: prefillData?.description || null,
                      merchant: prefillData?.merchant || '',
                      trip_id: prefillData?.trip_id || null,
                    };
                    setFormData(newExpenseData);
                    setEditingTransaction(null);
                    setKeepOpen(false);
                    setSelectedBudgetId('');
                    setDialogOpen(true);
                  }}
                  onExpenseClick={handleOpenDialog}
                  gridSize={{ xs: 12, md: 7 }}
                />
            ) : (
              <Grid item xs={12} md={7}>
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
                    No expenses in this period
                  </Typography>
                </Paper>
              </Grid>
            )}
              
            {/* Monthly Comparison Chart - Right side, fills 5/12 of width (2/5 equivalent) */}
            {monthlyComparisonData ? (
              <MonthlyComparisonChart
                monthlyComparisonData={monthlyComparisonData}
                comparisonBudgetId={comparisonBudgetId}
                budgets={budgets}
                displayCurrency={displayCurrency}
                frequency="monthly"
                colors={colors}
                colorPalette={colorPalette}
                gridSize={{ xs: 12, md: 5 }}
                categoryChartData={categoryChartData}
              />
            ) : (
              <Grid item xs={12} md={5}>
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
                    No comparison data available
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
        
        {/* Trip Expenses Card */}
        {tripData && (
          <TripExpensesCard
            tripData={tripData}
            tripExpenses={tripExpenses}
            displayCurrency={displayCurrency}
            colors={colors}
            colorPalette={colorPalette}
          />
        )}
        
        {showTable && (
          <ExpensesTable
            expenses={filteredExpenses}
            displayCurrency={displayCurrency}
            colors={colors}
            colorPalette={colorPalette}
            categories={categories}
            exchangeRates={exchangeRates}
            convertAmount={convertAmount}
            onEdit={handleOpenDialog}
            onDelete={handleDeleteTransaction}
            loading={loading}
            onHide={() => setShowTable(false)}
          />
        )}
        
        {/* Add/Edit Expense Dialog */}
        <ExpenseDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          onSave={handleSaveTransaction}
          editingExpense={editingTransaction}
          formData={formData}
          onFormDataChange={setFormData}
          saving={saving}
          keepOpen={keepOpen}
          onKeepOpenChange={setKeepOpen}
          accounts={accounts}
          budgets={budgets}
          trips={trips}
          selectedBudgetId={selectedBudgetId}
          onSelectedBudgetIdChange={setSelectedBudgetId}
          availableCategories={availableCategories}
          colors={colors}
          onDelete={handleDeleteTransaction}
        />
      </Container>
    </Box>
  );
};

export default ExpenseTracking;
