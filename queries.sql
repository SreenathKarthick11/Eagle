/* =========================================================
   EXTENSIONS
   ========================================================= */

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gist;


/* =========================================================
   ROLES
   ========================================================= */

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user LOGIN NOINHERIT PASSWORD 'brrs__app_user';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'visitor_role') THEN
        CREATE ROLE visitor_role NOLOGIN;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'editor_role') THEN
        CREATE ROLE editor_role NOLOGIN;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'organizer_role') THEN
        CREATE ROLE organizer_role NOLOGIN;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin_role') THEN
        CREATE ROLE admin_role NOLOGIN;
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO app_user, visitor_role, editor_role, organizer_role, admin_role;


/* =========================================================
   VIEWS
   ========================================================= */

/* View containing user IDs and their roles. */
CREATE OR REPLACE VIEW user_roles AS
SELECT
    u.user_id,
    CASE
        WHEN a.admin_id IS NOT NULL THEN 'admin'
        WHEN o.organizer_id IS NOT NULL THEN 'organizer'
        WHEN e.editor_id IS NOT NULL THEN 'editor'
        WHEN v.visitor_id IS NOT NULL THEN 'visitor'
        ELSE 'unknown'
    END AS role
FROM user_info u
LEFT JOIN admin a     ON a.admin_id = u.user_id
LEFT JOIN organizer o ON o.organizer_id = u.user_id
LEFT JOIN editor e    ON e.editor_id = u.user_id
LEFT JOIN visitor v   ON v.visitor_id = u.user_id;

/* View containing a user's profile info. */
CREATE OR REPLACE VIEW user_profile AS
SELECT
    u.user_id,
    u.username,
    u.name,
    u.email_id,
    u.phone_no,
    ur.role AS active_role,
    COALESCE(v.strike_count, 0)   AS blacklist_count,
    v.latest_timestamp            AS last_blacklisted_at
FROM user_info u
LEFT JOIN user_roles ur ON ur.user_id = u.user_id
LEFT JOIN admin a     ON a.admin_id = u.user_id
LEFT JOIN organizer o ON o.organizer_id = u.user_id
LEFT JOIN editor e    ON e.editor_id = u.user_id
LEFT JOIN visitor v   ON v.visitor_id = u.user_id;

/* View with event IDs, capacity, and number of registered visitors. */
CREATE OR REPLACE VIEW event_participation_stats AS
SELECT
    e.event_id,
    e.capacity,
    COALESCE(ev.n_visitors, 0) AS n_visitors
FROM event e
LEFT JOIN (
    SELECT event_id, COUNT(visitor_id)::int AS n_visitors
    FROM visitor_of
    GROUP BY event_id
) ev USING (event_id);

/* View with all relevant details of an event. */
CREATE OR REPLACE VIEW event_full_details AS
WITH secondary_orgs AS (
    SELECT
        so.event_id,
        ARRAY_AGG(u.username ORDER BY u.username) AS secondary_organizers
    FROM secondary_organizers so
    JOIN user_info u ON u.user_id = so.organizer_id
    GROUP BY so.event_id
)
SELECT
    e.event_id,
    e.name AS event_name,
    e.start_time,
    e.finish_time,
    e.description,
    e.capacity,
    v.name AS venue_name,
    l.name AS location_name,
    c.name AS campus_name,
    u.username AS primary_organizer,
    COALESCE(s.secondary_organizers, ARRAY[]::text[]) AS secondary_organizers
FROM event e
JOIN venue v   ON v.venue_id = e.venue_id
JOIN location l ON l.location_id = v.location_id
JOIN campus c  ON c.campus_id = l.campus_id
JOIN user_info u ON u.user_id = e.organizer_id
LEFT JOIN secondary_orgs s ON s.event_id = e.event_id;

