from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import balances, accounts, transactions, transfers, market_adjustments, exchange_rates, trips, expenses, budgets, goals, metrics, csv_import, categories, currency_exchange

app = FastAPI(
    title="Finance Dashboard API",
    description="Backend API for Finance Dashboard",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(balances.router)
app.include_router(accounts.router)
app.include_router(transactions.router)
app.include_router(transfers.router)
app.include_router(market_adjustments.router)
app.include_router(currency_exchange.router)
app.include_router(exchange_rates.router)
app.include_router(trips.router)
app.include_router(expenses.router)
app.include_router(budgets.router)
app.include_router(goals.router)
app.include_router(metrics.router)
app.include_router(csv_import.router)
app.include_router(categories.router)


@app.get("/")
async def root():
    return {"message": "Finance Dashboard API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

