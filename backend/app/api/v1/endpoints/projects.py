from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.app.api import deps
from backend.app.models import User, Project
from backend.app.db.base import get_db

router = APIRouter()

class ProjectCreate(BaseModel):
    title: str
    description: str | None = None

class ProjectResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    created_at: Any

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProjectResponse])
def read_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    # return db.query(Project).filter(Project.user_id == current_user.id).offset(skip).limit(limit).all()
    # Explicitly join or filter to ensure ownership
    projects = db.query(Project).filter(Project.owner == current_user).offset(skip).limit(limit).all()
    return projects

@router.post("/", response_model=ProjectResponse)
def create_project(
    *,
    db: Session = Depends(get_db),
    project_in: ProjectCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # Check limit for free users
    if not current_user.is_premium:
        count = db.query(Project).filter(Project.user_id == current_user.id).count()
        if count >= 2:
            raise HTTPException(
                status_code=402,
                detail="Free plan limit reached. Please upgrade to continue."
            )

    project = Project(
        title=project_in.title,
        description=project_in.description,
        user_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/{project_id}", response_model=ProjectResponse)
def read_project(
    *,
    db: Session = Depends(get_db),
    project_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

    db.delete(project)
    db.commit()
    return project

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: Any

    class Config:
        from_attributes = True

@router.get("/{project_id}/messages", response_model=List[MessageResponse])
def read_project_messages(
    *,
    db: Session = Depends(get_db),
    project_id: int,
    current_user: User = Depends(deps.get_current_user),
    type: str = "chat", # Default to chat history
) -> Any:
    from backend.app.models.project import ChatMessage, MessageType # Local import to avoid circular dep if any
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Filter by project and type
    messages = db.query(ChatMessage).filter(
        ChatMessage.project_id == project_id,
        ChatMessage.message_type == MessageType(type)
    ).order_by(ChatMessage.created_at.asc()).all()
    
    return messages
