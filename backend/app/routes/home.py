from fastapi import APIRouter
from app.models import HomeGetResponse, HomePostRequest, HomePostResponse
from app.db import get_connection

router = APIRouter()

@router.get("", response_model=HomeGetResponse)
def get_home_data():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT location_id, name FROM location")
            locations = cur.fetchall()
            
            cur.execute("SELECT venue_id, name FROM venue")
            venues = cur.fetchall()
            
            cur.execute("SELECT tag_name FROM tag")
            tags = cur.fetchall()
            
            return HomeGetResponse(
                location_list=locations,
                venue_list=venues,
                tag_list=tags
            )

@router.post("", response_model=HomePostResponse)
def search_events_endpoint(request: HomePostRequest):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT event_id, event_name 
                FROM search_events(
                    p_campus_name := %s,
                    p_venue_name := %s,
                    p_location_name := %s,
                    p_organizer_username := %s,
                    p_start_after := %s,
                    p_finish_before := %s,
                    p_tags := %s,
                    p_require_all_tags := %s,
                    p_is_full := %s,
                    p_title_substring := %s,
                    p_description_substring := %s
                )
            """, (
                request.campus_name, request.venue_name, request.location_name, request.organizer_username,
                request.start_after, request.finish_before, request.tags, request.require_all_tags,
                request.is_full, request.title_substring, request.description_substring
            ))
            events = cur.fetchall()
            return HomePostResponse(event_list=events)
