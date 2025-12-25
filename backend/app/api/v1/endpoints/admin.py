from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.app.api import deps
from backend.app.db.base import get_db
from backend.app.models import User

router = APIRouter()

class UserAdminView(BaseModel):
    id: int
    email: str
    full_name: str | None = None
    transaction_id: str | None = None
    is_premium: bool
    
    class Config:
        from_attributes = True

@router.get("/pending", response_model=List[UserAdminView])
def list_pending_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    
    # Verify logic: transaction_id is not null AND is_premium is False
    users = db.query(User).filter(User.transaction_id.isnot(None), User.is_premium == False).all()
    return users

@router.post("/approve/{user_id}")
def approve_subscription(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_premium = True
    # Keep transaction_id for record or clear it? 
    # Usually keep it, but maybe mark as handled?
    # For now, we trust is_premium=True means handled.
    db.commit()
    return {"message": "User approved and set to Premium"}
