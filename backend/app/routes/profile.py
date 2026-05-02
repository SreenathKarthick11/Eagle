from fastapi import APIRouter, Depends, HTTPException
from app.models import ProfileResponse, ChangePasswordRequest, UpdateProfileRequest
from app.deps import get_current_user, CurrentUser
from app.db import get_connection

router = APIRouter()

@router.get("", response_model=ProfileResponse)
def get_profile(current_user: CurrentUser = Depends(get_current_user)):
    with get_connection() as conn:
        with conn.cursor() as cur:
            # We fetch from user_profile view, but it doesn't have email/phone, so we join with user_info
            cur.execute("""
                SELECT up.user_id, up.name, up.username, up.active_role, ui.email_id, ui.phone_no
                FROM user_profile up
                JOIN user_info ui ON ui.user_id = up.user_id
                WHERE up.user_id = %s
            """, (current_user.user_id,))
            res = cur.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="User not found")
            return ProfileResponse(**res)

@router.put("/change-password")
def change_password(request: ChangePasswordRequest, current_user: CurrentUser = Depends(get_current_user)):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE user_info
                SET password = %s
                WHERE user_id = %s AND password = %s
            """, (request.new_password, current_user.user_id, request.current_password))
            if cur.rowcount == 0:
                raise HTTPException(status_code=400, detail="Invalid current password")
            conn.commit()
            return {"success": True}

@router.put("/save")
def save_profile(request: UpdateProfileRequest, current_user: CurrentUser = Depends(get_current_user)):
    with get_connection() as conn:
        with conn.cursor() as cur:
            updates = []
            params = []
            if request.name is not None:
                updates.append("name = %s")
                params.append(request.name)
            if request.phone_number is not None:
                updates.append("phone_no = %s")
                params.append(request.phone_number)
            
            if not updates:
                return {"success": True}
                
            params.append(current_user.user_id)
            query = f"UPDATE user_info SET {', '.join(updates)} WHERE user_id = %s"
            try:
                cur.execute(query, tuple(params))
                conn.commit()
                return {"success": True}
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))
