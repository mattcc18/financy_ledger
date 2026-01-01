import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '../../../services/api';
import { api } from '../../../services/api';
import { getPeriodDates } from '../utils';

interface UseComparisonExpensesOptions {
  selectedMonth: string;
  frequency: 'weekly' | 'monthly';
  startDay: number;
  displayCurrency: string;
  // Number of previous periods to load (default 6 for monthly comparison)
  periodsToLoad?: number;
  // Number of future periods to load (default 2 for monthly comparison)
  futurePeriodsToLoad?: number;
  // Optional: If provided, load all expenses in this date range instead of using fixed pattern
  dateRangeStart?: string;
  dateRangeEnd?: string;
}

/**
 * Hook to load expenses for multiple periods (current + previous periods)
 * Used for comparison charts and trend calculations
 */
export const useComparisonExpenses = (options: UseComparisonExpensesOptions) => {
  const {
    selectedMonth,
    frequency,
    startDay,
    displayCurrency,
    periodsToLoad = 6,
    futurePeriodsToLoad = 2,
    dateRangeStart,
    dateRangeEnd,
  } = options;

  const [allComparisonExpenses, setAllComparisonExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadComparisonExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If date range is provided, load expenses directly for that range
      if (dateRangeStart && dateRangeEnd) {
        const allTransactions = await api.getTransactions(
          undefined, // account_id - get all accounts
          'expense', // transaction_type
          undefined, // category
          dateRangeStart, // start_date
          dateRangeEnd    // end_date
        );
        setAllComparisonExpenses(allTransactions);
        setLoading(false);
        return;
      }
      
      const [year, month] = selectedMonth.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, 1);
      
      const periods: { start: Date; end: Date }[] = [];
      
      // Generate periods to load
      if (frequency === 'monthly') {
        // Load previous periods (going backwards)
        for (let i = periodsToLoad - 1; i >= 0; i--) {
          const periodEndMonth = new Date(selectedDate);
          periodEndMonth.setMonth(periodEndMonth.getMonth() - i);
          
          let periodStart: Date;
          let periodEndDate: Date;
          
          if (startDay === 1) {
            periodEndDate = new Date(periodEndMonth.getFullYear(), periodEndMonth.getMonth() + 1, 0);
            periodStart = new Date(periodEndMonth.getFullYear(), periodEndMonth.getMonth(), startDay);
          } else {
            periodEndDate = new Date(periodEndMonth.getFullYear(), periodEndMonth.getMonth() + 1, startDay - 1);
            periodStart = new Date(periodEndMonth.getFullYear(), periodEndMonth.getMonth(), startDay);
          }
          
          periodStart.setHours(0, 0, 0, 0);
          periodEndDate.setHours(23, 59, 59, 999);
          
          periods.push({ start: periodStart, end: periodEndDate });
        }
        
        // Load future periods (going forwards)
        for (let i = 1; i <= futurePeriodsToLoad; i++) {
          const periodEndMonth = new Date(selectedDate);
          periodEndMonth.setMonth(periodEndMonth.getMonth() + i);
          
          let periodStart: Date;
          let periodEndDate: Date;
          
          if (startDay === 1) {
            periodEndDate = new Date(periodEndMonth.getFullYear(), periodEndMonth.getMonth() + 1, 0);
            periodStart = new Date(periodEndMonth.getFullYear(), periodEndMonth.getMonth(), startDay);
          } else {
            periodEndDate = new Date(periodEndMonth.getFullYear(), periodEndMonth.getMonth() + 1, startDay - 1);
            periodStart = new Date(periodEndMonth.getFullYear(), periodEndMonth.getMonth(), startDay);
          }
          
          periodStart.setHours(0, 0, 0, 0);
          periodEndDate.setHours(23, 59, 59, 999);
          
          periods.push({ start: periodStart, end: periodEndDate });
        }
      } else {
        // Weekly
        const lastStartDay = new Date(selectedDate);
        if (lastStartDay.getDate() >= startDay) {
          lastStartDay.setDate(startDay);
        } else {
          lastStartDay.setMonth(lastStartDay.getMonth() - 1);
          lastStartDay.setDate(startDay);
        }
        
        for (let i = periodsToLoad - 1; i >= 0; i--) {
          const weekStart = new Date(lastStartDay);
          weekStart.setDate(weekStart.getDate() - (i * 7));
          weekStart.setHours(0, 0, 0, 0);
          
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          
          periods.push({ start: weekStart, end: weekEnd });
        }
      }

      // Load transactions for all periods using server-side date filtering
      const allTransactions: Transaction[] = [];
      
      // Load transactions for each period using date range filters
      for (const period of periods) {
        const startDate = period.start.toISOString().split('T')[0];
        const endDate = period.end.toISOString().split('T')[0];
        
        const periodExpenses = await api.getTransactions(
          undefined, // account_id - get all accounts
          'expense', // transaction_type
          undefined, // category
          startDate, // start_date
          endDate    // end_date
        );
        
        allTransactions.push(...periodExpenses);
      }
      
      setAllComparisonExpenses(allTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comparison expenses');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, frequency, startDay, periodsToLoad, futurePeriodsToLoad, dateRangeStart, dateRangeEnd]);

  useEffect(() => {
    loadComparisonExpenses();
  }, [loadComparisonExpenses]);

  return {
    allComparisonExpenses,
    loading,
    error,
    reload: loadComparisonExpenses,
  };
};

