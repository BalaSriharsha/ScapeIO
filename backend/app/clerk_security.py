from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from jose import jwt, JWTError
import requests
import base64
from app.database import get_db
from app.models import User
from app.config import settings
import json

# Cache for Clerk's JWKS
_jwks_cache = None

def get_clerk_domain():
    """Extract Clerk domain from publishable key"""
    if settings.CLERK_DOMAIN:
        return settings.CLERK_DOMAIN
    
    # Publishable key format: pk_test_{base64_encoded_domain}
    # or pk_live_{base64_encoded_domain}
    try:
        pub_key = settings.CLERK_PUBLISHABLE_KEY
        # Remove pk_test_ or pk_live_ prefix
        if pub_key.startswith('pk_test_'):
            encoded_domain = pub_key[8:]  # Remove 'pk_test_'
        elif pub_key.startswith('pk_live_'):
            encoded_domain = pub_key[8:]  # Remove 'pk_live_'
        else:
            raise ValueError("Invalid publishable key format")
        
        # Decode base64 to get domain
        decoded = base64.b64decode(encoded_domain).decode('utf-8')
        # Remove any trailing special characters (like $)
        decoded = decoded.rstrip('$').strip()
        return f"https://{decoded}"
    except Exception as e:
        print(f"Error extracting Clerk domain: {e}")
        # Fallback: try to extract from key structure
        # For development keys, the domain is often in the key itself
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not determine Clerk domain. Please set CLERK_DOMAIN in environment variables."
        )

