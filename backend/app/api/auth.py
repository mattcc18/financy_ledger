"""
Authentication API endpoints for Supabase Auth integration.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import httpx
import os
from app.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")


class SignUpRequest(BaseModel):
    email: str
    password: str


class SignInRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignUpRequest):
    """
    Sign up a new user via Supabase Auth.
    Note: If email confirmation is required, user will need to verify email before signing in.
    """
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase configuration missing. Set SUPABASE_URL and SUPABASE_ANON_KEY"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/auth/v1/signup",
                json={
                    "email": request.email,
                    "password": request.password
                },
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Content-Type": "application/json",
                    "X-Client-Info": "finance-dashboard"
                }
            )
            
            if response.status_code not in [200, 201]:
                error_data = response.json() if response.content else {}
                error_msg = error_data.get("message") or error_data.get("error_description") or error_data.get("error") or "Signup failed"
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_msg
                )
            
            data = response.json()
            
            # If email confirmation is required, access_token might be None
            # In that case, we still return success but user needs to verify email
            access_token = data.get("access_token")
            if not access_token:
                # User created but needs to verify email
                return AuthResponse(
                    access_token="",  # Empty token - user needs to verify email
                    token_type="bearer",
                    user=data.get("user", {})
                )
            
            return AuthResponse(
                access_token=access_token,
                token_type="bearer",
                user=data.get("user", {})
            )
    except HTTPException:
        raise
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to Supabase: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signup error: {str(e)}")


@router.post("/signin", response_model=AuthResponse)
async def signin(request: SignInRequest):
    """
    Sign in an existing user via Supabase Auth.
    """
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase configuration missing. Set SUPABASE_URL and SUPABASE_ANON_KEY"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            # Use the correct Supabase auth endpoint
            response = await client.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
                json={
                    "email": request.email,
                    "password": request.password
                },
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Content-Type": "application/json",
                    "X-Client-Info": "finance-dashboard"
                }
            )
            
            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                error_msg = error_data.get("error_description") or error_data.get("message") or error_data.get("error") or "Invalid email or password"
                
                # Check for email verification error
                if "email" in error_msg.lower() and ("confirm" in error_msg.lower() or "verify" in error_msg.lower()):
                    raise HTTPException(
                        status_code=401,
                        detail="Please verify your email address before signing in. Check your inbox for a verification email."
                    )
                
                raise HTTPException(
                    status_code=401,
                    detail=error_msg
                )
            
            data = response.json()
            
            return AuthResponse(
                access_token=data.get("access_token", ""),
                token_type="bearer",
                user=data.get("user", {})
            )
    except HTTPException:
        raise
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to Supabase: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")


@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Get current user information.
    """
    return {
        "user_id": current_user["user_id"],
        "email": current_user.get("email")
    }

