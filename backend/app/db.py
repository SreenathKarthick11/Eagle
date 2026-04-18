from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row
from app.core.config import settings

pool = ConnectionPool(
    conninfo=settings.DATABASE_NAME,
    min_size=2,
    max_size=20,
    kwargs={"row_factory": dict_row},
)

def get_connection():
    return pool.connection()

