from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.app.api import deps
from backend.app.models import User, Project, AnalysisResult, ChatMessage, ChatRole
from backend.app.db.base import get_db
from backend.app.services.rag import rag_service
from backend.app.services.reasoning import reasoning_service

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    document_ids: List[int] = [] # Optional: List of document IDs to filter by

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]

class MethodologySuggestion(BaseModel):
    action: str
    reasoning: str
    citations: List[str]

class AnalysisResponse(BaseModel):
    research_gaps: List[str]
    methodology_suggestions: List[MethodologySuggestion]
    common_approaches: List[str] = []
    missing_evaluations: List[str] = []
    unexplored_scenarios: List[str] = []

@router.post("/{project_id}/query/chat", response_model=ChatResponse)
def project_chat(
    project_id: int,
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 1. Prepare Valid Docs Filter
    valid_doc_ids = {doc.id for doc in project.documents} # Set for O(1) lookup
    
    target_doc_ids = valid_doc_ids
    if request.document_ids:
        # If user selected specific docs, intersect with valid docs to ensure they exist
        target_doc_ids = valid_doc_ids.intersection(set(request.document_ids))
    
    try:
        # 1. Retrieve Context
        k_val = 5
        if request.document_ids:
            # We fetch more candidates to ensure we have enough after filtering
            k_val = 20
        
        context_docs = rag_service.similarity_search(project_id, request.query, k=k_val)
        
        # Strict Filter: Only allow documents that are currently in the Project DB
        filtered_docs = []
        for doc in context_docs:
            doc_id = doc.get("metadata", {}).get("document_id")
            if doc_id in target_doc_ids:
                filtered_docs.append(doc)
        
        context_docs = filtered_docs[:5] # Take top 5 valid docs
        
        # Format context with "Reality" headers for the LLM
        context_chunks = []
        for doc in context_docs:
            meta = doc.get("metadata", {})
            source = meta.get("source", "Unknown")
            page = meta.get("page", "?")
            content = doc.get("content", "")
            context_chunks.append(f"[Document: {source} | Page: {page}]\n{content}")
        
        context_text = "\n\n".join(context_chunks)
        
        # 2. Retrieve Chat History
        from backend.app.models.project import MessageType
        history_records = db.query(ChatMessage).filter(
            ChatMessage.project_id == project_id,
            ChatMessage.message_type == MessageType.CHAT
        ).order_by(ChatMessage.created_at.desc()).limit(10).all()
        history_records.reverse()
        
        chat_history_text = ""
        for msg in history_records:
            role_label = "User" if msg.role == ChatRole.USER else "Assistant"
            chat_history_text += f"{role_label}: {msg.content}\n\n"
    
        # 3. Get Answer
        answer = reasoning_service.get_answer(request.query, context_text, chat_history_text)
        
        # 4. Save History (filter duplicates or handle same session logic)
        user_msg = ChatMessage(project_id=project_id, role=ChatRole.USER, content=request.query, message_type=MessageType.CHAT)
        ai_msg = ChatMessage(project_id=project_id, role=ChatRole.ASSISTANT, content=answer, message_type=MessageType.CHAT)
        db.add(user_msg)
        db.add(ai_msg)
        db.commit()
    
        return {"answer": answer, "sources": []}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{project_id}/query/analyze", response_model=AnalysisResponse)
def analyze_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 1. Gather Broad Context (naive approach: get generic chunks or random sample)
    # Ideally search for "summary", "conclusion", "limitations"
    queries = ["limitations", "future work", "conclusion", "methodology"]
    
    # 1. Prepare Valid Docs Filter
    valid_doc_ids = {doc.id for doc in project.documents}
    
    context_docs = []
    for q in queries:
        results = rag_service.similarity_search(project_id, q, k=5) # increased k to allow filtering
        # Strict Filter
        for doc in results:
            doc_id = doc.get("metadata", {}).get("document_id")
            if doc_id in valid_doc_ids:
                context_docs.append(doc)
    
    # Extract text content from dicts and deduplicate
    unique_contents = set()
    for doc in context_docs:
        if isinstance(doc, dict):
            unique_contents.add(doc.get("content", ""))
        else:
            unique_contents.add(str(doc))
            
    combined_context = "\n\n".join(unique_contents)
    
    if not combined_context:
        raise HTTPException(status_code=400, detail="Not enough documents to analyze.")

    # 2. Perform Analysis
    result = reasoning_service.analyze_project(combined_context)
    
    # 3. Save/Update Result
    analysis_entry = db.query(AnalysisResult).filter(AnalysisResult.project_id == project_id).first()
    if not analysis_entry:
        analysis_entry = AnalysisResult(
            project_id=project_id,
            research_gaps=result.get("research_gaps", []),
            methodology_suggestions=result.get("methodology_suggestions", []),
            common_approaches=result.get("common_approaches", []),
            missing_evaluations=result.get("missing_evaluations", []),
            unexplored_scenarios=result.get("unexplored_scenarios", [])
        )
        db.add(analysis_entry)
    else:
        analysis_entry.research_gaps = result.get("research_gaps", [])
        analysis_entry.methodology_suggestions = result.get("methodology_suggestions", [])
        analysis_entry.common_approaches = result.get("common_approaches", [])
        analysis_entry.missing_evaluations = result.get("missing_evaluations", [])
        analysis_entry.unexplored_scenarios = result.get("unexplored_scenarios", [])
    
    db.commit()
    
    return result
@router.post("/{project_id}/query/research")
def deep_research(
    project_id: int,
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 1. Broad Retrieval (Get more context for deep research)
    # Prepare Valid Docs Filter
    valid_doc_ids = {doc.id for doc in project.documents}

    context_docs_raw = rag_service.similarity_search(project_id, request.query, k=20)
    
    # Strict Filter
    context_docs = []
    for doc in context_docs_raw:
        doc_id = doc.get("metadata", {}).get("document_id")
        if doc_id in valid_doc_ids:
            context_docs.append(doc)
    
    # Extract text content
    context_text_list = []
    for doc in context_docs:
        if isinstance(doc, dict):
            context_text_list.append(doc.get("content", ""))
        else:
            context_text_list.append(str(doc))
            
    context_text = "\n\n".join(context_text_list)
    
    # Context might be empty, but we let the LLM handle it with general knowledge or a polite explanation.
    if not context_text:
        context_text = "No specific documents found in the database. Please answer based on general research principles or theoretical knowledge, but clearly state that no specific project documents were cited."

    # 2. Retrieve Chat History
    # IMPORTANT: Only retrieve research history!
    from backend.app.models.project import MessageType
    history_records = db.query(ChatMessage).filter(
        ChatMessage.project_id == project_id,
        ChatMessage.message_type == MessageType.RESEARCH
    ).order_by(ChatMessage.created_at.desc()).limit(10).all()
    
    # Reverse to chronological order
    history_records.reverse()
    
    chat_history_text = ""
    for msg in history_records:
        role_label = "User" if msg.role == ChatRole.USER else "Assistant"
        chat_history_text += f"{role_label}: {msg.content}\n\n"

    # 3. Generate Report
    result = reasoning_service.perform_deep_research(
        query=request.query, 
        context=context_text, 
        chat_history=chat_history_text,
        project_title=project.title,
        project_description=project.description or "No description provided."
    )
    
    # 3. Save as a chat message for history (optional, or just return)
    # We'll save it so it appears in the chat
    user_msg = ChatMessage(project_id=project_id, role=ChatRole.USER, content=f"[Deep Research] {request.query}", message_type=MessageType.RESEARCH)
    ai_msg = ChatMessage(project_id=project_id, role=ChatRole.ASSISTANT, content=result["report"], message_type=MessageType.RESEARCH)
    db.add(user_msg)
    db.add(ai_msg)
    db.commit()

    return result
