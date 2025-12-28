# Refactoring Analysis - Blast Radius Assessment

## Large Files Requiring Refactoring (>1000 lines)

1. **AccountDetailsPage.tsx** - 2025 lines
   - Status: Needs component extraction
   - Blast radius: Single file, low risk

2. **Dashboard.tsx** - 1670 lines  
   - Status: Needs component extraction
   - Blast radius: Single file, low risk

3. **AccountsPage.tsx** - 1611 lines
   - Status: Needs component extraction
   - Blast radius: Single file, low risk

4. **CSVImport.tsx** - 1351 lines
   - Status: Needs component extraction
   - Blast radius: Single file, low risk

5. **ExpenseTracking.tsx** - 1336 lines
   - Status: Already has extracted components, needs integration
   - Blast radius: Single file, low risk

## Migration Files Analysis

### One-Time Data Import Scripts (Can be deleted)
- import_expenses.py - One-time import, not referenced
- import_trips.py - One-time import, not referenced  
- import_budgets.py - One-time import, not referenced
- import_transactions_from_md.py - One-time import, not referenced
- delete_all_except_initial_balances.py - One-time cleanup, not referenced
- set_initial_balances_from_file.py - One-time setup, not referenced
- fix_transaction_types.py - One-time fix, not referenced
- add_exchange_rates.py - One-time data import, not referenced
- add_initial_balances.py - One-time setup, not referenced
- add_initial_balances_from_snapshots.py - One-time setup, not referenced
- fix_jlr_budget.py - One-time fix, not referenced
- reimport_budgets.py - One-time reimport, not referenced

### SQL Migration Files (Keep for schema reference)
- create_categories_table.sql - Schema definition, keep
- create_trips_table.sql - Schema definition, keep
- create_budgets_table_only.sql - Schema definition, keep
- create_import_patterns_table.sql - Schema definition, keep
- add_transaction_type.sql - Schema change, keep
- add_merchant_trip_id_to_transactions.sql - Schema change, keep
- enforce_single_initial_balance.sql - Schema constraint, keep
- migrate_expenses_to_transactions.sql - Major migration, keep for reference

### Documentation Files (Review and consolidate)
- Accounts.md - Data snapshot, can archive
- Transactions.md - Data snapshot, can archive
- budgets.md - Data snapshot, can archive
- current_balances.md - Data snapshot, can archive
- Various .md instruction files - Review and consolidate

### Utility Scripts (Keep if useful)
- delete_transactions_before_date.py - Utility script, might be useful
- run_categories_migration.py - Migration runner, keep

## Unused Code Analysis

### Backend API Files
- balances.py - Check if deprecated (has load_balances_from_transactions)
- expenses.py - Check if deprecated (migrated to transactions)

## Decision Matrix
- <10 files affected: Standard refactor process ✅
- Migration cleanup: Low risk, one-time scripts ✅
- Large file refactoring: Medium risk, needs phased approach ⚠️