/* View with ALL details of an event. */
CREATE OR REPLACE VIEW event_catalog AS
WITH secondary_orgs AS (
    SELECT
        so.event_id,
        ARRAY_AGG(u.username ORDER BY u.username) AS secondary_organizers
    FROM secondary_organizers so
    JOIN user_info u ON u.user_id = so.organizer_id
    GROUP BY so.event_id
),
tags_agg AS (
    SELECT
        tw.event_id,
        ARRAY_AGG(tw.tag_name ORDER BY tw.tag_name) AS tags
    FROM tagged_with tw
    GROUP BY tw.event_id
),
participation AS (
    SELECT event_id, COUNT(visitor_id)::int AS n_visitors
    FROM visitor_of
    GROUP BY event_id
)
SELECT
    e.event_id,
    e.name AS event_name,
    e.start_time,
    e.finish_time,
    e.description,
    e.capacity,
    v.name AS venue_name,
    l.name AS location_name,
    c.name AS campus_name,
    u.username AS primary_organizer,
    COALESCE(s.secondary_organizers, ARRAY[]::text[]) AS secondary_organizers,
    COALESCE(t.tags, ARRAY[]::text[]) AS tags,
    COALESCE(p.n_visitors, 0) AS registered_count,
    (COALESCE(p.n_visitors, 0) >= e.capacity) AS is_full
FROM event e
JOIN venue v   ON v.venue_id = e.venue_id
JOIN location l ON l.location_id = v.location_id
JOIN campus c  ON c.campus_id = l.campus_id
JOIN user_info u ON u.user_id = e.organizer_id
LEFT JOIN secondary_orgs s ON s.event_id = e.event_id
LEFT JOIN tags_agg t ON t.event_id = e.event_id
LEFT JOIN participation p ON p.event_id = e.event_id;


/* =========================================================
   TRIGGER FUNCTIONS + TRIGGERS
   ========================================================= */

/* Whenever a new user signs up, they are inserted into visitors. */
CREATE OR REPLACE FUNCTION tgr_insert_into_visitor()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO visitor (visitor_id, strike_count, latest_timestamp)
    VALUES (NEW.user_id, 0, NULL);
    RETURN NEW;
END;
$$;

/* Ensure that event capacity is <= venue capacity, and if not specified, it is
* set to the venue capacity. */
CREATE OR REPLACE FUNCTION enforce_event_capacity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_capacity int;
BEGIN
    SELECT capacity
    INTO v_capacity
    FROM venue
    WHERE venue_id = NEW.venue_id;

    IF NEW.capacity IS NULL THEN
        NEW.capacity := v_capacity;
    END IF;

    IF NEW.capacity > v_capacity THEN
        RAISE EXCEPTION 'event capacity exceeds venue capacity';
    END IF;

    RETURN NEW;
END;
$$;

/* Ensures that a new event does not clash with any of the existing events. */
CREATE OR REPLACE FUNCTION prevent_event_time_clash()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM event e
        WHERE e.venue_id = NEW.venue_id
          AND e.event_id <> NEW.event_id
          AND tsrange(e.start_time, e.finish_time, '[)') &&
              tsrange(NEW.start_time, NEW.finish_time, '[)')
    ) THEN
        RAISE EXCEPTION 'time clash with another event at the same venue';
    END IF;

    RETURN NEW;
END;
$$;

/* Ensures valid registrations, satisfying all constraints. */
CREATE OR REPLACE FUNCTION prevent_bad_registration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_strikes int;
    v_capacity int;
    v_count int;
BEGIN
    SELECT strike_count
    INTO v_strikes
    FROM visitor
    WHERE visitor_id = NEW.visitor_id;

    IF v_strikes IS NULL THEN
        RAISE EXCEPTION 'user is not a visitor';
    END IF;

    IF v_strikes >= 5 THEN
        RAISE EXCEPTION 'user is blacklisted';
    END IF;

    SELECT eps.capacity, eps.n_visitors
    INTO v_capacity, v_count
    FROM event_participation_stats eps
    WHERE eps.event_id = NEW.event_id;

    IF v_count >= v_capacity THEN
        RAISE EXCEPTION 'event is full';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tgr_user_info_after_insert ON user_info;
CREATE TRIGGER tgr_user_info_after_insert
AFTER INSERT ON user_info
FOR EACH ROW
EXECUTE FUNCTION tgr_insert_into_visitor();

DROP TRIGGER IF EXISTS trg_event_capacity ON event;
CREATE TRIGGER trg_event_capacity
BEFORE INSERT OR UPDATE ON event
FOR EACH ROW
EXECUTE FUNCTION enforce_event_capacity();

DROP TRIGGER IF EXISTS trg_event_time_clash ON event;
CREATE TRIGGER trg_event_time_clash
BEFORE INSERT OR UPDATE ON event
FOR EACH ROW
EXECUTE FUNCTION prevent_event_time_clash();

DROP TRIGGER IF EXISTS trg_prevent_bad_registration ON visitor_of;
CREATE TRIGGER trg_prevent_bad_registration
BEFORE INSERT ON visitor_of
FOR EACH ROW
EXECUTE FUNCTION prevent_bad_registration();


