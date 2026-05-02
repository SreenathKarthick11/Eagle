from fastapi import APIRouter, Depends, HTTPException
from app.models import EventDetail, CreateEventRequest, UpdateEventTextRequest
from app.deps import get_current_user, CurrentUser
from app.db import get_connection

router = APIRouter()

@router.get("/{event_id}", response_model=EventDetail)
def get_event(event_id: int):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT * FROM event_full_details WHERE event_id = %s
            """, (event_id,))
            event = cur.fetchone()
            if not event:
                raise HTTPException(status_code=404, detail="Event not found")
            
            cur.execute("SELECT tag_name FROM tagged_with WHERE event_id = %s", (event_id,))
            tags = [row["tag_name"] for row in cur.fetchall()]
            
            cur.execute("""
                SELECT u.username 
                FROM editor_of eo
                JOIN user_info u ON u.user_id = eo.editor_id
                WHERE eo.event_id = %s
            """, (event_id,))
            editors = [row["username"] for row in cur.fetchall()]
            
            organizer_list = [event["primary_organizer"]] + (event["secondary_organizers"] or [])
            
            return EventDetail(
                name=event["event_name"],
                start_time=event["start_time"],
                end_time=event["finish_time"],
                description=event["description"],
                capacity=event["capacity"],
                venue=event["venue_name"],
                location=event["location_name"],
                campus=event["campus_name"],
                organizer_list=organizer_list,
                editor_list=editors,
                event_tags=tags
            )

@router.put("/{event_id}", response_model=EventDetail)
def update_event(event_id: int, request: UpdateEventTextRequest, current_user: CurrentUser = Depends(get_current_user)):
    with get_connection() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute("SELECT edit_event_text_fields(%s, %s, %s, %s)", 
                            (current_user.user_id, event_id, request.name, request.description))
                conn.commit()
            except Exception as e:
                conn.rollback()
                raise HTTPException(status_code=400, detail=str(e))
    
    return get_event(event_id)

@router.post("/create")
def create_event(request: CreateEventRequest, current_user: CurrentUser = Depends(get_current_user)):
    with get_connection() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute("""
                    SELECT create_event(
                        p_organizer_id := %s,
                        p_name := %s,
                        p_start_time := %s,
                        p_finish_time := %s,
                        p_venue_id := %s,
                        p_description := %s,
                        p_capacity := %s
                    )
                """, (
                    current_user.user_id, request.name, request.start_time, request.end_time,
                    request.venue_id, request.description, request.capacity
                ))
                event_id = cur.fetchone()["create_event"]
                
                # Add secondary organizers
                for org_id in request.secondary_organizers:
                    cur.execute("INSERT INTO secondary_organizers (event_id, organizer_id) VALUES (%s, %s)", (event_id, org_id))
                    
                # Add editors
                for editor_id in request.editor_list:
                    cur.execute("SELECT add_editor_to_event(%s, %s, %s)", (current_user.user_id, event_id, editor_id))
                    
                # Add tags
                for tag in request.event_tags:
                    cur.execute("SELECT add_tag_to_event(%s, %s, %s)", (current_user.user_id, event_id, tag))
                
                conn.commit()
                return {"success": True, "event_id": event_id}
            except Exception as e:
                conn.rollback()
                raise HTTPException(status_code=400, detail=str(e))
