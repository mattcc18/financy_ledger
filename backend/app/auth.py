"""
Authentication module for Supabase Auth integration.
"""
import os
import jwt
from typing import Optional
from fastapi import HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# Security scheme
security = HTTPBearer(auto_error=False)


async def get_supabase_jwt_secret() -> str:
    """
    Get JWT secret from Supabase.
    If SUPABASE_JWT_SECRET is set, use it. Otherwise, fetch from Supabase.
    """
    if SUPABASE_JWT_SECRET:
        return SUPABASE_JWT_SECRET
    
    if not SUPABASE_URL:
        raise ValueError("SUPABASE_URL must be set if SUPABASE_JWT_SECRET is not provided")
    
    # Try to get JWT secret from Supabase (this is a fallback)
    # In production, you should set SUPABASE_JWT_SECRET as an environment variable
    # You can find it in Supabase Dashboard -> Settings -> API -> JWT Secret
    raise ValueError(
        "SUPABASE_JWT_SECRET must be set. "
        "Get it from Supabase Dashboard -> Settings -> API -> JWT Secret"
    )


async def verify_token(token: str) -> dict:
    """
    Verify Supabase JWT token by calling Supabase API.
    This works with both legacy HS256 tokens and new ES256 tokens.
    """
    try:
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set")
        
        # Verify token by calling Supabase's user endpoint
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
            
            # Extract user ID from the user data
            user_id = user_data.get("id")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token: no user ID")
            
            # Return a payload-like structure for compatibility
            return {
                "sub": user_id,
                "email": user_data.get("email"),
                "user_metadata": user_data.get("user_metadata", {}),
                "app_metadata": user_data.get("app_metadata", {}),
                "raw_user": user_data  # Include full user data
            }
    except HTTPException:
        raise
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify token with Supabase: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token verification error: {str(e)}")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    Dependency to get the current authenticated user from JWT token.
    Returns the user payload from the JWT token.
    """
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = await verify_token(token)
    
    # Extract user ID from payload
    user_id = payload.get("sub")  # Supabase uses "sub" for user ID
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: no user ID")
    
    return {
        "user_id": user_id,
        "email": payload.get("email"),
        "payload": payload
    }


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[dict]:
    """
    Optional authentication - returns user if token is valid, None otherwise.
    Useful for endpoints that work with or without authentication.
    """
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        payload = await verify_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "payload": payload
        }
    except HTTPException:
        return None

