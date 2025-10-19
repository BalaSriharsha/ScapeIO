from cryptography.fernet import Fernet
import json
import base64
import hashlib
from app.config import settings

def _get_encryption_key() -> bytes:
    """Derive a Fernet key from SECRET_KEY"""
    # Fernet requires a 32-byte base64-encoded key
    # Use SHA256 to hash the SECRET_KEY and then base64 encode it
    key_hash = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(key_hash)

def encrypt_credentials(credentials: dict) -> str:
    """Encrypt credentials dictionary to string"""
    if not credentials:
        return None
    
    try:
        key = _get_encryption_key()
        fernet = Fernet(key)
        
        # Convert dict to JSON string
        json_str = json.dumps(credentials)
        
        # Encrypt and return as string
        encrypted = fernet.encrypt(json_str.encode())
        return encrypted.decode()
    except Exception as e:
        print(f"Error encrypting credentials: {e}")
        return None

def decrypt_credentials(encrypted: str) -> dict:
    """Decrypt credentials string to dictionary"""
    if not encrypted:
        return None
    
    try:
        key = _get_encryption_key()
        fernet = Fernet(key)
        
        # Decrypt
        decrypted = fernet.decrypt(encrypted.encode())
        
        # Parse JSON and return dict
        return json.loads(decrypted.decode())
    except Exception as e:
        print(f"Error decrypting credentials: {e}")
        return None

