import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import Set, List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import ScrapingJob, ScrapedData, ScrapedPage
from app.database import SessionLocal
from app.services.embedding_service import get_embeddings
from app.utils.encryption import decrypt_credentials
import time
from playwright.sync_api import sync_playwright
from collections import deque

def scrape_with_playwright(url: str) -> tuple[str, BeautifulSoup]:
    """Scrape URL using Playwright for JavaScript-heavy websites with infinite scroll support"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Set viewport size for better rendering
        page.set_viewport_size({"width": 1920, "height": 1080})
        
        # Navigate to the page
        page.goto(url, wait_until="networkidle", timeout=30000)
        
        # Wait for initial content
        page.wait_for_timeout(2000)
        
        # Implement infinite scroll
        previous_height = 0
        scroll_attempts = 0
        max_scrolls = 20  # Increased to capture more content from complex sites
        
        while scroll_attempts < max_scrolls:
            # Get current scroll height
            current_height = page.evaluate("document.body.scrollHeight")
            
            # Break if no new content
            if current_height == previous_height:
                scroll_attempts += 1
                # Try one more time after waiting
                page.wait_for_timeout(2000)
                if page.evaluate("document.body.scrollHeight") == current_height:
                    break
            else:
                scroll_attempts = 0  # Reset if we found new content
            
            previous_height = current_height
            
            # Scroll down in steps for better content loading
            page.evaluate("""
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });
            """)
            
            # Wait for content to load (increased for complex sites)
            page.wait_for_timeout(2500)
            
            # Check for "Load More" buttons and click them
            try:
                load_more_selectors = [
                    'button:has-text("Load More")',
                    'button:has-text("Show More")',
                    'a:has-text("Load More")',
                    '[class*="load-more"]',
                    '[class*="show-more"]'
                ]
                
                for selector in load_more_selectors:
                    button = page.query_selector(selector)
                    if button and button.is_visible():
                        button.click()
                        page.wait_for_timeout(2000)
                        break
            except:
                pass
        
        # Scroll back to top to ensure all lazy-loaded images are captured
        page.evaluate("window.scrollTo(0, 0);")
        page.wait_for_timeout(1000)
        
        # Get final content
        content = page.content()
        browser.close()
        return content, BeautifulSoup(content, 'lxml')

def is_scrapable_url(url: str) -> bool:
    """Check if URL is scrapable (not a PDF, image, etc.)"""
    excluded_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', 
                          '.zip', '.rar', '.tar', '.gz', '.mp4', '.mp3', '.avi', 
                          '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
    return not any(url.lower().endswith(ext) for ext in excluded_extensions)

def extract_domain(url: str) -> str:
    """Extract domain from URL"""
    parsed = urlparse(url)
    return parsed.netloc

def handle_authentication(page, credentials: dict) -> bool:
    """Handle website authentication using provided credentials"""
    try:
        print(f"Attempting authentication...")
        
        # Look for common login form selectors
        login_selectors = [
            'input[type="password"]',
            'input[name*="pass"]',
            'input[name*="login"]',
            'form[action*="login"]'
        ]
        
        # Check if we're on a login page
        has_login_form = False
        for selector in login_selectors:
            if page.query_selector(selector):
                has_login_form = True
                break
        
        if not has_login_form:
            print("No login form detected")
            return True
        
        # Fill in credentials
        for field_name, field_value in credentials.items():
            if not field_value:
                continue
                
            # Try to find input by name, id, or type
            field_name_lower = field_name.lower()
            
            if 'username' in field_name_lower or 'email' in field_name_lower or 'user' in field_name_lower:
                selectors = [
                    f'input[name="{field_name}"]',
                    f'input[id="{field_name}"]',
                    'input[type="text"]',
                    'input[type="email"]',
                    'input[name*="user"]',
                    'input[name*="email"]'
                ]
            elif 'password' in field_name_lower or 'pass' in field_name_lower:
                selectors = [
                    f'input[name="{field_name}"]',
                    f'input[id="{field_name}"]',
                    'input[type="password"]'
                ]
            else:
                selectors = [
                    f'input[name="{field_name}"]',
                    f'input[id="{field_name}"]'
                ]
            
            for selector in selectors:
                input_field = page.query_selector(selector)
                if input_field:
                    input_field.fill(str(field_value))
                    print(f"Filled field: {field_name}")
                    break
        
        # Find and click submit button
        submit_selectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("Log in")',
            'button:has-text("Sign in")',
            'button:has-text("Login")',
            'button:has-text("Submit")'
        ]
        
        for selector in submit_selectors:
            submit_button = page.query_selector(selector)
            if submit_button:
                submit_button.click()
                page.wait_for_timeout(3000)  # Wait for navigation
                print("Submitted login form")
                return True
        
        return True
    except Exception as e:
        print(f"Authentication error: {e}")
        return False

def extract_prioritized_links(soup, base_url: str, domain: str) -> List[str]:
    """Extract and prioritize links from the page"""
    prioritized_links = []
    
    # Priority 1: Header and navigation links
    header_nav = soup.find_all(['header', 'nav'])
    for element in header_nav:
        for link in element.find_all('a', href=True):
            href = link['href']
            full_url = urljoin(base_url, href)
            if is_same_domain(full_url, domain) and is_scrapable_url(full_url):
                prioritized_links.append(full_url)
    
    # Priority 2: Footer links
    footer = soup.find_all('footer')
    for element in footer:
        for link in element.find_all('a', href=True):
            href = link['href']
            full_url = urljoin(base_url, href)
            if is_same_domain(full_url, domain) and is_scrapable_url(full_url):
                prioritized_links.append(full_url)
    
    # Priority 3: Main content links
    main_content = soup.find_all(['main', 'article', 'section'])
    for element in main_content:
        for link in element.find_all('a', href=True):
            href = link['href']
            full_url = urljoin(base_url, href)
            if is_same_domain(full_url, domain) and is_scrapable_url(full_url):
                prioritized_links.append(full_url)
    
    # Priority 4: All other links
    for link in soup.find_all('a', href=True):
        href = link['href']
        full_url = urljoin(base_url, href)
        if is_same_domain(full_url, domain) and is_scrapable_url(full_url):
            prioritized_links.append(full_url)
    
    # Remove duplicates while maintaining order
    seen = set()
    unique_links = []
    for link in prioritized_links:
        if link not in seen:
            seen.add(link)
            unique_links.append(link)
    
    return unique_links

def is_same_domain(url: str, domain: str) -> bool:
    """Check if URL belongs to the same domain"""
    parsed = urlparse(url)
    return parsed.netloc == domain

def scrape_url(url: str, use_playwright: bool = False) -> tuple[str, BeautifulSoup]:
    """Scrape a URL with optional JavaScript rendering"""
    if not is_scrapable_url(url):
        raise ValueError(f"URL is not scrapable: {url}")
    
    if use_playwright:
        return scrape_with_playwright(url)
    
    response = requests.get(url, timeout=10, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    response.raise_for_status()
    return response.text, BeautifulSoup(response.content, 'lxml')

def scrape_website(job_id: int, db: Session):
    """Scrape website with depth control, authentication support, and progress tracking using BFS"""
    db = SessionLocal()
    try:
        job = db.query(ScrapingJob).filter(ScrapingJob.id == job_id).first()
        if not job:
            return
        
        job.status = "discovering"
        job.pages_found = 0
        job.pages_scraped = 0
        db.commit()
        
        base_url = job.website_url
        max_depth = job.depth
        domain = extract_domain(base_url)
        
        # Decrypt credentials if provided
        credentials = None
        if job.auth_credentials:
            credentials = decrypt_credentials(job.auth_credentials)
        
        # Initialize Playwright
        playwright = sync_playwright().start()
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.set_viewport_size({"width": 1920, "height": 1080})
        
        # Handle authentication on the first page if credentials provided
        if credentials:
            try:
                page.goto(base_url, wait_until="networkidle", timeout=30000)
                handle_authentication(page, credentials)
                print("Authentication completed")
            except Exception as e:
                print(f"Authentication failed: {e}")
        
        # PHASE 1: DISCOVERY - Find all URLs to scrape
        print(f"🔍 PHASE 1: Discovering pages (max_depth={max_depth})...")
        discovery_queue: deque[Tuple[str, int]] = deque([(base_url, 0)])
        discovered_urls: Set[str] = set()
        urls_to_scrape: List[Tuple[str, int]] = []
        
        while discovery_queue:
            current_url, current_depth = discovery_queue.popleft()
            
            # Skip if already discovered or depth exceeded
            if current_url in discovered_urls or current_depth > max_depth:
                continue
            
            discovered_urls.add(current_url)
            urls_to_scrape.append((current_url, current_depth))
            
            # Record the discovered page in database
            scraped_page = ScrapedPage(
                job_id=job_id,
                url=current_url,
                status="pending",
                depth=current_depth
            )
            db.add(scraped_page)
            
            print(f"  Discovered [{len(discovered_urls)}]: {current_url} (depth {current_depth})")
            
            # Only extract links if we haven't exceeded depth
            if current_depth < max_depth:
                try:
                    page.goto(current_url, wait_until="networkidle", timeout=30000)
                    page.wait_for_timeout(1000)
                    
                    html_content = page.content()
                    soup = BeautifulSoup(html_content, 'lxml')
                    
                    # Extract and prioritize links
                    prioritized_links = extract_prioritized_links(soup, current_url, domain)
                    
                    # Add to discovery queue with incremented depth
                    for link in prioritized_links:
                        if link not in discovered_urls:
                            discovery_queue.append((link, current_depth + 1))
                    
                except Exception as e:
                    print(f"  Error discovering links from {current_url}: {str(e)}")
        
        # Commit all discovered pages
        db.commit()
        
        # Update pages_found in database
        job.pages_found = len(urls_to_scrape)
        job.status = "scraping"
        db.commit()
        
        print(f"✓ Discovery complete: Found {len(urls_to_scrape)} pages to scrape")
        
        # PHASE 2: SCRAPING - Scrape all discovered URLs
        print(f"\n📄 PHASE 2: Scraping {len(urls_to_scrape)} pages...")
        scraped_contents = []
        
        for idx, (current_url, current_depth) in enumerate(urls_to_scrape):
            try:
                # Update progress in database
                job.pages_scraped = idx
                job.current_url = current_url
                
                # Update page status to in_progress
                page_record = db.query(ScrapedPage).filter(
                    ScrapedPage.job_id == job_id,
                    ScrapedPage.url == current_url
                ).first()
                if page_record:
                    page_record.status = "in_progress"
                db.commit()
                
                print(f"Scraping [{idx + 1}/{len(urls_to_scrape)}] (depth {current_depth}): {current_url}")
                
                # Scrape with Playwright
                page.goto(current_url, wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(3000)  # Increased wait time for dynamic content
                
                # Implement infinite scroll for content-heavy pages
                previous_height = 0
                scroll_attempts = 0
                max_scrolls = 15  # Increased from 10
                
                while scroll_attempts < max_scrolls:
                    current_height = page.evaluate("document.body.scrollHeight")
                    
                    if current_height == previous_height:
                        scroll_attempts += 1
                        if scroll_attempts >= 3:  # Increased from 2
                            break
                    else:
                        scroll_attempts = 0
                    
                    previous_height = current_height
                    page.evaluate("window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});")
                    page.wait_for_timeout(2000)  # Increased from 1500ms
                    
                    # Try clicking "Load More" or similar buttons
                    try:
                        load_more_selectors = [
                            'button:has-text("Load More")',
                            'button:has-text("Show More")',
                            'a:has-text("Load More")',
                            '[class*="load-more"]',
                            '[class*="show-more"]'
                        ]
                        for selector in load_more_selectors:
                            button = page.query_selector(selector)
                            if button and button.is_visible():
                                button.click()
                                page.wait_for_timeout(2000)
                                break
                    except:
                        pass
                
                # Scroll back to top to ensure all content is captured
                page.evaluate("window.scrollTo(0, 0);")
                page.wait_for_timeout(1000)
                
                html_content = page.content()
                soup = BeautifulSoup(html_content, 'lxml')
                
                # Extract text content - keep more semantic elements
                for script in soup(["script", "style", "noscript"]):
                    script.decompose()
                
                text_content = soup.get_text(separator=' ', strip=True)
                
                # Clean up excessive whitespace
                text_content = ' '.join(text_content.split())
                
                if len(text_content) > 100:  # Reduced threshold from 200 to 100
                    scraped_contents.append({
                        'url': current_url,
                        'content': text_content,
                        'depth': current_depth
                    })
                    # Update page status to completed
                    if page_record:
                        page_record.status = "completed"
                        page_record.content_length = len(text_content)
                    print(f"  ✓ Scraped {len(text_content)} chars")
                else:
                    # Mark as completed but with no content
                    if page_record:
                        page_record.status = "completed"
                        page_record.content_length = len(text_content)
                        page_record.error_message = "Insufficient content"
                    print(f"  ⚠ Skipped (insufficient content: {len(text_content)} chars)")
                
                db.commit()
                time.sleep(0.5)
                
            except Exception as e:
                print(f"  ✗ Error scraping {current_url}: {str(e)}")
                # Mark page as failed
                page_record = db.query(ScrapedPage).filter(
                    ScrapedPage.job_id == job_id,
                    ScrapedPage.url == current_url
                ).first()
                if page_record:
                    page_record.status = "failed"
                    page_record.error_message = str(e)
                db.commit()
                continue
        
        # Update final progress
        job.pages_scraped = len(urls_to_scrape)
        job.current_url = None
        db.commit()
        
        # Cleanup Playwright
        page.close()
        context.close()
        browser.close()
        playwright.stop()
        
        print(f"\n✓ Scraping complete: {len(scraped_contents)} pages with content")
        
        if scraped_contents:
            # Process content with chunking for large texts
            all_chunks = []
            
            for item in scraped_contents:
                content = item['content']
                url = item['url']
                
                # Split large content into chunks (max 8000 chars per chunk with overlap)
                max_chunk_size = 8000  # Increased from 5000 to capture more context
                overlap = 800  # Increased overlap from 500
                
                if len(content) <= max_chunk_size:
                    all_chunks.append({'content': content, 'url': url})
                else:
                    # Split into chunks with overlap
                    start = 0
                    while start < len(content):
                        end = start + max_chunk_size
                        chunk = content[start:end]
                        
                        # Only add chunks with meaningful content (reduced threshold)
                        if len(chunk.strip()) > 100:  # Reduced from 200 to 100
                            all_chunks.append({'content': chunk, 'url': url})
                        
                        start += (max_chunk_size - overlap)
            
            print(f"Processing {len(all_chunks)} chunks for embedding...")
            
            # Generate embeddings for all chunks
            texts = [chunk['content'] for chunk in all_chunks]
            embeddings = get_embeddings(texts)
            
            # Store all chunks in database
            for chunk, embedding in zip(all_chunks, embeddings):
                scraped_data = ScrapedData(
                    job_id=job_id,
                    content=chunk['content'],
                    url=chunk['url'],
                    embedding=embedding
                )
                db.add(scraped_data)
            
            job.status = "completed"
            job.completed_at = datetime.utcnow()
            
            print(f"✓ Stored {len(all_chunks)} chunks from {len(scraped_contents)} pages")
        else:
            job.status = "failed"
            job.error_message = "No content could be scraped"
        
        db.commit()
        
    except Exception as e:
        job = db.query(ScrapingJob).filter(ScrapingJob.id == job_id).first()
        if job:
            job.status = "failed"
            job.error_message = str(e)
            db.commit()
    finally:
        db.close()

