const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:8000');

export interface Balance {
  balance_date: string;
  account_name: string;
  account_type: string;
  institution: string;
  currency_code: string;
  amount: number;
  balance_eur: number;
  balance_usd?: number;
  balance_gbp?: number;
  balance_chf?: number;
  balance_cad?: number;
}

export interface BalanceHistory {
  balance_date: string;
  account_name: string;
  account_type: string;
  institution: string;
  currency_code: string;
  amount: number;
  balance_eur: number;
  balance_usd?: number;
  balance_gbp?: number;
  balance_chf?: number;
  balance_cad?: number;
}

export interface Account {
  account_id: number;
  account_name: string;
  account_type: string;
  institution: string;
  currency_code: string;
}

export interface Transaction {
  transaction_id: number;
  account_id: number;
  amount: number;
  transaction_type: string;
  category: string | null;
  transaction_date: string;
  description: string | null;
  merchant: string | null;  // Only for expense-type transactions
  trip_id: number | null;  // Only for expense-type transactions
  account_name?: string | null;  // Account name from accounts.list
  currency_code?: string | null;  // Currency code from accounts.list
}

export interface Trip {
  trip_id: number;
  trip_name: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  category_id: number;
  category_name: string;
  category_type: 'expense' | 'income';
  created_at: string;
  updated_at: string;
}

export interface Expense {
  expense_id: number;
  expense_date: string;
  account_id: number;
  merchant: string;
  category: string;
  amount: number;
  currency_code: string;
  description: string | null;
  trip_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Metrics {
  cash: number;
  investments: number;
  net_worth: number;
  cash_investment_ratio: number;
}

export interface Budget {
  budget_id: number;
  name: string;
  currency: string;
  income_sources: { name: string; amount: number }[];
  categories: { name: string; budgeted_amount?: number; budgeted?: number; type: string }[];
  created_at: string;
  updated_at: string;
}

export interface Goal {
  goal_id: number;
  name: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  target_date: string | null;
  description: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;
  console.log('API Call:', options?.method || 'GET', url, options?.body);
  
  // Get auth token from localStorage
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };
  
  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.detail || error.message || error.error || errorMessage;
    } catch {
      // Keep default error message
    }
    console.error('API Error:', errorMessage);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log('API Response:', data);
  return data;
}

