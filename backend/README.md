# Finance Dashboard Backend

Clean FastAPI backend with Supabase.

## Setup

1. **Install dependencies:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Create `.env` file:**
   ```env
   SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

3. **Run database schema:**
   - Go to Supabase SQL Editor
   - Run `supabase_schema_complete.sql` from project root

4. **Start server:**
   ```bash
   python run.py
   ```

5. **Test:**
   - Open: http://localhost:8000/docs



