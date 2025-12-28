"""
Test database connection script.
Run this to verify your database connection string is correct.
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from urllib.parse import urlparse, quote_plus

# Load environment variables
backend_dir = Path(__file__).parent
env_path = backend_dir / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")

if not SUPABASE_DB_URL:
    print("❌ SUPABASE_DB_URL not found in .env file")
    exit(1)

print(f"📋 Connection string (password hidden):")
# Hide password in output
parsed = urlparse(SUPABASE_DB_URL)
if parsed.password:
    hidden_url = SUPABASE_DB_URL.replace(parsed.password, "***")
    print(f"   {hidden_url}")
else:
    print(f"   {SUPABASE_DB_URL}")

print("\n🔍 Testing connection...")

try:
    # Create engine
    engine = create_engine(
        SUPABASE_DB_URL,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 10}
    )
    
    # Test connection
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();"))
        version = result.fetchone()[0]
        print(f"✅ Connection successful!")
        print(f"   PostgreSQL version: {version[:50]}...")
        
        # Test a simple query
        result = conn.execute(text("SELECT current_database();"))
        db_name = result.fetchone()[0]
        print(f"   Database: {db_name}")
        
except Exception as e:
    print(f"❌ Connection failed!")
    print(f"   Error: {str(e)}")
    print("\n💡 Tips:")
    print("   1. Wait 5-10 minutes if you see 'Circuit breaker open'")
    print("   2. Get a fresh connection string from Supabase Dashboard")
    print("   3. Make sure the password is URL-encoded if it contains special characters")
    print("   4. Check that your IP is allowed in Supabase (if using IP restrictions)")
    exit(1)

print("\n✅ Database connection is working correctly!")

