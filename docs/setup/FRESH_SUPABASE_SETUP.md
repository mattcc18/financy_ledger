# Fresh Supabase Setup Guide

Clean setup from scratch for Finance Dashboard with Supabase.

## Step 1: Create New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `finance-dashboard` (or your choice)
   - **Database Password**: Create a strong password (**SAVE THIS!**)
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. Wait ~2 minutes for setup to complete

## Step 2: Get Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string** section
3. Select **"Connection pooling"** tab (NOT direct connection)
4. Copy the connection string (looks like):
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
5. **SAVE THIS** - you'll need it for `.env` file

## Step 3: Create Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Open file: `supabase_schema_complete.sql` in this project
4. Copy the **entire contents** and paste into SQL Editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)
6. You should see: "Success. No rows returned"
7. Verify tables were created: Go to **Table Editor** and check all schemas

## Step 4: Configure Backend

1. Navigate to backend directory:
   ```bash
   cd "/Users/matthewcorcoran/Desktop/Finance Copy/Finance_Dashboard_Final/backend"
   ```

2. Create `.env` file:
   ```bash
   # Create .env file
   touch .env
   ```

3. Edit `.env` file and add:
   ```env
   SUPABASE_DB_URL=postgresql://postgres.[your-ref]:[your-password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
   
   Replace:
   - `[your-ref]` with your project reference from Step 2
   - `[your-password]` with your database password
   - `[region]` with your region (e.g., eu-west-1, us-east-1)

## Step 5: Set Up Python Virtual Environment

1. Navigate to project root:
   ```bash
   cd "/Users/matthewcorcoran/Desktop/Finance Copy/Finance_Dashboard_Final"
   ```

2. Create virtual environment:
   ```bash
   python3 -m venv venv
   ```

3. Activate virtual environment:
   ```bash
   source venv/bin/activate
   ```

4. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

## Step 6: Test Connection

1. Test database connection:
   ```bash
   python -c "from app.db.database import engine; conn = engine.connect(); print('✅ Connection successful!'); conn.close()"
   ```

2. If successful, you'll see: `✅ Connection successful!`

## Step 7: Start Backend Server

1. Make sure virtual environment is activated:
   ```bash
   source venv/bin/activate  # if not already activated
   ```

2. Start the server:
   ```bash
   cd backend
   python run.py
   ```

3. You should see:
   ```
   INFO:     Uvicorn running on http://0.0.0.0:8000
   INFO:     Application startup complete.
   ```

4. Test in browser:
   - Open: `http://localhost:8000/docs` (Swagger UI)
   - Try: `GET /health` endpoint
   - Should return: `{"status": "healthy"}`

## Step 8: Verify Database Setup

In Supabase SQL Editor, run:

```sql
-- Check all tables exist
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema IN ('accounts', 'balances', 'budgets', 'expenses', 'goals', 'exchange_rates', 'transactions')
ORDER BY table_schema, table_name;
```

You should see all your tables listed.

## Troubleshooting

**Error: "connection refused" or "authentication failed"**
- Double-check `.env` file has correct connection string
- Make sure you copied the "Connection pooling" connection string (not direct)
- Verify password matches your Supabase project password

**Error: "relation does not exist"**
- Make sure you ran `supabase_schema_complete.sql` in Supabase SQL Editor
- Check table names match exactly

**Error: "ModuleNotFoundError: No module named 'fastapi'"**
- Make sure virtual environment is activated: `source venv/bin/activate`
- Install dependencies: `pip install -r backend/requirements.txt`

**Port 8000 already in use**
- Stop any other processes using port 8000
- Or change port in `backend/run.py`

## Next Steps

Once setup is complete:
- ✅ Backend connects to Supabase
- ✅ Database schema created
- ✅ Backend server starts successfully
- ✅ API endpoints accessible at `http://localhost:8000`

You can now:
- Start using the API
- Set up the frontend (if needed)
- Begin adding data to your database



