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

    def get_profile_details(self, user_id):
        return self.call_function_one("get_user_profile", user_id)

    def update_user_details(self, user_id, name, phone_no):
        return self.call_function_one("update_user_details", user_id, name, phone_no)

    def is_user_regsitered(self, user_id, event_id):
        return self.call_scalar_function("is_user_registered",user_id,event_id)

    def register_for_event(self, user_id, event_id):
        return self.call_function_one("register_for_event",user_id, event_id)

    def cancel_registration(self, user_id, event_id):
        return self.call_function_one("cancel_registration",user_id, event_id)
    
    def get_event_details(self,event_id):
        return self.call_function_one("get_event_details",event_id)
    
    def edit_event_details(self, user_id, event_id, name, description):
        return self.call_function_one("edit_event_text_fields",user_id, event_id, name, description)
#     def signup_user(self, name, username, password, email_id, phone_no):
#         hashed_password = password
#         return self.call_function(
#             "signup_user", name, username, hashed_password, email_id, phone_no
#         )

#     def signin_user(self, username, password):
#         hashed_password = password
#         return self.call_function_rows("signin_user", username, hashed_password)

#     def search_events(self, campus_name, venue_name, location_name, organizer_username, start_after, finish_before, tags, require_all_tags, is_full, title_substring, description_substring):
#         return self.call_function_rows("search_events", campus_name, venue_name, location_name, organizer_username, start_after, finish_before, tags, require_all_tags, is_full, title_substring, description_substring)

#     def filter_values(self):
#         return self.call_function_rows("filter_values")

#     def update_user_details(self, name, username, password, email_id, phone_no):
#         hashed_password = password
#         return self.call_function(
#             "signup_user", name, username, hashed_password, email_id, phone_no
#         )

#     def is_blacklisted(self, user_id):
#         return self.call_function("is_blacklisted", user_id)

#     def is_organizer(self, user_id):
#         return self.call_function("is_organizer", user_id)

#     def is_editor(self, user_id):
#         return self.call_function("is_editor", user_id)

#     def is_admin(self, user_id):
#         return self.call_function("is_admin", user_id)

#     def can_manage_event(self, user_id, event_id):
#         return self.call("can_manage_event", user_id, event_id)

#     def can_edit_event(self, user_id, event_id):
#         return self.call("can_edit_event", user_id, event_id)

#     def cancel_registration(self, user_id, event_id):
#         return self.call("cancel_registration", user_id, event_id)

#     def edit_event_text_fields(self, user_id, event_id, new_name, new_description):
#         return self.call(
#             "edit_event_text_fields", user_id, event_id, new_name, new_description
#         )

#     def create_event(
#         self,
#         organizer_id,
#         name,
#         start_time,
#         finish_time,
#         venue_id,
#         description,
#         capacity,
#     ):
#         return self.call_function(
#             "create_event",
#             organizer_id,
#             name,
#             start_time,
#             finish_time,
#             venue_id,
#             description,
#             capacity,
#         )

#     def delete_event(self, user_id, event_id):
#         return self.call_function("delete_event", user_id, event_id)

#     def add_editor_to_event(self, user_id, event_id, visitor_id):
#         return self.call_function("add_editor_to_event", user_id, event_id, visitor_id)

#     def add_tag_to_event(self, user_id, event_id, tag_name):
#         return self.call_function("add_tag_to_event", user_id, event_id, tag_name)

#     def remove_tag_from_event(self, user_id, event_id, tag_name):
#         return self.call_function("remove_tag_from_event", user_id, event_id, tag_name)

#     def get_event_participation(self, user_id, event_id):
#         return self.call_function("get_event_participation", user_id, event_id)

#     def blacklist_visitor(self, user_id, visitor_id, event_id):
#         return self.call_function(user_id, visitor_id, event_id)

#     def reset_blacklist(self, admin_id, visitor_id):
#         return self.call_function("reset_blacklist", admin_id, visitor_id)

#     def create_location(self, admin_id, name, landmark, coordinates, campus_id):
#         return self.call_function(
#             "create_location", admin_id, name, landmark, coordinates, campus_id
#         )

#     def create_venue(self, admin_id, name, capacity, location_id):
#         return self.call_function("create_venue", admin_id, name, capacity, location_id)

#     def promote_visitor_to_editor(self, admin_id, user_id):
#         return self.call_function("promote_visitor_to_editor", admin_id, user_id)

#     def promote_visitor_to_organizer(self, admin_id, user_id):
#         return self.call_function("promote_visitor_to_organizer", admin_id, user_id)

#     def promote_visitor_to_admin(self, admin_id, user_id):
#         return self.call_function("promote_visitor_to_admin", admin_id, user_id)

#     def promote_organizer_to_admin(self, admin_id, user_id):
#         return self.call_function("promote_organizer_to_admin", admin_id, user_id)



db = PGConnect()
