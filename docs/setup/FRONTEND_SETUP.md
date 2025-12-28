# Frontend Setup Instructions

## Overview

The frontend is a React + TypeScript application using Vite, Material-UI, and Plotly.js.

## Prerequisites

- Node.js 18+ and npm
- Backend server running on port 8000

## Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser** to `http://localhost:3000`

## Features

- **Accounts Page** (`/`): Lists all accounts with balances
- **Account Details Page** (`/account/:accountId`): Shows account details, balance history graph, and transactions

## API Integration

The frontend connects to the backend API at `http://localhost:8000` via a Vite proxy (configured in `vite.config.ts`).

## Currency Support

The app supports multiple currencies (EUR, GBP, CHF, USD, CAD) with automatic conversion using exchange rates from the `exchange_rates.rate_history` table.

## Development

- Hot reload is enabled by default
- API requests are proxied through Vite to avoid CORS issues
- TypeScript for type safety

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.



