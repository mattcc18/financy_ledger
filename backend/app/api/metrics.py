from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from typing import Optional
from datetime import date
from app.db.database import engine
from app.models.schemas import BalanceResponse
from app.api.balances import load_balances_from_transactions

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


def calculate_metrics_from_balances(balances: list[BalanceResponse], target_currency: str = 'EUR') -> dict:
    """
    Calculate financial metrics from balance data.
    
    Categorizes accounts as 'Cash' or 'Investment' based on account_type.
    """
    # Default account types (can be expanded)
    CASH_TYPES = ['Cash', 'Current', 'Savings', 'Checking']
    INVESTMENT_TYPES = ['Investment', 'Pension', 'Stocks', 'ISA', 'Retirement']
    
    cash_total = 0.0
    investments_total = 0.0
    
    for balance in balances:
        # Get balance in target currency
        balance_value = 0.0
        if target_currency.upper() == 'EUR':
            balance_value = balance.balance_eur
        else:
            balance_col = f"balance_{target_currency.lower()}"
            balance_value = getattr(balance, balance_col, balance.balance_eur)
        
        # Categorize by account_type
        account_type_lower = balance.account_type.lower()
        if any(cash_type.lower() in account_type_lower for cash_type in CASH_TYPES):
            cash_total += balance_value
        elif any(inv_type.lower() in account_type_lower for inv_type in INVESTMENT_TYPES):
            investments_total += balance_value
        else:
            # Default to cash if unclear
            cash_total += balance_value
    
    net_worth = cash_total + investments_total
    cash_investment_ratio = (investments_total / net_worth * 100) if net_worth > 0 else 0.0
    
    return {
        "cash": round(cash_total, 2),
        "investments": round(investments_total, 2),
        "net_worth": round(net_worth, 2),
        "cash_investment_ratio": round(cash_investment_ratio, 2)
    }


@router.get("")
async def get_metrics(
    currency: str = Query('EUR', description="Target currency for calculations"),
    date: Optional[str] = Query(None, description="Date in format YYYY-MM-DD")
):
    """Get calculated financial metrics (net worth, cash, investments, cash/investment ratio)."""
    try:
        parsed_date = None
        if date:
            try:
                from datetime import datetime
                parsed_date = datetime.fromisoformat(date).date()
            except ValueError:
                raise HTTPException(status_code=422, detail="Invalid date format. Use YYYY-MM-DD")
        
        # Get balances
        balances_data = []
        df = load_balances_from_transactions(target_currency=currency, balance_date=parsed_date)
        
        if not df.empty:
            records = df.to_dict('records')
            for record in records:
                result = {
                    "balance_date": record['balance_date'],
                    "account_name": record['account_name'],
                    "account_type": record['account_type'],
                    "institution": record['institution'],
                    "currency_code": record['currency_code'],
                    "amount": float(record['amount']),
                    "balance_eur": float(record['balance_eur']),
                }
                
                if currency.upper() != 'EUR':
                    balance_col = f"balance_{currency.lower()}"
                    if balance_col in record:
                        result[balance_col] = float(record[balance_col])
                
                balances_data.append(BalanceResponse(**result))
        
        # Calculate metrics
        if not balances_data:
            return {
                "cash": 0.0,
                "investments": 0.0,
                "net_worth": 0.0,
                "cash_investment_ratio": 0.0
            }
        
        metrics = calculate_metrics_from_balances(balances_data, target_currency=currency)
        return metrics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

