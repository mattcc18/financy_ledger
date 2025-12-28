import { useMemo } from 'react';
import { Transaction } from '../../../services/api';
import { convertAmount, getPeriodDates } from '../utils';

export interface MonthlyComparisonData {
  labels: string[];
  values: number[];
  isCurrentPeriod?: boolean[];
}

export const useMonthlyComparison = (
  expenses: Transaction[],
  selectedMonth: string,
  frequency: 'weekly' | 'monthly',
  startDay: number,
  displayCurrency: string,
  exchangeRates: { [key: string]: number },
  accounts?: { account_id: number; currency_code: string }[]
): MonthlyComparisonData | null => {
  return useMemo(() => {
    if (!expenses || expenses.length === 0) return null;

    const [year, month] = selectedMonth.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, 1);
    
    const periods: { start: Date; end: Date; label: string }[] = [];
    
    if (frequency === 'monthly') {
      for (let i = 5; i >= 0; i--) {
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
        
        const label = periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        periods.push({ start: periodStart, end: periodEndDate, label });
      }
    } else {
      const lastStartDay = new Date(selectedDate);
      if (lastStartDay.getDate() >= startDay) {
        lastStartDay.setDate(startDay);
      } else {
        lastStartDay.setMonth(lastStartDay.getMonth() - 1);
        lastStartDay.setDate(startDay);
      }
      
      for (let i = 5; i >= 0; i--) {
        const weekStart = new Date(lastStartDay);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        periods.push({ start: weekStart, end: weekEnd, label });
      }
    }

    // Create account currency map - use currency_code from transaction if available, otherwise fallback to accounts map
    const accountCurrencyMap = new Map();
    if (accounts && accounts.length > 0) {
      accounts.forEach(a => accountCurrencyMap.set(a.account_id, a.currency_code));
    }
    
    const labels: string[] = [];
    const values: number[] = [];
    
    periods.forEach(period => {
      const periodExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.transaction_date);
        return expenseDate >= period.start && expenseDate <= period.end;
      });
      
      const total = periodExpenses.reduce((sum, expense) => {
        // Prefer currency_code from transaction, then from account map, then default to EUR
        const accountCurrency = expense.currency_code || accountCurrencyMap.get(expense.account_id) || 'EUR';
        return sum + convertAmount(Math.abs(expense.amount), accountCurrency, displayCurrency, exchangeRates);
      }, 0);
      
      labels.push(period.label);
      values.push(total);
    });
    
    return { labels, values };
  }, [expenses, selectedMonth, frequency, startDay, displayCurrency, exchangeRates, accounts]);
};

