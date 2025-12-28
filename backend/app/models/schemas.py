from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date


class BalanceResponse(BaseModel):
    balance_date: date
    account_name: str
    account_type: str
    institution: str
    currency_code: str
    amount: float
    balance_eur: float
    balance_usd: Optional[float] = None
    balance_gbp: Optional[float] = None
    balance_chf: Optional[float] = None
    balance_cad: Optional[float] = None

    class Config:
        from_attributes = True


class AccountResponse(BaseModel):
    account_id: int
    account_name: str
    account_type: str
    institution: str
    currency_code: str


class AccountCreateRequest(BaseModel):
    account_name: str
    account_type: str
    institution: str
    currency_code: str


class AccountUpdateRequest(BaseModel):
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    institution: Optional[str] = None
    currency_code: Optional[str] = None


class TransactionCreateRequest(BaseModel):
    account_id: int
    amount: float
    transaction_type: str  # 'income', 'expense', or 'transfer'
    category: Optional[str] = None  # Expense category (e.g., 'Groceries', 'Transport') or income category
    transaction_date: date
    description: Optional[str] = None
    merchant: Optional[str] = None  # Only for expense-type transactions
    trip_id: Optional[int] = None  # Only for expense-type transactions


class TransactionUpdateRequest(BaseModel):
    amount: Optional[float] = None
    category: Optional[str] = None
    transaction_date: Optional[date] = None
    description: Optional[str] = None
    merchant: Optional[str] = None
    trip_id: Optional[int] = None
    # Note: transaction_type and account_id cannot be changed


class TransferRequest(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: float
    fees: float = 0.0  # Optional fees in source currency
    date: date
    description: Optional[str] = None


class TransferResponse(BaseModel):
    message: str
    from_transaction_id: int
    to_transaction_id: int
    fee_transaction_id: Optional[int] = None
    transfer_link_id: int


class CurrencyExchangeRequest(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: float  # Amount in source currency
    exchange_rate: float  # Rate to convert from source to destination currency
    fees: float = 0.0  # Fees in source currency
    date: date
    description: Optional[str] = None


class CurrencyExchangeResponse(BaseModel):
    message: str
    from_transaction_id: int
    to_transaction_id: int
    fee_transaction_id: Optional[int] = None
    transfer_link_id: int
    from_amount: float
    to_amount: float
    exchange_rate: float


class MarketAdjustmentRequest(BaseModel):
    account_id: int
    actual_balance: float
    date: date
    description: Optional[str] = None


class MarketAdjustmentResponse(BaseModel):
    message: str
    transaction_id: int
    adjustment_amount: float
    new_balance: float


class TransactionResponse(BaseModel):
    transaction_id: int
    account_id: int
    amount: float
    transaction_type: str
    category: Optional[str]
    transaction_date: date
    description: Optional[str]
    merchant: Optional[str] = None  # Only populated for expense-type transactions
    trip_id: Optional[int] = None  # Only populated for expense-type transactions with trip associations
    account_name: Optional[str] = None  # Account name from accounts.list
    currency_code: Optional[str] = None  # Currency code from accounts.list


class ExchangeRateRequest(BaseModel):
    base_currency: str
    target_currency: str
    rate: float
    rate_date: date


class BalanceHistoryResponse(BaseModel):
    balance_date: date
    account_name: str
    account_type: str
    institution: str
    currency_code: str
    amount: float
    balance_eur: float
    balance_usd: Optional[float] = None
    balance_gbp: Optional[float] = None
    balance_chf: Optional[float] = None
    balance_cad: Optional[float] = None

    class Config:
        from_attributes = True


class TripResponse(BaseModel):
    trip_id: int
    trip_name: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    location: Optional[str] = None
    description: Optional[str] = None
    created_at: str
    updated_at: str


class TripCreateRequest(BaseModel):
    trip_name: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    location: Optional[str] = None
    description: Optional[str] = None


class TripUpdateRequest(BaseModel):
    trip_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    location: Optional[str] = None
    description: Optional[str] = None


class ExpenseResponse(BaseModel):
    expense_id: int
    expense_date: date
    account_id: int
    merchant: str
    category: str
    amount: float
    currency_code: str
    description: Optional[str] = None
    trip_id: Optional[int] = None
    created_at: str
    updated_at: str


class ExpenseCreateRequest(BaseModel):
    expense_date: date
    account_id: int
    merchant: str
    category: str
    amount: float
    currency_code: str
    description: Optional[str] = None
    trip_id: Optional[int] = None


class ExpenseUpdateRequest(BaseModel):
    expense_date: Optional[date] = None
    account_id: Optional[int] = None
    merchant: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    currency_code: Optional[str] = None
    description: Optional[str] = None
    trip_id: Optional[int] = None


class BudgetResponse(BaseModel):
    budget_id: int
    name: str
    currency: str
    income_sources: List[Dict[str, Any]]
    categories: List[Dict[str, Any]]
    created_at: str
    updated_at: str


class BudgetCreateRequest(BaseModel):
    name: str
    currency: str = 'GBP'
    income_sources: Optional[List[Dict[str, Any]]] = None
    categories: Optional[List[Dict[str, Any]]] = None


class BudgetUpdateRequest(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    income_sources: Optional[List[Dict[str, Any]]] = None
    categories: Optional[List[Dict[str, Any]]] = None


class GoalResponse(BaseModel):
    goal_id: int
    name: str
    goal_type: str
    target_amount: float
    current_amount: float
    currency: str
    target_date: Optional[date] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    created_at: str
    updated_at: str


class GoalCreateRequest(BaseModel):
    name: str
    goal_type: str
    target_amount: float
    current_amount: float = 0.0
    currency: str = 'EUR'
    target_date: Optional[date] = None
    description: Optional[str] = None
    icon: Optional[str] = None


class GoalUpdateRequest(BaseModel):
    name: Optional[str] = None
    goal_type: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    currency: Optional[str] = None
    target_date: Optional[date] = None
    description: Optional[str] = None
    icon: Optional[str] = None

