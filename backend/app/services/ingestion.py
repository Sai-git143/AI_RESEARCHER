import logging
import os
import re
from tempfile import NamedTemporaryFile
from fastapi import UploadFile
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

# Config
CHUNK_SIZE = 1200
CHUNK_OVERLAP = 200

def clean_text(text: str) -> str:
    """
    Cleans extracted text for academic papers.
    """
    # Fix hyphenation: "word- \n word" -> "wordword"
    text = re.sub(r'(\w+)-\s+(\w+)', r'\1\2', text)
    # Replace multiple newlines with a single newline
    text = re.sub(r'\n{2,}', '\n', text)
    # Replace multiple spaces with single space
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()

def extract_text_from_bytes_and_chunk(file_stream, filename: str) -> list[dict]:
    """
    Extracts text from a file-like object (bytes), chunks it, and returns list of docs with metadata.
    """
    chunks_with_metadata = []
    try:
        reader = PdfReader(file_stream)
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

        for i, page in enumerate(reader.pages):
            page_text = clean_text(page.extract_text())
            if not page_text:
                continue
            
            # Split this page's text
            page_chunks = splitter.split_text(page_text)
            
            for chunk in page_chunks:
                chunks_with_metadata.append({
                    "text": chunk,
                    "metadata": {
                        "source": filename,
                        "page": i + 1
                    }
                })
                
        return chunks_with_metadata
    except Exception as e:
        logger.error(f"Error reading PDF stream: {e}")
        raise ValueError("Failed to extract text from PDF stream")

def extract_text_and_chunk(file_path: str, filename: str) -> list[dict]:
    """
    Wrapper for backward compatibility or file-path based processing.
    """
    with open(file_path, "rb") as f:
        return extract_text_from_bytes_and_chunk(f, filename)

async def process_pdf(file: UploadFile) -> list[dict]:
    """
    Reads upload file and returns list of dicts {text, metadata}.
    """
    contents = await file.read()
    
    # Use io.BytesIO to treat bytes as a file stream
    import io
    file_stream = io.BytesIO(contents)
    
    try:
        return extract_text_from_bytes_and_chunk(file_stream, filename=file.filename)
    except Exception as e:
        logger.error(f"Error processing PDF upload: {e}")
        # Reset file cursor just in case, though we read into memory
        await file.seek(0)
        raise e