def fetch_clerk_user_details(clerk_user_id: str) -> dict:
    """Fetch user details from Clerk's REST API"""
    try:
        # Clerk's API endpoint - always use api.clerk.com
        url = f"https://api.clerk.com/v1/users/{clerk_user_id}"
        headers = {
            "Authorization": f"Bearer {settings.CLERK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        print(f"Fetching user details from Clerk API: {url}")
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        user_data = response.json()
        print(f"Successfully fetched user data from Clerk API: {json.dumps(user_data, indent=2)}")
        return user_data
    except Exception as e:
        print(f"Error fetching user details from Clerk API: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"API Response: {e.response.text}")
        return {}

def get_clerk_jwks():
    """Fetch Clerk's JSON Web Key Set (JWKS) for token validation"""
    global _jwks_cache
    
    if _jwks_cache is None:
        try:
            # Clerk's JWKS endpoint
            clerk_domain = get_clerk_domain()
            jwks_url = f"{clerk_domain}/.well-known/jwks.json"
            print(f"Fetching JWKS from: {jwks_url}")
            response = requests.get(jwks_url, timeout=10)
            response.raise_for_status()
            _jwks_cache = response.json()
            print(f"Successfully fetched JWKS")
        except Exception as e:
            print(f"Error fetching Clerk JWKS: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch authentication keys"
            )
    
    return _jwks_cache

def verify_clerk_token(token: str) -> dict:
    """Verify and decode a Clerk JWT token"""
    try:
        # Get the signing key from Clerk's JWKS
        jwks = get_clerk_jwks()
        
        # Decode the token header to get the key ID
        unverified_header = jwt.get_unverified_header(token)
        key_id = unverified_header.get('kid')
        
        # Find the corresponding key
        signing_key = None
        for key in jwks.get('keys', []):
            if key.get('kid') == key_id:
                signing_key = key
                break
        
        if not signing_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: signing key not found"
            )
        
        # Verify and decode the token
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=['RS256'],
            options={"verify_aud": False}  # Clerk tokens don't always have aud
        )
        
        return payload
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_from_clerk(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """Get current user from Clerk JWT token"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Extract token from "Bearer <token>"
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify the Clerk token
    payload = verify_clerk_token(token)
    
    # Debug: Print the entire payload to see what Clerk sends
    print(f"Clerk JWT Payload: {payload}")
    
    # Get user ID from Clerk token (Clerk uses 'sub' for user ID)
    clerk_user_id: str = payload.get("sub")
    if not clerk_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get email from Clerk token - try multiple possible locations
    email = None
    username = None
    first_name = None
    last_name = None
    
    # Try direct email field
    if payload.get("email"):
        email = payload.get("email")
        print(f"Found email in 'email' field: {email}")
    
    # Try primary_email_address_id and email_addresses
    if not email and payload.get("email_addresses"):
        email_addresses = payload.get("email_addresses", [])
        primary_email_id = payload.get("primary_email_address_id")
        
        # If we have a primary email ID, find the matching email
        if primary_email_id and isinstance(email_addresses, list):
            for email_obj in email_addresses:
                if isinstance(email_obj, dict) and email_obj.get("id") == primary_email_id:
                    email = email_obj.get("email_address")
                    print(f"Found primary email: {email}")
                    break
        
        # Fallback: use first email if we still don't have one
        if not email and email_addresses and len(email_addresses) > 0:
            if isinstance(email_addresses[0], str):
                email = email_addresses[0]
            elif isinstance(email_addresses[0], dict):
                email = email_addresses[0].get("email_address")
            print(f"Using first email as fallback: {email}")
    
    # If email still not found, fetch from Clerk API
    if not email:
        print(f"Email not found in JWT, fetching user details from Clerk API...")
        user_details = fetch_clerk_user_details(clerk_user_id)
        if user_details:
            # Extract email from Clerk API response
            email_addresses = user_details.get("email_addresses", [])
            primary_email_id = user_details.get("primary_email_address_id")
            
            # Find primary email
            if primary_email_id:
                for email_obj in email_addresses:
                    if email_obj.get("id") == primary_email_id:
                        email = email_obj.get("email_address")
                        print(f"✅ Found email from Clerk API: {email}")
                        break
            
            # Fallback to first email
            if not email and email_addresses:
                email = email_addresses[0].get("email_address")
                print(f"Using first email from Clerk API: {email}")
            
            # Get name fields
            first_name = user_details.get("first_name")
            last_name = user_details.get("last_name")
            username = user_details.get("username")
            
            print(f"User details from API: first_name={first_name}, last_name={last_name}, username={username}")
    
    # Try to find user by Clerk user ID first
    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    
    if not user and email:
        # Try to find existing user by email (for account linking)
        user = db.query(User).filter(User.email == email).first()
        if user:
            # Link the existing account to this Clerk user ID
            print(f"Linking existing user {user.email} (ID: {user.id}) to Clerk user {clerk_user_id}")
            user.clerk_user_id = clerk_user_id
            db.commit()
            db.refresh(user)
    
    if not user:
        # User doesn't exist - create new user
        print(f"Creating new user for Clerk ID: {clerk_user_id}, Email: {email}")
        
        # Get username from various sources (already fetched from API if needed)
        if not username:
            username = payload.get("username")
        if not username:
            # Try to get from name fields (already fetched from API if needed)
            if not first_name:
                first_name = payload.get("first_name", "")
            if not last_name:
                last_name = payload.get("last_name", "")
            
            if first_name:
                username = first_name.lower().replace(" ", "")
            elif email:
                username = email.split("@")[0]
            else:
                username = f"user_{clerk_user_id[:8]}"
        
        # Check if username already exists and make it unique
        base_username = username
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Ensure we have an email - this is critical
        if not email:
            print(f"WARNING: No email found in Clerk payload for user {clerk_user_id}")
            # Try to get email from other fields
            if payload.get("primary_email_address"):
                email = payload.get("primary_email_address")
            else:
                email = f"{clerk_user_id}@clerk.temp"
        
        # Build full name
        full_name = f"{first_name or ''} {last_name or ''}".strip() or None
        
        user = User(
            email=email,
            username=username,
            clerk_user_id=clerk_user_id,
            hashed_password="",  # No password for Clerk users
            full_name=full_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"✅ Created new user: email={user.email}, username={user.username}, full_name={user.full_name}, id={user.id}, clerk_id={clerk_user_id}")
    
    return user

async def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None (for embedded chatbot)"""
    if not authorization:
        return None
    
    try:
        return await get_current_user_from_clerk(authorization, db)
    except HTTPException:
        return None

