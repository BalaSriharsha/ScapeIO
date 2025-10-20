import httpx
import json
import os
from app.config import settings
from app.utils.encryption import decrypt_credentials
import logging

logger = logging.getLogger(__name__)

# Go scraper service URL
GO_SCRAPER_URL = os.getenv("GO_SCRAPER_URL", "http://localhost:8001")

# HTTP client for async requests
http_client = httpx.AsyncClient(timeout=10.0)

async def check_go_scraper_health() -> bool:
    """
    Check if Go scraper service is running
    
    Returns:
        True if service is healthy, False otherwise
    """
    try:
        response = await http_client.get(f"{GO_SCRAPER_URL}/health", timeout=2)
        return response.status_code == 200
    except:
        return False

async def run_go_scraper(job_id: int, url: str, depth: int, auth_creds_encrypted: str = None) -> dict:
    """
    Send scraping request to Go scraper service
    
    Args:
        job_id: Scraping job ID
        url: Website URL to scrape
        depth: Maximum depth for scraping
        auth_creds_encrypted: Encrypted authentication credentials
    
    Returns:
        Dictionary with scraping results
    
    Raises:
        Exception if scraping fails
    """
    # Check if Go scraper is running
    is_healthy = await check_go_scraper_health()
    if not is_healthy:
        raise Exception(
            f"Go scraper service is not running at {GO_SCRAPER_URL}. "
            "Please start it with: ./start-go-scraper.sh"
        )
    
    # Prepare auth credentials
    auth_creds = None
    if auth_creds_encrypted:
        try:
            auth_creds = decrypt_credentials(auth_creds_encrypted)
        except Exception as e:
            logger.error(f"Failed to decrypt credentials: {e}")
    
    # Prepare request data
    request_data = {
        "job_id": job_id,
        "website_url": url,
        "depth": depth,
        "max_pages": 1000,  # Safety limit
        "auth_credentials": auth_creds if auth_creds else {},
        "db_connection": settings.DATABASE_URL
    }
    
    logger.info(f"Sending job {job_id} to Go scraper service at {GO_SCRAPER_URL}")
    
    try:
        # Send async POST request to Go scraper
        response = await http_client.post(
            f"{GO_SCRAPER_URL}/scrape",
            json=request_data,
            timeout=5.0  # Short timeout since Go responds immediately
        )
        
        response.raise_for_status()
        result = response.json()
        
        logger.info(f"Go scraper accepted job {job_id}: {result}")
        return result
        
    except httpx.ConnectError:
        logger.error(f"Cannot connect to Go scraper at {GO_SCRAPER_URL}")
        raise Exception(f"Go scraper service unavailable at {GO_SCRAPER_URL}")
    except httpx.TimeoutException:
        logger.error(f"Go scraper request timed out for job {job_id}")
        raise Exception("Go scraper service timeout")
    except Exception as e:
        logger.error(f"Go scraper error for job {job_id}: {str(e)}")
        raise

