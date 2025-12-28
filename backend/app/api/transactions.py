from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from app.db.database import engine
from app.models.schemas import TransactionCreateRequest, TransactionUpdateRequest, TransactionResponse
from typing import Optional
from datetime import date
from fastapi import APIRouter, HTTPException, Query, Path

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

# Common expense categories (can be customized)
EXPENSE_CATEGORIES = [
    "Groceries",
    "Restaurants",
    "Transport",
    "Shopping",
    "Entertainment",
    "Bills",
    "Health",
    "Education",
    "Travel",
    "Other"
]

# Common income categories
INCOME_CATEGORIES = [
    "Salary",
    "Freelance",
    "Investment",
    "Gift",
    "Other"
]


@router.post("", response_model=TransactionResponse)
async def create_transaction(transaction: TransactionCreateRequest):
    """
    Create a new transaction.
    
    transaction_type must be: 'income', 'expense', or 'transfer'
    For transfers, use the /api/transfers endpoint instead.
    """
    try:
        # Validate transaction_type
        valid_types = ['income', 'expense', 'transfer']
        if transaction.transaction_type not in valid_types:
            raise HTTPException(
                status_code=400, 
                detail=f"transaction_type must be one of: {', '.join(valid_types)}"
            )
        
        if transaction.transaction_type == 'transfer':
            raise HTTPException(
                status_code=400,
                detail="Use /api/transfers endpoint for transfer transactions"
            )
        
        # Validate account exists
        check_account = text("SELECT account_id FROM accounts.list WHERE account_id = :account_id")
        with engine.connect() as conn:
            account_result = conn.execute(check_account, {"account_id": transaction.account_id}).fetchone()
            if not account_result:
                raise HTTPException(status_code=404, detail=f"Account ID {transaction.account_id} does not exist")
            
            # Check if this is an Initial Balance transaction and if one already exists
            if transaction.category == 'Initial Balance':
                check_existing = text("""
                    SELECT transaction_id 
                    FROM transactions.ledger 
                    WHERE account_id = :account_id 
                    AND category = 'Initial Balance'
                    LIMIT 1
                """)
                existing = conn.execute(check_existing, {"account_id": transaction.account_id}).fetchone()
                if existing:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Account {transaction.account_id} already has an Initial Balance transaction. Each account can only have one Initial Balance."
                    )
            
            # Validate trip if provided
            if transaction.trip_id:
                check_trip = text("SELECT trip_id FROM trips.list WHERE trip_id = :trip_id")
                trip_result = conn.execute(check_trip, {"trip_id": transaction.trip_id}).fetchone()
                if not trip_result:
                    raise HTTPException(status_code=404, detail=f"Trip ID {transaction.trip_id} does not exist")
            
            # Insert transaction
            insert_query = text("""
                INSERT INTO transactions.ledger 
                (account_id, amount, transaction_type, category, transaction_date, description, merchant, trip_id)
                VALUES (:account_id, :amount, :transaction_type, :category, :transaction_date, :description, :merchant, :trip_id)
                RETURNING transaction_id, account_id, amount, transaction_type, category, transaction_date, description, merchant, trip_id
            """)
            
            result = conn.execute(insert_query, {
                "account_id": transaction.account_id,
                "amount": transaction.amount,
                "transaction_type": transaction.transaction_type,
                "category": transaction.category,
                "transaction_date": transaction.transaction_date,
                "description": transaction.description,
                "merchant": transaction.merchant,
                "trip_id": transaction.trip_id
            })
            conn.commit()
            row = result.fetchone()
            
            return TransactionResponse(
                transaction_id=row[0],
                account_id=row[1],
                amount=float(row[2]),
                transaction_type=row[3],
                category=row[4],
                transaction_date=row[5],
                description=row[6],
                merchant=row[7] if row[7] else None,
                trip_id=row[8] if row[8] else None
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=list[TransactionResponse])
async def get_transactions(
    account_id: Optional[int] = Query(None, description="Filter by account ID"),
    transaction_type: Optional[str] = Query(None, description="Filter by transaction type (income, expense, transfer)"),
    trip_id: Optional[int] = Query(None, description="Filter by trip ID (for expense transactions)"),
    merchant: Optional[str] = Query(None, description="Filter by merchant (for expense transactions)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    currency_code: Optional[str] = Query(None, description="Filter by currency code"),
    start_date: Optional[date] = Query(None, description="Filter by start date (inclusive)"),
    end_date: Optional[date] = Query(None, description="Filter by end date (inclusive)")
):
    """Get all transactions, optionally filtered by account, transaction_type, trip_id, merchant, category, currency_code, or date range."""
    try:
        query = """
            SELECT 
                t.transaction_id, 
                t.account_id, 
                t.amount, 
                t.transaction_type, 
                t.category, 
                t.transaction_date, 
                t.description, 
                t.merchant, 
                t.trip_id,
                a.account_name,
                a.currency_code
            FROM transactions.ledger t
            LEFT JOIN accounts.list a ON t.account_id = a.account_id
        """
        params = {}
        conditions = []
        
        if account_id:
            conditions.append("t.account_id = :account_id")
            params["account_id"] = account_id
        
        if transaction_type:
            if transaction_type not in ['income', 'expense', 'transfer']:
                raise HTTPException(status_code=400, detail="transaction_type must be: income, expense, or transfer")
            conditions.append("t.transaction_type = :transaction_type")
            params["transaction_type"] = transaction_type
        
        if trip_id:
            conditions.append("t.trip_id = :trip_id")
            params["trip_id"] = trip_id
        
        if merchant:
            conditions.append("t.merchant ILIKE :merchant")
            params["merchant"] = f"%{merchant}%"
        
        if category:
            conditions.append("t.category = :category")
            params["category"] = category
        
        if currency_code:
            conditions.append("a.currency_code = :currency_code")
            params["currency_code"] = currency_code
        
        if start_date:
            conditions.append("t.transaction_date >= :start_date")
            params["start_date"] = start_date
        
        if end_date:
            conditions.append("t.transaction_date <= :end_date")
            params["end_date"] = end_date
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += " ORDER BY t.transaction_date DESC, t.transaction_id DESC"
        
        with engine.connect() as conn:
            result = conn.execute(text(query), params)
            transactions = []
            for row in result:
                transactions.append(TransactionResponse(
                    transaction_id=row[0],
                    account_id=row[1],
                    amount=float(row[2]),
                    transaction_type=row[3],
                    category=row[4],
                    transaction_date=row[5],
                    description=row[6],
                    merchant=row[7] if row[7] else None,
                    trip_id=row[8] if row[8] else None,
                    account_name=row[9] if row[9] else None,
                    currency_code=row[10] if row[10] else None
                ))
            return transactions
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories", response_model=dict)
async def get_categories():
    """Get available expense and income categories."""
    return {
        "expense_categories": EXPENSE_CATEGORIES,
        "income_categories": INCOME_CATEGORIES
    }


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(transaction_id: int, transaction_update: TransactionUpdateRequest):
    """Update an existing transaction. Cannot change transaction_type or account_id."""
    try:
        # First check if transaction exists
        check_query = text("SELECT transaction_id, transaction_type, account_id FROM transactions.ledger WHERE transaction_id = :transaction_id")
        with engine.connect() as conn:
            existing = conn.execute(check_query, {"transaction_id": transaction_id}).fetchone()
            if not existing:
                raise HTTPException(status_code=404, detail=f"Transaction ID {transaction_id} not found")
            
            existing_type = existing[1]
            
            # Build update query dynamically
            updates = []
            params = {"transaction_id": transaction_id}
            
            if transaction_update.amount is not None:
                # Allow 0.00 for Initial Balance transactions, otherwise require != 0
                existing_category_query = text("SELECT category FROM transactions.ledger WHERE transaction_id = :transaction_id")
                existing_category = conn.execute(existing_category_query, {"transaction_id": transaction_id}).fetchone()
                is_initial_balance = (existing_category and existing_category[0] == 'Initial Balance') or (transaction_update.category == 'Initial Balance')
                
                # Validation based on transaction type:
                # - Expenses: can be negative (or zero for Initial Balance)
                # - Income: must be positive (or zero for Initial Balance)
                # - Transfers: can be negative or positive (depending on direction)
                if transaction_update.amount == 0 and not is_initial_balance:
                    raise HTTPException(status_code=400, detail="Amount must not be zero (except for Initial Balance transactions)")
                
                if existing_type == 'income' and transaction_update.amount < 0:
                    raise HTTPException(status_code=400, detail="Income transactions cannot have negative amounts")
                
                # Expenses and transfers can have negative amounts (expenses are typically negative)
                # No additional validation needed for expenses/transfers
                
                updates.append("amount = :amount")
                params["amount"] = transaction_update.amount
            
            if transaction_update.category is not None:
                new_category = transaction_update.category.strip() if transaction_update.category else None
                # If changing to "Initial Balance", check if one already exists for this account
                if new_category == 'Initial Balance':
                    existing_account_id = existing[2]  # account_id from check_query
                    check_existing_initial = text("""
                        SELECT transaction_id 
                        FROM transactions.ledger 
                        WHERE account_id = :account_id 
                        AND category = 'Initial Balance'
                        AND transaction_id != :transaction_id
                        LIMIT 1
                    """)
                    existing_initial = conn.execute(check_existing_initial, {
                        "account_id": existing_account_id,
                        "transaction_id": transaction_id
                    }).fetchone()
                    if existing_initial:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Account already has an Initial Balance transaction. Each account can only have one Initial Balance."
                        )
                updates.append("category = :category")
                params["category"] = new_category
            
            if transaction_update.transaction_date is not None:
                updates.append("transaction_date = :transaction_date")
                params["transaction_date"] = transaction_update.transaction_date
            
            if transaction_update.description is not None:
                updates.append("description = :description")
                params["description"] = transaction_update.description.strip() if transaction_update.description else None
            
            # Merchant can be set for income and expense
            if transaction_update.merchant is not None and existing_type in ['income', 'expense']:
                updates.append("merchant = :merchant")
                params["merchant"] = transaction_update.merchant.strip() if transaction_update.merchant else None
            
            # Trip ID only for expenses
            if transaction_update.trip_id is not None:
                if existing_type == 'expense':
                    # Validate trip exists if provided
                    if transaction_update.trip_id:
                        check_trip = text("SELECT trip_id FROM trips.list WHERE trip_id = :trip_id")
                        trip_result = conn.execute(check_trip, {"trip_id": transaction_update.trip_id}).fetchone()
                        if not trip_result:
                            raise HTTPException(status_code=404, detail=f"Trip ID {transaction_update.trip_id} does not exist")
                    updates.append("trip_id = :trip_id")
                    params["trip_id"] = transaction_update.trip_id
                else:
                    raise HTTPException(status_code=400, detail="trip_id can only be set for expense transactions")
            
            if not updates:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            # Build update query
            update_query = text(f"""
                UPDATE transactions.ledger
                SET {', '.join(updates)}
                WHERE transaction_id = :transaction_id
                RETURNING transaction_id, account_id, amount, transaction_type, category, transaction_date, description, merchant, trip_id
            """)
            
            result = conn.execute(update_query, params)
            conn.commit()
            row = result.fetchone()
            
            if not row:
                raise HTTPException(status_code=500, detail="Failed to update transaction")
            
            return TransactionResponse(
                transaction_id=row[0],
                account_id=row[1],
                amount=float(row[2]),
                transaction_type=row[3],
                category=row[4],
                transaction_date=row[5],
                description=row[6],
                merchant=row[7] if row[7] else None,
                trip_id=row[8] if row[8] else None
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{transaction_id}")
async def delete_transaction(transaction_id: int):
    """Delete a transaction. If it's part of a transfer, delete both linked transactions."""
    try:
        # Check if transaction exists and get transfer_link_id if it's a transfer
        check_query = text("""
            SELECT transaction_id, transfer_link_id, transaction_type 
            FROM transactions.ledger 
            WHERE transaction_id = :transaction_id
        """)
        with engine.connect() as conn:
            existing = conn.execute(check_query, {"transaction_id": transaction_id}).fetchone()
            if not existing:
                raise HTTPException(status_code=404, detail=f"Transaction ID {transaction_id} not found")
            
            transfer_link_id = existing[1]
            transaction_type = existing[2]
            
            # If this is a transfer transaction (has transfer_link_id), delete both linked transactions
            if transfer_link_id is not None:
                delete_query = text("""
                    DELETE FROM transactions.ledger 
                    WHERE transfer_link_id = :transfer_link_id 
                    RETURNING transaction_id
                """)
                result = conn.execute(delete_query, {"transfer_link_id": transfer_link_id})
                deleted_transactions = result.fetchall()
                conn.commit()
                
                if not deleted_transactions:
                    raise HTTPException(status_code=500, detail="Failed to delete transfer transactions")
                
                deleted_ids = [row[0] for row in deleted_transactions]
                return {
                    "message": f"Transfer deleted successfully. Deleted transaction IDs: {deleted_ids}",
                    "deleted_transaction_ids": deleted_ids
                }
            else:
                # Regular transaction (not a transfer), just delete it
                delete_query = text("DELETE FROM transactions.ledger WHERE transaction_id = :transaction_id RETURNING transaction_id")
                result = conn.execute(delete_query, {"transaction_id": transaction_id})
                conn.commit()
                
                if not result.fetchone():
                    raise HTTPException(status_code=500, detail="Failed to delete transaction")
                
                return {"message": f"Transaction ID {transaction_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

