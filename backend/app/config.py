from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days (30 * 24 * 60)
    GEMINI_API_KEY: Optional[str] = None
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Clerk Configuration
    CLERK_PUBLISHABLE_KEY: Optional[str] = None
    CLERK_SECRET_KEY: Optional[str] = None
    CLERK_WEBHOOK_SECRET: Optional[str] = None
    CLERK_DOMAIN: Optional[str] = None
    
    class Config:
        env_file = ".env"

settings = Settings()

