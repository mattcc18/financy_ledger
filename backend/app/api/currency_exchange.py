from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from app.db.database import engine
from app.models.schemas import CurrencyExchangeRequest, CurrencyExchangeResponse

router = APIRouter(prefix="/api/currency-exchange", tags=["currency-exchange"])


@router.post("", response_model=CurrencyExchangeResponse)
async def create_currency_exchange(exchange: CurrencyExchangeRequest):
    """
    Transfer money between accounts in different currencies.
    Creates transactions for the transfer and optional fees.
    """
    try:
        # Validate accounts exist and get their currencies
        check_accounts = text("""
            SELECT account_id, account_name, currency_code FROM accounts.list 
            WHERE account_id IN (:from_account_id, :to_account_id)
        """)
        
        with engine.connect() as conn:
            result = conn.execute(check_accounts, {
                "from_account_id": exchange.from_account_id,
                "to_account_id": exchange.to_account_id
            })
            accounts_data = {row[0]: {"name": row[1], "currency": row[2]} for row in result}
            
            if exchange.from_account_id not in accounts_data:
                raise HTTPException(status_code=404, detail=f"From account ID {exchange.from_account_id} not found")
            if exchange.to_account_id not in accounts_data:
                raise HTTPException(status_code=404, detail=f"To account ID {exchange.to_account_id} not found")
            if exchange.from_account_id == exchange.to_account_id:
                raise HTTPException(status_code=400, detail="Cannot exchange to the same account")
            if exchange.amount <= 0:
                raise HTTPException(status_code=400, detail="Amount must be positive")
            if exchange.exchange_rate <= 0:
                raise HTTPException(status_code=400, detail="Exchange rate must be positive")
            if exchange.fees < 0:
                raise HTTPException(status_code=400, detail="Fees cannot be negative")
            
            from_account = accounts_data[exchange.from_account_id]
            to_account = accounts_data[exchange.to_account_id]
            from_currency = from_account["currency"]
            to_currency = to_account["currency"]
            
            # Calculate destination amount: source_amount * exchange_rate
            to_amount = exchange.amount * exchange.exchange_rate
            
            # Get next transfer_link_id from sequence
            get_link_id = text("SELECT nextval('transactions.transfer_link_seq')")
            link_id_result = conn.execute(get_link_id)
            transfer_link_id = link_id_result.scalar()
            
            # Create description
            description = exchange.description or f"Currency exchange: {exchange.amount} {from_currency} → {to_amount:.2f} {to_currency} (rate: {exchange.exchange_rate})"
            
            # Insert negative transaction (from account) - in source currency
            insert_from = text("""
                INSERT INTO transactions.ledger 
                (account_id, amount, transaction_type, category, transaction_date, transfer_link_id, description, merchant)
                VALUES (:account_id, :amount, 'transfer', 'Transfer', :transaction_date, :transfer_link_id, :description, :merchant)
                RETURNING transaction_id
            """)
            
            from_result = conn.execute(insert_from, {
                "account_id": exchange.from_account_id,
                "amount": -exchange.amount,  # Negative amount in source currency
                "transaction_date": exchange.date,
                "transfer_link_id": transfer_link_id,
                "description": f"{description} (from)",
                "merchant": to_account["name"]
            })
            from_transaction_id = from_result.scalar()
            
            # Insert positive transaction (to account) - in destination currency
            insert_to = text("""
                INSERT INTO transactions.ledger 
                (account_id, amount, transaction_type, category, transaction_date, transfer_link_id, description, merchant)
                VALUES (:account_id, :amount, 'transfer', 'Transfer', :transaction_date, :transfer_link_id, :description, :merchant)
                RETURNING transaction_id
            """)
            
            to_result = conn.execute(insert_to, {
                "account_id": exchange.to_account_id,
                "amount": to_amount,  # Positive amount in destination currency
                "transaction_date": exchange.date,
                "transfer_link_id": transfer_link_id,
                "description": f"{description} (to)",
                "merchant": from_account["name"]
            })
            to_transaction_id = to_result.scalar()
            
            # If fees > 0, create an expense transaction in the source account
            fee_transaction_id = None
            if exchange.fees > 0:
                insert_fee = text("""
                    INSERT INTO transactions.ledger 
                    (account_id, amount, transaction_type, category, transaction_date, description, merchant)
                    VALUES (:account_id, :amount, 'expense', 'Bank Fees', :transaction_date, :description, :merchant)
                    RETURNING transaction_id
                """)
                
                fee_result = conn.execute(insert_fee, {
                    "account_id": exchange.from_account_id,
                    "amount": -exchange.fees,  # Negative amount (expense) in source currency
                    "transaction_date": exchange.date,
                    "description": f"Currency exchange fee: {exchange.fees} {from_currency}",
                    "merchant": "Currency Exchange"
                })
                fee_transaction_id = fee_result.scalar()
            
            conn.commit()
            
            return CurrencyExchangeResponse(
                message=f"Currency exchange created: {exchange.amount} {from_currency} → {to_amount:.2f} {to_currency}",
                from_transaction_id=from_transaction_id,
                to_transaction_id=to_transaction_id,
                fee_transaction_id=fee_transaction_id,
                transfer_link_id=transfer_link_id,
                from_amount=exchange.amount,
                to_amount=to_amount,
                exchange_rate=exchange.exchange_rate
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

