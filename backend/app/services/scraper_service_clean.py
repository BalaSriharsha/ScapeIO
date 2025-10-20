import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import Set, List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import ScrapingJob, ScrapedData, ScrapedPage
from app.database import SessionLocal
from app.services.embedding_service import get_embeddings
from app.services.go_scraper_service import run_go_scraper
from app.utils.encryption import decrypt_credentials
import time
import logging
from multiprocessing import Process

logger = logging.getLogger(__name__)

def start_scraping_job(job_id: int):
    """Start scraping using Go scraper service (non-blocking)"""
    process = Process(target=trigger_go_scraper, args=(job_id,))
    process.daemon = True
    process.start()
    logger.info(f"Started scraping job {job_id} in process {process.pid}")

def trigger_go_scraper(job_id: int):
    """Trigger Go scraper and handle post-processing"""
    db = SessionLocal()
    try:
        job = db.query(ScrapingJob).filter(ScrapingJob.id == job_id).first()
        if not job:
            logger.error(f"Job {job_id} not found")
            return
        
        logger.info(f"Job {job_id}: Sending to Go scraper service")
        
        # Send job to Go scraper (async call)
        import asyncio
        try:
            result = asyncio.run(run_go_scraper(
                job_id=job_id,
                url=job.website_url,
                depth=job.depth,
                auth_creds_encrypted=job.auth_credentials
            ))
            logger.info(f"Job {job_id}: Go scraper accepted - {result}")
        except Exception as e:
            logger.error(f"Job {job_id}: Failed to start Go scraper - {str(e)}")
            job.status = "failed"
            job.error_message = f"Failed to start scraper: {str(e)}"
            db.commit()
            return
        
        # Wait for Go scraper to complete by monitoring job status
        logger.info(f"Job {job_id}: Waiting for Go scraper to complete...")
        max_wait = 3600  # 1 hour max wait
        wait_time = 0
        
        while wait_time < max_wait:
            time.sleep(5)  # Check every 5 seconds
            wait_time += 5
            
            db.refresh(job)
            
            if job.status == "completed":
                logger.info(f"Job {job_id}: Go scraper completed successfully")
                break
            elif job.status == "failed":
                logger.error(f"Job {job_id}: Go scraper failed - {job.error_message}")
                return
        
        if job.status != "completed":
            logger.warning(f"Job {job_id}: Timeout waiting for completion")
            return
        
        # Generate embeddings for scraped data
        logger.info(f"Job {job_id}: Generating embeddings...")
        scraped_data_list = db.query(ScrapedData).filter(ScrapedData.job_id == job_id).all()
        
        if scraped_data_list:
            logger.info(f"Job {job_id}: Generating embeddings for {len(scraped_data_list)} chunks")
            
            # Process in batches to avoid memory issues
            batch_size = 50
            for i in range(0, len(scraped_data_list), batch_size):
                batch = scraped_data_list[i:i+batch_size]
                texts = [data.content for data in batch]
                embeddings = get_embeddings(texts)
                
                for data, embedding in zip(batch, embeddings):
                    data.embedding = embedding
                
                db.commit()
                logger.info(f"Job {job_id}: Processed batch {i//batch_size + 1}/{(len(scraped_data_list) + batch_size - 1)//batch_size}")
            
            logger.info(f"Job {job_id}: All embeddings generated successfully")
        else:
            logger.warning(f"Job {job_id}: No scraped data found")
        
    except Exception as e:
        logger.error(f"Job {job_id}: Error in trigger_go_scraper - {str(e)}")
        job = db.query(ScrapingJob).filter(ScrapingJob.id == job_id).first()
        if job:
            job.status = "failed"
            job.error_message = str(e)
            db.commit()
    finally:
        db.close()

def scrape_website(job_id: int, db: Session):
    """
    Legacy Python scraper - DEPRECATED
    All scraping is now handled by Go scraper service.
    This function is kept for backward compatibility only.
    """
    logger.warning(f"Job {job_id}: scrape_website called but all scraping is now done by Go service")
    trigger_go_scraper(job_id)

