import os
import logging
from supabase import create_client, Client
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

class StorageService:
    _instance = None
    _client: Client = None
    BUCKET_NAME = "uploads"

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(StorageService, cls).__new__(cls)
            if settings.SUPABASE_URL and settings.SUPABASE_KEY:
                try:
                    cls._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                    logger.info("Supabase Storage Client Initialized.")
                except Exception as e:
                    logger.error(f"Failed to initialize Supabase wrapper: {e}")
            else:
                logger.warning("Supabase credentials missing. Storage service disabled.")
        return cls._instance

    def upload_file(self, content: bytes, destination_path: str, content_type: str = "application/pdf") -> str:
        """
        Uploads a file to Supabase Storage.
        Returns the public URL or raises an exception.
        """
        if not self._client:
            raise Exception("Storage service not initialized.")

        try:
            # destination_path e.g., "project_1/file.pdf"
            response = self._client.storage.from_(self.BUCKET_NAME).upload(
                file=content,
                path=destination_path,
                file_options={"content-type": content_type, "upsert": "true"}
            )
            # Construct public URL (or get it from client if method exists)
            # Standard pattern: {SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{PATH}
            public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{self.BUCKET_NAME}/{destination_path}"
            return public_url
        except Exception as e:
            logger.error(f"Upload failed: {e}")
            raise e

    def delete_file(self, path: str):
        if not self._client:
            return
        try:
            self._client.storage.from_(self.BUCKET_NAME).remove([path])
        except Exception as e:
            logger.error(f"Delete failed: {e}")

storage_service = StorageService()
