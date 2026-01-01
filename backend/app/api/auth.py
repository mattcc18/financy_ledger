"""
Authentication API endpoints for user signup, signin, and password reset.
"""
import os
import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.auth import get_current_user

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    user: dict


class User(BaseModel):
    user_id: str
    email: str | None = None


class ResetPasswordRequest(BaseModel):
    email: EmailStr


class ConfirmResetPasswordRequest(BaseModel):
    token: str
    new_password: str


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
                    "Content-Type": "application/json",
                    "X-Client-Info": "finance-dashboard"
                }
            )

            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                error_msg = error_data.get("error_description") or error_data.get("message") or error_data.get("error") or "Signup failed"
                
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_msg
                )

            data = response.json()

            return AuthResponse(
                access_token=data.get("access_token", ""),
                refresh_token=data.get("refresh_token"),
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
                refresh_token=data.get("refresh_token"),
                token_type="bearer",
                user=data.get("user", {})
            )
    except HTTPException:
        raise
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to Supabase: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")


@router.get("/me", response_model=User)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Get the current authenticated user's information.
    """
    return User(
        user_id=current_user["user_id"],
        email=current_user.get("email")
    )


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """
    Request a password reset email.
    """
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase configuration missing. Set SUPABASE_URL and SUPABASE_ANON_KEY"
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/auth/v1/recover",
                json={
                    "email": request.email
                },
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Content-Type": "application/json"
                }
            )

            if response.status_code not in [200, 201]:
                error_data = response.json() if response.content else {}
                error_msg = error_data.get("error_description") or error_data.get("message") or "Failed to send reset email"
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_msg
                )

            return {"message": "Password reset email sent"}
    except HTTPException:
        raise
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to Supabase: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Password reset error: {str(e)}")


@router.post("/reset-password/confirm")
async def confirm_reset_password(request: ConfirmResetPasswordRequest):
    """
    Confirm password reset with token and new password.
    """
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase configuration missing. Set SUPABASE_URL and SUPABASE_ANON_KEY"
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/auth/v1/user",
                json={
                    "password": request.new_password
                },
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {request.token}",
                    "Content-Type": "application/json"
                }
            )

            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                error_msg = error_data.get("error_description") or error_data.get("message") or "Failed to reset password"
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_msg
                )

            data = response.json()

            return {
                "message": "Password reset successfully",
                "access_token": data.get("access_token", ""),
                "user": data.get("user", {})
            }
    except HTTPException:
        raise
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to Supabase: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Password reset error: {str(e)}")


@router.post("/refresh")
async def refresh_token(request: dict):
    """
    Refresh access token using refresh token.
    """
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase configuration missing. Set SUPABASE_URL and SUPABASE_ANON_KEY"
        )

    refresh_token_value = request.get("refresh_token")
    if not refresh_token_value:
        raise HTTPException(status_code=400, detail="refresh_token is required")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token",
                json={
                    "refresh_token": refresh_token_value
                },
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Content-Type": "application/json"
                }
            )

            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                error_msg = error_data.get("error_description") or error_data.get("message") or "Token refresh failed"
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_msg
                )

            data = response.json()

            return {
                "access_token": data.get("access_token", ""),
                "refresh_token": data.get("refresh_token"),
                "token_type": "bearer"
            }
    except HTTPException:
        raise
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to Supabase: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token refresh error: {str(e)}")

