
These are some request response format, which we thought of now:
Token:
    - user_id
    - role
SignIn:
    /signin
    - username
    - password


/profile:
    - Get the details of the user using the user_id from the token
        - Get the name, username, email, phone number
    - We can change the password
        - request has {current_password, new_password}
        - Return success/failure
    - Save changes:
        - request: {name: str, phone_number: str}
        - response: {success: bool}
    - No, need of displaying the strike count

/black-list:
    - request: null
    - response: List of events(event-id s) organized by that organizer (get the user_id and role from the token)
    /black-list/event-id
    GET
        - request: null
        - response: List of all the visitors(user_id, username) that are enrolled in that event
    POST
        - request: {visitor_id}

/home

GET:
    - request: null
    - response: {location-list:[(location_id, name)], venue-list: [(venue_id, name)], tag-list:[str]}

POST:
    - request:
        {
        }
    -response:
        {
        event-list: [(event_name, event_id)]
        }

<!-- Here for the sake of simplicity we are returning both ids and numbers, so that the frontend can 
do request easily -->



/event/{event_id}/
GET:
    - request:
        null
    - response:
        {
            name: str,
            start_time: str,
            end_time: str,
            description: str,
            capacity: str,
            venue: str,
            location: str,
            campus: str,
            organizer_list: [str],
            editor_list: [str],
            event_tags: [str]
        }

PUT:

    - response:
        {
            name: str,
            start_time: str,
            end_time: str,
            description: str,
            capacity: str,
            venue: str,
            location: str,
            campus: str,
            organizer_list: [str],
            editor_list: [str],
            event_tags: [str]
        }

/event/create:
POST:
    - request:
        {
            name: str,
            start_time: str,
            end_time: str,
            description: str,
            capacity: str,
            venue: str,
            location: str,
            campus: str,
            primary_organizer_id: str,
            secondary_organizer_id: [str],
            editor_list: [str],
            event_tags: [str]
        }




<!-- 
Navbar:
    - For Navbar, we need 
    - Based on the role, the navbar changes -->


We still need to implement the admin functionalities
/admin  
    ... Coming Soon