/* =========================================================
   HELPER FUNCTIONS
   ========================================================= */

CREATE OR REPLACE FUNCTION is_blacklisted(p_user_id int)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM visitor
        WHERE visitor_id = p_user_id
          AND strike_count >= 5
    );
$$;

CREATE OR REPLACE FUNCTION is_organizer(p_user_id int)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (SELECT 1 FROM organizer WHERE organizer_id = p_user_id);
$$;

CREATE OR REPLACE FUNCTION is_editor(p_user_id int)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (SELECT 1 FROM editor WHERE editor_id = p_user_id);
$$;

CREATE OR REPLACE FUNCTION is_admin(p_user_id int)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (SELECT 1 FROM admin WHERE admin_id = p_user_id);
$$;


/* Is a user a primary or a secondary organizer of an event? */
CREATE OR REPLACE FUNCTION is_organizer_of_event(p_actor_id int, p_event_id int)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT
        (
        EXISTS (
            SELECT 1
            FROM event e
            WHERE e.event_id = p_event_id
              AND e.organizer_id = p_actor_id)
        )
        OR (
            EXISTS (
                SELECT 1
                FROM secondary_organizers so
                WHERE so.event_id = p_event_id
                  AND so.organizer_id = p_actor_id
            )
        );
$$

/* Users who can manage an event: admins, primary and secondary organizers. */
CREATE OR REPLACE FUNCTION can_manage_event(p_actor_id int, p_event_id int)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT
        is_admin(p_actor_id)
        OR is_organizer_of_event(p_actor_id, p_event_id)
$$;

CREATE OR REPLACE FUNCTION can_edit_event(p_actor_id int, p_event_id int)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT
        can_manage_event(p_actor_id, p_event_id)
        OR (
            EXISTS (
                SELECT 1
                FROM editor_of eo
                WHERE eo.event_id = p_event_id
                  AND eo.editor_id = p_actor_id
            )
        );
$$;

CREATE OR REPLACE FUNCTION get_event_details(p_event_id INT)
RETURNS SETOF event_catalog
LANGUAGE sql
STABLE
AS $$
    SELECT *
    FROM event_catalog ec
    WHERE ec.event_id = p_event_id;
$$;


/* =========================================================
   APPLICATION FUNCTIONS
   ========================================================= */

