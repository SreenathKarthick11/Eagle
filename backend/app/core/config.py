from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql_url"
    DATABASE_NAME: str = "postgresql://postgres:postgres@/eagle_db"
    class Config:
        env_file = ".env"
    
settings = Settings()