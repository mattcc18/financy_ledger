# Environment Variables Setup

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database Configuration
# Your Supabase connection string (use connection pooling)
# Get this from Supabase Dashboard -> Settings -> Database -> Connection pooling
SUPABASE_DB_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Supabase Authentication Configuration
# Get these from Supabase Dashboard -> Settings -> API
SUPABASE_URL=https://[your-project-ref].supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here

# CORS Configuration (optional)
# For production, specify your frontend URL(s) separated by commas
# Example: ALLOWED_ORIGINS=https://your-app.vercel.app,https://another-domain.com
# Leave unset or set to "*" for development (allows all origins)
ALLOWED_ORIGINS=*
```

## How to Get These Values:

1. **SUPABASE_DB_URL**: 
   - Go to Supabase Dashboard → Settings → Database
   - Scroll to "Connection string"
   - Select "Connection pooling" tab
   - Copy the connection string

2. **SUPABASE_URL**:
   - Go to Supabase Dashboard → Settings → API
   - Copy the "Project URL" (looks like `https://xxxxx.supabase.co`)

3. **SUPABASE_ANON_KEY**:
   - Same page (Settings → API)
   - Copy the "anon" or "public" key

4. **SUPABASE_JWT_SECRET**:
   - Same page (Settings → API)
   - Scroll down to "JWT Secret"
   - Copy the JWT secret

## Important:
- The `.env` file is in `.gitignore` and will NOT be committed to git (this is correct for security)
- Replace all placeholder values with your actual Supabase values
- For Render deployment, add these as environment variables in the Render dashboard

