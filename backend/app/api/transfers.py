from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import text
from app.db.database import engine
from app.models.schemas import TransferRequest, TransferResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/transfers", tags=["transfers"])


@router.post("", response_model=TransferResponse)
async def create_transfer(transfer: TransferRequest, current_user: dict = Depends(get_current_user)):
    """
    Transfer money between two accounts.
    Creates two linked transactions: one negative (from account) and one positive (to account).
    """
    try:
        # Validate accounts exist and belong to user
        check_accounts = text("""
            SELECT account_id FROM accounts.list 
            WHERE account_id IN (:from_account_id, :to_account_id)
              AND user_id = :user_id
        """)
        
        with engine.connect() as conn:
            result = conn.execute(check_accounts, {
                "from_account_id": transfer.from_account_id,
                "to_account_id": transfer.to_account_id,
                "user_id": current_user["user_id"]
            })
            found_accounts = {row[0] for row in result}
            
            if transfer.from_account_id not in found_accounts:
                raise HTTPException(status_code=404, detail=f"From account ID {transfer.from_account_id} not found")
            if transfer.to_account_id not in found_accounts:
                raise HTTPException(status_code=404, detail=f"To account ID {transfer.to_account_id} not found")
            if transfer.from_account_id == transfer.to_account_id:
                raise HTTPException(status_code=400, detail="Cannot transfer to the same account")
            if transfer.amount <= 0:
                raise HTTPException(status_code=400, detail="Transfer amount must be positive")
            if transfer.fees < 0:
                raise HTTPException(status_code=400, detail="Fees cannot be negative")
            
            # Get account names for merchant field
            get_account_names = text("""
                SELECT account_id, account_name FROM accounts.list 
                WHERE account_id IN (:from_account_id, :to_account_id)
            """)
            account_names_result = conn.execute(get_account_names, {
                "from_account_id": transfer.from_account_id,
                "to_account_id": transfer.to_account_id
            })
            account_names = {row[0]: row[1] for row in account_names_result}
            to_account_name = account_names.get(transfer.to_account_id, "")
            from_account_name = account_names.get(transfer.from_account_id, "")
            
            # Get next transfer_link_id from sequence
            get_link_id = text("SELECT nextval('transactions.transfer_link_seq')")
            link_id_result = conn.execute(get_link_id)
            transfer_link_id = link_id_result.scalar()
            
            # Create description if not provided
            description = transfer.description or f"Transfer between accounts"
            
            # Insert negative transaction (from account) - merchant = to_account_name
            insert_from = text("""
                INSERT INTO transactions.ledger 
                (account_id, amount, transaction_type, category, transaction_date, transfer_link_id, description, merchant, user_id)
                VALUES (:account_id, :amount, 'transfer', 'Transfer', :transaction_date, :transfer_link_id, :description, :merchant, :user_id)
                RETURNING transaction_id
            """)
            
            from_result = conn.execute(insert_from, {
                "account_id": transfer.from_account_id,
                "amount": -transfer.amount,  # Negative amount
                "transaction_date": transfer.date,
                "transfer_link_id": transfer_link_id,
                "description": f"{description} (from)",
                "merchant": to_account_name,  # Set merchant to the destination account name
                "user_id": current_user["user_id"]
            })
            from_transaction_id = from_result.scalar()
            
            # Insert positive transaction (to account) - merchant = from_account_name
            insert_to = text("""
                INSERT INTO transactions.ledger 
                (account_id, amount, transaction_type, category, transaction_date, transfer_link_id, description, merchant, user_id)
                VALUES (:account_id, :amount, 'transfer', 'Transfer', :transaction_date, :transfer_link_id, :description, :merchant, :user_id)
                RETURNING transaction_id
            """)
            
            to_result = conn.execute(insert_to, {
                "account_id": transfer.to_account_id,
                "amount": transfer.amount,  # Positive amount
                "transaction_date": transfer.date,
                "transfer_link_id": transfer_link_id,
                "description": f"{description} (to)",
                "merchant": from_account_name,  # Set merchant to the source account name
                "user_id": current_user["user_id"]
            })
            to_transaction_id = to_result.scalar()
            
            # If fees > 0, create an expense transaction in the source account
            fee_transaction_id = None
            if transfer.fees > 0:
                # Get currency code for fee description
                get_currency = text("""
                    SELECT currency_code FROM accounts.list 
                    WHERE account_id = :account_id
                """)
                currency_result = conn.execute(get_currency, {"account_id": transfer.from_account_id})
                currency_code = currency_result.fetchone()[0] if currency_result else ""
                
                insert_fee = text("""
                    INSERT INTO transactions.ledger 
                    (account_id, amount, transaction_type, category, transaction_date, description, merchant, user_id)
                    VALUES (:account_id, :amount, 'expense', 'Bank Fees', :transaction_date, :description, :merchant, :user_id)
                    RETURNING transaction_id
                """)
                
                fee_result = conn.execute(insert_fee, {
                    "account_id": transfer.from_account_id,
                    "amount": -transfer.fees,  # Negative amount (expense)
                    "transaction_date": transfer.date,
                    "description": f"Transfer fee: {transfer.fees} {currency_code}",
                    "merchant": "Transfer Fee",
                    "user_id": current_user["user_id"]
                })
                fee_transaction_id = fee_result.scalar()
            
            conn.commit()
            
            return TransferResponse(
                message=f"Transfer of {transfer.amount} created successfully",
                from_transaction_id=from_transaction_id,
                to_transaction_id=to_transaction_id,
                fee_transaction_id=fee_transaction_id,
                transfer_link_id=transfer_link_id
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

