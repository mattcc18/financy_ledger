import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import balances, accounts, transactions, transfers, market_adjustments, exchange_rates, trips, expenses, budgets, goals, metrics, csv_import, categories, currency_exchange, auth

app = FastAPI(
    title="Finance Dashboard API",
    description="Backend API for Finance Dashboard",
    version="1.0.0"
)

# Configure CORS
# Allow origins from environment variable or default to allowing all (for development)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins != "*":
    # Split comma-separated origins and remove trailing slashes
    origins_list = [origin.strip().rstrip("/") for origin in allowed_origins.split(",")]
    allowed_origins = origins_list
else:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router)  # Auth endpoints (signup, signin) - no auth required
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

