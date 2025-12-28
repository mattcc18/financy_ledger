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
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", "Signup failed")
                )
            
            data = response.json()
            
            return AuthResponse(
                access_token=data.get("access_token", ""),
                token_type="bearer",
                user=data.get("user", {})
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to Supabase: {str(e)}")


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
            response = await client.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
                json={
                    "email": request.email,
                    "password": request.password
                },
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                raise HTTPException(
                    status_code=401,
                    detail=error_data.get("error_description", "Invalid email or password")
                )
            
            data = response.json()
            
            return AuthResponse(
                access_token=data.get("access_token", ""),
                token_type="bearer",
                user=data.get("user", {})
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to Supabase: {str(e)}")


@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Get current user information.
    """
    return {
        "user_id": current_user["user_id"],
        "email": current_user.get("email")
    }

