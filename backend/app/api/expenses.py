from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from app.db.database import engine
from app.models.schemas import ExpenseResponse, ExpenseCreateRequest, ExpenseUpdateRequest
from typing import Optional
from datetime import date

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("", response_model=list[ExpenseResponse])
async def get_expenses(
    account_id: Optional[int] = Query(None, description="Filter by account ID"),
    trip_id: Optional[int] = Query(None, description="Filter by trip ID"),
    category: Optional[str] = Query(None, description="Filter by category")
):
    """Get all expenses, optionally filtered by account, trip, or category."""
    try:
        query_str = """
            SELECT expense_id, expense_date, account_id, merchant, category, 
                   amount, currency_code, description, trip_id, created_at, updated_at
            FROM expenses.list
        """
        params = {}
        conditions = []
        
        if account_id:
            conditions.append("account_id = :account_id")
            params["account_id"] = account_id
        
        if trip_id:
            conditions.append("trip_id = :trip_id")
            params["trip_id"] = trip_id
        
        if category:
            conditions.append("category = :category")
            params["category"] = category
        
        if conditions:
            query_str += " WHERE " + " AND ".join(conditions)
        
        query_str += " ORDER BY expense_date DESC, expense_id DESC"
        
        with engine.connect() as conn:
            result = conn.execute(text(query_str), params)
            expenses = []
            for row in result:
                expenses.append(ExpenseResponse(
                    expense_id=row[0],
                    expense_date=row[1],
                    account_id=row[2],
                    merchant=row[3],
                    category=row[4],
                    amount=float(row[5]),
                    currency_code=row[6],
                    description=row[7],
                    trip_id=row[8],
                    created_at=str(row[9]) if row[9] else "",
                    updated_at=str(row[10]) if row[10] else ""
                ))
            return expenses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(expense_id: int):
    """Get a specific expense by ID."""
    try:
        query = text("""
            SELECT expense_id, expense_date, account_id, merchant, category, 
                   amount, currency_code, description, trip_id, created_at, updated_at
            FROM expenses.list
            WHERE expense_id = :expense_id
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, {"expense_id": expense_id})
            row = result.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail=f"Expense ID {expense_id} not found")
            
            return ExpenseResponse(
                expense_id=row[0],
                expense_date=row[1],
                account_id=row[2],
                merchant=row[3],
                category=row[4],
                amount=float(row[5]),
                currency_code=row[6],
                description=row[7],
                trip_id=row[8],
                created_at=str(row[9]) if row[9] else "",
                updated_at=str(row[10]) if row[10] else ""
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=ExpenseResponse)
async def create_expense(expense: ExpenseCreateRequest):
    """Create a new expense."""
    try:
        # Validate account exists
        check_account = text("SELECT account_id FROM accounts.list WHERE account_id = :account_id")
        
        with engine.connect() as conn:
            account_result = conn.execute(check_account, {"account_id": expense.account_id}).fetchone()
            if not account_result:
                raise HTTPException(status_code=404, detail=f"Account ID {expense.account_id} does not exist")
            
            # Validate trip if provided
            if expense.trip_id:
                check_trip = text("SELECT trip_id FROM trips.list WHERE trip_id = :trip_id")
                trip_result = conn.execute(check_trip, {"trip_id": expense.trip_id}).fetchone()
                if not trip_result:
                    raise HTTPException(status_code=404, detail=f"Trip ID {expense.trip_id} does not exist")
            
            # Insert expense
            insert_query = text("""
                INSERT INTO expenses.list 
                (expense_date, account_id, merchant, category, amount, currency_code, description, trip_id)
                VALUES (:expense_date, :account_id, :merchant, :category, :amount, :currency_code, :description, :trip_id)
                RETURNING expense_id, expense_date, account_id, merchant, category, amount, currency_code, description, trip_id, created_at, updated_at
            """)
            
            result = conn.execute(insert_query, {
                "expense_date": expense.expense_date,
                "account_id": expense.account_id,
                "merchant": expense.merchant,
                "category": expense.category,
                "amount": expense.amount,
                "currency_code": expense.currency_code.upper(),
                "description": expense.description,
                "trip_id": expense.trip_id
            })
            conn.commit()
            row = result.fetchone()
            
            return ExpenseResponse(
                expense_id=row[0],
                expense_date=row[1],
                account_id=row[2],
                merchant=row[3],
                category=row[4],
                amount=float(row[5]),
                currency_code=row[6],
                description=row[7],
                trip_id=row[8],
                created_at=str(row[9]) if row[9] else "",
                updated_at=str(row[10]) if row[10] else ""
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
