from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from app.db.database import engine
from app.models.schemas import BudgetResponse, BudgetCreateRequest, BudgetUpdateRequest
import json

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


@router.get("", response_model=list[BudgetResponse])
async def get_all_budgets():
    """Get all budgets."""
    try:
        query = text("""
            SELECT budget_id, name, currency, income_sources, categories, created_at, updated_at
            FROM budgets.list
            ORDER BY name
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query)
            budgets = []
            for row in result:
                budgets.append(BudgetResponse(
                    budget_id=row[0],
                    name=row[1],
                    currency=row[2],
                    income_sources=row[3] if row[3] else [],
                    categories=row[4] if row[4] else [],
                    created_at=str(row[5]),
                    updated_at=str(row[6])
                ))
            return budgets
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(budget_id: int):
    """Get a specific budget by ID."""
    try:
        query = text("""
            SELECT budget_id, name, currency, income_sources, categories, created_at, updated_at
            FROM budgets.list
            WHERE budget_id = :budget_id
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, {"budget_id": budget_id})
            row = result.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail=f"Budget ID {budget_id} not found")
            
            return BudgetResponse(
                budget_id=row[0],
                name=row[1],
                currency=row[2],
                income_sources=row[3] if row[3] else [],
                categories=row[4] if row[4] else [],
                created_at=str(row[5]),
                updated_at=str(row[6])
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=BudgetResponse)
async def create_budget(budget: BudgetCreateRequest):
    """Create a new budget."""
    try:
        income_sources = json.dumps(budget.income_sources if budget.income_sources is not None else [])
        categories = json.dumps(budget.categories if budget.categories is not None else [])
        
        query = text("""
            INSERT INTO budgets.list (name, currency, income_sources, categories)
            VALUES (:name, :currency, CAST(:income_sources AS jsonb), CAST(:categories AS jsonb))
            RETURNING budget_id, name, currency, income_sources, categories, created_at, updated_at
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, {
                "name": budget.name,
                "currency": budget.currency.upper(),
                "income_sources": income_sources,
                "categories": categories
            })
            conn.commit()
            row = result.fetchone()
            
            return BudgetResponse(
                budget_id=row[0],
                name=row[1],
                currency=row[2],
                income_sources=row[3] if row[3] else [],
                categories=row[4] if row[4] else [],
                created_at=str(row[5]),
                updated_at=str(row[6])
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(budget_id: int, budget: BudgetUpdateRequest):
    """Update an existing budget."""
    try:
        # Build update query dynamically based on provided fields
        updates = []
        params = {"budget_id": budget_id}
        
        if budget.name is not None:
            updates.append("name = :name")
            params["name"] = budget.name
        
        if budget.currency is not None:
            updates.append("currency = :currency")
            params["currency"] = budget.currency.upper()
        
        if budget.income_sources is not None:
            updates.append("income_sources = CAST(:income_sources AS jsonb)")
            params["income_sources"] = json.dumps(budget.income_sources)
        
        if budget.categories is not None:
            updates.append("categories = CAST(:categories AS jsonb)")
            params["categories"] = json.dumps(budget.categories)
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields provided to update")
        
        updates.append("updated_at = CURRENT_TIMESTAMP")
        
        query = text(f"""
            UPDATE budgets.list
            SET {', '.join(updates)}
            WHERE budget_id = :budget_id
            RETURNING budget_id, name, currency, income_sources, categories, created_at, updated_at
        """)
        
        with engine.connect() as conn:
            # Check if budget exists
            check_query = text("SELECT budget_id FROM budgets.list WHERE budget_id = :budget_id")
            check_result = conn.execute(check_query, {"budget_id": budget_id}).fetchone()
            if not check_result:
                raise HTTPException(status_code=404, detail=f"Budget ID {budget_id} not found")
            
            result = conn.execute(query, params)
            conn.commit()
            row = result.fetchone()
            
            return BudgetResponse(
                budget_id=row[0],
                name=row[1],
                currency=row[2],
                income_sources=row[3] if row[3] else [],
                categories=row[4] if row[4] else [],
                created_at=str(row[5]),
                updated_at=str(row[6])
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{budget_id}")
async def delete_budget(budget_id: int):
    """Delete a budget."""
    try:
        query = text("DELETE FROM budgets.list WHERE budget_id = :budget_id RETURNING budget_id")
        
        with engine.connect() as conn:
            result = conn.execute(query, {"budget_id": budget_id})
            conn.commit()
            row = result.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail=f"Budget ID {budget_id} not found")
            
            return {"message": f"Budget {budget_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

