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


def get_connection():
    return pool.connection()


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

    def fetch_one(
        self, query: str, params: Optional[Sequence[Any]] = None
    ) -> Optional[dict]:
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, params or ())
                row = cur.fetchone()
                return dict(row) if row else None

    def fetch_all(
        self, query: str, params: Optional[Sequence[Any]] = None
    ) -> list[dict]:
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, params or ())
                rows = cur.fetchall()
                return [dict(r) for r in rows]

    def execute(self, query: str, params: Optional[Sequence[Any]] = None) -> None:
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, params or ())
                conn.commit()

    def call_function(
        self, function_name: str, *args: Any, schema: str = "public"
    ) -> Any:
        """
        Call a PostgreSQL function and return its first column value.
        Example:
            helper.call_function("add_numbers", 5, 7)
        """
        placeholders = sql.SQL(", ").join(sql.Placeholder() for _ in args)

        query = sql.SQL("SELECT {}.{}({})").format(
            sql.Identifier(schema),
            sql.Identifier(function_name),
            placeholders,
        )

        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, args)
                row = cur.fetchone()
                return row[0] if row else None

    def call_procedure(
        self, procedure_name: str, *args: Any, schema: str = "public"
    ) -> None:
        """
        Call a PostgreSQL procedure.
        Example:
            helper.call_procedure("register_event", 12, 45)
        """
        placeholders = sql.SQL(", ").join(sql.Placeholder() for _ in args)

        query = sql.SQL("CALL {}.{}({})").format(
            sql.Identifier(schema),
            sql.Identifier(procedure_name),
            placeholders,
        )

        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, args)
                conn.commit()

    """
        Error handling for the database responses is done in the routing layer
    """

    def signup_user(self, name, username, password, email_id, phone_no):
        hashed_password = password
        return self.call_function(
            "signup_user", name, username, hashed_password, email_id, phone_no
        )

    def signin_user(self, username, password):
        hashed_password = password
        return self.call_function("signin_user", username, hashed_password)

    def update_user_details(self, name, username, password, email_id, phone_no):
        hashed_password = password
        return self.call_function(
            "signup_user", name, username, hashed_password, email_id, phone_no
        )

    def is_blacklisted(self, user_id):
        return self.call_function("is_blacklisted", user_id)

    def is_organizer(self, user_id):
        return self.call_function("is_organizer", user_id)

    def is_editor(self, user_id):
        return self.call_function("is_editor", user_id)

    def is_admin(self, user_id):
        return self.call_function("is_admin", user_id)

    def can_manage_event(self, user_id, event_id):
        return self.call("can_manage_event", user_id, event_id)

    def can_edit_event(self, user_id, event_id):
        return self.call("can_edit_event", user_id, event_id)

    def cancel_registration(self, user_id, event_id):
        return self.call("cancel_registration", user_id, event_id)

    def edit_event_text_fields(self, user_id, event_id, new_name, new_description):
        return self.call(
            "edit_event_text_fields", user_id, event_id, new_name, new_description
        )

    def create_event(
        self,
        organizer_id,
        name,
        start_time,
        finish_time,
        venue_id,
        description,
        capacity,
    ):
        return self.call_function(
            "create_event",
            organizer_id,
            name,
            start_time,
            finish_time,
            venue_id,
            description,
            capacity,
        )

    def delete_event(self, user_id, event_id):
        return self.call_function("delete_event", user_id, event_id)

    def add_editor_to_event(self, user_id, event_id, visitor_id):
        return self.call_function("add_editor_to_event", user_id, event_id, visitor_id)

    def add_tag_to_event(self, user_id, event_id, tag_name):
        return self.call_function("add_tag_to_event", user_id, event_id, tag_name)

    def remove_tag_from_event(self, user_id, event_id, tag_name):
        return self.call_function("remove_tag_from_event", user_id, event_id, tag_name)

    def get_event_participation(self, user_id, event_id):
        return self.call_function("get_event_participation", user_id, event_id)

    def blacklist_visitor(self, user_id, visitor_id, event_id):
        return self.call_function(user_id, visitor_id, event_id)

    def reset_blacklist(self, admin_id, visitor_id):
        return self.call_function("reset_blacklist", admin_id, visitor_id)

    def create_location(self, admin_id, name, landmark, coordinates, campus_id):
        return self.call_function(
            "create_location", admin_id, name, landmark, coordinates, campus_id
        )

    def create_venue(self, admin_id, name, capacity, location_id):
        return self.call_function("create_venue", admin_id, name, capacity, location_id)

    def promote_visitor_to_editor(self, admin_id, user_id):
        return self.call_function("promote_visitor_to_editor", admin_id, user_id)
    
    def promote_visitor_to_organizer(self, admin_id, user_id):
        return self.call_function("promote_visitor_to_organizer", admin_id, user_id)
    
    def promote_visitor_to_admin(self, admin_id, user_id):
        return self.call_function("promote_visitor_to_admin", admin_id, user_id)
    
    def promote_organizer_to_admin(self, admin_id, user_id):
        return self.call_function("promote_organizer_to_admin", admin_id, user_id)

    