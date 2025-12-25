import logging
from typing import List
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import SupabaseVectorStore
from supabase.client import create_client
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

class RAGService:
    _instance = None
    _embeddings = None
    _supabase = None
    _vector_store = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RAGService, cls).__new__(cls)
            
            # 1. Load Embeddings
            logger.info("Loading Embedding Model...")
            cls._embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
            
            # 2. Initialize Supabase Client for Vector Store
            if settings.SUPABASE_URL and settings.SUPABASE_KEY:
                try:
                    cls._supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                    
                    # Initialize Vector Store wrapper
                    # Note: Table name defaults to 'documents'. 
                    # query_name defaults to 'match_documents'.
                    cls._vector_store = SupabaseVectorStore(
                        client=cls._supabase,
                        embedding=cls._embeddings,
                        table_name="documents",
                        query_name="match_documents"
                    )
                    logger.info("Supabase Vector Store initialized.")
                except Exception as e:
                    logger.error(f"Failed to init Supabase Vector: {e}")
            else:
                logger.warning("Supabase credentials missing. RAG service limited.")
                
        return cls._instance

    @property
    def embeddings(self):
        return self._embeddings

    def add_documents(self, project_id: int, texts: List[str], metadatas: List[dict] = None) -> bool:
        """
        Embeds and pushes documents to Supabase Vector Store.
        """
        if not self._vector_store:
            logger.error("Vector Store not initialized.")
            return False

        try:
            # Check if metadatas need project_id injection? 
            # They already come with it usually, but let's ensure consistency.
            # metadatas already passed from caller have 'document_id' etc.
            # We should append project_id to metadata for filtering later!
            
            enriched_metadatas = []
            if metadatas:
                for meta in metadatas:
                    meta["project_id"] = project_id
                    enriched_metadatas.append(meta)
            else:
                enriched_metadatas = [{"project_id": project_id}] * len(texts)

            self._vector_store.add_texts(texts, metadatas=enriched_metadatas)
            return True
        except Exception as e:
            logger.error(f"Error adding documents to Supabase: {e}")
            return False

    def similarity_search(self, project_id: int, query: str, k: int = 4, filter: dict = None) -> List[dict]:
        """
        Performs similarity search on Supabase.
        Uses Metadata filtering for Project ID (Essential in shared table!).
        """
        if not self._vector_store:
            return []

        try:
            # Construct Filter
            # SupabaseVectorStore filter format: dict of metadata fields
            query_filter = {"project_id": project_id}
            
            # Merge with existing filter if any (like document_id)
            if filter:
                query_filter.update(filter)
            
            docs = self._vector_store.similarity_search(query, k=k, filter=query_filter)
            
            return [{"content": doc.page_content, "metadata": doc.metadata} for doc in docs]
        except Exception as e:
            logger.error(f"Error searching Supabase Vector: {e}")
            return []

rag_service = RAGService()
