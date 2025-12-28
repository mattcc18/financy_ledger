# Transaction Database Schema

## Table: `transactions.ledger`

### Columns

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `transaction_id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `account_id` | INTEGER | NOT NULL, FK → `accounts.list(account_id)` ON DELETE CASCADE | Reference to the account this transaction belongs to |
| `amount` | DECIMAL(15, 2) | NOT NULL | Transaction amount (positive for income, negative for expenses/transfers out) |
| `category` | VARCHAR(100) | NULLABLE | Transaction category (e.g., "Initial Balance", "Transfer", "Expense", "Income", etc.) |
| `transaction_date` | DATE | NOT NULL | Date of the transaction |
| `transfer_link_id` | INTEGER | NULLABLE | Links two transactions for transfers between accounts (both transactions share the same ID) |
| `description` | TEXT | NULLABLE | Free-form description of the transaction |
| `transaction_type` | VARCHAR(20) | DEFAULT 'expense', CHECK IN ('income', 'expense', 'transfer') | Type of transaction: income, expense, or transfer |
| `merchant` | VARCHAR(255) | NULLABLE | Merchant/vendor name (typically populated for expense-type transactions) |
| `trip_id` | INTEGER | NULLABLE, FK → `trips.list(trip_id)` ON DELETE SET NULL | Reference to trips table (for expense transactions associated with trips) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp when record was created |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp when record was last updated |

### Indexes

1. **Primary Key Index**: `transaction_id` (automatic)
2. **`idx_transactions_account_id`**: Index on `account_id` for performance
3. **`idx_transactions_date`**: Index on `transaction_date` for date-based queries
4. **`idx_transactions_transfer_link`**: Index on `transfer_link_id` for transfer linking
5. **`idx_transactions_category`**: Index on `category` for category filtering
6. **`idx_transactions_type`**: Index on `transaction_type` for type filtering
7. **`idx_transactions_merchant`**: Index on `merchant` for merchant filtering
8. **`idx_transactions_trip_id`**: Index on `trip_id` for trip-based filtering
9. **`idx_unique_initial_balance_per_account`**: Unique partial index on `(account_id)` WHERE `category = 'Initial Balance'` - ensures only one Initial Balance transaction per account

### Sequences

- **`transactions.transfer_link_seq`**: Sequence for generating unique transfer link IDs

### Foreign Key Relationships

1. **`account_id`** → `accounts.list(account_id)` ON DELETE CASCADE
   - When an account is deleted, all its transactions are deleted

2. **`trip_id`** → `trips.list(trip_id)` ON DELETE SET NULL
   - When a trip is deleted, the trip_id is set to NULL (transaction is preserved)

### Constraints

1. **`check_transaction_type`**: Ensures `transaction_type` is one of: 'income', 'expense', 'transfer'
2. **Unique Initial Balance**: Each account can only have one transaction with `category = 'Initial Balance'` (enforced by partial unique index)

### Notes

- **Amount Sign Convention**:
  - Positive amounts: Income, transfers in, initial balances
  - Negative amounts: Expenses, transfers out
  
- **Transfer Linking**:
  - When a transfer occurs between two accounts, two transactions are created:
    - One negative amount transaction in the source account
    - One positive amount transaction in the destination account
  - Both transactions share the same `transfer_link_id` to link them together

- **Initial Balance**:
  - Each account must have exactly one "Initial Balance" transaction
  - This transaction represents the starting balance of the account
  - Amount can be 0.00 or any positive/negative value
  - Enforced by unique partial index

- **Transaction Types**:
  - **income**: Money coming into the account (salary, interest, etc.)
  - **expense**: Money going out of the account (purchases, bills, etc.)
  - **transfer**: Money moving between accounts (linked transactions)

