from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models import User, ScrapingJob, ScrapedPage, ScrapedData, SubscriptionPlan
from app.schemas import ScrapingJobCreate, ScrapingJobResponse, ScrapedPageResponse
from app.clerk_security import get_current_user_from_clerk as get_current_user
from app.services.scraper_service import start_scraping_job
from app.services.markdown_service import create_markdown_document, create_single_page_markdown
from app.utils.encryption import encrypt_credentials

router = APIRouter()

@router.post("/jobs", response_model=ScrapingJobResponse, status_code=status.HTTP_201_CREATED)
async def create_scraping_job(
    job_data: ScrapingJobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get user's subscription plan
    subscription_plan = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.id == current_user.subscription_plan_id
    ).first()
    
    if not subscription_plan:
        # Default to free plan if not set
        subscription_plan = db.query(SubscriptionPlan).filter(
            SubscriptionPlan.name == "free"
        ).first()
    
    # Check job count limit
    if subscription_plan.max_jobs != -1:  # -1 means unlimited
        current_job_count = db.query(func.count(ScrapingJob.id)).filter(
            ScrapingJob.user_id == current_user.id
        ).scalar()
        
        if current_job_count >= subscription_plan.max_jobs:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Job limit reached. Your {subscription_plan.display_name} plan allows {subscription_plan.max_jobs} jobs. Upgrade to create more jobs."
            )
    
    # Check storage limit
    if subscription_plan.max_storage_mb != -1:  # -1 means unlimited
        # Get all job IDs for this user
        job_ids = db.query(ScrapingJob.id).filter(
            ScrapingJob.user_id == current_user.id
        ).all()
        job_ids = [job_id[0] for job_id in job_ids]
        
        if job_ids:
            # Calculate current storage (embedding + content)
            embedding_count = db.query(func.count(ScrapedData.id)).filter(
                ScrapedData.job_id.in_(job_ids)
            ).scalar() or 0
            embedding_storage_mb = (embedding_count * 768 * 4) / (1024 * 1024)
            
            total_content_size = db.query(func.sum(func.length(ScrapedData.content))).filter(
                ScrapedData.job_id.in_(job_ids)
            ).scalar() or 0
            content_storage_mb = total_content_size / (1024 * 1024)
            
            current_storage_mb = embedding_storage_mb + content_storage_mb
            
            if current_storage_mb >= subscription_plan.max_storage_mb:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Storage limit reached. Your {subscription_plan.display_name} plan allows {subscription_plan.max_storage_mb} MB. Current usage: {int(current_storage_mb)} MB. Upgrade for more storage."
                )
    
    # Check pages per job limit
    if subscription_plan.max_pages_per_job != -1:  # -1 means unlimited
        if job_data.depth > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum depth allowed for {subscription_plan.display_name} plan is 5"
            )
    
    # Encrypt credentials if provided
    encrypted_creds = None
    if job_data.auth_credentials:
        encrypted_creds = encrypt_credentials(job_data.auth_credentials)
    
    new_job = ScrapingJob(
        user_id=current_user.id,
        website_url=job_data.website_url,
        job_name=job_data.job_name,
        depth=job_data.depth,
        auth_credentials=encrypted_creds,
        status="pending"
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    # Start scraping in a separate process to avoid blocking the server
    start_scraping_job(new_job.id)
    
    return new_job

@router.get("/jobs", response_model=List[ScrapingJobResponse])
async def get_scraping_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    jobs = db.query(ScrapingJob).filter(ScrapingJob.user_id == current_user.id).order_by(ScrapingJob.created_at.desc()).all()
    return jobs

@router.get("/jobs/{job_id}", response_model=ScrapingJobResponse)
async def get_scraping_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(ScrapingJob).filter(
        ScrapingJob.id == job_id,
        ScrapingJob.user_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return job

@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scraping_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(ScrapingJob).filter(
        ScrapingJob.id == job_id,
        ScrapingJob.user_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    db.delete(job)
    db.commit()
    return None

@router.get("/jobs/{job_id}/pages", response_model=List[ScrapedPageResponse])
async def get_job_pages(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
    
    # Get all pages for this job
    pages = db.query(ScrapedPage).filter(
        ScrapedPage.job_id == job_id
    ).order_by(ScrapedPage.depth, ScrapedPage.scraped_at).all()
    
    return pages

@router.get("/jobs/{job_id}/export/markdown")
async def export_job_as_markdown(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export a completed scraping job as a markdown file"""
    
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
    
    if job.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job must be completed before exporting"
        )
    
    # Get all scraped data for this job
    scraped_data = db.query(ScrapedData).filter(
        ScrapedData.job_id == job_id
    ).all()
    
    if not scraped_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No scraped data found for this job"
        )
    
    # Get pages with their depth information
    pages_data = []
    for data in scraped_data:
        # Find corresponding page info
        page_info = db.query(ScrapedPage).filter(
            ScrapedPage.job_id == job_id,
            ScrapedPage.url == data.url
        ).first()
        
        pages_data.append({
            'url': data.url,
            'content': data.content,
            'depth': page_info.depth if page_info else 0
        })
    
    # Sort by depth and URL
    pages_data.sort(key=lambda x: (x['depth'], x['url']))
    
    # Create markdown document
    markdown_content = create_markdown_document(
        job_name=job.job_name,
        website_url=job.website_url,
        scraped_pages=pages_data,
        include_metadata=True
    )
    
    # Create safe filename
    safe_filename = "".join(c for c in job.job_name if c.isalnum() or c in (' ', '-', '_')).strip()
    safe_filename = safe_filename.replace(' ', '_')
    filename = f"{safe_filename}_{job_id}.md"
    
    # Return as downloadable file
    return Response(
        content=markdown_content,
        media_type="text/markdown",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.get("/jobs/{job_id}/pages/{page_id}/export/markdown")
async def export_single_page_as_markdown(
    job_id: int,
    page_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export a single scraped page as markdown"""
    
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
    
    # Get the specific page data
    page_data = db.query(ScrapedData).filter(
        ScrapedData.id == page_id,
        ScrapedData.job_id == job_id
    ).first()
    
    if not page_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found"
        )
    
    # Create markdown for single page
    markdown_content = create_single_page_markdown(
        url=page_data.url,
        content=page_data.content
    )
    
    # Create safe filename from URL
    url_parts = page_data.url.split('/')
    page_name = url_parts[-1] if url_parts[-1] else 'index'
    filename = f"{page_name}_{page_id}.md"
    
    return Response(
        content=markdown_content,
        media_type="text/markdown",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

