from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy import text
import pandas as pd
from typing import Optional
from datetime import date as date_class
from app.db.database import engine
from app.models.schemas import BalanceResponse, BalanceHistoryResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/balances", tags=["balances"])


def load_balances_from_transactions(target_currency: str = 'EUR', balance_date: Optional[date_class] = None, user_id: Optional[str] = None):
    """
    Loads balances by aggregating transactions, converts non-EUR holdings to a standard 'balance_eur',
    and then converts 'balance_eur' to the selected target currency.
    Filters by user_id if provided.
    """
    date_filter = ""
    if balance_date:
        date_filter = f"AND t.transaction_date <= '{balance_date}'"
    
    user_filter_transactions = ""
    if user_id:
        user_filter_transactions = f"AND t.user_id = '{user_id}'"
    
    user_filter_accounts = ""
    if user_id:
        user_filter_accounts = f"AND a.user_id = '{user_id}'"
    
    query = f"""
    WITH account_balances AS (
        SELECT
            t.account_id,
            SUM(t.amount) as amount,
            MAX(t.transaction_date) as balance_date
        FROM transactions.ledger t
        WHERE 1=1 {date_filter} {user_filter_transactions}
        GROUP BY t.account_id
    )
    SELECT
        ab.balance_date,
        a.account_name,
        a.account_type,
        a.institution,
        a.currency_code,
        ab.amount,
        COALESCE(r_te.rate_to_eur, 1.0) AS rate_to_eur
    FROM account_balances ab
    JOIN accounts.list a ON ab.account_id = a.account_id
    LEFT JOIN LATERAL (
        SELECT 1.0 / r_te.rate AS rate_to_eur
        FROM exchange_rates.rate_history r_te
        WHERE r_te.base_currency = 'EUR' 
          AND r_te.target_currency = a.currency_code 
          AND r_te.rate_date <= ab.balance_date
        ORDER BY r_te.rate_date DESC
        LIMIT 1
    ) r_te ON a.currency_code != 'EUR'
    WHERE 1=1 {user_filter_accounts}
    ORDER BY ab.balance_date DESC, a.account_id;
    """
    
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        
        if df.empty:
            return df
        
        # Calculate EUR equivalent
        df['balance_eur'] = df['amount'] * df['rate_to_eur']
        
        # Convert to target currency
        dynamic_col = f"balance_{target_currency.lower()}"
        df[dynamic_col] = df['balance_eur']
        
        if target_currency.upper() != 'EUR':
            rate_query = text("""
                SELECT rate_date, rate
                FROM exchange_rates.rate_history
                WHERE base_currency = 'EUR' AND target_currency = :target_currency
                ORDER BY rate_date DESC
            """)
            
            df_rates = pd.read_sql(rate_query, conn, params={"target_currency": target_currency.upper()})
            if not df_rates.empty:
                df_rates['rate_date'] = pd.to_datetime(df_rates['rate_date']).dt.date
                
                df['balance_date_dt'] = pd.to_datetime(df['balance_date'])
                df_rates['rate_date_dt'] = pd.to_datetime(df_rates['rate_date'])
                
                df = df.sort_values('balance_date_dt')
                df_rates = df_rates.sort_values('rate_date_dt')
                
                df = pd.merge_asof(
                    df,
                    df_rates[['rate_date_dt', 'rate']],
                    left_on='balance_date_dt',
                    right_on='rate_date_dt',
                    direction='backward'
                )
                
                df[dynamic_col] = df['balance_eur'] * df['rate'].fillna(1.0)
                df = df.drop(columns=['balance_date_dt', 'rate_date_dt', 'rate'])
        
        return df


