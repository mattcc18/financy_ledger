# Project Structure

## Overview

This is a transaction ledger-based finance tracking application with React frontend and FastAPI backend.

## Directory Structure

```
Finance_Dashboard_Final/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   │   ├── accounts.py
│   │   │   ├── transactions.py
│   │   │   ├── transfers.py
│   │   │   ├── budgets.py
│   │   │   ├── categories.py
│   │   │   ├── csv_import.py
│   │   │   ├── currency_exchange.py
│   │   │   ├── exchange_rates.py
│   │   │   ├── market_adjustments.py
│   │   │   ├── trips.py
│   │   │   ├── goals.py
│   │   │   ├── metrics.py
│   │   │   ├── balances.py    # Deprecated - use transactions
│   │   │   └── expenses.py     # Deprecated - use transactions
│   │   ├── db/                # Database connection
│   │   ├── models/            # Pydantic schemas
│   │   └── main.py            # FastAPI app
│   ├── migrations/            # Database migrations
│   │   ├── archive/           # Historical/archived migrations
│   │   └── *.sql             # Active migration scripts
│   ├── docs/                  # Backend documentation
│   ├── requirements.txt
│   └── README.md
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── account-details/
│   │   │   ├── accounts/
│   │   │   ├── budget/
│   │   │   ├── csv-import/
│   │   │   ├── dashboard/
│   │   │   ├── expense-tracking/
│   │   │   └── expenses/
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service
│   │   ├── utils/            # Utilities
│   │   ├── config/           # Configuration
│   │   └── contexts/         # React contexts
│   └── package.json
├── docs/                      # Project documentation
│   ├── setup/                # Setup instructions
│   ├── migrations/           # Migration guides
│   └── refactoring/          # Refactoring documentation
├── expenses/                  # Sample CSV files
├── supabase_schema_complete.sql  # Complete database schema
└── README.md                  # Main project README
```

## Key Components

### Backend API Endpoints

- **Accounts**: `/api/accounts` - Account management
- **Transactions**: `/api/transactions` - All transaction operations (replaces expenses)
- **Transfers**: `/api/transfers` - Transfer between accounts
- **Currency Exchange**: `/api/currency-exchange` - Cross-currency transfers
- **Market Adjustments**: `/api/market-adjustments` - Investment account balance sync
- **Budgets**: `/api/budgets` - Budget management
- **Categories**: `/api/categories` - Category management
- **Trips**: `/api/trips` - Trip/holiday management
- **CSV Import**: `/api/csv-import` - CSV file import
- **Exchange Rates**: `/api/exchange-rates` - Exchange rate management

### Frontend Pages

- **Dashboard**: Main overview with metrics and charts
- **Accounts**: Account list and management
- **Account Details**: Individual account view with transactions
- **Expense Tracking**: Expense analysis and filtering
- **CSV Import**: Import transactions from CSV files
- **Budget**: Budget management
- **Goals**: Financial goals tracking

## Deprecated APIs

- `/api/balances` - Use transactions API instead
- `/api/expenses` - Use transactions API with `transaction_type=expense`

## Migration Files

Active migrations are in `backend/migrations/`. Historical/archived migrations are in `backend/migrations/archive/`.