CREATE OR REPLACE FUNCTION signup_user(
    p_name text,
    p_username text,
    p_password text,
    p_email_id text,
    p_phone_no text
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id int;
    v_constraint text;
BEGIN
    INSERT INTO user_info (name, username, password, email_id, phone_no)
    VALUES (p_name, p_username, p_password, p_email_id, p_phone_no)
    RETURNING user_id INTO v_user_id;

    RETURN v_user_id;

EXCEPTION
    WHEN unique_violation OR check_violation THEN
        GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
        RAISE EXCEPTION 'signup failed: %', v_constraint;
END;
$$;

CREATE OR REPLACE FUNCTION signin_user(
    p_username text,
    p_password text
)
RETURNS TABLE(user_id int, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id int;
    v_password text;
BEGIN
    SELECT u.user_id, u.password
    INTO v_user_id, v_password
    FROM user_info u
    WHERE u.username = p_username;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'invalid username or password';
    END IF;

    IF v_password <> p_password THEN
        RAISE EXCEPTION 'invalid username or password';
    END IF;

    RETURN QUERY
    SELECT ur.user_id, ur.role
    FROM user_roles ur
    WHERE ur.user_id = v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION search_events(
    p_campus_name text DEFAULT NULL,
    p_venue_name text DEFAULT NULL,
    p_location_name text DEFAULT NULL,
    p_organizer_username text DEFAULT NULL,
    p_start_after timestamp DEFAULT NULL,
    p_finish_before timestamp DEFAULT NULL,
    p_tags text[] DEFAULT NULL,
    p_require_all_tags boolean DEFAULT false,
    p_is_full boolean DEFAULT NULL,
    p_title_substring text DEFAULT NULL,
    p_description_substring text DEFAULT NULL
)
RETURNS SETOF event_catalog
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM event_catalog ec
    WHERE (p_campus_name IS NULL OR ec.campus_name = p_campus_name)
      AND (p_venue_name IS NULL OR ec.venue_name = p_venue_name)
      AND (p_location_name IS NULL OR ec.location_name = p_location_name)
      AND (p_organizer_username IS NULL OR ec.primary_organizer = p_organizer_username)
      AND (p_start_after IS NULL OR ec.start_time >= p_start_after)
      AND (p_finish_before IS NULL OR ec.finish_time <= p_finish_before)
      AND (
            p_tags IS NULL
            OR (p_require_all_tags AND ec.tags @> p_tags)
            OR (NOT p_require_all_tags AND ec.tags && p_tags)
          )
      AND (p_is_full IS NULL OR ec.is_full = p_is_full)
      AND (p_title_substring IS NULL OR lower(ec.event_name) LIKE '%' || lower(p_title_substring) || '%')
      AND (p_description_substring IS NULL OR lower(ec.description) LIKE '%' || lower(p_description_substring) || '%')
    ORDER BY ec.start_time, ec.event_id;
END;
$$;


CREATE OR REPLACE FUNCTION search_event_items(
    p_campus_name text DEFAULT NULL,
    p_venue_name text DEFAULT NULL,
    p_location_name text DEFAULT NULL,
    p_organizer_username text DEFAULT NULL,
    p_start_after timestamp DEFAULT NULL,
    p_finish_before timestamp DEFAULT NULL,
    p_tags text[] DEFAULT NULL,
    p_require_all_tags boolean DEFAULT false,
    p_is_full boolean DEFAULT NULL,
    p_title_substring text DEFAULT NULL,
    p_description_substring text DEFAULT NULL
)
RETURNS TABLE(event_id int, event_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT ec.event_id, ec.event_name
    FROM event_catalog ec
    WHERE (p_campus_name IS NULL OR ec.campus_name = p_campus_name)
      AND (p_venue_name IS NULL OR ec.venue_name = p_venue_name)
      AND (p_location_name IS NULL OR ec.location_name = p_location_name)
      AND (p_organizer_username IS NULL OR ec.primary_organizer = p_organizer_username)
      AND (p_start_after IS NULL OR ec.start_time >= p_start_after)
      AND (p_finish_before IS NULL OR ec.finish_time <= p_finish_before)
      AND (
            p_tags IS NULL
            OR (p_require_all_tags AND ec.tags @> p_tags)
            OR (NOT p_require_all_tags AND ec.tags && p_tags)
          )
      AND (p_is_full IS NULL OR ec.is_full = p_is_full)
      AND (p_title_substring IS NULL OR lower(ec.event_name) LIKE '%' || lower(p_title_substring) || '%')
      AND (p_description_substring IS NULL OR lower(ec.description) LIKE '%' || lower(p_description_substring) || '%')
    ORDER BY ec.start_time, ec.event_id;
END;
$$;


CREATE OR REPLACE FUNCTION register_for_event(
    p_visitor_id int,
    p_event_id int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO visitor_of (event_id, visitor_id)
    VALUES (p_event_id, p_visitor_id);
END;
$$;

CREATE OR REPLACE FUNCTION cancel_registration(
    p_visitor_id int,
    p_event_id int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM visitor_of
    WHERE event_id = p_event_id
      AND visitor_id = p_visitor_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'registration not found';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION edit_event_text_fields(
    p_actor_id int,
    p_event_id int,
    p_new_name text DEFAULT NULL,
    p_new_description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT can_edit_event(p_actor_id, p_event_id) THEN
        RAISE EXCEPTION 'not authorized to edit this event';
    END IF;

    UPDATE event
    SET name = COALESCE(p_new_name, name),
        description = COALESCE(p_new_description, description)
    WHERE event_id = p_event_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'event not found';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION create_event(
    p_organizer_id int,
    p_name text,
    p_start_time timestamp,
    p_finish_time timestamp,
    p_venue_id int,
    p_description text DEFAULT NULL,
    p_capacity int DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event_id int;
BEGIN
    IF is_blacklisted(p_organizer_id) THEN
        RAISE EXCEPTION 'user is blacklisted';
    END IF;

    IF NOT is_organizer(p_organizer_id) AND NOT is_admin(p_organizer_id) THEN
        RAISE EXCEPTION 'not authorized to create events';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM venue WHERE venue_id = p_venue_id) THEN
        RAISE EXCEPTION 'venue does not exist';
    END IF;

    INSERT INTO event (name, start_time, finish_time, description, capacity, venue_id, organizer_id)
    VALUES (
        p_name,
        p_start_time,
        p_finish_time,
        p_description,
        p_capacity,
        p_venue_id,
        p_organizer_id
    )
    RETURNING event_id INTO v_event_id;

    RETURN v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION delete_event(
    p_actor_id int,
    p_event_id int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT can_manage_event(p_actor_id, p_event_id) THEN
        RAISE EXCEPTION 'not authorized to delete this event';
    END IF;

    DELETE FROM event
    WHERE event_id = p_event_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'event not found';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION add_editor_to_event(
    p_actor_id int,
    p_event_id int,
    p_visitor_id int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT can_manage_event(p_actor_id, p_event_id) THEN
        RAISE EXCEPTION 'not authorized for this event';
    END IF;

    IF is_blacklisted(p_visitor_id) THEN
        RAISE EXCEPTION 'user is blacklisted';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM visitor WHERE visitor_id = p_visitor_id) THEN
        RAISE EXCEPTION 'user is not a visitor';
    END IF;

    INSERT INTO editor(editor_id)
    VALUES (p_visitor_id)
    ON CONFLICT DO NOTHING;

    INSERT INTO editor_of(event_id, editor_id)
    VALUES (p_event_id, p_visitor_id)
    ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION add_tag_to_event(
    p_actor_id int,
    p_event_id int,
    p_tag_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT can_manage_event(p_actor_id, p_event_id) THEN
        RAISE EXCEPTION 'not authorized for this event';
    END IF;

    INSERT INTO tag(tag_name)
    VALUES (p_tag_name)
    ON CONFLICT DO NOTHING;

    INSERT INTO tagged_with(event_id, tag_name)
    VALUES (p_event_id, p_tag_name)
    ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION remove_tag_from_event(
    p_actor_id int,
    p_event_id int,
    p_tag_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT can_manage_event(p_actor_id, p_event_id) THEN
        RAISE EXCEPTION 'not authorized for this event';
    END IF;

    DELETE FROM tagged_with
    WHERE event_id = p_event_id
      AND tag_name = p_tag_name;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'tag mapping not found';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_event_participants(
    p_actor_id int,
    p_event_id int
)
RETURNS TABLE (
    visitor_id int,
    username text,
    name text,
    strike_count int,
    latest_timestamp timestamp
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT can_manage_event(p_actor_id, p_event_id) THEN
        RAISE EXCEPTION 'not authorized for this event';
    END IF;

    RETURN QUERY
    SELECT
        v.visitor_id,
        u.username,
        u.name,
        v.strike_count,
        v.latest_timestamp
    FROM visitor_of vo
    JOIN visitor v ON v.visitor_id = vo.visitor_id
    JOIN user_info u ON u.user_id = v.visitor_id
    WHERE vo.event_id = p_event_id
    ORDER BY u.username;
END;
$$;

CREATE OR REPLACE FUNCTION blacklist_visitor(
    p_actor_id int,
    p_visitor_id int,
    p_event_id int
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_count int;
    v_owner int;
BEGIN
    IF is_blacklisted(p_actor_id) THEN
        RAISE EXCEPTION 'user is blacklisted';
    END IF;

    SELECT organizer_id
    INTO v_owner
    FROM event
    WHERE event_id = p_event_id;

    IF v_owner IS NULL THEN
        RAISE EXCEPTION 'event not found';
    END IF;

    IF NOT is_admin(p_actor_id) AND v_owner <> p_actor_id THEN
        RAISE EXCEPTION 'not authorized for this event';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM visitor_of
        WHERE event_id = p_event_id
          AND visitor_id = p_visitor_id
    ) THEN
        RAISE EXCEPTION 'visitor did not attend this event';
    END IF;

    UPDATE visitor
    SET strike_count = strike_count + 1,
        latest_timestamp = clock_timestamp()
    WHERE visitor_id = p_visitor_id
      AND strike_count < 5
    RETURNING strike_count INTO v_new_count;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'visitor does not exist or already has maximum blacklist count';
    END IF;

    RETURN v_new_count;
END;
$$;

CREATE OR REPLACE FUNCTION reset_blacklist(
    p_admin_id int,
    p_visitor_id int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'admin only';
    END IF;

    UPDATE visitor
    SET strike_count = 0,
        latest_timestamp = NULL
    WHERE visitor_id = p_visitor_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'visitor not found';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION create_location(
    p_admin_id int,
    p_name text,
    p_landmark text,
    p_coordinates point,
    p_campus_id int
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_location_id int;
BEGIN
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'admin only';
    END IF;

    INSERT INTO location(name, landmark, coordinates, campus_id)
    VALUES (p_name, p_landmark, p_coordinates, p_campus_id)
    RETURNING location_id INTO v_location_id;

    RETURN v_location_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_venue(
    p_admin_id int,
    p_name text,
    p_capacity int,
    p_location_id int
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_venue_id int;
BEGIN
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'admin only';
    END IF;

    INSERT INTO venue(name, capacity, location_id)
    VALUES (p_name, p_capacity, p_location_id)
    RETURNING venue_id INTO v_venue_id;

    RETURN v_venue_id;
END;
$$;

CREATE OR REPLACE FUNCTION promote_visitor_to_editor(
    p_admin_id int,
    p_user_id int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'admin only';
    END IF;

    IF is_blacklisted(p_user_id) THEN
        RAISE EXCEPTION 'cannot promote blacklisted user';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM visitor WHERE visitor_id = p_user_id) THEN
        RAISE EXCEPTION 'user is not a visitor';
    END IF;

    IF EXISTS (SELECT 1 FROM organizer WHERE organizer_id = p_user_id)
       OR EXISTS (SELECT 1 FROM admin WHERE admin_id = p_user_id) THEN
        RAISE EXCEPTION 'user already has a higher role';
    END IF;

    INSERT INTO editor(editor_id)
    VALUES (p_user_id)
    ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION promote_visitor_to_organizer(
    p_admin_id int,
    p_user_id int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'admin only';
    END IF;

    IF is_blacklisted(p_user_id) THEN
        RAISE EXCEPTION 'cannot promote blacklisted user';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM visitor WHERE visitor_id = p_user_id) THEN
        RAISE EXCEPTION 'user is not a visitor';
    END IF;

    DELETE FROM visitor_of WHERE visitor_id = p_user_id;
    DELETE FROM editor_of WHERE editor_id = p_user_id;
    DELETE FROM editor WHERE editor_id = p_user_id;
    DELETE FROM visitor WHERE visitor_id = p_user_id;

    INSERT INTO organizer(organizer_id)
    VALUES (p_user_id)
    ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION promote_visitor_to_admin(
    p_admin_id int,
    p_user_id int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'admin only';
    END IF;

    IF is_blacklisted(p_user_id) THEN
        RAISE EXCEPTION 'cannot promote blacklisted user';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM visitor WHERE visitor_id = p_user_id) THEN
        RAISE EXCEPTION 'user is not a visitor';
    END IF;

    DELETE FROM visitor_of WHERE visitor_id = p_user_id;
    DELETE FROM editor_of WHERE editor_id = p_user_id;
    DELETE FROM editor WHERE editor_id = p_user_id;
    DELETE FROM visitor WHERE visitor_id = p_user_id;
    DELETE FROM organizer WHERE organizer_id = p_user_id;

    INSERT INTO admin(admin_id)
    VALUES (p_user_id)
    ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION promote_organizer_to_admin(
    p_admin_id int,
    p_user_id int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'admin only';
    END IF;

    IF is_blacklisted(p_user_id) THEN
        RAISE EXCEPTION 'cannot promote blacklisted user';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM organizer WHERE organizer_id = p_user_id) THEN
        RAISE EXCEPTION 'user is not an organizer';
    END IF;

    DELETE FROM visitor_of WHERE visitor_id = p_user_id;
    DELETE FROM editor_of WHERE editor_id = p_user_id;
    DELETE FROM editor WHERE editor_id = p_user_id;
    DELETE FROM visitor WHERE visitor_id = p_user_id;
    DELETE FROM organizer WHERE organizer_id = p_user_id;

    INSERT INTO admin(admin_id)
    VALUES (p_user_id)
    ON CONFLICT DO NOTHING;
END;
$$;




-- CREATE OR REPLACE FUNCTION filter_values()
-- RETURNS TABLE (
--     campus_ids INT[],
--     campus_names TEXT[],
--     location_ids INT[],
--     location_names TEXT[],
--     venue_ids INT[],
--     venue_names TEXT[],
--     organizer_usernames TEXT[],
--     tags TEXT[]
-- )
-- LANGUAGE sql
-- AS $$
--     SELECT
--         -- campus
--         ARRAY_AGG(DISTINCT c.campus_id) FILTER (WHERE c.campus_id IS NOT NULL),
--         ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL),

--         -- location
--         ARRAY_AGG(DISTINCT l.location_id) FILTER (WHERE l.location_id IS NOT NULL),
--         ARRAY_AGG(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL),

--         -- venue
--         ARRAY_AGG(DISTINCT v.venue_id) FILTER (WHERE v.venue_id IS NOT NULL),
--         ARRAY_AGG(DISTINCT v.name) FILTER (WHERE v.name IS NOT NULL),

--         -- organizer usernames
--         ARRAY_AGG(DISTINCT u.username) FILTER (WHERE u.username IS NOT NULL),

--         -- tags
--         ARRAY_AGG(DISTINCT t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL)

--     FROM event e
--     LEFT JOIN venue v ON e.venue_id = v.venue_id
--     LEFT JOIN location l ON v.location_id = l.location_id
--     LEFT JOIN campus c ON l.campus_id = c.campus_id
--     LEFT JOIN organizer o ON e.organizer_id = o.organizer_id
--     LEFT JOIN user_info u ON o.organizer_id = u.user_id
--     LEFT JOIN tagged_with tw ON e.event_id = tw.event_id
--     LEFT JOIN tag t ON tw.tag_name = t.tag_name;
-- $$;


CREATE OR REPLACE FUNCTION public.get_campuses()
RETURNS TABLE (
    campus_id INT,
    campus_name TEXT
)
LANGUAGE sql
AS $$
    SELECT
        c.campus_id,
        c.name AS campus_name
    FROM campus c
    ORDER BY c.name;
$$;

CREATE OR REPLACE FUNCTION public.get_locations(p_campus_id INT DEFAULT NULL)
RETURNS TABLE (
    location_id INT,
    location_name TEXT
)
LANGUAGE sql
AS $$
    SELECT
        l.location_id,
        l.name AS location_name
    FROM location l
    WHERE p_campus_id IS NULL OR l.campus_id = p_campus_id
    ORDER BY l.name;
$$;

CREATE OR REPLACE FUNCTION public.get_venues(p_location_id INT DEFAULT NULL)
RETURNS TABLE (
    venue_id INT,
    venue_name TEXT
)
LANGUAGE sql
AS $$
    SELECT
        v.venue_id,
        v.name AS venue_name
    FROM venue v
    WHERE p_location_id IS NULL OR v.location_id = p_location_id
    ORDER BY v.name;
$$;

CREATE OR REPLACE FUNCTION public.get_tags()
RETURNS TABLE (
    tag_name TEXT
)
LANGUAGE sql
AS $$
    SELECT
        t.tag_name
    FROM tag t
    ORDER BY t.tag_name;
$$;


CREATE OR REPLACE FUNCTION get_user_profile(p_user_id INT)
RETURNS TABLE (
    user_id INT,
    username TEXT,
    name TEXT,
    active_role TEXT,
    is_admin BOOLEAN,
    is_organizer BOOLEAN,
    is_editor BOOLEAN,
    is_visitor BOOLEAN,
    blacklist_count INT,
    last_blacklisted_at TIMESTAMP
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        up.user_id,
        up.username,
        up.name,
        up.active_role,
        up.is_admin,
        up.is_organizer,
        up.is_editor,
        up.is_visitor,
        up.blacklist_count,
        up.last_blacklisted_at
    FROM user_profile up
    WHERE up.user_id = p_user_id;
$$;


CREATE OR REPLACE FUNCTION update_user_details(
    p_user_id int,
    p_name text,
    p_phone_no text
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id int;
    v_constraint text;
BEGIN
    UPDATE user_info
    SET
        name = p_name,
        phone_no = p_phone_no
    WHERE user_id = p_user_id
    RETURNING user_id INTO v_user_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'update failed: user not found';
    END IF;

    RETURN v_user_id;

EXCEPTION
    WHEN unique_violation OR check_violation THEN
        GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
        RAISE EXCEPTION 'update failed: %', v_constraint;
END;
$$;

CREATE OR REPLACE FUNCTION is_user_registered(
    p_user_id INT,
    p_event_id INT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM visitor_of vo
        WHERE vo.event_id = p_event_id
          AND vo.visitor_id = p_user_id
    );
$$;

/* =========================================================
   GRANTS
   ========================================================= */

-- Onboarding
GRANT EXECUTE ON FUNCTION signup_user(text, text, text, text, text) TO app_user;
GRANT EXECUTE ON FUNCTION signin_user(text, text) TO app_user;

-- Browsing
GRANT SELECT ON event_catalog TO app_user, visitor_role, editor_role, organizer_role, admin_role;
GRANT SELECT ON event_full_details TO visitor_role, editor_role, organizer_role, admin_role;
GRANT SELECT ON event_participation_stats TO organizer_role, editor_role, admin_role;
GRANT SELECT ON user_profile TO admin_role;
GRANT SELECT ON user_roles TO admin_role;

GRANT EXECUTE ON FUNCTION search_events(
    text, text, text, text, timestamp, timestamp, text[], boolean, boolean, text, text
) TO app_user, visitor_role, editor_role, organizer_role, admin_role;

GRANT EXECUTE ON FUNCTION get_campuses() TO app_user, visitor_role, editor_role, organizer_role, admin_role;
GRANT EXECUTE ON FUNCTION get_locations(int) TO app_user, visitor_role, editor_role, organizer_role, admin_role;
GRANT EXECUTE ON FUNCTION get_venues(int) TO app_user, visitor_role, editor_role, organizer_role, admin_role;
GRANT EXECUTE ON FUNCTION get_tags() TO app_user, visitor_role, editor_role, organizer_role, admin_role;


-- Visitor actions
GRANT EXECUTE ON FUNCTION register_for_event(int, int) TO visitor_role;
GRANT EXECUTE ON FUNCTION cancel_registration(int, int) TO visitor_role;

-- Editor actions
GRANT EXECUTE ON FUNCTION edit_event_text_fields(int, int, text, text)
TO editor_role, organizer_role, admin_role;

-- Organizer actions
GRANT EXECUTE ON FUNCTION create_event(int, text, timestamp, timestamp, int, text, int)
TO organizer_role, admin_role;
GRANT EXECUTE ON FUNCTION delete_event(int, int) TO organizer_role, admin_role;
GRANT EXECUTE ON FUNCTION add_editor_to_event(int, int, int) TO organizer_role, admin_role;
GRANT EXECUTE ON FUNCTION add_tag_to_event(int, int, text) TO organizer_role, admin_role;
GRANT EXECUTE ON FUNCTION remove_tag_from_event(int, int, text) TO organizer_role, admin_role;
GRANT EXECUTE ON FUNCTION get_event_participants(int, int) TO organizer_role, admin_role;
GRANT EXECUTE ON FUNCTION blacklist_visitor(int, int, int) TO organizer_role, admin_role;

-- Admin actions
GRANT EXECUTE ON FUNCTION reset_blacklist(int, int) TO admin_role;
GRANT EXECUTE ON FUNCTION create_location(int, text, text, point, int) TO admin_role;
GRANT EXECUTE ON FUNCTION create_venue(int, text, int, int) TO admin_role;
GRANT EXECUTE ON FUNCTION promote_visitor_to_editor(int, int) TO admin_role;
GRANT EXECUTE ON FUNCTION promote_visitor_to_organizer(int, int) TO admin_role;
GRANT EXECUTE ON FUNCTION promote_visitor_to_admin(int, int) TO admin_role;
GRANT EXECUTE ON FUNCTION promote_organizer_to_admin(int, int) TO admin_role;

-- Admin direct table access
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO admin_role;


/* =========================================================
   INDEXES
   ========================================================= */

CREATE INDEX IF NOT EXISTS idx_event_venue_time
    ON event (venue_id, start_time, finish_time);

CREATE INDEX IF NOT EXISTS idx_event_start_time
    ON event (start_time);

CREATE INDEX IF NOT EXISTS idx_event_organizer
    ON event (organizer_id);

CREATE INDEX IF NOT EXISTS idx_venue_location
    ON venue (location_id);

CREATE INDEX IF NOT EXISTS idx_location_campus
    ON location (campus_id);

CREATE INDEX IF NOT EXISTS idx_visitor_strike_count
    ON visitor (strike_count);

CREATE INDEX IF NOT EXISTS idx_visitor_of_event
    ON visitor_of (event_id);

CREATE INDEX IF NOT EXISTS idx_visitor_of_visitor
    ON visitor_of (visitor_id);

CREATE INDEX IF NOT EXISTS idx_tagged_with_tag_event
    ON tagged_with (tag_name, event_id);

CREATE INDEX IF NOT EXISTS idx_event_name_trgm
    ON event USING gin (lower(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_event_description_trgm
    ON event USING gin (lower(description) gin_trgm_ops);
