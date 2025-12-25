import logging
from backend.app.db.base import engine, Base
# Import all models so Base.metadata has them registered
from backend.app.models import User, Project, Document, ChatMessage, AnalysisResult

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    logger.info("Creating initial database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully.")

if __name__ == "__main__":
    init_db()
