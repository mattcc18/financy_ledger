from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import text
from app.db.database import engine
from app.models.schemas import GoalResponse, GoalCreateRequest, GoalUpdateRequest
from app.auth import get_current_user

router = APIRouter(prefix="/api/goals", tags=["goals"])


@router.get("", response_model=list[GoalResponse])
async def get_all_goals(current_user: dict = Depends(get_current_user)):
    """Get all goals for the authenticated user."""
    try:
        query = text("""
            SELECT goal_id, name, goal_type, target_amount, current_amount, currency, 
                   target_date, description, icon, created_at, updated_at
            FROM goals.list
            WHERE user_id = :user_id
            ORDER BY created_at DESC
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, {"user_id": current_user["user_id"]})
            goals = []
            for row in result:
                goals.append(GoalResponse(
                    goal_id=row[0],
                    name=row[1],
                    goal_type=row[2],
                    target_amount=float(row[3]),
                    current_amount=float(row[4]),
                    currency=row[5],
                    target_date=row[6],
                    description=row[7],
                    icon=row[8],
                    created_at=str(row[9]),
                    updated_at=str(row[10])
                ))
            return goals
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(goal_id: int, current_user: dict = Depends(get_current_user)):
    """Get a specific goal by ID (only if owned by current user)."""
    try:
        query = text("""
            SELECT goal_id, name, goal_type, target_amount, current_amount, currency, 
                   target_date, description, icon, created_at, updated_at
            FROM goals.list
            WHERE goal_id = :goal_id AND user_id = :user_id
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, {"goal_id": goal_id, "user_id": current_user["user_id"]})
            row = result.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail=f"Goal ID {goal_id} not found")
            
            return GoalResponse(
                goal_id=row[0],
                name=row[1],
                goal_type=row[2],
                target_amount=float(row[3]),
                current_amount=float(row[4]),
                currency=row[5],
                target_date=row[6],
                description=row[7],
                icon=row[8],
                created_at=str(row[9]),
                updated_at=str(row[10])
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=GoalResponse)
async def create_goal(goal: GoalCreateRequest, current_user: dict = Depends(get_current_user)):
    """Create a new goal for the authenticated user."""
    try:
        query = text("""
            INSERT INTO goals.list (name, goal_type, target_amount, current_amount, currency, target_date, description, icon, user_id)
            VALUES (:name, :goal_type, :target_amount, :current_amount, :currency, :target_date, :description, :icon, :user_id)
            RETURNING goal_id, name, goal_type, target_amount, current_amount, currency, 
                      target_date, description, icon, created_at, updated_at
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, {
                "name": goal.name,
                "goal_type": goal.goal_type,
                "target_amount": goal.target_amount,
                "current_amount": goal.current_amount,
                "currency": goal.currency.upper(),
                "target_date": goal.target_date,
                "description": goal.description,
                "icon": goal.icon,
                "user_id": current_user["user_id"]
            })
            conn.commit()
            row = result.fetchone()
            
            return GoalResponse(
                goal_id=row[0],
                name=row[1],
                goal_type=row[2],
                target_amount=float(row[3]),
                current_amount=float(row[4]),
                currency=row[5],
                target_date=row[6],
                description=row[7],
                icon=row[8],
                created_at=str(row[9]),
                updated_at=str(row[10])
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(goal_id: int, goal: GoalUpdateRequest, current_user: dict = Depends(get_current_user)):
    """Update an existing goal (only if owned by current user)."""
    try:
        # Build update query dynamically based on provided fields
        updates = []
        params = {"goal_id": goal_id, "user_id": current_user["user_id"]}
        
        if goal.name is not None:
            updates.append("name = :name")
            params["name"] = goal.name
        
        if goal.goal_type is not None:
            updates.append("goal_type = :goal_type")
            params["goal_type"] = goal.goal_type
        
        if goal.target_amount is not None:
            updates.append("target_amount = :target_amount")
            params["target_amount"] = goal.target_amount
        
        if goal.current_amount is not None:
            updates.append("current_amount = :current_amount")
            params["current_amount"] = goal.current_amount
        
        if goal.currency is not None:
            updates.append("currency = :currency")
            params["currency"] = goal.currency.upper()
        
        if goal.target_date is not None:
            updates.append("target_date = :target_date")
            params["target_date"] = goal.target_date
        
        if goal.description is not None:
            updates.append("description = :description")
            params["description"] = goal.description
        
        if goal.icon is not None:
            updates.append("icon = :icon")
            params["icon"] = goal.icon
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields provided to update")
        
        updates.append("updated_at = CURRENT_TIMESTAMP")
        
        query = text(f"""
            UPDATE goals.list
            SET {', '.join(updates)}
            WHERE goal_id = :goal_id AND user_id = :user_id
            RETURNING goal_id, name, goal_type, target_amount, current_amount, currency, 
                      target_date, description, icon, created_at, updated_at
        """)
        
        with engine.connect() as conn:
            # Check if goal exists and belongs to user
            check_query = text("SELECT goal_id FROM goals.list WHERE goal_id = :goal_id AND user_id = :user_id")
            check_result = conn.execute(check_query, {"goal_id": goal_id, "user_id": current_user["user_id"]}).fetchone()
            if not check_result:
                raise HTTPException(status_code=404, detail=f"Goal ID {goal_id} not found or you don't have permission")
            
            result = conn.execute(query, params)
            conn.commit()
            row = result.fetchone()
            
            return GoalResponse(
                goal_id=row[0],
                name=row[1],
                goal_type=row[2],
                target_amount=float(row[3]),
                current_amount=float(row[4]),
                currency=row[5],
                target_date=row[6],
                description=row[7],
                icon=row[8],
                created_at=str(row[9]),
                updated_at=str(row[10])
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{goal_id}")
async def delete_goal(goal_id: int, current_user: dict = Depends(get_current_user)):
    """Delete a goal (only if owned by current user)."""
    try:
        query = text("DELETE FROM goals.list WHERE goal_id = :goal_id AND user_id = :user_id RETURNING goal_id")
        
        with engine.connect() as conn:
            result = conn.execute(query, {"goal_id": goal_id, "user_id": current_user["user_id"]})
            conn.commit()
            row = result.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail=f"Goal ID {goal_id} not found or you don't have permission")
            
            return {"message": f"Goal {goal_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



