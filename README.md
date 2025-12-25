# AI Project Researcher 🤖

A full-stack AI application that helps researchers analyze PDF papers, identifying research gaps and suggesting methodologies using RAG (Retrieval Augmented Generation) and Google Gemini.

## 🚀 Features
*   **Project Management**: Organize research into projects.
*   **PDF Ingestion**: Upload research papers (text extraction & chunking).
*   **RAG Search**: Vector-based semantic search using FAISS (Local).
*   **AI Analysis**:
    *   **Research Gap Identification**: Automatically finds what's missing in the literature.
    *   **Methodology Suggestions**: Proposes improvements based on context.
*   **Chat Assistant**: Q&A with your documents.

## 🛠️ Tech Stack
*   **Backend**: Python, FastAPI, SQLAlchemy, LangChain, FAISS.
*   **Frontend**: React, Vite, TailwindCSS, Lucide Icons.
*   **Database**: SQLite (Dev) / PostgreSQL (Prod ready).
*   **AI**: Google Gemini API (Free Tier) + HuggingFace Embeddings.

---

## 🏗️ Setup & Installation

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Dependencies (This may take time due to PyTorch/FAISS)
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY
```

**Run the Server:**
```bash
# From the root directory
python -m uvicorn backend.app.main:app --reload --port 8000
```
*The database tables will be created automatically on startup.*

### 2. Frontend Setup

```bash
cd frontend
npm install
```

**Run the Client:**
```bash
npm run dev
```
*Access the app at `http://localhost:5173`*

---

## 🔒 Security Notes
*   **Authentication**: Uses JWT (JSON Web Tokens). Default expiry is 30 mins.
*   **Data Isolation**: All files and indices are stored in `uploads/{project_id}/` and are strictly scoped to the project owner.
