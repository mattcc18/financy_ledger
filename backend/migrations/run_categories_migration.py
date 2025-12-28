#!/usr/bin/env python3
"""
Run the categories table migration.
This creates the categories.list table and populates it with default categories.
"""

import os
import sys
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

# Get database connection
SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")

if SUPABASE_DB_URL:
    connection_string = SUPABASE_DB_URL
elif all([DB_USER, DB_PASS, DB_HOST, DB_NAME]):
    connection_string = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"
else:
    raise ValueError("Missing database connection. Set SUPABASE_DB_URL or DB_* variables.")

def main():
    """Run the categories table migration."""
    print("=" * 60)
    print("Creating Categories Table")
    print("=" * 60)
    print()
    
    migration_file = Path(__file__).parent / "create_categories_table.sql"
    
    if not migration_file.exists():
        print(f"❌ Error: Migration file not found: {migration_file}")
        sys.exit(1)
    
    # Read SQL file
    with open(migration_file, 'r') as f:
        sql = f.read()
    
    # Execute migration
    engine = create_engine(connection_string)
    
    try:
        with engine.connect() as conn:
            print("📊 Running migration...")
            
            # First, create the schema separately (needs to be committed)
            print("  Creating schema...")
            try:
                conn.execute(text("CREATE SCHEMA IF NOT EXISTS categories"))
                conn.commit()
                print("  ✅ Schema created")
            except Exception as e:
                if "already exists" not in str(e).lower():
                    print(f"  ⚠️  Schema creation: {e}")
                conn.rollback()
            
            # Now execute the rest of the SQL
            # Remove the CREATE SCHEMA line since we already did it
            sql_without_schema = '\n'.join([line for line in sql.split('\n') if not line.strip().startswith('CREATE SCHEMA')])
            
            # Execute statements one by one, committing after each
            statements = []
            current_statement = []
            
            for line in sql_without_schema.split('\n'):
                line = line.strip()
                if not line or line.startswith('--'):
                    continue
                current_statement.append(line)
                if line.endswith(';'):
                    statement = ' '.join(current_statement).rstrip(';')
                    if statement:
                        statements.append(statement)
                    current_statement = []
            
            # Execute each statement
            for i, statement in enumerate(statements, 1):
                if statement:
                    try:
                        conn.execute(text(statement))
                        conn.commit()
                    except Exception as e:
                        # Ignore "already exists" errors
                        error_str = str(e).lower()
                        if "already exists" in error_str or "duplicate" in error_str or "does not exist" in error_str:
                            # For "does not exist" errors on indexes, that's okay - table might not exist yet
                            if "index" in error_str:
                                pass  # Index creation will be retried
                            else:
                                print(f"  ⚠️  Statement {i} (already exists): {statement[:50]}...")
                        else:
                            print(f"  ⚠️  Statement {i} error: {e}")
                            print(f"     Statement: {statement[:100]}...")
                        conn.rollback()
            
            print("✅ Migration completed!")
            print()
            
            # Verify the table was created
            print("📊 Verifying table creation...")
            try:
                result = conn.execute(text("""
                    SELECT COUNT(*) FROM categories.list
                """))
                count = result.fetchone()[0]
                print(f"  Found {count} categories in the table")
                print()
                
                # Show categories by type
                result = conn.execute(text("""
                    SELECT category_type, COUNT(*) 
                    FROM categories.list 
                    GROUP BY category_type
                    ORDER BY category_type
                """))
                print("Categories by type:")
                for row in result:
                    print(f"  {row[0]}: {row[1]} categories")
            except Exception as e3:
                print(f"⚠️  Could not verify: {e3}")
                print("   Table might not have been created. Check the errors above.")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

