from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from app.db.database import engine
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/categories", tags=["categories"])


class CategoryCreateRequest(BaseModel):
    category_name: str
    category_type: str  # 'expense' or 'income'


class CategoryResponse(BaseModel):
    category_id: int
    category_name: str
    category_type: str
    created_at: str
    updated_at: str


@router.get("", response_model=list[CategoryResponse])
async def get_categories(category_type: Optional[str] = None):
    """Get all categories, optionally filtered by type (expense or income)."""
    try:
        query = """
            SELECT category_id, category_name, category_type, created_at, updated_at
            FROM categories.list
        """
        params = {}
        
        if category_type:
            if category_type not in ['expense', 'income']:
                raise HTTPException(
                    status_code=400,
                    detail="category_type must be 'expense' or 'income'"
                )
            query += " WHERE category_type = :category_type"
            params["category_type"] = category_type
        
        query += " ORDER BY category_type, category_name"
        
        with engine.connect() as conn:
            result = conn.execute(text(query), params)
            categories = []
            for row in result:
                categories.append(CategoryResponse(
                    category_id=row[0],
                    category_name=row[1],
                    category_type=row[2],
                    created_at=str(row[3]) if row[3] else "",
                    updated_at=str(row[4]) if row[4] else ""
                ))
            return categories
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=CategoryResponse)
async def create_category(category: CategoryCreateRequest):
    """Create a new category."""
    try:
        # Validate category_type
        if category.category_type not in ['expense', 'income']:
            raise HTTPException(
                status_code=400,
                detail="category_type must be 'expense' or 'income'"
            )
        
        # Check if category already exists (case-insensitive)
        check_query = text("""
            SELECT category_id FROM categories.list 
            WHERE LOWER(category_name) = LOWER(:category_name)
        """)
        
        with engine.connect() as conn:
            existing = conn.execute(check_query, {"category_name": category.category_name}).fetchone()
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Category '{category.category_name}' already exists"
                )
            
            # Insert new category
            insert_query = text("""
                INSERT INTO categories.list (category_name, category_type)
                VALUES (:category_name, :category_type)
                RETURNING category_id, category_name, category_type, created_at, updated_at
            """)
            
            result = conn.execute(insert_query, {
                "category_name": category.category_name,
                "category_type": category.category_type
            })
            conn.commit()
            row = result.fetchone()
            
            return CategoryResponse(
                category_id=row[0],
                category_name=row[1],
                category_type=row[2],
                created_at=str(row[3]) if row[3] else "",
                updated_at=str(row[4]) if row[4] else ""
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/grouped", response_model=dict)
async def get_categories_grouped():
    """Get categories grouped by type (for backward compatibility with existing API)."""
    try:
        query = text("""
            SELECT category_name, category_type
            FROM categories.list
            ORDER BY category_type, category_name
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query)
            expense_categories = []
            income_categories = []
            
            for row in result:
                if row[1] == 'expense':
                    expense_categories.append(row[0])
                else:
                    income_categories.append(row[0])
            
            return {
                "expense_categories": expense_categories,
                "income_categories": income_categories
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


