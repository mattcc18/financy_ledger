# Deployment Guide

This guide will help you deploy the Finance Dashboard backend to Render and frontend to Vercel.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Supabase Database**: You should have your Supabase database connection string ready

### Git Repository Options

You have three options:

**Option A: GitHub/GitLab/Bitbucket (Recommended - Easiest)**
- Create a repository on GitHub/GitLab/Bitbucket
- Both Render and Vercel integrate seamlessly with Git
- Automatic deployments on push to main branch
- Preview deployments for pull requests

**Option B: Deploy via CLI (No Git Required)**
- Use Vercel CLI and Render CLI to deploy directly from your local machine
- See "Alternative: CLI Deployment" section below

**Option C: GitLab/Bitbucket (Alternative to GitHub)**
- Works the same way as GitHub
- Both platforms support GitLab and Bitbucket

## Backend Deployment (Render)

### Step 1: Connect Repository to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub/GitLab repository
4. Select the repository containing your finance dashboard

### Step 2: Configure the Service

Use these settings:

- **Name**: `finance-dashboard-api` (or any name you prefer)
- **Environment**: `Python 3`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend` (important!)
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 3: Set Environment Variables

In the Render dashboard, go to "Environment" section and add:

- **Key**: `SUPABASE_DB_URL`
- **Value**: Your Supabase database connection string (format: `postgresql://user:password@host:port/database`)

Optional (for production CORS):
- **Key**: `ALLOWED_ORIGINS`
- **Value**: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`) - Add this after deploying frontend

### Step 4: Deploy

Click "Create Web Service" and wait for the deployment to complete.

Once deployed, note your backend URL (e.g., `https://finance-dashboard-api.onrender.com`)

## Frontend Deployment (Vercel)

### Step 1: Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Select the repository

### Step 2: Configure the Project

Vercel should auto-detect Vite. Use these settings:

- **Framework Preset**: Vite
- **Root Directory**: `frontend` (click "Edit" and set this)
- **Build Command**: `npm run build` (should be auto-detected)
- **Output Directory**: `dist` (should be auto-detected)
- **Install Command**: `npm install` (should be auto-detected)

### Step 3: Set Environment Variables

In the "Environment Variables" section, add:

- **Key**: `VITE_API_URL`
- **Value**: Your Render backend URL (e.g., `https://finance-dashboard-api.onrender.com`)
- **Environments**: Select "Production", "Preview", and "Development"

### Step 4: Deploy

Click "Deploy" and wait for the build to complete.

Once deployed, you'll get a URL like `https://your-app.vercel.app`

### Step 5: Update Backend CORS (Important!)

After deploying the frontend, update the backend CORS settings:

1. Go back to Render dashboard
2. Edit your web service
3. Go to "Environment" section
4. Add/Update environment variable:
   - **Key**: `ALLOWED_ORIGINS`
   - **Value**: Your Vercel URL: `https://your-app.vercel.app`
5. Save and redeploy

Alternatively, you can add multiple origins separated by commas:
```
https://your-app.vercel.app,https://your-app-git-main.vercel.app
```

## Post-Deployment Checklist

- [ ] Backend is accessible at Render URL
- [ ] Backend `/health` endpoint returns `{"status": "healthy"}`
- [ ] Frontend is accessible at Vercel URL
- [ ] Frontend can connect to backend API
- [ ] CORS is properly configured
- [ ] Database connection is working

## Troubleshooting

### Backend Issues

**Issue**: Build fails on Render
- **Solution**: Make sure `backend/requirements.txt` exists and has all dependencies

**Issue**: Service crashes on startup
- **Solution**: Check logs in Render dashboard, verify `SUPABASE_DB_URL` is set correctly

**Issue**: CORS errors
- **Solution**: Ensure `ALLOWED_ORIGINS` includes your Vercel URL

### Frontend Issues

**Issue**: Build fails on Vercel
- **Solution**: Check that `frontend/package.json` has all dependencies listed

**Issue**: API calls fail
- **Solution**: Verify `VITE_API_URL` is set correctly in Vercel environment variables

**Issue**: 404 errors on page refresh
- **Solution**: The `vercel.json` rewrite rules should handle this automatically

## Free Tier Limitations

### Render Free Tier
- Services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Consider upgrading for production use

### Vercel Free Tier
- Generous limits for personal projects
- Great performance and edge network
- Should be sufficient for most use cases

## Alternative: CLI Deployment (No GitHub Required)

If you don't want to use GitHub, you can deploy directly from your local machine using CLIs.

### Deploy Backend with Render CLI

1. **Install Render CLI**:
   ```bash
   brew install render # macOS
   # Or download from: https://github.com/renderinc/cli
   ```

2. **Login to Render**:
   ```bash
   render login
   ```

3. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

4. **Deploy**:
   ```bash
   render deploy
   ```

5. **Set environment variables** in Render dashboard after first deployment

### Deploy Frontend with Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow prompts**:
   - Link to existing project or create new
   - Set `VITE_API_URL` when prompted (or add in Vercel dashboard)

5. **For production deployment**:
   ```bash
   vercel --prod
   ```

**Note**: CLI deployments still require you to manually update environment variables in the respective dashboards.

## Custom Domains (Optional)

Both Render and Vercel support custom domains:
- **Render**: Add custom domain in service settings
- **Vercel**: Add domain in project settings → Domains

## Continuous Deployment (GitHub/GitLab Only)

If using GitHub/GitLab, both platforms support automatic deployments:
- Push to `main` branch → Auto-deploys to production
- Create pull request → Auto-deploys preview environment (Vercel)

