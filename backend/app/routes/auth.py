from fastapi import APIRouter, HTTPException, Depends
from app.models import SignInRequest, TokenResponse
from app.core.security import create_access_token
from app.db import get_connection

router = APIRouter()

@router.post("/signin", response_model=TokenResponse)
def signin(request: SignInRequest):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM signin_user(%s, %s)", (request.username, request.password))
                res = cur.fetchone()
                if not res:
                    raise HTTPException(status_code=401, detail="Invalid username or password")
                user_id = res["user_id"]
                role = res["role"]
                
                access_token = create_access_token(subject=user_id, role=role)
                return TokenResponse(access_token=access_token)
    except Exception as e:
        if "invalid username or password" in str(e).lower():
            raise HTTPException(status_code=401, detail="Invalid username or password")
        raise HTTPException(status_code=500, detail=str(e))
