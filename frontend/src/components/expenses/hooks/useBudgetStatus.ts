import { useMemo } from 'react';
import { Budget, Transaction } from '../../../services/api';
import { convertAmount } from '../utils';

export interface BudgetStatus {
  totalBudgeted: number;
  totalActual: number;
  remaining: number;
  isOverBudget: boolean;
  currency: string;
  color: string;
}

export const useBudgetStatus = (
  comparisonBudgetId: string,
  budgets: Budget[],
  filteredExpenses: Transaction[],
  convertAmountFn: (amount: number, fromCurrency: string, toCurrency: string, exchangeRates: { [key: string]: number }) => number,
  exchangeRates: { [key: string]: number },
  accounts: { account_id: number; currency_code: string }[]
): BudgetStatus | null => {
  return useMemo(() => {
    if (!comparisonBudgetId) return null;
    const selectedBudget = budgets.find(b => String(b.budget_id) === comparisonBudgetId);
    if (!selectedBudget) return null;
    
    const totalBudgeted = (selectedBudget.categories || []).reduce((sum: number, cat: any) => sum + (cat.budgeted_amount || 0), 0);
    const expenseSpending: { [category: string]: number } = {};
    
    // Create account currency map
    const accountCurrencyMap = new Map(accounts.map(a => [a.account_id, a.currency_code]));
    
    filteredExpenses.forEach(expense => {
      const accountCurrency = accountCurrencyMap.get(expense.account_id) || 'EUR';
      const convertedAmount = convertAmountFn(
        Math.abs(expense.amount), // Expenses are negative, so use absolute value
        accountCurrency,
        selectedBudget.currency,
        exchangeRates
      );
      if (!expenseSpending[expense.category || '']) {
        expenseSpending[expense.category || ''] = 0;
      }
      expenseSpending[expense.category || ''] += convertedAmount;
    });
    
    const totalActual = (selectedBudget.categories || []).reduce((sum: number, category: any) => {
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
      return sum + actual;
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
  }, [comparisonBudgetId, budgets, filteredExpenses, convertAmountFn, exchangeRates, accounts]);
};



