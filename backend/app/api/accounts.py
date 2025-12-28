from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from app.db.database import engine
from app.models.schemas import AccountResponse, AccountCreateRequest, AccountUpdateRequest

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


@router.get("", response_model=list[AccountResponse])
async def get_all_accounts():
    """Get all accounts."""
    try:
        query = text("SELECT account_id, account_name, account_type, institution, currency_code FROM accounts.list ORDER BY account_name")
        
        with engine.connect() as conn:
            result = conn.execute(query)
            accounts = []
            for row in result:
                accounts.append(AccountResponse(
                    account_id=row[0],
                    account_name=row[1],
                    account_type=row[2],
                    institution=row[3],
                    currency_code=row[4]
                ))
            return accounts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=AccountResponse)
async def create_account(account: AccountCreateRequest):
    """Create a new account."""
    try:
        query = text("""
            INSERT INTO accounts.list (account_name, account_type, institution, currency_code)
            VALUES (:account_name, :account_type, :institution, :currency_code)
            RETURNING account_id, account_name, account_type, institution, currency_code
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, {
                "account_name": account.account_name,
                "account_type": account.account_type,
                "institution": account.institution,
                "currency_code": account.currency_code.upper()
            })
            conn.commit()
            row = result.fetchone()
            
            return AccountResponse(
                account_id=row[0],
                account_name=row[1],
                account_type=row[2],
                institution=row[3],
                currency_code=row[4]
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(account_id: int, account: AccountUpdateRequest):
    """Update an existing account."""
    try:
        # Build dynamic update query
        updates = []
        params = {"account_id": account_id}
        
        if account.account_name is not None:
            updates.append("account_name = :account_name")
            params["account_name"] = account.account_name
        
        if account.account_type is not None:
            updates.append("account_type = :account_type")
            params["account_type"] = account.account_type
        
        if account.institution is not None:
            updates.append("institution = :institution")
            params["institution"] = account.institution
        
        if account.currency_code is not None:
            updates.append("currency_code = :currency_code")
            params["currency_code"] = account.currency_code.upper()
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        query = text(f"""
            UPDATE accounts.list
            SET {', '.join(updates)}
            WHERE account_id = :account_id
            RETURNING account_id, account_name, account_type, institution, currency_code
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, params)
            conn.commit()
            row = result.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail=f"Account with ID {account_id} not found")
            
            return AccountResponse(
                account_id=row[0],
                account_name=row[1],
                account_type=row[2],
                institution=row[3],
                currency_code=row[4]
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{account_id}")
async def delete_account(account_id: int):
    """Delete an account."""
    try:
        # Check if account exists
        check_query = text("SELECT account_id FROM accounts.list WHERE account_id = :account_id")
        
        with engine.connect() as conn:
            result = conn.execute(check_query, {"account_id": account_id})
            if not result.fetchone():
                raise HTTPException(status_code=404, detail=f"Account with ID {account_id} not found")
            
            # Delete the account (cascade will handle related transactions)
            delete_query = text("DELETE FROM accounts.list WHERE account_id = :account_id")
            conn.execute(delete_query, {"account_id": account_id})
            conn.commit()
            
            return {"message": f"Account {account_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