@router.get("", response_model=list[BalanceResponse])
async def get_balances(
    currency: str = 'EUR',
    date: Optional[str] = Query(None, description="Date in format YYYY-MM-DD"),
    current_user: dict = Depends(get_current_user)
):
    """Get all account balances for the current user, aggregated from transactions."""
    try:
        parsed_date = None
        if date:
            try:
                parsed_date = date_class.fromisoformat(date)
            except ValueError:
                raise HTTPException(status_code=422, detail="Invalid date format. Use YYYY-MM-DD")
        
        df = load_balances_from_transactions(
            target_currency=currency, 
            balance_date=parsed_date,
            user_id=current_user["user_id"]
        )
        
        if df.empty:
            return []
        
        records = df.to_dict('records')
        results = []
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
            
            results.append(BalanceResponse(**result))
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{account_name}", response_model=list[BalanceHistoryResponse])
async def get_account_balance_history(
    account_name: str,
    currency: str = Query('EUR', description="Target currency for conversion"),
    current_user: dict = Depends(get_current_user)
):
    """Get balance history for a specific account."""
    try:
        # URL decode account name
        account_name = account_name.replace('_', ' ').replace('%2F', '/')
        
        # Use transaction-based aggregation for history
        # Generate running totals from transactions (one row per transaction date)
        query = text("""
        WITH transaction_balances AS (
            SELECT
                t.account_id,
                t.transaction_date,
                SUM(t.amount) OVER (
                    PARTITION BY t.account_id 
                    ORDER BY t.transaction_date 
                    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                ) as running_balance
            FROM transactions.ledger t
            JOIN accounts.list a ON t.account_id = a.account_id
            WHERE a.account_name = :account_name 
              AND t.user_id = :user_id 
              AND a.user_id = :user_id
        ),
        daily_balances AS (
            SELECT DISTINCT ON (transaction_date)
                account_id,
                transaction_date as balance_date,
                running_balance as amount
            FROM transaction_balances
            ORDER BY transaction_date, account_id
        )
        SELECT
            db.balance_date,
            a.account_name,
            a.account_type,
            a.institution,
            a.currency_code,
            db.amount,
            COALESCE(r_te.rate_to_eur, 1.0) AS rate_to_eur
        FROM daily_balances db
        JOIN accounts.list a ON db.account_id = a.account_id
        LEFT JOIN LATERAL (
            SELECT 1.0 / r_te.rate AS rate_to_eur
            FROM exchange_rates.rate_history r_te
            WHERE r_te.base_currency = 'EUR' 
              AND r_te.target_currency = a.currency_code 
              AND r_te.rate_date <= db.balance_date
            ORDER BY r_te.rate_date DESC
            LIMIT 1
        ) r_te ON a.currency_code != 'EUR'
        ORDER BY db.balance_date ASC;
        """)
        
        with engine.connect() as conn:
            df = pd.read_sql(query, conn, params={
                "account_name": account_name,
                "user_id": current_user["user_id"]
            })
            
            if df.empty:
                return []
            
            # Calculate EUR equivalent
            df['balance_eur'] = df['amount'] * df['rate_to_eur']
            
            # Convert to target currency
            dynamic_col = f"balance_{currency.lower()}"
            df[dynamic_col] = df['balance_eur']
            
            if currency.upper() != 'EUR':
                rate_query = text("""
                    SELECT rate_date, rate
                    FROM exchange_rates.rate_history
                    WHERE base_currency = 'EUR' AND target_currency = :target_currency
                    ORDER BY rate_date DESC
                """)
                
                df_rates = pd.read_sql(rate_query, conn, params={"target_currency": currency.upper()})
                if not df_rates.empty:
                    df_rates['rate_date'] = pd.to_datetime(df_rates['rate_date']).dt.date
                    
                    df['balance_date_dt'] = pd.to_datetime(df['balance_date'])
                    df_rates['rate_date_dt'] = pd.to_datetime(df_rates['rate_date'])
                    
                    df = df.sort_values('balance_date_dt')
                    df_rates = df_rates.sort_values('rate_date_dt')
                    
                    df = pd.merge_asof(
                        df,
                        df_rates[['rate_date_dt', 'rate']],
                        left_on='balance_date_dt',
                        right_on='rate_date_dt',
                        direction='backward'
                    )
                    
                    df[dynamic_col] = df['balance_eur'] * df['rate'].fillna(1.0)
                    df = df.drop(columns=['balance_date_dt', 'rate_date_dt', 'rate'])
            
            # Convert to response format
            records = df.to_dict('records')
            results = []
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
                
                results.append(BalanceHistoryResponse(**result))
            
            return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

