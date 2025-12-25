from fastapi import APIRouter
from backend.app.api.v1.endpoints import auth, projects, query, admin, documents

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(documents.router, prefix="/projects", tags=["documents"])
api_router.include_router(query.router, prefix="/projects", tags=["query"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(query.router, prefix="/projects", tags=["query"])
