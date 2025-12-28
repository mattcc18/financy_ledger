# Finance Dashboard - Final Version

Transaction ledger-based finance tracking application with React frontend and FastAPI backend.

## Project Structure

```
Finance_Dashboard_Final/
├── backend/              # FastAPI backend
│   ├── app/             # Application code
│   ├── migrations/      # Database migrations
│   └── docs/            # Backend documentation
├── frontend/            # React frontend
│   └── src/            # Source code
├── docs/               # Project documentation
│   ├── setup/         # Setup instructions
│   ├── migrations/    # Migration guides
│   └── refactoring/   # Refactoring docs
└── supabase_schema_complete.sql  # Complete database schema
```

For detailed structure, see [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md).

## Features

- ✅ Transaction ledger system (replaces snapshot-based balances)
- ✅ Multi-currency support (EUR, GBP, CHF, USD, CAD)
- ✅ Exchange rate management
- ✅ Account management
- ✅ Transaction categories (income, expense, transfer)
- ✅ Account balance history with graphs
- ✅ Transfer between accounts
- ✅ Market adjustments for investment accounts

## Setup

### Quick Start

1. **Database (Supabase)**
   - Create a new Supabase project
   - Run `supabase_schema_complete.sql` in the SQL Editor
   - Run required migrations from `backend/migrations/`

2. **Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python run.py
   ```

3. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

For detailed setup instructions, see [docs/setup/](docs/setup/).

## API Endpoints

- `GET /api/accounts` - List all accounts
- `GET /api/balances` - Get account balances (aggregated from transactions)
- `GET /api/balances/history/{account_name}` - Get balance history for an account
- `GET /api/transactions` - List transactions (filter by account_id)
- `POST /api/transactions` - Create a transaction
- `POST /api/transfers` - Transfer money between accounts
- `POST /api/market-adjustments` - Sync investment account balance
- `GET /api/exchange-rates/latest` - Get latest exchange rates
- `POST /api/exchange-rates` - Add exchange rate

## Currency Conversion

The system uses the `exchange_rates.rate_history` table to convert balances between currencies. Rates are stored with:
- `base_currency` (e.g., EUR)
- `target_currency` (e.g., GBP)
- `rate` (e.g., 0.85 means 1 EUR = 0.85 GBP)
- `rate_date` (the date the rate was effective)

To add exchange rates, use the API:
```bash
curl -X POST http://localhost:8000/api/exchange-rates \
  -H 'Content-Type: application/json' \
  -d '{
    "base_currency": "EUR",
    "target_currency": "GBP",
    "rate": 0.85,
    "rate_date": "2025-01-01"
  }'
```

## Transaction Types

- **income**: Money coming in (e.g., salary, freelance)
- **expense**: Money going out (e.g., groceries, bills)
- **transfer**: Money moving between accounts (use `/api/transfers` endpoint)

## Development

- Backend runs on `http://localhost:8000`
- Frontend runs on `http://localhost:3000`
- Frontend proxies API requests through Vite to avoid CORS

## Documentation

- [Project Structure](docs/PROJECT_STRUCTURE.md) - Detailed project structure
- [Setup Instructions](docs/setup/) - All setup guides
- [Refactoring Documentation](docs/refactoring/) - Code refactoring progress
- [Cleanup Summary](docs/CLEANUP_SUMMARY.md) - Project cleanup details
