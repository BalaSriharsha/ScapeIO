from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from typing import List
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User, ScrapingJob, ScrapedData, ChatInteraction, UsageMetrics
from app.schemas import JobAnalyticsResponse, UserAnalyticsResponse
from app.clerk_security import get_current_user_from_clerk as get_current_user

router = APIRouter()

@router.get("/jobs/{job_id}/analytics", response_model=JobAnalyticsResponse)
async def get_job_analytics(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics for a specific job"""
    # Verify job belongs to user
    job = db.query(ScrapingJob).filter(
        ScrapingJob.id == job_id,
        ScrapingJob.user_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Total interactions
    total_interactions = db.query(func.count(ChatInteraction.id)).filter(
        ChatInteraction.job_id == job_id
    ).scalar() or 0
    
    # Unique users (for embedded chatbot)
    unique_users = db.query(func.count(distinct(ChatInteraction.user_id))).filter(
        ChatInteraction.job_id == job_id,
        ChatInteraction.user_id.isnot(None)
    ).scalar() or 0
    
    # Average response time
    avg_response_time = db.query(func.avg(ChatInteraction.response_time_ms)).filter(
        ChatInteraction.job_id == job_id
    ).scalar() or 0
    
    # Calculate embedding storage (vector size * number of embeddings)
    # Each embedding is 768 floats * 4 bytes = 3072 bytes
    embedding_count = db.query(func.count(ScrapedData.id)).filter(
        ScrapedData.job_id == job_id
    ).scalar() or 0
    embedding_storage_mb = (embedding_count * 768 * 4) / (1024 * 1024)
    
    # Total content size
    total_content_size = db.query(func.sum(func.length(ScrapedData.content))).filter(
        ScrapedData.job_id == job_id
    ).scalar() or 0
    total_content_mb = total_content_size / (1024 * 1024)
    
    # Top questions (last 10 unique questions)
    top_questions_raw = db.query(
        ChatInteraction.message,
        func.count(ChatInteraction.id).label('count')
    ).filter(
        ChatInteraction.job_id == job_id
    ).group_by(
        ChatInteraction.message
    ).order_by(
        func.count(ChatInteraction.id).desc()
    ).limit(10).all()
    
    top_questions = [
        {"question": q.message, "count": q.count}
        for q in top_questions_raw
    ]
    
    # Interactions over time (last 7 days)
    seven_days_ago = datetime.now() - timedelta(days=7)
    interactions_by_day = db.query(
        func.date(ChatInteraction.created_at).label('date'),
        func.count(ChatInteraction.id).label('count')
    ).filter(
        ChatInteraction.job_id == job_id,
        ChatInteraction.created_at >= seven_days_ago
    ).group_by(
        func.date(ChatInteraction.created_at)
    ).order_by('date').all()
    
    interactions_over_time = [
        {"date": str(item.date), "count": item.count}
        for item in interactions_by_day
    ]
    
    return JobAnalyticsResponse(
        total_interactions=total_interactions,
        unique_users=unique_users,
        avg_response_time_ms=float(avg_response_time),
        embedding_storage_mb=float(embedding_storage_mb),
        total_content_mb=float(total_content_mb),
        top_questions=top_questions,
        interactions_over_time=interactions_over_time
    )

@router.get("/user/analytics", response_model=UserAnalyticsResponse)
async def get_user_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get overall analytics for current user"""
    # Total jobs
    total_jobs = db.query(func.count(ScrapingJob.id)).filter(
        ScrapingJob.user_id == current_user.id
    ).scalar() or 0
    
    # Total interactions across all jobs
    total_interactions = db.query(func.count(ChatInteraction.id)).filter(
        ChatInteraction.user_id == current_user.id
    ).scalar() or 0
    
    # Get all job IDs for this user
    job_ids = db.query(ScrapingJob.id).filter(
        ScrapingJob.user_id == current_user.id
    ).all()
    job_ids = [job_id[0] for job_id in job_ids]
    
    # Total storage (embedding + content)
    if job_ids:
        embedding_count = db.query(func.count(ScrapedData.id)).filter(
            ScrapedData.job_id.in_(job_ids)
        ).scalar() or 0
        embedding_storage_mb = (embedding_count * 768 * 4) / (1024 * 1024)
        
        total_content_size = db.query(func.sum(func.length(ScrapedData.content))).filter(
            ScrapedData.job_id.in_(job_ids)
        ).scalar() or 0
        content_storage_mb = total_content_size / (1024 * 1024)
        
        total_storage_mb = embedding_storage_mb + content_storage_mb
        
        # Total API calls (interactions + embeddings generated)
        total_api_calls = total_interactions + embedding_count
    else:
        total_storage_mb = 0
        total_api_calls = 0
    
    # Monthly trends (last 6 months)
    six_months_ago = datetime.now() - timedelta(days=180)
    monthly_jobs = db.query(
        func.date_trunc('month', ScrapingJob.created_at).label('month'),
        func.count(ScrapingJob.id).label('job_count')
    ).filter(
        ScrapingJob.user_id == current_user.id,
        ScrapingJob.created_at >= six_months_ago
    ).group_by('month').order_by('month').all()
    
    monthly_trends = [
        {
            "month": str(item.month.date()) if item.month else "",
            "jobs": item.job_count
        }
        for item in monthly_jobs
    ]
    
    return UserAnalyticsResponse(
        total_jobs=total_jobs,
        total_interactions=total_interactions,
        total_storage_mb=float(total_storage_mb),
        total_api_calls=total_api_calls,
        monthly_trends=monthly_trends
    )

