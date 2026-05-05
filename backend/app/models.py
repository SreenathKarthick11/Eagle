from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# Auth
# /signin
class SignInRequest(BaseModel):
    username: str
    password: str


class SignInResponse(BaseModel):
    user_id: int
    role: str
    # access_token: str
    """Check this model again"""


class SignUpRequest(BaseModel):
    name: str
    username: str
    email: str
    password: str
    phone: str


class SuccessResponse(BaseModel):
    success: bool


class ProfileDetails(BaseModel):
    user_id: int
    username: str
    name: str
    email_id: str
    phone_no: str
    active_role: str
    blacklist_count: int
    last_blacklisted_at: Optional[datetime] = None


class UpdateProfile(BaseModel):
    user_id: int
    name: str
    phone_no: str
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class IsRegistered(BaseModel):
    user_id: int
    event_id: int


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None


# Update Profile Response will be the Success response

# Home Page


# GET /home without any request body, to get the the following response
# class GetHomeEventFiltersResponse(BaseModel):
#     campus_ids: List[int]
#     campus_names: List[str]
#     location_ids: List[int]
#     location_names: List[str]
#     venue_ids: List[int]
#     venue_names: List[str]
#     organizer_usernames: List[str]
#     tags: List[str]


# POST /home with the following request body to get response in the fomat PostSearchEventsResponse
class SearchEventsRequest(BaseModel):
    campus_name: Optional[str] = None
    venue_name: Optional[str] = None
    location_name: Optional[str] = None
    organizer_username: Optional[str] = None
    start_after: Optional[datetime] = None
    finish_before: Optional[datetime] = None
    tags: Optional[List[str]] = None
    require_all_tags: Optional[bool] = False
    is_full: Optional[bool] = None
    title_substring: Optional[str] = None
    description_substring: Optional[str] = None


# class SearchEventDetail(BaseModel):
#     event_id: int
#     title: str
#     organizer_name: str


# class PostSearchEventsResponse(BaseModel):
#     items: List[SearchEventDetail]


# Event
# class EventListItem(BaseModel):
#     event_name: str
#     event_id: int








class EventCatalog(BaseModel):
    event_id: int
    event_name: str
    start_time: datetime
    finish_time: datetime
    description: Optional[str]
    capacity: Optional[int]
    venue_name: str
    location_name: str
    campus_name: str
    primary_organizer: str
    secondary_organizers: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    registered_count: int
    is_full: bool


class EditEvent(BaseModel):
    user_id: int
    event_id: int
    name: Optional[str] = None
    description: Optional[str] = None


# # PUT /event/{event_id}, to modify the details of an event
# class EditEventFields(BaseModel):
#     # For now ignoring the adding tags thing
#     title: str
#     description: str


# Admin


class UserItem(BaseModel):
    user_id: int
    username: str


class CampusItem(BaseModel):
    campus_id: int
    campus_name: str


class LocationItem(BaseModel):
    location_id: int
    location_name: str


class VenueItem(BaseModel):
    venue_id: int
    venue_name: str


class EventItem(BaseModel):
    event_id: int
    event_name: str


class TagItem(BaseModel):
    tag: str


# GET /admin/blacklist
class AdminBlacklists(BaseModel):
    items: List[UserItem]


# POST /admin/blacklist
class AdminWhitelistUser(BaseModel):
    user_id: int


# GET /admin/campuses
class AdminCampuses(BaseModel):
    items: List[CampusItem]


# POST /admin/campuses
class AdminCreateCampus(BaseModel):
    campus_name: str


# DELETE /admin/campuses
class AdminDeleteCampus(BaseModel):
    campus_id: int


# GET /admin/locations
class AdminLocations(BaseModel):
    items: List[LocationItem]


# POST /admin/locations
class AdminCreateLocation(BaseModel):
    location_name: str
    landmark: Optional[str] = None
    latitude: float
    longitude: float


# DELETE /admin/locations
class AdminDeleteLocation(BaseModel):
    location_id: int


# GET /admin/venues
class AdminVenues(BaseModel):
    item: List[VenueItem]


# POST /admin/venues
class AdminCreateVenue(BaseModel):
    venue_name: str
    capacity: int


# DELETE /admin/venues
class AdminDeleteVenue(BaseModel):
    venue_id: int


# GET /admin/users
class AdminUsers(BaseModel):
    items: List[UserItem]


# POST /admin/users
class AdminPromoteUser(BaseModel):
    user_id: int
    role: str


class CreateEvent(BaseModel):
    user_id: int
    name: str
    start_time: datetime
    finish_time: datetime
    venue_id: int
    secondary_organizer_ids: Optional[list[int]] = None
    capacity: Optional[int] = None
    tags: Optional[str] = None
    description: Optional[str] = None



class CreateCampus(BaseModel):
    campus_name: str


class CreateLocation(BaseModel):
    location_name: str
    landmark: Optional[str] = None
    latitude: str
    longitude: str
    campus_id: int


class CreateVenue(BaseModel):
    venue_name: str
    capacity: int
    location_id: int
