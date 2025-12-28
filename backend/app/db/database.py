import os
from pathlib import Path
from sqlalchemy import create_engine
from dotenv import load_dotenv
from urllib.parse import urlparse, urlunparse, quote_plus

# Load environment variables
backend_dir = Path(__file__).parent.parent.parent
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

# Support Supabase connection string
SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")

# Prefer Supabase connection string if available
if SUPABASE_DB_URL:
    # Parse and properly encode the connection string to handle special characters in password
    try:
        parsed = urlparse(SUPABASE_DB_URL)
        # Reconstruct with properly encoded password
        if parsed.password:
            # Password might already be encoded, but we'll ensure it's properly encoded
            encoded_password = quote_plus(parsed.password, safe='')
            # Reconstruct the URL with encoded password
            connection_string = urlunparse((
                parsed.scheme,
                f"{parsed.username}:{encoded_password}@{parsed.hostname}:{parsed.port or ''}",
                parsed.path,
                parsed.params,
                parsed.query,
                parsed.fragment
            )).replace('://:', '://')  # Fix double colon if port is empty
        else:
            connection_string = SUPABASE_DB_URL
    except Exception as e:
        # If parsing fails, use the original string
        print(f"Warning: Could not parse connection string, using as-is: {e}")
        connection_string = SUPABASE_DB_URL
elif all([DB_USER, DB_PASS, DB_HOST, DB_NAME]):
    # URL encode password to handle special characters
    encoded_pass = quote_plus(DB_PASS, safe='')
    connection_string = f"postgresql+psycopg2://{DB_USER}:{encoded_pass}@{DB_HOST}/{DB_NAME}"
else:
    raise ValueError(
        "Missing required database environment variables. "
        "Please set either SUPABASE_DB_URL or (DB_USER, DB_PASS, DB_HOST, DB_NAME) in your .env file. "
        f"Checked locations: {[str(p) for p in env_paths]}"
    )

engine = create_engine(
    connection_string,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10
)



