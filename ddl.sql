create table user_info (
    user_id int generated always as identity (start with 0 minvalue 0) primary key,
    name text not null check (name ~ '^[A-Za-z ]+$'),
    username text not null unique check (username ~ '^[A-Za-z][A-Za-z0-9_-]*$'),
    password text not null,
    email_id text not null unique check (email_id ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone_no text not null unique check (phone_no ~ '^[0-9]{10}$')
);

create table campus (
    campus_id int generated always as identity (start with 0 minvalue 0) primary key,
    name text not null check (name ~ '^[A-Za-z][A-Za-z0-9 -]*$')
);

create table location (
    location_id int generated always as identity (start with 0 minvalue 0) primary key,
    name text not null check (name ~ '^[A-Za-z][A-Za-z0-9 -]*$'),
    landmark text check (length(landmark) > 0),
    coordinates point not null,
    campus_id int references campus(campus_id)
);

create table venue (
    venue_id int generated always as identity (start with 0 minvalue 0) primary key,
    name text not null check (name ~ '^[A-Za-z][A-Za-z0-9 -]*$'),
    capacity int not null,
    location_id int references location(location_id)
);

create table organizer (
    organizer_id int references user_info(user_id) primary key
);

create table admin (
    admin_id int references user_info(user_id) primary key
);

create table editor (
    editor_id int references user_info(user_id) primary key
);

create table visitor (
    visitor_id int references user_info(user_id) primary key,
    strike_count int not null default 0 check (strike_count between 0 and 5),
    latest_timestamp timestamp
);

create table tag (
    tag_name text not null primary key
        check (tag_name ~ '^[A-Za-z][A-Za-z0-9_-]*(/[A-Za-z0-9_-]+)*$')
);

create table event ( 
    event_id int generated always as identity (start with 0 minvalue 0) primary key,
    name text not null check (name ~ '^[A-Za-z][A-Za-z0-9 -]*$'),
    start_time timestamp not null,
    finish_time timestamp not null check (finish_time > start_time),
    description text check (length(description) > 0),
    capacity int check (capacity > 0),
    venue_id int references venue(venue_id),
    organizer_id int references organizer(organizer_id)
);

create table secondary_organizers (
    event_id int references event(event_id),
    organizer_id int references organizer(organizer_id),
    primary key (event_id, organizer_id)
);

create table editor_of (
    event_id int references event(event_id),
    editor_id int references editor(editor_id),
    primary key (event_id, editor_id)
);

create table visitor_of (
    event_id int references event(event_id),
    visitor_id int references visitor(visitor_id),
    primary key (event_id, visitor_id)
);

create table tagged_with (
    event_id int references event(event_id),
    tag_name text references tag(tag_name),
    primary key (event_id, tag_name)
)
