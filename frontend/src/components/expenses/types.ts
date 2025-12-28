import { Transaction, Budget, Account } from '../../services/api';

export interface ExpenseTrackingColors {
  card_bg: string;
  card_text: string;
  card_subtext: string;
  card_accent: string;
  cash: string;
  investment: string;
}


export interface PeriodDates {
  start: Date;
  end: Date;
}

export interface BudgetStatus {
  totalBudgeted: number;
  totalActual: number;
  remaining: number;
  isOverBudget: boolean;
  currency: string;
  color: string;
}

export interface CategoryChartData {
  labels: string[];
  values: number[];
  colors: string[];
  hoverText: string[];
  total: number;
  counts: number[];
  viewType: 'category' | 'currency' | 'merchant';
}

export interface TripData {
  labels: string[];
  values: number[];
  colors: string[];
  hoverText: string[];
  total: number;
  counts: number[];
  latestDates: { [key: string]: Date };
}

export interface ExpenseTrackingProps {
  expenses: Transaction[]; // Using Transaction instead of Expense
  budgets: Budget[];
  colors: ExpenseTrackingColors;
  colorPalette: string;
  displayCurrency: string;
  exchangeRates: { [key: string]: number };
  filteredExpenses: Transaction[];
  categoryChartData: CategoryChartData | null;
  budgetStatus: BudgetStatus | null;
  comparisonBudgetId: string;
  frequency: 'weekly' | 'monthly';
  startDay: number;
  selectedMonth: string;
  onPeriodChange: (month: string) => void;
  onFrequencyChange: (freq: 'weekly' | 'monthly') => void;
  onStartDayChange: (day: number) => void;
}