export const api = {
  getBalances: async (currency: string = 'EUR', date?: string): Promise<Balance[]> => {
    const params = new URLSearchParams({ currency });
    if (date) params.append('date', date);
    return fetchAPI<Balance[]>(`/api/balances?${params}`);
  },

  getAccountBalanceHistory: async (
    accountName: string,
    currency: string = 'EUR'
  ): Promise<BalanceHistory[]> => {
    const encodedName = encodeURIComponent(accountName.replace(/ /g, '_').replace(/\//g, '_'));
    const params = new URLSearchParams({ currency });
    return fetchAPI<BalanceHistory[]>(`/api/balances/history/${encodedName}?${params}`);
  },

  getAccounts: async (): Promise<Account[]> => {
    return fetchAPI<Account[]>('/api/accounts');
  },

  getTransactions: async (
    accountId?: number, 
    transactionType?: string, 
    category?: string,
    startDate?: string,
    endDate?: string,
    currencyCode?: string,
    tripId?: number
  ): Promise<Transaction[]> => {
    const params = new URLSearchParams();
    if (accountId) {
      params.append('account_id', accountId.toString());
    }
    if (transactionType) {
      params.append('transaction_type', transactionType);
    }
    if (category) {
      params.append('category', category);
    }
    if (startDate) {
      params.append('start_date', startDate);
    }
    if (endDate) {
      params.append('end_date', endDate);
    }
    if (currencyCode) {
      params.append('currency_code', currencyCode);
    }
    if (tripId) {
      params.append('trip_id', tripId.toString());
    }
    const queryString = params.toString();
    return fetchAPI<Transaction[]>(`/api/transactions${queryString ? '?' + queryString : ''}`);
  },

  getAccountBalance: async (accountName: string, currency: string = 'EUR'): Promise<Balance | null> => {
    const balances = await api.getBalances(currency);
    return balances.find(b => b.account_name === accountName) || null;
  },

  getExpenses: async (accountId?: number): Promise<Expense[]> => {
    const params = new URLSearchParams();
    if (accountId) {
      params.append('account_id', accountId.toString());
    }
    const queryString = params.toString();
    return fetchAPI<Expense[]>(`/api/expenses${queryString ? '?' + queryString : ''}`);
  },

  getTrips: async (): Promise<Trip[]> => {
    return fetchAPI<Trip[]>('/api/trips');
  },

  // Transaction categories (backward compatible)
  getCategories: async (): Promise<{ expense_categories: string[]; income_categories: string[] }> => {
    return fetchAPI<{ expense_categories: string[]; income_categories: string[] }>('/api/categories/grouped');
  },

  // Get all categories (with IDs)
  getAllCategories: async (categoryType?: 'expense' | 'income'): Promise<Category[]> => {
    const url = categoryType 
      ? `/api/categories?category_type=${categoryType}`
      : '/api/categories';
    return fetchAPI<Category[]>(url);
  },

  // Create a new category
  createCategory: async (category: { category_name: string; category_type: 'expense' | 'income' }): Promise<Category> => {
    return fetchAPI<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  },

  // Create transaction
  createTransaction: async (transaction: {
    account_id: number;
    amount: number;
    transaction_type: string;
    category?: string | null;
    transaction_date: string;
    description?: string | null;
    merchant?: string | null;
    trip_id?: number | null;
  }): Promise<Transaction> => {
    return fetchAPI<Transaction>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  },

  // Update transaction
  updateTransaction: async (transactionId: number, transaction: {
    amount?: number;
    category?: string | null;
    transaction_date?: string;
    description?: string | null;
    merchant?: string | null;
    trip_id?: number | null;
  }): Promise<Transaction> => {
    return fetchAPI<Transaction>(`/api/transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    });
  },

  // Delete transaction
  deleteTransaction: async (transactionId: number): Promise<{ message: string }> => {
    return fetchAPI<{ message: string }>(`/api/transactions/${transactionId}`, {
      method: 'DELETE',
    });
  },

  // Create account
  createAccount: async (account: {
    account_name: string;
    account_type: string;
    institution: string;
    currency_code: string;
  }): Promise<Account> => {
    return fetchAPI<Account>('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(account),
    });
  },
  updateAccount: async (accountId: number, account: Partial<Omit<Account, 'account_id'>>): Promise<Account> => {
    return fetchAPI<Account>(`/api/accounts/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(account),
    });
  },
  deleteAccount: async (accountId: number): Promise<{ message: string }> => {
    return fetchAPI<{ message: string }>(`/api/accounts/${accountId}`, {
      method: 'DELETE',
    });
  },

  // Create transfer
  createTransfer: async (transfer: {
    from_account_id: number;
    to_account_id: number;
    amount: number;
    fees?: number;
    date: string;
    description?: string | null;
  }): Promise<{ message: string; from_transaction_id: number; to_transaction_id: number; fee_transaction_id?: number | null; transfer_link_id: number }> => {
    return fetchAPI<{ message: string; from_transaction_id: number; to_transaction_id: number; fee_transaction_id?: number | null; transfer_link_id: number }>('/api/transfers', {
      method: 'POST',
      body: JSON.stringify(transfer),
    });
  },

  // Market adjustment for investment accounts
  createMarketAdjustment: async (adjustment: {
    account_id: number;
    actual_balance: number;
    date: string;
    description?: string | null;
  }): Promise<{ message: string; transaction_id: number; adjustment_amount: number; new_balance: number }> => {
    return fetchAPI<{ message: string; transaction_id: number; adjustment_amount: number; new_balance: number }>('/api/market-adjustments', {
      method: 'POST',
      body: JSON.stringify(adjustment),
    });
  },

  // Currency exchange (transfer between different currencies)
  createCurrencyExchange: async (exchange: {
    from_account_id: number;
    to_account_id: number;
    amount: number;
    exchange_rate: number;
    fees?: number;
    date: string;
    description?: string | null;
  }): Promise<{ message: string; from_transaction_id: number; to_transaction_id: number; fee_transaction_id?: number | null; transfer_link_id: number; from_amount: number; to_amount: number; exchange_rate: number }> => {
    return fetchAPI<{ message: string; from_transaction_id: number; to_transaction_id: number; fee_transaction_id?: number | null; transfer_link_id: number; from_amount: number; to_amount: number; exchange_rate: number }>('/api/currency-exchange', {
      method: 'POST',
      body: JSON.stringify(exchange),
    });
  },

  getMetrics: async (currency: string = 'EUR', date?: string): Promise<Metrics> => {
    const params = new URLSearchParams({ currency });
    if (date) params.append('date', date);
    return fetchAPI<Metrics>(`/api/metrics?${params}`);
  },

  // Budgets
  getBudgets: async (): Promise<Budget[]> => {
    return fetchAPI<Budget[]>('/api/budgets');
  },
  getBudget: async (budgetId: number): Promise<Budget> => {
    return fetchAPI<Budget>(`/api/budgets/${budgetId}`);
  },
  createBudget: async (budget: Omit<Budget, 'budget_id' | 'created_at' | 'updated_at'>): Promise<Budget> => {
    return fetchAPI<Budget>('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(budget),
    });
  },
  updateBudget: async (budgetId: number, budget: Partial<Omit<Budget, 'budget_id' | 'created_at' | 'updated_at'>>): Promise<Budget> => {
    return fetchAPI<Budget>(`/api/budgets/${budgetId}`, {
      method: 'PUT',
      body: JSON.stringify(budget),
    });
  },
  deleteBudget: async (budgetId: number): Promise<{ message: string }> => {
    return fetchAPI<{ message: string }>(`/api/budgets/${budgetId}`, {
      method: 'DELETE',
    });
  },

  // Goals
  getGoals: async (): Promise<Goal[]> => {
    return fetchAPI<Goal[]>('/api/goals');
  },
  getGoal: async (goalId: number): Promise<Goal> => {
    return fetchAPI<Goal>(`/api/goals/${goalId}`);
  },
  createGoal: async (goal: Omit<Goal, 'goal_id' | 'created_at' | 'updated_at'>): Promise<Goal> => {
    return fetchAPI<Goal>('/api/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
  },
  updateGoal: async (goalId: number, goal: Partial<Omit<Goal, 'goal_id' | 'created_at' | 'updated_at'>>): Promise<Goal> => {
    return fetchAPI<Goal>(`/api/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(goal),
    });
  },
  deleteGoal: async (goalId: number): Promise<{ message: string }> => {
    return fetchAPI<{ message: string }>(`/api/goals/${goalId}`, {
      method: 'DELETE',
    });
  },

  // Currencies
  getCurrencies: async (): Promise<string[]> => {
    const response = await fetchAPI<{ currencies: string[] }>('/api/currencies');
    return response.currencies;
  },

  // Exchange Rates
  getLatestExchangeRates: async (baseCurrency: string = 'EUR', targetDate?: string): Promise<{
    base_currency: string;
    rates: { [key: string]: number };
    date?: string | null;
  }> => {
    const params = new URLSearchParams({ base_currency: baseCurrency });
    if (targetDate) {
      params.append('target_date', targetDate);
    }
    return fetchAPI<{
      base_currency: string;
      rates: { [key: string]: number };
      date?: string | null;
    }>(`/api/exchange-rates/latest?${params}`);
  },

  // Account Type Categories
  getAccountTypeCategories: async (): Promise<{ cash_types: string[]; investment_types: string[] }> => {
    return fetchAPI<{ cash_types: string[]; investment_types: string[] }>('/api/accounts/types');
  },

  // CSV Import
  uploadCSV: async (file: File, accountId?: number): Promise<{
    transactions: any[];
    uncertain: any[];
    errors: string[];
    total_parsed: number;
    format_detected: string;
    default_account_id?: number;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Build URL with query parameters
    let url = `${API_BASE_URL}/api/csv-import/upload`;
    if (accountId) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}account_id=${accountId}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.detail || error.message || errorMessage;
      } catch {
        // Keep default error message
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  confirmCSVTransactions: async (transactions: any[]): Promise<{ message: string; imported: number }> => {
    return fetchAPI<{ message: string; imported: number }>('/api/csv-import/confirm', {
      method: 'POST',
      body: JSON.stringify(transactions),
    });
  },

  // Authentication
  signUp: async (email: string, password: string): Promise<{ access_token: string; user: any }> => {
    return fetchAPI<{ access_token: string; user: any }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  signIn: async (email: string, password: string): Promise<{ access_token: string; user: any }> => {
    return fetchAPI<{ access_token: string; user: any }>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getCurrentUser: async (): Promise<{ user_id: string; email?: string }> => {
    return fetchAPI<{ user_id: string; email?: string }>('/api/auth/me');
  },
};

