#!/usr/bin/env python3
"""
Delete all transactions before a specific date (2025-11-27)
This script will remove all transactions with transaction_date < '2025-11-27'
while preserving Initial Balance transactions if they're on or after that date.
"""

import os
import sys
import argparse
from pathlib import Path
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
backend_dir = Path(__file__).parent.parent
env_paths = [
    backend_dir / ".env",
    backend_dir.parent / ".env",
    Path.cwd() / ".env",
]

for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path)
        break
else:
    load_dotenv()

def get_connection_string():
    """Get database connection string from environment variables."""
    SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")
    DB_USER = os.getenv("DB_USER")
    DB_PASS = os.getenv("DB_PASS")
    DB_HOST = os.getenv("DB_HOST")
    DB_NAME = os.getenv("DB_NAME")
    
    if SUPABASE_DB_URL:
        return SUPABASE_DB_URL
    elif DB_USER and DB_PASS and DB_HOST and DB_NAME:
        return f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"
    else:
        raise ValueError("Missing database connection. Set SUPABASE_DB_URL or DB_* variables.")

def main(skip_confirmation=False):
    """Delete all transactions before 2025-11-26."""
    cutoff_date = '2025-11-26'
    
    print("=" * 60)
    print(f"Delete Transactions Before {cutoff_date}")
    print("=" * 60)
    print()
    
    # Get connection
    connection_string = get_connection_string()
    engine = create_engine(connection_string)
    
    try:
        with engine.connect() as conn:
            # First, show what will be deleted
            print(f"📊 Checking transactions before {cutoff_date}...")
            
            # Count total transactions before cutoff
            result = conn.execute(text("""
                SELECT COUNT(*) 
                FROM transactions.ledger
                WHERE transaction_date < :cutoff_date
            """), {"cutoff_date": cutoff_date})
            transactions_to_delete = result.scalar()
            
            # Count by category
            result = conn.execute(text("""
                SELECT 
                    category,
                    COUNT(*) as count
                FROM transactions.ledger
                WHERE transaction_date < :cutoff_date
                GROUP BY category
                ORDER BY count DESC
            """), {"cutoff_date": cutoff_date})
            category_counts = result.fetchall()
            
            # Count initial balances before cutoff
            result = conn.execute(text("""
                SELECT COUNT(*) 
                FROM transactions.ledger
                WHERE transaction_date < :cutoff_date
                AND category = 'Initial Balance'
            """), {"cutoff_date": cutoff_date})
            initial_balances_before = result.scalar()
            
            # Count total transactions
            result = conn.execute(text("SELECT COUNT(*) FROM transactions.ledger"))
            total_transactions = result.scalar()
            
            print(f"  Total transactions in database: {total_transactions}")
            print(f"  Transactions to delete (before {cutoff_date}): {transactions_to_delete}")
            print(f"    - Initial Balance transactions: {initial_balances_before}")
            print(f"    - Other transactions: {transactions_to_delete - initial_balances_before}")
            print()
            
            if category_counts:
                print("  Breakdown by category:")
                for category, count in category_counts:
                    cat_name = category if category else "(null)"
                    print(f"    - {cat_name}: {count}")
                print()
            
            if transactions_to_delete == 0:
                print(f"✅ No transactions to delete. All transactions are on or after {cutoff_date}.")
                return
            
            # Show date range
            result = conn.execute(text("""
                SELECT 
                    MIN(transaction_date) as min_date,
                    MAX(transaction_date) as max_date
                FROM transactions.ledger
            """))
            date_range = result.fetchone()
            if date_range and date_range[0]:
                print(f"  Date range in database: {date_range[0]} to {date_range[1]}")
                print()
            
            # Confirm deletion
            print(f"⚠️  WARNING: This will delete {transactions_to_delete} transactions with transaction_date < {cutoff_date}!")
            if initial_balances_before > 0:
                print(f"   ⚠️  This includes {initial_balances_before} Initial Balance transaction(s)!")
            print()
            
            if not skip_confirmation:
                response = input("Are you sure you want to proceed? (yes/no): ")
                if response.lower() != 'yes':
                    print("❌ Deletion cancelled.")
                    return
            
            print()
            print("🗑️  Deleting transactions...")
            
            # Delete all transactions before cutoff date
            result = conn.execute(text("""
                DELETE FROM transactions.ledger 
                WHERE transaction_date < :cutoff_date
            """), {"cutoff_date": cutoff_date})
            
            deleted_count = result.rowcount
            conn.commit()
            
            print(f"✅ Deleted {deleted_count} transactions.")
            print()
            
            # Verify the deletion
            print("📊 Verifying deletion...")
            result = conn.execute(text("SELECT COUNT(*) FROM transactions.ledger"))
            remaining = result.scalar()
            
            result = conn.execute(text("""
                SELECT 
                    MIN(transaction_date) as min_date,
                    MAX(transaction_date) as max_date,
                    COUNT(*) as count
                FROM transactions.ledger
            """))
            stats = result.fetchone()
            
            print(f"  Remaining transactions: {remaining}")
            if stats and stats[0]:
                print(f"  New date range: {stats[0]} to {stats[1]}")
            print()
            
            print("✅ Success! Transactions before the cutoff date have been deleted.")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Delete transactions before a cutoff date')
    parser.add_argument('--yes', action='store_true', help='Skip confirmation prompt')
    args = parser.parse_args()
    main(skip_confirmation=args.yes)

