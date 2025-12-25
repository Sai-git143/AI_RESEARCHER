import os
import logging
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.app.api import deps
from backend.app.models import User, Project, Document
from backend.app.db.base import get_db
from backend.app.core.config import settings
from backend.app.services.ingestion import process_pdf
from backend.app.services.rag import rag_service

router = APIRouter()
logger = logging.getLogger(__name__)

class DocumentResponse(BaseModel):
    id: int
    filename: str
    is_indexed: bool
    uploaded_at: Any
    
    class Config:
        from_attributes = True

@router.post("/{project_id}/documents/upload", response_model=List[DocumentResponse])
async def upload_documents(
    project_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # 1. Verify Project Ownership
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    uploaded_docs = []

    # Supabase Storage Logic (Stateless)
    from backend.app.services.storage import storage_service

    for file in files:
        if not file.filename.lower().endswith('.pdf'):
            continue # Skip non-PDFs for now
            
        try:
            # Read unique file content into memory
            # Note: For very large files, this might need chunked upload, but standard PDFs are fine.
            content = await file.read()
            
            # Create a unique path: project_id/timestamp_filename
            import time
            timestamp = int(time.time())
            storage_path = f"project_{project_id}/{timestamp}_{file.filename}"
            
            # Upload to Supabase
            public_url = storage_service.upload_file(content, storage_path, content_type="application/pdf")
            
            # Create DB Record
            db_doc = Document(
                project_id=project.id,
                filename=file.filename,
                file_path=public_url, # Store URL or Storage Path? URL is better for frontend access.
                file_size=len(content),
                is_indexed=False
            )
            db.add(db_doc)
            db.commit() # Commit to get ID
            
            # 3. Process PDF (Text Extraction)
            # Since we are stateless, we can either:
            # a) Download from URL (adds latency)
            # b) Use the 'content' bytes we already have (fastest)
            
            from backend.app.services.ingestion import extract_text_from_bytes_and_chunk
            
            # We need to adapt ingestion.py to handle BYTES instead of file path
            # For now, let's write to a temp file if PyPDF2 strictness requires it, or use io.BytesIO
            import io
            file_stream = io.BytesIO(content)
            
            chunk_dicts = extract_text_from_bytes_and_chunk(file_stream, filename=file.filename)
            
            texts = [c["text"] for c in chunk_dicts]
            
            # 4. RAG Indexing
            # Add Source Metadata + Page Numbers
            metadatas = []
            for c in chunk_dicts:
                meta = c["metadata"]
                meta["document_id"] = db_doc.id # Add DB ID to metadata
                meta["source"] = file.filename # Ensure source is friendly name
                metadatas.append(meta)
            
            if rag_service.add_documents(project.id, texts, metadatas):
                db_doc.is_indexed = True
                db.commit()
            
            uploaded_docs.append(db_doc)

        except Exception as e:
            logger.error(f"Failed to process file {file.filename}: {e}")
            # db.delete(db_doc) # Optional: Delete on failure
            # db.commit()
            raise HTTPException(status_code=500, detail=f"Error processing {file.filename}: {str(e)}")

    return uploaded_docs

@router.get("/{project_id}/documents", response_model=List[DocumentResponse])
def read_documents(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return project.documents

@router.delete("/{project_id}/documents/{document_id}", status_code=200)
def delete_document(
    project_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    document = db.query(Document).filter(Document.id == document_id, Document.project_id == project_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete from Supabase Storage
    # Extract path from URL or logic?
    # Logic: "project_{id}/{timestamp}_{filename}"
    # But we stored the FULL URL in file_path. We need to extract the relative path.
    # URL: .../uploads/project_8/123_file.pdf
    # Bucket: "uploads"
    # We need: "project_8/123_file.pdf"
    
    from backend.app.services.storage import storage_service
    
    try:
        if document.file_path and "storage/v1/object/public/" in document.file_path:
            # Extract path suffix
            # Split by bucket name
            parts = document.file_path.split(f"/{storage_service.BUCKET_NAME}/")
            if len(parts) > 1:
                relative_path = parts[1]
                storage_service.delete_file(relative_path)
    except Exception as e:
        logger.error(f"Failed to delete file from storage: {e}")
    
    # Remove from DB
    db.delete(document)
    db.commit()
    
    return None
