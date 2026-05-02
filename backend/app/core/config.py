from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql_url"
    DATABASE_NAME: str = "postgresql://app_user:brrs__app_user@localhost:5432/eagle"
    
    class Config:
        env_file = ".env"
    
settings = Settings()