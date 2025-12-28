import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '../../../services/api';
import { api } from '../../../services/api';
import { getPeriodDates } from '../utils';

interface UseExpenseDataOptions {
  selectedMonth: string;
  frequency: 'weekly' | 'monthly';
  startDay: number;
  filterAccountId?: number | '';
  filterCategory?: string;
  filterCurrency?: string;
  // For trips, we need all expenses regardless of date
  includeAllForTrips?: boolean;
}

export const useExpenseData = (options: UseExpenseDataOptions) => {
  const {
    selectedMonth,
    frequency,
    startDay,
    filterAccountId,
    filterCategory,
    filterCurrency,
    includeAllForTrips = false,
  } = options;

  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get date range for filtering
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      if (!includeAllForTrips) {
        const { start, end } = getPeriodDates(selectedMonth, frequency, startDay);
        startDate = start.toISOString().split('T')[0];
        endDate = end.toISOString().split('T')[0];
      }
      
      // Get all transactions with type 'expense' using server-side filtering
      const transactions = await api.getTransactions(
        filterAccountId || undefined,
        'expense',
        filterCategory || undefined,
        startDate,
        endDate,
        filterCurrency || undefined
      );
      
      setExpenses(transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, frequency, startDay, filterAccountId, filterCategory, filterCurrency, includeAllForTrips]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  return {
    expenses,
    loading,
    error,
    reload: loadExpenses,
  };
};

