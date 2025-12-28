# Transaction Types and Categories Setup

## Step 1: Run Database Migration

Run this SQL in Supabase SQL Editor to add the `transaction_type` column:

**File**: `migrations/add_transaction_type.sql`

This will:
- Add `transaction_type` column (income, expense, transfer)
- Update existing transactions with appropriate types
- Add validation constraint

## Step 2: Transaction Types

Transactions can be one of three types:

1. **`income`** - Money coming in (salary, freelance, gifts, etc.)
2. **`expense`** - Money going out (groceries, bills, shopping, etc.)
3. **`transfer`** - Money moving between accounts (use `/api/transfers` endpoint)

## Step 3: Categories

### Expense Categories (available via `/api/transactions/categories`)
- Groceries
- Restaurants
- Transport
- Shopping
- Entertainment
- Bills
- Health
- Education
- Travel
- Other

### Income Categories
- Salary
- Freelance
- Investment
- Gift
- Other

You can customize these categories in `backend/app/api/transactions.py`

## Usage Examples

### Create an Expense Transaction
```bash
curl -X POST http://localhost:8000/api/transactions \
  -H 'Content-Type: application/json' \
  -d '{
  "account_id": 1,
  "amount": 50.00,
  "transaction_type": "expense",
  "category": "Groceries",
  "transaction_date": "2025-12-25",
  "description": "Weekly grocery shopping"
}'
```

### Create an Income Transaction
```bash
curl -X POST http://localhost:8000/api/transactions \
  -H 'Content-Type: application/json' \
  -d '{
  "account_id": 1,
  "amount": 2000.00,
  "transaction_type": "income",
  "category": "Salary",
  "transaction_date": "2025-12-25",
  "description": "Monthly salary"
}'
```

### Get Available Categories
```bash
curl http://localhost:8000/api/transactions/categories
```

### Filter Transactions by Type
```bash
# Get only expenses
curl http://localhost:8000/api/transactions?transaction_type=expense

# Get only income
curl http://localhost:8000/api/transactions?transaction_type=income
```



