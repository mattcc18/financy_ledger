from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from app.db.database import engine
from app.models.schemas import ExchangeRateRequest
from typing import Optional, Dict
from datetime import date

router = APIRouter(prefix="/api/exchange-rates", tags=["exchange-rates"])


@router.get("/latest")
async def get_latest_exchange_rates(
    base_currency: str = Query('EUR', description="Base currency"),
    target_date: Optional[str] = Query(None, description="Date to get rates for (YYYY-MM-DD). If not provided, uses latest available.")
):
    """Get the latest exchange rates for converting from base_currency to all other currencies."""
    try:
        date_filter = ""
        params = {"base_currency": base_currency.upper()}
        
        if target_date:
            date_filter = "AND rate_date <= :target_date"
            params["target_date"] = target_date
        else:
            # Get the latest date available
            latest_date_query = text("""
                SELECT MAX(rate_date) as latest_date
                FROM exchange_rates.rate_history
                WHERE base_currency = :base_currency
            """)
            with engine.connect() as conn:
                result = conn.execute(latest_date_query, {"base_currency": base_currency.upper()})
                row = result.fetchone()
                if row and row[0]:
                    date_filter = "AND rate_date = :target_date"
                    params["target_date"] = row[0]
        
        query = text(f"""
            SELECT DISTINCT ON (target_currency)
                target_currency,
                rate,
                rate_date
            FROM exchange_rates.rate_history
            WHERE base_currency = :base_currency {date_filter}
            ORDER BY target_currency, rate_date DESC
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, params)
            rows = result.fetchall()
            
            rates: Dict[str, float] = {}
            # Base currency always has rate of 1.0
            rates[base_currency.upper()] = 1.0
            
            for row in rows:
                target_curr = row[0]
                rate = float(row[1])
                rates[target_curr] = rate
            
            return {
                "base_currency": base_currency.upper(),
                "rates": rates,
                "date": params.get("target_date") if "target_date" in params else None
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_exchange_rate(entry: ExchangeRateRequest):
    """Create a new exchange rate entry."""
    try:
        if entry.rate <= 0:
            raise HTTPException(status_code=400, detail="Rate must be greater than zero")
        
        query = text("""
            INSERT INTO exchange_rates.rate_history (base_currency, target_currency, rate, rate_date)
            VALUES (:base_currency, :target_currency, :rate, :rate_date)
            ON CONFLICT (base_currency, target_currency, rate_date) 
            DO UPDATE SET rate = EXCLUDED.rate
        """)
        
        with engine.connect() as conn:
            conn.execute(query, {
                "base_currency": entry.base_currency.upper(),
                "target_currency": entry.target_currency.upper(),
                "rate": entry.rate,
                "rate_date": entry.rate_date
            })
            conn.commit()
        
        return {"message": "Exchange rate created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



