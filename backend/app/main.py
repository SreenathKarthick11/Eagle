from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# from app.routes import auth, profile, events, home, blacklist
from app.models import (
    SignInRequest,
    SignInResponse,
    CampusItem,
    LocationItem,
    VenueItem,
    SearchEventsRequest,
    EventItem,
    ProfileDetails,
    UpdateProfile,
    SuccessResponse,
    IsRegistered,
    EventCatalog,
    EditEvent,
    CreateCampus,
    CreateLocation,
    CreateVenue,
    UserItem,
    CreateEvent,
)
import psycopg
from app.db import db
from fastapi import HTTPException
from typing import Any, Optional

# import jose
# from jose import jwe
secret_key = b"abc"
app = FastAPI(title="Eagle Event Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.include_router(auth.router, tags=["auth"])
# app.include_router(profile.router, prefix="/profile", tags=["profile"])
# app.include_router(events.router, prefix="/event", tags=["events"])
# app.include_router(home.router, prefix="/home", tags=["home"])
# app.include_router(blacklist.router, prefix="/black-list", tags=["blacklist"])


@app.get("/")
def read_root():
    return {"message": "Welcome to Eagle Event Management API"}


@app.post("/signin")
def signin(request: SignInRequest):
    try:
        result = db.signin_user(**request.model_dump())
        return SignInResponse(**result)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


# @app.get("/home")
# def gethome(request: None):
#     pass
#     # try:
#     #     result = db.search_events()
#     # except psycopg.Error as e:


@app.get("/campuses")
def get_campuses():
    try:
        result = db.get_campuses()
        result = list(map(lambda x: CampusItem(**x), result))
        return result
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/campuses")
def create_campus(request: CreateCampus, role: str= "postgres"):
    try:
        db.create_campus(**request.model_dump(), role=role)
        return SuccessResponse(success=True)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/campuses")
def delete_campus(campus_id: int, role: str = "postgres"):
    try:
        db.delete_campus(campus_id, role=role)
        return SuccessResponse(success=True)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/locations")
def get_locations(campus_id: Optional[int] = None):
    try:
        result = db.get_locations(campus_id)
        result = list(map(lambda x: LocationItem(**x), result))
        return result
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/locations")
def create_location(request: CreateLocation, role: Optional[str] = "postgres"):
    try:
        db.create_location(**request.model_dump(), role=role)
        return SuccessResponse(success=True)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/locations")
def delete_location(location_id: int, role: Optional[str] = "postgres"):
    try:
        db.delete_location(location_id, role=role)
        return SuccessResponse(success=True)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/venues")
def get_venues(location_id: Optional[int] = None):
    try:
        result = db.get_venues(location_id)
        result = list(map(lambda x: VenueItem(**x), result))
        return result
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/venues")
def create_venue(request: CreateVenue, role: Optional[str] = "postgres"):
    try:
        db.create_venue(**request.model_dump(), role=role)
        return SuccessResponse(success=True)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/venues")
def delete_venue(venue_id: int, role: Optional[str] = "postgres"):
    try:
        db.delete_venue(venue_id, role=role)
        return SuccessResponse(success=True)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tags")
def get_tags():
    try:
        result = db.get_tags()
        result = list(map(lambda x: x["tag_name"], result))
        return result
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search")
def search_events(request: SearchEventsRequest):
    try:
        print(request.model_dump())
        result = db.search_event_items(**request.model_dump())
        result = list(map(lambda x: EventItem(**x), result))
        return result
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/profile")
def get_profile(user_id: int):
    try:
        result = db.get_user_profile(user_id)
        print(result)
        return ProfileDetails(**result)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/profile")
def update_profile(request: UpdateProfile):
    try:
        _ = db.update_user_details(**request.model_dump())
        return SuccessResponse(success=True)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/event/{event_id}")
def event_details(event_id: int):
    try:
        result = db.get_event_details(event_id)
        return EventCatalog(**result)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/event/{event_id}")
def update_event_details(request: EditEvent, role: str = "postgres"):
    try:
        # print(request.model_dump())
        db.edit_event_details(**request.model_dump(), role=role)
        return SuccessResponse(success=True)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/event")
def create_event(request: CreateEvent):
    try:
        db.create_event(**request.model_dump())
        # result = list(map(lambda x: EventCatalog(**x), result))
        return SuccessResponse(success=True)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/event/{event_id}")
def delete_event(event_id: int, role="postgres"):
    try:
        # print(request.model_dump())
        db.delete_event(event_id=event_id, role=role)
        return SuccessResponse(success=True)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/is_user_registered")
def is_user_registered(user_id: int, event_id: int):
    try:
        result = db.is_user_regsitered(user_id, event_id)
        print("is user registered:", result)
        return SuccessResponse(success=result)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/event/{event_id}/register")
def register_for_event(user_id: int, event_id: int):
    try:
        db.register_for_event(user_id, event_id)
        return SuccessResponse(success=True)
    except psycopg.Error as e:
        # return SuccessResponse(success=False)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/event/{event_id}/withdraw")
def cancel_registration(user_id: int, event_id: int):
    try:
        db.cancel_registration(user_id, event_id)
        return SuccessResponse(success=True)
    except psycopg.Error as e:
        # return SuccessResponse(success=False)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/organizers")
def get_organizers():
    try:
        result = db.get_organizers()
        print("Organizers:", result)
        result = list(map(lambda x: UserItem(**x), result))
        return result
    except psycopg.Error as e:
        return HTTPException(status_code=500, detail=str(e))


@app.get("/visitors")
def get_visitors():
    try:
        result = db.get_visitors()
        result = list(map(lambda x: UserItem(**x), result))
        return result
    except psycopg.Error as e:
        return HTTPException(status_code=500, detail=str(e))


@app.get("/blacklists")
def get_blacklists():
    try:
        result = db.get_blacklists()
        result = list(map(lambda x: UserItem(**x), result))
        return result
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/promote_visitor_to_editor")
def promote_visitor_to_editor(user_id):
    try:
        db.promote_visitor_to_editor(user_id)
        return SuccessResponse(success=True)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/promote_visitor_to_organizer")
def promote_visitor_to_organizer(user_id):
    try:
        db.promote_visitor_to_organizer(user_id)
        return SuccessResponse(success=True)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/promote_visitor_to_admin")
def promote_visitor_to_admin(user_id):
    try:
        db.promote_visitor_to_admin(user_id)
        return SuccessResponse(success=True)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/promote_organizer_to_admin")
def promote_organizer_to_admin(user_id):
    try:
        db.promote_organizer_to_admin(user_id)
        return SuccessResponse(success=True)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/events")
def get_events_by_organizer(organizer_id: Optional[int] = None):
    try:
        result = db.get_events_of_organizer(organizer_id)
        result = list(map(lambda x: EventItem(**x), result))
        return result
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/event_participants")
def event_participants(event_id):
    try:
        result = db.get_event_participants(event_id)
        result = list(
            map(
                lambda x: UserItem(user_id=x["visitor_id"], username=x["username"]),
                result,
            )
        )
        return result
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/blacklist/{event_id}")
def blacklist_user(user_id: int, visitor_id: int, event_id: int):
    try:
        db.blacklist_visitor(user_id, visitor_id, event_id)
        return SuccessResponse(success=True)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    # try:
    #     pass
    # except psycopg.Error as e:
    #     raise HTTPException(status_code=500,detail=str(e))


# @app.post("/home")
# def search_events(request: )
