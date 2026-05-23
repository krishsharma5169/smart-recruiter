import fitz
from docx import Document
from fastapi import UploadFile
import io

SUPPORTED_TYPES = [".pdf", ".docx"]

async def extract_text(file: UploadFile) -> str:
    filename = file.filename.lower()
    ext = next((e for e in SUPPORTED_TYPES if filename.endswith(e)), None)

    if not ext:
        raise ValueError(f"Unsupported file type: {file.filename}. Only PDF and DOCX allowed.")

    contents = await file.read()

    if ext == ".pdf":
        return _parse_pdf(contents, file.filename)
    elif ext == ".docx":
        return _parse_docx(contents)

def _parse_pdf(contents: bytes, filename: str) -> str:
    doc = fitz.open(stream=contents, filetype="pdf")
    text = "\n".join(page.get_text() for page in doc).strip()

    if not text:
        raise ValueError(
            f"'{filename}' appears to be a scanned PDF with no extractable text. "
            "Please provide a text-based PDF."
        )
    return text

def _parse_docx(contents: bytes) -> str:
    doc = Document(io.BytesIO(contents))
    text = "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()

    if not text:
        raise ValueError("DOCX file appears to be empty.")
    return text