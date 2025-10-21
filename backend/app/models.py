from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Numeric, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from pgvector.sqlalchemy import Vector
from app.database import Base

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    price_monthly = Column(Numeric(10, 2), nullable=False, default=0)
    price_yearly = Column(Numeric(10, 2), nullable=False, default=0)
    max_jobs = Column(Integer, nullable=False, default=-1)
    max_pages_per_job = Column(Integer, nullable=False, default=-1)
    max_storage_mb = Column(Integer, nullable=False, default=-1)
    features = Column(JSONB, default=[])
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    users = relationship("User", back_populates="subscription_plan")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    clerk_user_id = Column(String(255), unique=True, index=True, nullable=True)
    full_name = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    avatar_url = Column(Text, nullable=True)
    preferences = Column(JSONB, default={})
    subscription_plan_id = Column(Integer, ForeignKey("subscription_plans.id"), default=1)
    subscription_status = Column(String(20), default="active")
    subscription_expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    scraping_jobs = relationship("ScrapingJob", back_populates="user")
    subscription_plan = relationship("SubscriptionPlan", back_populates="users")

class ScrapingJob(Base):
    __tablename__ = "scraping_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    website_url = Column(String, nullable=False)
    job_name = Column(String, nullable=False)
    status = Column(String, default="pending")
    depth = Column(Integer, default=2, nullable=False)
    auth_credentials = Column(Text, nullable=True)
    pages_found = Column(Integer, default=0)
    pages_scraped = Column(Integer, default=0)
    current_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="scraping_jobs")
    scraped_data = relationship("ScrapedData", back_populates="job", cascade="all, delete-orphan")

class ScrapedData(Base):
    __tablename__ = "scraped_data"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("scraping_jobs.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    url = Column(String, nullable=False)
    embedding = Column(Vector(768))
    extra_metadata = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    job = relationship("ScrapingJob", back_populates="scraped_data")

class ScrapedPage(Base):
    __tablename__ = "scraped_pages"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("scraping_jobs.id", ondelete="CASCADE"), nullable=False)
    url = Column(Text, nullable=False)
    status = Column(String, default="pending")  # pending, in_progress, completed, failed
    depth = Column(Integer, default=0)
    content_length = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())

class ChatInteraction(Base):
    __tablename__ = "chat_interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("scraping_jobs.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    response_time_ms = Column(Integer, nullable=True)
    sources_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UsageMetrics(Base):
    __tablename__ = "usage_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    job_id = Column(Integer, ForeignKey("scraping_jobs.id", ondelete="CASCADE"), nullable=True)
    metric_type = Column(String(50), nullable=False)
    metric_value = Column(Integer, nullable=False, default=0)
    date = Column(Date, nullable=False, server_default=func.current_date())

