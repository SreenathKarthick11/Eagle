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
)
import psycopg
from app.db import db
from fastapi import HTTPException
from typing import Optional

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
        # print(result)
        # print(type(result))
        # return SignInResponse(**{"user_id": 1, "role": "dummy"})
        return SignInResponse(**result)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/home")
def gethome(request: None):
    pass
    # try:
    #     result = db.search_events()
    # except psycopg.Error as e:


@app.get("/campuses")
def get_campuses():
    try:
        result = db.get_campuses()
        result = list(map(lambda x: CampusItem(**x), result))
        return result
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


@app.get("/venues")
def get_venues(location_id: Optional[int] = None):
    try:
        result = db.get_venues(location_id)
        result = list(map(lambda x: VenueItem(**x), result))
        return result
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
        result = db.get_profile_details(user_id)
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
def update_event_details(request: EditEvent):
    try:
        # print(request.model_dump())
        db.edit_event_details(**request.model_dump())
        return SuccessResponse(success=True)
    except psycopg.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/is_user_registered")
def is_user_registered(user_id: int, event_id: int):
    try:
        result = db.is_user_regsitered(user_id, event_id)
        # print(result)
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



    # try:
    #     pass
    # except psycopg.Error as e:
    #     raise HTTPException(status_code=500,detail=str(e))


# @app.post("/home")
# def search_events(request: )
