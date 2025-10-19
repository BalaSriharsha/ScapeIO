from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime, date
from decimal import Decimal

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    subscription_plan_id: Optional[int] = None
    subscription_status: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: Optional[dict] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ScrapingJobCreate(BaseModel):
    website_url: str
    job_name: str
    depth: int = Field(default=2, ge=1, le=5)
    auth_credentials: Optional[dict] = None

class ScrapingJobResponse(BaseModel):
    id: int
    user_id: int
    website_url: str
    job_name: str
    status: str
    depth: int
    pages_found: int
    pages_scraped: int
    current_url: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    error_message: Optional[str]
    
    class Config:
        from_attributes = True

class ScrapedPageResponse(BaseModel):
    id: int
    job_id: int
    url: str
    status: str
    depth: int
    content_length: int
    error_message: Optional[str]
    scraped_at: datetime
    
    class Config:
        from_attributes = True

class ChatbotEmbedRequest(BaseModel):
    job_id: int

class ChatbotEmbedResponse(BaseModel):
    embed_code: str
    job_id: int

class ChatRequest(BaseModel):
    job_id: int
    message: str
    conversation_history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    response: str
    sources: List[str]

class SubscriptionPlanResponse(BaseModel):
    id: int
    name: str
    display_name: str
    price_monthly: Decimal
    price_yearly: Decimal
    max_jobs: int
    max_pages_per_job: int
    max_storage_mb: int
    features: List[str]
    is_active: bool
    
    class Config:
        from_attributes = True

class EnterpriseContactRequest(BaseModel):
    name: str
    email: EmailStr
    company: str
    message: str

class JobAnalyticsResponse(BaseModel):
    total_interactions: int
    unique_users: int
    avg_response_time_ms: float
    embedding_storage_mb: float
    total_content_mb: float
    top_questions: List[dict]
    interactions_over_time: List[dict]

class UserAnalyticsResponse(BaseModel):
    total_jobs: int
    total_interactions: int
    total_storage_mb: float
    total_api_calls: int
    monthly_trends: List[dict]
