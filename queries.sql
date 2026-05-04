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
$$;

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

-- CREATE OR REPLACE FUNCTION search_events(
--     p_campus_name text DEFAULT NULL,
--     p_venue_name text DEFAULT NULL,
--     p_location_name text DEFAULT NULL,
--     p_organizer_username text DEFAULT NULL,
--     p_start_after timestamp DEFAULT NULL,
--     p_finish_before timestamp DEFAULT NULL,
--     p_tags text[] DEFAULT NULL,
--     p_require_all_tags boolean DEFAULT false,
--     p_is_full boolean DEFAULT NULL,
--     p_title_substring text DEFAULT NULL,
--     p_description_substring text DEFAULT NULL
-- )
-- RETURNS SETOF event_catalog
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = public
-- AS $$
-- BEGIN
--     RETURN QUERY
--     SELECT *
--     FROM event_catalog ec
--     WHERE (p_campus_name IS NULL OR ec.campus_name = p_campus_name)
--       AND (p_venue_name IS NULL OR ec.venue_name = p_venue_name)
--       AND (p_location_name IS NULL OR ec.location_name = p_location_name)
--       AND (p_organizer_username IS NULL OR ec.primary_organizer = p_organizer_username)
--       AND (p_start_after IS NULL OR ec.start_time >= p_start_after)
--       AND (p_finish_before IS NULL OR ec.finish_time <= p_finish_before)
--       AND (
--             p_tags IS NULL
--             OR (p_require_all_tags AND ec.tags @> p_tags)
--             OR (NOT p_require_all_tags AND ec.tags && p_tags)
--           )
--       AND (p_is_full IS NULL OR ec.is_full = p_is_full)
--       AND (p_title_substring IS NULL OR lower(ec.event_name) LIKE '%' || lower(p_title_substring) || '%')
--       AND (p_description_substring IS NULL OR lower(ec.description) LIKE '%' || lower(p_description_substring) || '%')
--     ORDER BY ec.start_time, ec.event_id;
-- END;
-- $$;


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
    p_secondary_organizer_ids int[] DEFAULT NULL,
    p_capacity int DEFAULT NULL,
    p_tags text[] DEFAULT NULL,
    p_description text DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event_id int;
BEGIN
    -- Insert the main event record.
    INSERT INTO event (name, start_time, finish_time, description, capacity, venue_id, organizer_id)
    VALUES (p_name, p_start_time, p_finish_time, p_description, p_capacity, p_venue_id, p_organizer_id)
    RETURNING event_id INTO v_event_id;

    -- Insert secondary organizers, excluding the primary organizer if accidentally included.
    IF p_secondary_organizer_ids IS NOT NULL THEN
        INSERT INTO secondary_organizers (event_id, organizer_id)
        SELECT v_event_id, unnest(p_secondary_organizer_ids)
        WHERE unnest(p_secondary_organizer_ids) <> p_organizer_id
        ON CONFLICT (event_id, organizer_id) DO NOTHING;
    END IF;

    -- Ensure all tags exist in the tag table, then link them to the event.
    IF p_tags IS NOT NULL THEN
        -- Insert missing tags (ignores existing ones).
        INSERT INTO tag (tag_name)
        SELECT unnest(p_tags)
        ON CONFLICT (tag_name) DO NOTHING;

        -- Link tags with the newly created event.
        INSERT INTO tagged_with (event_id, tag_name)
        SELECT v_event_id, unnest(p_tags)
        ON CONFLICT (event_id, tag_name) DO NOTHING;
    END IF;

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

    IF NOT EXISTS (SELECT 1 FROM editor WHERE editor_id = p_visitor_id) THEN
        RAISE EXCEPTION 'user is not an editor';
    END IF;

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


