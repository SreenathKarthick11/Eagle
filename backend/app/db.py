from contextlib import contextmanager
from typing import Any, Optional, Sequence
import psycopg
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row
from app.core.config import settings
from psycopg import sql

pool = ConnectionPool(
    conninfo=settings.DATABASE_NAME,
    min_size=2,
    max_size=20,
    kwargs={"row_factory": dict_row},
)


# def get_connection():
#     return pool.connection()


# from contextlib import contextmanager
# from typing import Any, Optional, Sequence

# from psycopg import sql
# from psycopg.rows import dict_row
# from psycopg_pool import ConnectionPool

# from app.core.config import settings


class PGConnect:
    def __init__(self, dsn: str = settings.DATABASE_NAME):
        self.pool = ConnectionPool(
            conninfo=dsn,
            min_size=1,
            max_size=10,
            kwargs={"row_factory": dict_row},
        )

    def close(self) -> None:
        self.pool.close()

    @contextmanager
    def _role_connection(self, role: str = "postgres"):
        with self.pool.connection() as conn:
            conn.autocommit = True
            with conn.cursor() as cur:
                cur.execute(sql.SQL("SET ROLE {}").format(sql.Identifier(role)))
            try:
                yield conn
            finally:
                with conn.cursor() as cur:
                    cur.execute("RESET ROLE")

    def fetch_one(
        self,
        query: str,
        params: Optional[Sequence[Any]] = None,
        role: str = "postgres",
    ) -> Optional[dict[str, Any]]:
        with self._role_connection(role) as conn:
            with conn.cursor() as cur:
                cur.execute(query, params or ())
                row = cur.fetchone()
                return dict(row) if row else None

    def fetch_all(
        self,
        query: str,
        params: Optional[Sequence[Any]] = None,
        role: str = "postgres",
    ) -> list[dict[str, Any]]:
        with self._role_connection(role) as conn:
            with conn.cursor() as cur:
                cur.execute(query, params or ())
                rows = cur.fetchall()
                return [dict(row) for row in rows]

    def execute(
        self,
        query: str,
        params: Optional[Sequence[Any]] = None,
        role: str = "postgres",
    ) -> None:
        with self._role_connection(role) as conn:
            with conn.cursor() as cur:
                cur.execute(query, params or ())

    def call_function_one(
        self,
        function_name: str,
        *args: Any,
        schema: str = "public",
        role: str = "postgres",
    ) -> Optional[dict[str, Any]]:
        """
        For PostgreSQL functions that return exactly one row.
        """
        placeholders = sql.SQL(", ").join(sql.Placeholder() for _ in args)

        query = sql.SQL("SELECT * FROM {}.{}({})").format(
            sql.Identifier(schema),
            sql.Identifier(function_name),
            placeholders,
        )

        with self._role_connection(role) as conn:
            with conn.cursor() as cur:
                cur.execute(query, args)
                row = cur.fetchone()
                return dict(row) if row else None

    def call_function_rows(
        self,
        function_name: str,
        *args: Any,
        schema: str = "public",
        role: str = "postgres",
    ) -> list[dict[str, Any]]:
        """
        For PostgreSQL functions that return multiple rows.
        """
        placeholders = sql.SQL(", ").join(sql.Placeholder() for _ in args)

        query = sql.SQL("SELECT * FROM {}.{}({})").format(
            sql.Identifier(schema),
            sql.Identifier(function_name),
            placeholders,
        )

        with self._role_connection(role) as conn:
            with conn.cursor() as cur:
                cur.execute(query, args)
                rows = cur.fetchall()
                return [dict(row) for row in rows]

    def call_scalar_function(
        self,
        function_name: str,
        *args: Any,
        schema: str = "public",
        role: str = "postgres",
    ) -> Any:
        """
        For PostgreSQL functions that return a single scalar value.
        """
        placeholders = sql.SQL(", ").join(sql.Placeholder() for _ in args)

        query = sql.SQL("SELECT {}.{}({}) AS result").format(
            sql.Identifier(schema),
            sql.Identifier(function_name),
            placeholders,
        )

        with self._role_connection(role) as conn:
            with conn.cursor() as cur:
                cur.execute(query, args)
                row = cur.fetchone()
                return row["result"] if row else None

    def get_campuses(self):
        return self.call_function_rows("get_campuses")

    def get_locations(self, campus_id=None):
        return self.call_function_rows("get_locations", campus_id)

    def get_venues(self, location_id=None):
        return self.call_function_rows("get_venues", location_id)

    def get_tags(self):
        return self.call_function_rows("get_tags")

    def signup_user(self, name, username, password, email_id, phone_no):
        hashed_password = password
        return self.call_function_one(
            "signup_user", name, username, hashed_password, email_id, phone_no
        )

    def signin_user(self, username, password):
        hashed_password = password
        return self.call_function_one("signin_user", username, hashed_password)

    def search_events(
        self,
        campus_name,
        venue_name,
        location_name,
        organizer_username,
        start_after,
        finish_before,
        tags,
        require_all_tags,
        is_full,
        title_substring,
        description_substring,
    ):
        return self.call_function_rows(
            "search_events",
            campus_name,
            venue_name,
            location_name,
            organizer_username,
            start_after,
            finish_before,
            tags,
            require_all_tags,
            is_full,
            title_substring,
            description_substring,
        )

    def search_event_items(
        self,
        campus_name,
        venue_name,
        location_name,
        organizer_username,
        start_after,
        finish_before,
        tags,
        require_all_tags,
        is_full,
        title_substring,
        description_substring,
    ):
        return self.call_function_rows(
            "search_event_items",
            campus_name,
            venue_name,
            location_name,
            organizer_username,
            start_after,
            finish_before,
            tags,
            require_all_tags,
            is_full,
            title_substring,
            description_substring,
        )

    def get_user_profile(self, user_id):
        return self.call_function_one("get_user_profile", user_id)

    def update_user_details(self, user_id, name, phone_no, role="postgres"):
        return self.call_function_one(
            "update_user_details", user_id, name, phone_no, role=role
        )

    def is_user_regsitered(self, user_id, event_id):
        return self.call_scalar_function("is_user_registered", user_id, event_id)

    def register_for_event(self, user_id, event_id, role="postgres"):
        return self.call_function_one(
            "register_for_event", user_id, event_id, role=role
        )

    def cancel_registration(self, user_id, event_id, role="postgres"):
        return self.call_function_one(
            "cancel_registration", user_id, event_id, role=role
        )

    def get_event_details(self, event_id):
        return self.call_function_one("get_event_details", event_id)

    def edit_event_details(self, user_id, event_id, name, description, role="role"):
        return self.call_function_one(
            "edit_event_text_fields", user_id, event_id, name, description, role=role
        )

    def create_campus(self, campus_name, role="postgres"):
        return self.call_function_one("create_campus", campus_name, role=role)

    def create_location(
        self, location_name, landmark, latitude, longitude, campus_id, role="postgres"
    ):
        return self.call_function_one(
            "create_location",
            location_name,
            landmark,
            latitude,
            longitude,
            campus_id,
            role=role,
        )

    def create_venue(self, venue_name, capacity, location_id, role="postgres"):
        return self.call_function_one("create_venue", venue_name, capacity, location_id, role=role)

    def delete_campus(self, campus_id, role="postgres"):
        return self.call_function_one("delete_campus", campus_id, role=role)

    def delete_location(self, location_id, role="postgres"):
        return self.call_function_one("delete_location", location_id, role=role)

    def delete_venue(self, venue_id, role="postgres"):
        return self.call_function_one("delete_venue", venue_id, role=role)

    def get_organizers(self):
        return self.call_function_rows("get_organizers")

    def get_visitors(self):
        return self.call_function_rows("get_visitors")

    def get_blacklists(self, role="postgres"):
        return self.call_function_rows("get_blacklists", role=role)

    def blacklist_visitor(self, user_id, visitor_id, event_id, role="postgres"):
        return self.call_function_one(
            "blacklist_visitor", user_id, visitor_id, event_id, role=role
        )

    def reset_blacklist(self, user_id, role="postgres"):
        return self.call_function_one("reset_blacklist", user_id, role=role)

    def create_event(
        self,
        user_id,
        name,
        start_time,
        finish_time,
        venue_id,
        secondary_organizer_ids,
        capacity,
        tags,
        description,
        role="postgres"
    ):
        self.call_function_one(
            "create_event",
            user_id,
            name,
            start_time,
            finish_time,
            venue_id,
            secondary_organizer_ids,
            capacity,
            tags,
            description,
            role=role
        )

    def delete_event(self, event_id, role="postgres"):
        return self.call_function_one("delete_event", event_id, role=role)

    def get_events_of_organizer(self, organizer_id):
        return self.call_function_rows("get_events_of_organizer", organizer_id)

    def get_event_participants(self, event_id: Optional[int] = None):
        return self.call_function_rows("get_event_participants", event_id)

    def promote_visitor_to_editor(self, user_id, role="postgres"):
        return self.call_function_one("promote_visitor_to_editor", user_id, role=role)

    def promote_visitor_to_organizer(self, user_id, role="postgres"):
        return self.call_function_one("promote_visitor_to_organizer", user_id, role=role)

    def promote_visitor_to_admin(self, user_id, role="postgres"):
        return self.call_function_one("promote_visitor_to_admin", user_id, role=role)

    def promote_organizer_to_admin(self, user_id, role="postgres"):
        return self.call_function_one("promote_organizer_to_admin", user_id, role=role)



db = PGConnect()
