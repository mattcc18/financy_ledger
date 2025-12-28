from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from app.db.database import engine
from app.models.schemas import TripResponse, TripCreateRequest, TripUpdateRequest
from typing import Optional
from datetime import date

router = APIRouter(prefix="/api/trips", tags=["trips"])


@router.get("", response_model=list[TripResponse])
async def get_all_trips():
    """Get all trips."""
    try:
        query = text("""
            SELECT trip_id, trip_name, start_date, end_date, location, description, created_at, updated_at
            FROM trips.list
            ORDER BY start_date DESC NULLS LAST, trip_name
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query)
            trips = []
            for row in result:
                trips.append(TripResponse(
                    trip_id=row[0],
                    trip_name=row[1],
                    start_date=row[2],
                    end_date=row[3],
                    location=row[4],
                    description=row[5],
                    created_at=str(row[6]) if row[6] else "",
                    updated_at=str(row[7]) if row[7] else ""
                ))
            return trips
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(trip_id: int):
    """Get a specific trip by ID."""
    try:
        query = text("""
            SELECT trip_id, trip_name, start_date, end_date, location, description, created_at, updated_at
            FROM trips.list
            WHERE trip_id = :trip_id
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, {"trip_id": trip_id})
            row = result.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail=f"Trip ID {trip_id} not found")
            
            return TripResponse(
                trip_id=row[0],
                trip_name=row[1],
                start_date=row[2],
                end_date=row[3],
                location=row[4],
                description=row[5],
                created_at=str(row[6]) if row[6] else "",
                updated_at=str(row[7]) if row[7] else ""
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=TripResponse)
async def create_trip(trip: TripCreateRequest):
    """Create a new trip."""
    try:
        query = text("""
            INSERT INTO trips.list (trip_name, start_date, end_date, location, description)
            VALUES (:trip_name, :start_date, :end_date, :location, :description)
            RETURNING trip_id, trip_name, start_date, end_date, location, description, created_at, updated_at
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, {
                "trip_name": trip.trip_name,
                "start_date": trip.start_date,
                "end_date": trip.end_date,
                "location": trip.location,
                "description": trip.description
            })
            conn.commit()
            row = result.fetchone()
            
            return TripResponse(
                trip_id=row[0],
                trip_name=row[1],
                start_date=row[2],
                end_date=row[3],
                location=row[4],
                description=row[5],
                created_at=str(row[6]) if row[6] else "",
                updated_at=str(row[7]) if row[7] else ""
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(trip_id: int, trip: TripUpdateRequest):
    """Update an existing trip."""
    try:
        # Build update query dynamically based on provided fields
        updates = []
        params = {"trip_id": trip_id}
        
        if trip.trip_name is not None:
            updates.append("trip_name = :trip_name")
            params["trip_name"] = trip.trip_name
        if trip.start_date is not None:
            updates.append("start_date = :start_date")
            params["start_date"] = trip.start_date
        if trip.end_date is not None:
            updates.append("end_date = :end_date")
            params["end_date"] = trip.end_date
        if trip.location is not None:
            updates.append("location = :location")
            params["location"] = trip.location
        if trip.description is not None:
            updates.append("description = :description")
            params["description"] = trip.description
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        updates.append("updated_at = CURRENT_TIMESTAMP")
        
        query = text(f"""
            UPDATE trips.list
            SET {', '.join(updates)}
            WHERE trip_id = :trip_id
            RETURNING trip_id, trip_name, start_date, end_date, location, description, created_at, updated_at
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, params)
            row = result.fetchone()
            conn.commit()
            
            if not row:
                raise HTTPException(status_code=404, detail=f"Trip ID {trip_id} not found")
            
            return TripResponse(
                trip_id=row[0],
                trip_name=row[1],
                start_date=row[2],
                end_date=row[3],
                location=row[4],
                description=row[5],
                created_at=str(row[6]) if row[6] else "",
                updated_at=str(row[7]) if row[7] else ""
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{trip_id}")
async def delete_trip(trip_id: int):
    """Delete a trip. Expenses linked to this trip will have trip_id set to NULL."""
    try:
        query = text("DELETE FROM trips.list WHERE trip_id = :trip_id RETURNING trip_id")
        
        with engine.connect() as conn:
            result = conn.execute(query, {"trip_id": trip_id})
            row = result.fetchone()
            conn.commit()
            
            if not row:
                raise HTTPException(status_code=404, detail=f"Trip ID {trip_id} not found")
            
            return {"message": f"Trip ID {trip_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{trip_id}/expenses")
async def get_trip_expenses(trip_id: int):
    """Get all expense transactions for a specific trip (from unified transactions.ledger)."""
    try:
        # First check if trip exists
        check_trip = text("SELECT trip_id FROM trips.list WHERE trip_id = :trip_id")
        
        with engine.connect() as conn:
            trip_result = conn.execute(check_trip, {"trip_id": trip_id}).fetchone()
            if not trip_result:
                raise HTTPException(status_code=404, detail=f"Trip ID {trip_id} not found")
            
            # Get expense transactions for this trip from transactions.ledger
            query = text("""
                SELECT transaction_id, account_id, amount, transaction_type, category, 
                       transaction_date, description, merchant, trip_id, created_at, updated_at
                FROM transactions.ledger
                WHERE trip_id = :trip_id 
                  AND transaction_type = 'expense'
                ORDER BY transaction_date DESC, transaction_id DESC
            """)
            
            result = conn.execute(query, {"trip_id": trip_id})
            expenses = []
            for row in result:
                # Get account currency for display
                account_query = text("SELECT currency_code FROM accounts.list WHERE account_id = :account_id")
                account_result = conn.execute(account_query, {"account_id": row[1]}).fetchone()
                currency_code = account_result[0] if account_result else 'EUR'
                
                expenses.append({
                    "transaction_id": row[0],
                    "account_id": row[1],
                    "amount": float(row[2]),
                    "transaction_type": row[3],
                    "category": row[4],
                    "transaction_date": str(row[5]),
                    "description": row[6],
                    "merchant": row[7],
                    "currency_code": currency_code,
                    "trip_id": row[8],
                    "created_at": str(row[9]) if row[9] else "",
                    "updated_at": str(row[10]) if row[10] else ""
                })
            
            return {"trip_id": trip_id, "expenses": expenses, "count": len(expenses)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

