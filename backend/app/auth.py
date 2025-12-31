"""
Authentication utilities for verifying Supabase JWT tokens.
"""
import os
import httpx
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

security = HTTPBearer()


async def verify_token(token: str) -> dict:
    """
    Verify Supabase JWT token by calling Supabase API.
    This works with both legacy HS256 tokens and new ES256 tokens.
    """
    try:
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {token}"
                }
            )
            
            if response.status_code != 200:
                if response.status_code == 401:
                    raise HTTPException(status_code=401, detail="Invalid or expired token")
                error_data = response.json() if response.content else {}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Token verification failed")
                )
            
            user_data = response.json()
            user_id = user_data.get("id")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token: no user ID")
            
            return {
                "sub": user_id,
                "email": user_data.get("email"),
                "user_metadata": user_data.get("user_metadata", {}),
                "app_metadata": user_data.get("app_metadata", {}),
                "raw_user": user_data
            }
    except HTTPException:
        raise
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify token with Supabase: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token verification error: {str(e)}")


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    FastAPI dependency to get the current authenticated user.
    Extracts and verifies the JWT token from the Authorization header.
    """
    token = credentials.credentials
    token_data = await verify_token(token)
    
    return {
        "user_id": token_data["sub"],
        "email": token_data.get("email"),
        "user_metadata": token_data.get("user_metadata", {}),
        "app_metadata": token_data.get("app_metadata", {})
    }

