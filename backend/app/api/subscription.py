from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, SubscriptionPlan
from app.schemas import SubscriptionPlanResponse, EnterpriseContactRequest
from app.clerk_security import get_current_user_from_clerk as get_current_user

router = APIRouter()

@router.get("/plans", response_model=List[SubscriptionPlanResponse])
async def get_plans(db: Session = Depends(get_db)):
    """Get all active subscription plans"""
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    return plans

@router.post("/subscribe/{plan_id}")
async def subscribe_to_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Subscribe user to a plan"""
    # Verify plan exists
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    # Update user's subscription
    current_user.subscription_plan_id = plan_id
    current_user.subscription_status = "active"
    db.commit()
    
    return {
        "message": f"Successfully subscribed to {plan.display_name} plan",
        "plan": plan.display_name
    }

@router.post("/contact-enterprise")
async def contact_enterprise(contact_data: EnterpriseContactRequest):
    """Submit enterprise contact request"""
    # In a real app, this would send an email to the sales team
    # For now, we'll just log it
    print(f"Enterprise contact request: {contact_data.name} ({contact_data.email}) from {contact_data.company}")
    print(f"Message: {contact_data.message}")
    
    return {
        "message": "Thank you for your interest! Our sales team will contact you within 24 hours.",
        "contact_email": "enterprise@scraper.com"
    }

