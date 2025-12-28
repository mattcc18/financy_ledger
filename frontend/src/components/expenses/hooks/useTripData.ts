import { useMemo } from 'react';
import { Transaction } from '../../../services/api';
import { convertAmount, getCategoryColor } from '../utils';

export interface TripData {
  labels: string[];
  values: number[];
  colors: string[];
  hoverText: string[];
  total: number;
  counts: number[];
  latestDates: { [key: string]: Date };
}

export const useTripData = (
  expenses: Transaction[],
  displayCurrency: string,
  exchangeRates: { [key: string]: number },
  colorPalette: string,
  donutColors: string[],
  accounts: { account_id: number; currency_code: string }[]
): TripData | null => {
  return useMemo(() => {
    // Filter out expenses without trip_id
    const tripExpenses = expenses.filter(expense => expense.trip_id && expense.trip_id > 0);
    if (tripExpenses.length === 0) return null;

    const totals: { [key: string]: number } = {};
    const counts: { [key: string]: number } = {};
    const latestDates: { [key: string]: Date } = {};
    
    // Create account currency map
    const accountCurrencyMap = new Map(accounts.map(a => [a.account_id, a.currency_code]));

    tripExpenses.forEach(expense => {
      const tripId = String(expense.trip_id);
      if (!totals[tripId]) {
        totals[tripId] = 0;
        counts[tripId] = 0;
        latestDates[tripId] = new Date(expense.transaction_date);
      }
      const accountCurrency = accountCurrencyMap.get(expense.account_id) || 'EUR';
      const convertedAmount = convertAmount(Math.abs(expense.amount), accountCurrency, displayCurrency, exchangeRates);
      totals[tripId] += convertedAmount;
      counts[tripId] += 1;
      const expenseDate = new Date(expense.transaction_date);
      if (expenseDate > latestDates[tripId]) {
        latestDates[tripId] = expenseDate;
      }
    });

    const sortedTrips = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    
    return {
      labels: sortedTrips.map(([tripId]) => `Trip ${tripId}`),
      values: sortedTrips.map(([, total]) => total),
      colors: sortedTrips.map((_, idx) => getCategoryColor('travel', idx, colorPalette, donutColors)),
      hoverText: sortedTrips.map(([tripId, total]) => 
        `Trip ${tripId}<br>${total.toFixed(2)} ${displayCurrency}<br>${counts[tripId]} expenses`
      ),
      total: sortedTrips.reduce((sum, [, total]) => sum + total, 0),
      counts: sortedTrips.map(([tripId]) => counts[tripId]),
      latestDates: Object.fromEntries(
        sortedTrips.map(([tripId]) => [tripId, latestDates[tripId]])
      ),
    };
  }, [expenses, displayCurrency, exchangeRates, colorPalette, donutColors, accounts]);
};



