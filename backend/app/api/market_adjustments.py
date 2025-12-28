from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from app.db.database import engine
from app.models.schemas import MarketAdjustmentRequest, MarketAdjustmentResponse

router = APIRouter(prefix="/api/market-adjustments", tags=["market-adjustments"])


@router.post("", response_model=MarketAdjustmentResponse)
async def create_market_adjustment(adjustment: MarketAdjustmentRequest):
    """
    Sync an investment account with actual balance.
    Creates a 'Market Gain' or 'Market Loss' transaction for the difference.
    """
    try:
        # Validate account exists
        check_account = text("SELECT account_id FROM accounts.list WHERE account_id = :account_id")
        
        with engine.connect() as conn:
            account_result = conn.execute(check_account, {"account_id": adjustment.account_id}).fetchone()
            if not account_result:
                raise HTTPException(status_code=404, detail=f"Account ID {adjustment.account_id} not found")
            
            # Calculate current balance from transactions
            current_balance_query = text("""
                SELECT COALESCE(SUM(amount), 0) 
                FROM transactions.ledger 
                WHERE account_id = :account_id
            """)
            
            current_balance_result = conn.execute(current_balance_query, {"account_id": adjustment.account_id})
            current_balance = float(current_balance_result.scalar() or 0)
            
            # Calculate difference
            adjustment_amount = adjustment.actual_balance - current_balance
            
            # If difference is negligible, don't create transaction
            if abs(adjustment_amount) < 0.01:
                return MarketAdjustmentResponse(
                    message="No adjustment needed - balances match",
                    transaction_id=0,
                    adjustment_amount=0.0,
                    new_balance=current_balance
                )
            
            # Determine category
            category = "Market Gain" if adjustment_amount > 0 else "Market Loss"
            
            # Create description
            description = adjustment.description or f"{category} adjustment (was {current_balance}, now {adjustment.actual_balance})"
            
            # Insert adjustment transaction
            insert_transaction = text("""
                INSERT INTO transactions.ledger 
                (account_id, amount, transaction_type, category, transaction_date, description)
                VALUES (:account_id, :amount, 'income', :category, :transaction_date, :description)
                RETURNING transaction_id
            """)
            
            result = conn.execute(insert_transaction, {
                "account_id": adjustment.account_id,
                "amount": adjustment_amount,
                "category": category,
                "transaction_date": adjustment.date,
                "description": description
            })
            transaction_id = result.scalar()
            
            conn.commit()
            
            return MarketAdjustmentResponse(
                message=f"{category} transaction created successfully",
                transaction_id=transaction_id,
                adjustment_amount=adjustment_amount,
                new_balance=adjustment.actual_balance
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

