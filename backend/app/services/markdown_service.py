from typing import List, Dict
from datetime import datetime
import re
from markdownify import markdownify
from bs4 import BeautifulSoup

def html_to_markdown(html_content: str, url: str) -> str:
    """Convert HTML content to clean markdown"""
    # Parse HTML and clean it up
    soup = BeautifulSoup(html_content, 'lxml')
    
    # Remove script, style, and other non-content tags
    for tag in soup(['script', 'style', 'noscript', 'meta', 'link']):
        tag.decompose()
    
    # Convert to markdown
    markdown = markdownify(str(soup), heading_style="ATX", bullets="-")
    
    # Clean up excessive whitespace
    markdown = re.sub(r'\n{3,}', '\n\n', markdown)
    markdown = markdown.strip()
    
    return markdown

def create_markdown_document(
    job_name: str,
    website_url: str,
    scraped_pages: List[Dict],
    include_metadata: bool = True
) -> str:
    """
    Create a structured markdown document from scraped content
    
    Args:
        job_name: Name of the scraping job
        website_url: Base URL of the website
        scraped_pages: List of dicts with 'url', 'content', 'depth' keys
        include_metadata: Whether to include metadata headers
    
    Returns:
        Complete markdown document as string
    """
    
    markdown_doc = []
    
    # Document header
    if include_metadata:
        markdown_doc.append(f"# {job_name}\n")
        markdown_doc.append(f"**Source:** {website_url}\n")
        markdown_doc.append(f"**Scraped:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        markdown_doc.append(f"**Total Pages:** {len(scraped_pages)}\n")
        markdown_doc.append("---\n")
    
    # Table of contents
    if len(scraped_pages) > 1:
        markdown_doc.append("## Table of Contents\n")
        for idx, page in enumerate(scraped_pages, 1):
            # Create anchor-friendly title from URL
            title = page['url'].split('/')[-1] or 'Home'
            title = title.replace('-', ' ').replace('_', ' ').title()
            anchor = f"page-{idx}"
            markdown_doc.append(f"{idx}. [{title}](#{anchor}) (Depth: {page.get('depth', 0)})\n")
        markdown_doc.append("\n---\n")
    
    # Content for each page
    for idx, page in enumerate(scraped_pages, 1):
        url = page['url']
        content = page['content']
        depth = page.get('depth', 0)
        
        # Page header
        markdown_doc.append(f"\n## Page {idx}: {url} {{#page-{idx}}}\n")
        markdown_doc.append(f"**URL:** {url}\n")
        markdown_doc.append(f"**Depth Level:** {depth}\n")
        markdown_doc.append(f"**Content Length:** {len(content)} characters\n")
        markdown_doc.append("\n---\n")
        
        # Page content
        markdown_doc.append(f"\n{content}\n")
        markdown_doc.append("\n" + "="*80 + "\n")
    
    return '\n'.join(markdown_doc)

def create_single_page_markdown(url: str, content: str) -> str:
    """Create markdown for a single page without job metadata"""
    markdown_doc = []
    
    markdown_doc.append(f"# {url}\n")
    markdown_doc.append(f"**Scraped:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    markdown_doc.append("---\n")
    markdown_doc.append(f"\n{content}\n")
    
    return '\n'.join(markdown_doc)

