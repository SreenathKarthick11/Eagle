from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Auth
class SignInRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ProfileResponse(BaseModel):
    user_id: int
    name: str
    username: str
    active_role: str
    # These are not in user_profile view directly, but we can fetch them from user_info
    email_id: Optional[str] = None
    phone_no: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None

# Event
class EventListItem(BaseModel):
    event_name: str
    event_id: int

class EventDetail(BaseModel):
    name: str
    start_time: datetime
    end_time: datetime
    description: Optional[str]
    capacity: Optional[int]
    venue: str
    location: str
    campus: str
    organizer_list: List[str]
    editor_list: List[str]
    event_tags: List[str]

class CreateEventRequest(BaseModel):
    name: str
    start_time: datetime
    end_time: datetime
    description: Optional[str] = None
    capacity: Optional[int] = None
    venue_id: int
    # Note: frontend mentions location_id, campus_id, but the DB just needs venue_id.
    # We will ignore location_id and campus_id in DB insertion or validate them.
    # primary_organizer_id: not needed, token has it.
    secondary_organizers: List[int] = []
    editor_list: List[int] = []
    event_tags: List[str] = []

class UpdateEventTextRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

# Home
class LocationItem(BaseModel):
    location_id: int
    name: str

class VenueItem(BaseModel):
    venue_id: int
    name: str

class TagItem(BaseModel):
    tag_name: str

class HomeGetResponse(BaseModel):
    location_list: List[LocationItem]
    venue_list: List[VenueItem]
    tag_list: List[TagItem]

class HomePostRequest(BaseModel):
    campus_name: Optional[str] = None
    venue_name: Optional[str] = None
    location_name: Optional[str] = None
    organizer_username: Optional[str] = None
    start_after: Optional[datetime] = None
    finish_before: Optional[datetime] = None
    tags: Optional[List[str]] = None
    require_all_tags: bool = False
    is_full: Optional[bool] = None
    title_substring: Optional[str] = None
    description_substring: Optional[str] = None

class HomePostResponse(BaseModel):
    event_list: List[EventListItem]

class BlacklistAddVisitorRequest(BaseModel):
    visitor_id: int

