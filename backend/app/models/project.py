from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, JSON, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from backend.app.db.base import Base

class ChatRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"

class MessageType(str, enum.Enum):
    CHAT = "chat"
    RESEARCH = "research"

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="projects")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    chats = relationship("ChatMessage", back_populates="project", cascade="all, delete-orphan")
    analysis = relationship("AnalysisResult", back_populates="project", uselist=False, cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False) # Local path
    file_size = Column(Integer)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    is_indexed = Column(Boolean, default=False)
    
    project = relationship("Project", back_populates="documents")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    role = Column(Enum(ChatRole, values_callable=lambda x: [e.value for e in x]), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(Enum(MessageType, values_callable=lambda x: [e.value for e in x]), default=MessageType.CHAT)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="chats")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), unique=True)
    research_gaps = Column(JSON, default=list) # List[str]
    methodology_suggestions = Column(JSON, default=list) # List[str]
    
    # New Gap Analysis Fields
    common_approaches = Column(JSON, default=list)
    missing_evaluations = Column(JSON, default=list)
    unexplored_scenarios = Column(JSON, default=list)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="analysis")
