from typing import List
from openai import OpenAI
from app.config import settings
import redis
import json
import hashlib

# Initialize Gemini client with OpenAI-compatible endpoint
client = OpenAI(
    api_key=settings.GEMINI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
) if settings.GEMINI_API_KEY else None

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=False)

def get_cache_key(text: str) -> str:
    return f"embedding:{hashlib.md5(text.encode()).hexdigest()}"

def get_embeddings(texts: List[str]) -> List[List[float]]:
    embeddings = []
    
    for text in texts:
        cache_key = get_cache_key(text)
        
        try:
            cached = redis_client.get(cache_key)
            if cached:
                embeddings.append(json.loads(cached))
                continue
        except:
            pass
        
        try:
            if client:
                response = client.embeddings.create(
                    model="text-embedding-004",
                    input=text[:8000]
                )
                embedding = response.data[0].embedding
            else:
                embedding = [0.0] * 768
            
            embeddings.append(embedding)
            
            try:
                redis_client.setex(cache_key, 86400, json.dumps(embedding))
            except:
                pass
                
        except Exception as e:
            print(f"Error generating embedding: {str(e)}")
            embedding = [0.0] * 768
            embeddings.append(embedding)
    
    return embeddings

def get_single_embedding(text: str) -> List[float]:
    return get_embeddings([text])[0]

