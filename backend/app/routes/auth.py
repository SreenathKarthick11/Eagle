from fastapi import APIRouter, HTTPException
from app.models import SignInRequest
from app.models import SignInResponse
# from app.core.security import create_access_token
# from app.db import get_connection
from app.db import db
import psycopg
router = APIRouter()

@router.post("/signin")
def signin(request: SignInRequest):
    try:
        db.signin_user(**request.model_dump())
        return SignInResponse(token = 'abc')
    except psycopg.Error as _:
        raise HTTPException(status_code=500, detail="Sign In failed")
    # try:
    #     with get_connection() as conn:
    #         with conn.cursor() as cur:
    #             cur.execute("SELECT * FROM signin_user(%s, %s)", (request.username, request.password))
    #             res = cur.fetchone()
    #             if not res:
    #                 raise HTTPException(status_code=401, detail="Invalid username or password")
    #             user_id = res["user_id"]
    #             role = res["role"]
                
    #             access_token = create_access_token(subject=user_id, role=role)
    #             return TokenResponse(access_token=access_token)
    # except Exception as e:
    #     if "invalid username or password" in str(e).lower():
    #         raise HTTPException(status_code=401, detail="Invalid username or password")
    #     raise HTTPException(status_code=500, detail=str(e))
