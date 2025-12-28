import os
from pathlib import Path
from sqlalchemy import create_engine
from dotenv import load_dotenv

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
    connection_string = SUPABASE_DB_URL
elif all([DB_USER, DB_PASS, DB_HOST, DB_NAME]):
    connection_string = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"
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



