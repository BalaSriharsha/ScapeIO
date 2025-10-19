from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User, ScrapingJob
from app.schemas import ChatbotEmbedRequest, ChatbotEmbedResponse, ChatRequest, ChatResponse
from app.security import get_current_user, get_current_user_optional
from app.services.chatbot_service import generate_embed_code, get_chat_response

router = APIRouter()

@router.post("/embed", response_model=ChatbotEmbedResponse)
async def get_embed_code(
    request: ChatbotEmbedRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(ScrapingJob).filter(
        ScrapingJob.id == request.job_id,
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
            detail="Job is not completed yet"
        )
    
    embed_code = generate_embed_code(request.job_id)
    return ChatbotEmbedResponse(embed_code=embed_code, job_id=request.job_id)

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    job = db.query(ScrapingJob).filter(ScrapingJob.id == request.job_id).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if job.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job is not completed yet"
        )
    
    user_id = current_user.id if current_user else None
    response = await get_chat_response(request.job_id, request.message, request.conversation_history, db, user_id)
    return response

