from fastapi import APIRouter, Request, HTTPException, status
from sqlalchemy.orm import Session
from fastapi import Depends
from app.database import get_db
from app.models import User
from app.config import settings
import json

router = APIRouter()

@router.post("/webhook")
async def clerk_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle Clerk webhooks for user events
    Supports: user.created, user.updated, user.deleted
    
    Note: For production, configure webhook secret verification in Clerk Dashboard
    """
    
    # Get webhook secret from settings (optional for now)
    webhook_secret = settings.CLERK_WEBHOOK_SECRET
    
    # Get body
    body = await request.body()
    
    # Parse payload
    try:
        payload = json.loads(body)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON: {str(e)}"
        )
    
    # Parse event type and data
    event_type = payload.get("type")
    data = payload.get("data", {})
    
    if event_type == "user.created":
        await handle_user_created(data, db)
    elif event_type == "user.updated":
        await handle_user_updated(data, db)
    elif event_type == "user.deleted":
        await handle_user_deleted(data, db)
    else:
        print(f"Unhandled webhook event type: {event_type}")
    
    return {"status": "success"}

async def handle_user_created(data: dict, db: Session):
    """Handle user.created event from Clerk"""
    clerk_user_id = data.get("id")
    email_addresses = data.get("email_addresses", [])
    primary_email = None
    
    # Debug: Print webhook data
    print(f"Clerk webhook - user.created data: {data}")
    
    # Find primary email - try multiple methods
    primary_email_id = data.get("primary_email_address_id")
    
    # Method 1: Find primary email by ID
    if primary_email_id and email_addresses:
        for email_obj in email_addresses:
            if isinstance(email_obj, dict) and email_obj.get("id") == primary_email_id:
                primary_email = email_obj.get("email_address")
                print(f"Found primary email by ID: {primary_email}")
                break
    
    # Method 2: Use first email as fallback
    if not primary_email and email_addresses:
        if isinstance(email_addresses[0], dict):
            primary_email = email_addresses[0].get("email_address")
        elif isinstance(email_addresses[0], str):
            primary_email = email_addresses[0]
        print(f"Using first email as fallback: {primary_email}")
    
    # Method 3: Try direct email field
    if not primary_email and data.get("email"):
        primary_email = data.get("email")
        print(f"Using direct email field: {primary_email}")
    
    # Check if user already exists by clerk_user_id
    existing_user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if existing_user:
        print(f"User {clerk_user_id} already exists")
        return
    
    # Check if user exists by email (for account linking)
    if primary_email:
        existing_user = db.query(User).filter(User.email == primary_email).first()
        if existing_user:
            print(f"Linking existing user {primary_email} to Clerk user {clerk_user_id}")
            existing_user.clerk_user_id = clerk_user_id
            # Update full name if available
            full_name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
            if full_name:
                existing_user.full_name = full_name
            db.commit()
            return
    
    # Get username
    username = data.get("username")
    if not username and primary_email:
        username = primary_email.split("@")[0]
    elif not username:
        username = f"user_{clerk_user_id[:8]}"
    
    # Make username unique if needed
    base_username = username
    counter = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base_username}{counter}"
        counter += 1
    
    # Ensure we have an email
    if not primary_email:
        print(f"WARNING: No email found for Clerk user {clerk_user_id} in webhook")
        primary_email = f"{clerk_user_id}@clerk.temp"
    
    # Create new user
    new_user = User(
        email=primary_email,
        username=username,
        clerk_user_id=clerk_user_id,
        hashed_password="",  # No password for Clerk users
        full_name=f"{data.get('first_name', '')} {data.get('last_name', '')}".strip() or None
    )
    
    db.add(new_user)
    db.commit()
    print(f"✅ Webhook created user: email={new_user.email}, username={new_user.username}, id={new_user.id}, clerk_id={clerk_user_id}")

async def handle_user_updated(data: dict, db: Session):
    """Handle user.updated event from Clerk"""
    clerk_user_id = data.get("id")
    
    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if not user:
        print(f"User {clerk_user_id} not found for update")
        return
    
    # Update email if changed
    email_addresses = data.get("email_addresses", [])
    if email_addresses:
        for email_obj in email_addresses:
            if email_obj.get("id") == data.get("primary_email_address_id"):
                user.email = email_obj.get("email_address")
                break
    
    # Update username if changed
    if data.get("username"):
        user.username = data.get("username")
    
    # Update full name
    full_name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
    if full_name:
        user.full_name = full_name
    
    db.commit()
    print(f"Updated user {clerk_user_id} from Clerk webhook")

async def handle_user_deleted(data: dict, db: Session):
    """Handle user.deleted event from Clerk"""
    clerk_user_id = data.get("id")
    
    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if not user:
        print(f"User {clerk_user_id} not found for deletion")
        return
    
    # Soft delete or hard delete based on your requirements
    # For now, we'll do a hard delete (user's jobs will be cascade deleted)
    db.delete(user)
    db.commit()
    print(f"Deleted user {clerk_user_id} from Clerk webhook")

