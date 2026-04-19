from pydantic import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL = "postgresql_url"
    DATABASE_NAME = "eagledb"
    
    class Config:
        env_file = ".env"
    
settings = Settings()