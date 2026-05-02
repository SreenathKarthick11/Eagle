from fastapi import APIRouter, Depends, HTTPException
from app.models import BlacklistAddVisitorRequest
from app.deps import get_current_user, CurrentUser
from app.db import get_connection

router = APIRouter()

@router.get("")
def get_organizer_events(current_user: CurrentUser = Depends(get_current_user)):
    # Returns events organized by the organizer
    if current_user.role not in ["organizer", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT event_id, name as event_name 
                FROM event 
                WHERE organizer_id = %s
            """, (current_user.user_id,))
            events = cur.fetchall()
            return {"events": events}

@router.get("/{event_id}")
def get_event_visitors(event_id: int, current_user: CurrentUser = Depends(get_current_user)):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM get_event_participants(%s, %s)", (current_user.user_id, event_id))
            participants = cur.fetchall()
            return {"participants": participants}

@router.post("/{event_id}")
def blacklist_visitor_in_event(event_id: int, request: BlacklistAddVisitorRequest, current_user: CurrentUser = Depends(get_current_user)):
    with get_connection() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute("SELECT blacklist_visitor(%s, %s, %s)", (current_user.user_id, request.visitor_id, event_id))
                new_strike_count = cur.fetchone()["blacklist_visitor"]
                conn.commit()
                return {"success": True, "new_strike_count": new_strike_count}
            except Exception as e:
                conn.rollback()
                raise HTTPException(status_code=400, detail=str(e))
