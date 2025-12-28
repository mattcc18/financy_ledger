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


def verify_token(token: str) -> dict:
    """
    Verify Supabase JWT token and return the payload.
    Supabase uses HS256 algorithm with the JWT secret.
    """
    try:
        # Get JWT secret
        if not SUPABASE_JWT_SECRET:
            raise ValueError("SUPABASE_JWT_SECRET must be set in environment variables")
        
        jwt_secret = SUPABASE_JWT_SECRET
        
        # First, decode without verification to see what algorithm is used
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg", "HS256")
        
        # Supabase uses HS256, but we'll try to use whatever algorithm is in the token
        # If it's not HS256, we might need to handle it differently
        try:
            # Try with HS256 first (most common for Supabase)
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_aud": False,  # Don't verify audience
                    "verify_iss": False  # Don't verify issuer
                }
            )
            return payload
        except jwt.InvalidAlgorithmError:
            # If HS256 fails, try with the algorithm from the token header
            # This handles cases where the token might use a different algorithm
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=[alg] if alg else ["HS256"],
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_aud": False,
                    "verify_iss": False
                }
            )
            return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidAlgorithmError as e:
        raise HTTPException(
            status_code=401, 
            detail=f"Invalid token algorithm: {str(e)}. Make sure SUPABASE_JWT_SECRET is correct."
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
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
    payload = verify_token(token)
    
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
        payload = verify_token(token)
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

