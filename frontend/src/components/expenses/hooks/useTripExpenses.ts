import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '../../../services/api';
import { api } from '../../../services/api';

/**
 * Hook to load ALL expenses for trips (independent of date filters)
 * This should be used sparingly and only when trips section is visible
 */
export const useTripExpenses = (enabled: boolean = false) => {
  const [tripExpenses, setTripExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadTripExpenses = useCallback(async () => {
    if (!enabled) {
      setTripExpenses([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Load all expense transactions from all accounts (no date filter)
      const allTransactions = await api.getTransactions(
        undefined, // account_id - get all accounts
        'expense'  // transaction_type
      );
      setTripExpenses(allTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trip expenses');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    loadTripExpenses();
  }, [loadTripExpenses]);

  return {
    tripExpenses,
    loading,
    error,
    reload: loadTripExpenses,
  };
};