CREATE OR REPLACE FUNCTION get_event_participants(
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

    RETURN v_new_count;
END;
$$;



CREATE OR REPLACE FUNCTION reset_blacklist(
    p_visitor_id int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE visitor
    SET strike_count = 0,
        latest_timestamp = NULL
    WHERE visitor_id = p_visitor_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'visitor not found';
    END IF;
END;
$$;


CREATE OR REPLACE FUNCTION promote_visitor_to_editor(
    p_user_id int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    p_user_id int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM visitor WHERE visitor_id = p_user_id) THEN
        RAISE EXCEPTION 'user is not a visitor';
    END IF;

    DELETE FROM editor WHERE editor_id = p_user_id;
    DELETE FROM visitor WHERE visitor_id = p_user_id;

    INSERT INTO organizer(organizer_id)
    VALUES (p_user_id)
    ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION promote_visitor_to_admin(
    p_user_id int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM visitor WHERE visitor_id = p_user_id) THEN
        RAISE EXCEPTION 'user is not a visitor';
    END IF;

    DELETE FROM editor WHERE editor_id = p_user_id;
    DELETE FROM visitor WHERE visitor_id = p_user_id;
    DELETE FROM organizer WHERE organizer_id = p_user_id;

    INSERT INTO admin(admin_id)
    VALUES (p_user_id)
    ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION promote_organizer_to_admin(
    p_user_id int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM organizer WHERE organizer_id = p_user_id) THEN
        RAISE EXCEPTION 'user is not an organizer';
    END IF;

    DELETE FROM editor WHERE editor_id = p_user_id;
    DELETE FROM visitor WHERE visitor_id = p_user_id;
    DELETE FROM organizer WHERE organizer_id = p_user_id;

    INSERT INTO admin(admin_id)
    VALUES (p_user_id)
    ON CONFLICT DO NOTHING;
END;
$$;


CREATE OR REPLACE FUNCTION get_campuses()
RETURNS TABLE (
    campus_id INT,
    campus_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        c.campus_id,
        c.name AS campus_name
    FROM campus c
    ORDER BY c.name;
$$;

CREATE OR REPLACE FUNCTION get_locations(p_campus_id INT DEFAULT NULL)
RETURNS TABLE (
    location_id INT,
    location_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        l.location_id,
        l.name AS location_name
    FROM location l
    WHERE p_campus_id IS NULL OR l.campus_id = p_campus_id
    ORDER BY l.name;
$$;

CREATE OR REPLACE FUNCTION get_venues(p_location_id INT DEFAULT NULL)
RETURNS TABLE (
    venue_id INT,
    venue_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        v.venue_id,
        v.name AS venue_name
    FROM venue v
    WHERE p_location_id IS NULL OR v.location_id = p_location_id
    ORDER BY v.name;
$$;

CREATE OR REPLACE FUNCTION get_tags()
RETURNS TABLE (
    tag_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        t.tag_name
    FROM tag t
    ORDER BY t.tag_name;
$$;

CREATE OR REPLACE FUNCTION get_user_profile(p_user_id INT)
RETURNS SETOF user_profile
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT * FROM user_profile up
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
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM visitor_of vo
        WHERE vo.event_id = p_event_id
          AND vo.visitor_id = p_user_id
    );
$$;

CREATE OR REPLACE FUNCTION create_campus(
    p_campus_name text
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_campus_id int;
BEGIN
    INSERT INTO campus(name)
    VALUES (p_campus_name)
    RETURNING campus_id INTO v_campus_id;

    RETURN v_campus_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_location(
    p_location_name text,
    p_landmark text,
    p_latitude text,
    p_longitude text,
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
    INSERT INTO location(name, landmark, coordinates, campus_id)
    VALUES (
        p_location_name, 
        p_landmark, 
        point(p_longitude::double precision, p_latitude::double precision), 
        p_campus_id
    )
    RETURNING location_id INTO v_location_id;

    RETURN v_location_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_venue(
    p_venue_name text,
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
    INSERT INTO venue(name, capacity, location_id)
    VALUES (p_venue_name, p_capacity, p_location_id)
    RETURNING venue_id INTO v_venue_id;

    RETURN v_venue_id;
END;
$$;


CREATE OR REPLACE FUNCTION delete_campus(
    p_campus_id int
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_id int;
BEGIN
    DELETE FROM campus
    WHERE campus_id = p_campus_id
    RETURNING campus_id INTO v_deleted_id;

    IF v_deleted_id IS NULL THEN
        RAISE EXCEPTION 'campus not found';
    END IF;

    RETURN v_deleted_id;
END;
$$;


CREATE OR REPLACE FUNCTION delete_location(
    p_location_id int
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_id int;
BEGIN
    DELETE FROM location
    WHERE location_id = p_location_id
    RETURNING location_id INTO v_deleted_id;

    IF v_deleted_id IS NULL THEN
        RAISE EXCEPTION 'location not found';
    END IF;

    RETURN v_deleted_id;
END;
$$;

CREATE OR REPLACE FUNCTION delete_venue(
    p_venue_id int
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_id int;
BEGIN
    DELETE FROM venue
    WHERE venue_id = p_venue_id
    RETURNING venue_id INTO v_deleted_id;

    IF v_deleted_id IS NULL THEN
        RAISE EXCEPTION 'venue not found';
    END IF;

    RETURN v_deleted_id;
END;
$$;


CREATE OR REPLACE FUNCTION get_visitors()
RETURNS TABLE (
    user_id int,
    username text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        u.user_id,
        u.username
    FROM visitor v
    JOIN user_info u ON v.visitor_id = u.user_id
    ORDER BY u.username;
$$;

CREATE OR REPLACE FUNCTION get_organizers()
RETURNS TABLE (
    user_id int,
    username text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        u.user_id,
        u.username
    FROM organizer o
    JOIN user_info u ON o.organizer_id = u.user_id
    ORDER BY u.username;
$$;

CREATE OR REPLACE FUNCTION get_blacklists()
RETURNS TABLE (
    user_id int,
    username text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        u.user_id,
        u.username
    FROM visitor v
    JOIN user_info u ON v.visitor_id = u.user_id
    WHERE v.strike_count >= 5
    ORDER BY u.username;
$$;


CREATE OR REPLACE FUNCTION get_events_of_organizer(p_organizer_id int)
RETURNS TABLE (
    event_id int,
    event_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        e.event_id,
        e.name as event_name
    FROM event e
    WHERE e.organizer_id = p_organizer_id;
$$;


/* =========================================================
   GRANTS
   ========================================================= */

-- 1. app_user (unauthenticated) – signup, signin, browse events, view single event
GRANT EXECUTE ON FUNCTION signup_user(text, text, text, text, text) TO app_user;
GRANT EXECUTE ON FUNCTION signin_user(text, text) TO app_user;

GRANT SELECT ON event_catalog TO app_user;
GRANT EXECUTE ON FUNCTION search_event_items(
    text, text, text, text, timestamp, timestamp, text[], boolean, boolean, text, text
) TO app_user;
GRANT EXECUTE ON FUNCTION get_event_details(int) TO app_user;
GRANT EXECUTE ON FUNCTION get_campuses() TO app_user;
GRANT EXECUTE ON FUNCTION get_locations(int) TO app_user;
GRANT EXECUTE ON FUNCTION get_venues(int) TO app_user;
GRANT EXECUTE ON FUNCTION get_tags() TO app_user;

-- 2. visitor_role – logged‑in regular user
GRANT SELECT ON event_catalog TO visitor_role;
GRANT SELECT ON event_full_details TO visitor_role;
GRANT EXECUTE ON FUNCTION search_event_items(
    text, text, text, text, timestamp, timestamp, text[], boolean, boolean, text, text
) TO visitor_role;
GRANT EXECUTE ON FUNCTION get_event_details(int) TO visitor_role;
GRANT EXECUTE ON FUNCTION get_campuses() TO visitor_role;
GRANT EXECUTE ON FUNCTION get_locations(int) TO visitor_role;
GRANT EXECUTE ON FUNCTION get_venues(int) TO visitor_role;
GRANT EXECUTE ON FUNCTION get_tags() TO visitor_role;

GRANT EXECUTE ON FUNCTION register_for_event(int, int) TO visitor_role;
GRANT EXECUTE ON FUNCTION cancel_registration(int, int) TO visitor_role;
GRANT EXECUTE ON FUNCTION get_user_profile(int) TO visitor_role;
GRANT EXECUTE ON FUNCTION update_user_details(int, text, text) TO visitor_role;
GRANT EXECUTE ON FUNCTION is_user_registered(int, int) TO visitor_role;

-- 3. editor_role – visitor + can edit event text fields
GRANT SELECT ON event_catalog TO editor_role;
GRANT SELECT ON event_full_details TO editor_role;
GRANT EXECUTE ON FUNCTION search_event_items(
    text, text, text, text, timestamp, timestamp, text[], boolean, boolean, text, text
) TO editor_role;
GRANT EXECUTE ON FUNCTION get_event_details(int) TO editor_role;
GRANT EXECUTE ON FUNCTION get_campuses() TO editor_role;
GRANT EXECUTE ON FUNCTION get_locations(int) TO editor_role;
GRANT EXECUTE ON FUNCTION get_venues(int) TO editor_role;
GRANT EXECUTE ON FUNCTION get_tags() TO editor_role;

GRANT EXECUTE ON FUNCTION register_for_event(int, int) TO editor_role;
GRANT EXECUTE ON FUNCTION cancel_registration(int, int) TO editor_role;
GRANT EXECUTE ON FUNCTION get_user_profile(int) TO editor_role;
GRANT EXECUTE ON FUNCTION update_user_details(int, text, text) TO editor_role;
GRANT EXECUTE ON FUNCTION is_user_registered(int, int) TO editor_role;

-- Editor-specific
GRANT EXECUTE ON FUNCTION edit_event_text_fields(int, int, text, text) TO editor_role;

-- 4. organizer_role – full event management
GRANT SELECT ON event_catalog TO organizer_role;
GRANT SELECT ON event_full_details TO organizer_role;
GRANT SELECT ON event_participation_stats TO organizer_role;
GRANT EXECUTE ON FUNCTION search_event_items(
    text, text, text, text, timestamp, timestamp, text[], boolean, boolean, text, text
) TO organizer_role;
GRANT EXECUTE ON FUNCTION get_event_details(int) TO organizer_role;
GRANT EXECUTE ON FUNCTION get_campuses() TO organizer_role;
GRANT EXECUTE ON FUNCTION get_locations(int) TO organizer_role;
GRANT EXECUTE ON FUNCTION get_venues(int) TO organizer_role;
GRANT EXECUTE ON FUNCTION get_tags() TO organizer_role;

-- Additional browsing needed for event creation: see list of possible secondary organizers
GRANT EXECUTE ON FUNCTION get_organizers() TO organizer_role;

GRANT EXECUTE ON FUNCTION get_user_profile(int) TO organizer_role;
GRANT EXECUTE ON FUNCTION update_user_details(int, text, text) TO organizer_role;
GRANT EXECUTE ON FUNCTION is_user_registered(int, int) TO organizer_role;
GRANT EXECUTE ON FUNCTION edit_event_text_fields(int, int, text, text) TO organizer_role;

-- Organizer-specific event management
GRANT EXECUTE ON FUNCTION create_event(
    int, text, timestamp, timestamp, int, int[], int, text[], text
) TO organizer_role;
GRANT EXECUTE ON FUNCTION delete_event(int, int) TO organizer_role;  -- signature updated
GRANT EXECUTE ON FUNCTION add_editor_to_event(int, int, int) TO organizer_role;
GRANT EXECUTE ON FUNCTION add_tag_to_event(int, int, text) TO organizer_role;  -- signature updated
GRANT EXECUTE ON FUNCTION get_event_participants(int) TO organizer_role;
GRANT EXECUTE ON FUNCTION blacklist_visitor(int, int, int) TO organizer_role;

-- NEW: Allow organizers to see events they are primary organizer of
GRANT EXECUTE ON FUNCTION get_events_of_organizer(int) TO organizer_role;

-- 5. admin_role – superuser (everything above plus admin-only functions)
GRANT SELECT ON event_catalog TO admin_role;
GRANT SELECT ON event_full_details TO admin_role;
GRANT SELECT ON event_participation_stats TO admin_role;
GRANT SELECT ON user_profile TO admin_role;
GRANT SELECT ON user_roles TO admin_role;
GRANT EXECUTE ON FUNCTION search_event_items(
    text, text, text, text, timestamp, timestamp, text[], boolean, boolean, text, text
) TO admin_role;
GRANT EXECUTE ON FUNCTION get_event_details(int) TO admin_role;
GRANT EXECUTE ON FUNCTION get_campuses() TO admin_role;
GRANT EXECUTE ON FUNCTION get_locations(int) TO admin_role;
GRANT EXECUTE ON FUNCTION get_venues(int) TO admin_role;
GRANT EXECUTE ON FUNCTION get_tags() TO admin_role;

GRANT EXECUTE ON FUNCTION register_for_event(int, int) TO admin_role;
GRANT EXECUTE ON FUNCTION cancel_registration(int, int) TO admin_role;
GRANT EXECUTE ON FUNCTION get_user_profile(int) TO admin_role;
GRANT EXECUTE ON FUNCTION update_user_details(int, text, text) TO admin_role;
GRANT EXECUTE ON FUNCTION is_user_registered(int, int) TO admin_role;
GRANT EXECUTE ON FUNCTION edit_event_text_fields(int, int, text, text) TO admin_role;
GRANT EXECUTE ON FUNCTION create_event(
    int, text, timestamp, timestamp, int, int[], int, text[], text
) TO admin_role;
GRANT EXECUTE ON FUNCTION delete_event(int, int) TO admin_role;  -- signature updated
GRANT EXECUTE ON FUNCTION add_editor_to_event(int, int, int) TO admin_role;
GRANT EXECUTE ON FUNCTION add_tag_to_event(int, int, text) TO admin_role;  -- signature updated
GRANT EXECUTE ON FUNCTION get_event_participants(int) TO admin_role;
GRANT EXECUTE ON FUNCTION blacklist_visitor(int, int, int) TO admin_role;

-- Admin-only functions
GRANT EXECUTE ON FUNCTION reset_blacklist(int) TO admin_role;
GRANT EXECUTE ON FUNCTION promote_visitor_to_editor(int) TO admin_role;
GRANT EXECUTE ON FUNCTION promote_visitor_to_organizer(int) TO admin_role;
GRANT EXECUTE ON FUNCTION promote_visitor_to_admin(int) TO admin_role;
GRANT EXECUTE ON FUNCTION promote_organizer_to_admin(int) TO admin_role;
GRANT EXECUTE ON FUNCTION create_campus(text) TO admin_role;
GRANT EXECUTE ON FUNCTION create_location(text, text, text, text, int) TO admin_role;
GRANT EXECUTE ON FUNCTION create_venue(text, int, int) TO admin_role;
GRANT EXECUTE ON FUNCTION delete_campus(int) TO admin_role;
GRANT EXECUTE ON FUNCTION delete_location(int) TO admin_role;
GRANT EXECUTE ON FUNCTION delete_venue(int) TO admin_role;
GRANT EXECUTE ON FUNCTION get_visitors() TO admin_role;
GRANT EXECUTE ON FUNCTION get_organizers() TO admin_role;
GRANT EXECUTE ON FUNCTION get_blacklists() TO admin_role;

-- Full table access for admin (back‑end maintenance)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO admin_role;


/* =========================================================
   INDEXES
   ========================================================= */

-- 1. event table
-- GiST index for fast time‑clash detection (trigger: prevent_event_time_clash)
CREATE INDEX IF NOT EXISTS idx_event_venue_time_range
    ON event USING gist (venue_id, tsrange(start_time, finish_time, '[)'));

-- B‑tree indexes for common filters and joins
CREATE INDEX IF NOT EXISTS idx_event_organizer ON event (organizer_id);
CREATE INDEX IF NOT EXISTS idx_event_start_time ON event (start_time);
CREATE INDEX IF NOT EXISTS idx_event_venue_id ON event (venue_id);   -- supports join + FK

-- GIN trigram indexes for substring search on name and description
CREATE INDEX IF NOT EXISTS idx_event_name_trgm
    ON event USING gin (lower(name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_event_description_trgm
    ON event USING gin (lower(description) gin_trgm_ops);

-- 2. venue table
CREATE INDEX IF NOT EXISTS idx_venue_location ON venue (location_id);

-- 3. location table
CREATE INDEX IF NOT EXISTS idx_location_campus ON location (campus_id);

-- 4. visitor table
CREATE INDEX IF NOT EXISTS idx_visitor_strike_count ON visitor (strike_count);

-- 5. visitor_of table (junction)
CREATE INDEX IF NOT EXISTS idx_visitor_of_event ON visitor_of (event_id);
CREATE INDEX IF NOT EXISTS idx_visitor_of_visitor ON visitor_of (visitor_id);

-- 6. secondary_organizers table (junction)
-- primary key (event_id, organizer_id) already provides an index, but we also add reverse for lookups by organizer
CREATE INDEX IF NOT EXISTS idx_secondary_organizers_organizer ON secondary_organizers (organizer_id);

-- 7. editor_of table (junction)
CREATE INDEX IF NOT EXISTS idx_editor_of_editor ON editor_of (editor_id);

-- 8. tagged_with table (junction)
-- primary key (event_id, tag_name) covers event_id lookups; add index for tag-based reverse lookups
CREATE INDEX IF NOT EXISTS idx_tagged_with_tag ON tagged_with (tag_name);

-- 9. tag table – no extra indexes needed (primary key)

-- 10. user_info – username already has unique index, other columns not heavily filtered
-- 11. role tables (admin, organizer, editor, visitor) – primary keys are sufficient
