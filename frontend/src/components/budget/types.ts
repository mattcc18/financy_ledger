export interface BudgetCategory {
  id: string;
  name: string;
  type: 'needs' | 'wants' | 'savings';
  budgeted: number;
  actual?: number;
  icon?: string;
  mapped_expense_categories?: string[];  // List of expense category names that map to this budget category
}

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  icon?: string;
}

export interface BudgetTotals {
  needs: number;
  wants: number;
  savings: number;
  total: number;
  remaining: number;
  needsPercent: number;
  wantsPercent: number;
  savingsPercent: number;
}



