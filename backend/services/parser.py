import fitz
from docx import Document
from fastapi import UploadFile
import io

async def extract_text(file: UploadFile) -> str:
    contents = await file.read()
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        return _parse_pdf(contents)
    elif filename.endswith(".docx"):
        return _parse_docx(contents)
    else:
        raise ValueError(f"Unsupported file type: {file.filename}")

def _parse_pdf(contents: bytes) -> str:
    doc = fitz.open(stream=contents, filetype="pdf")
    return "\n".join(page.get_text() for page in doc).strip()

def _parse_docx(contents: bytes) -> str:
    doc = Document(io.BytesIO(contents))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()