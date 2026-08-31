"""
Text extraction from uploaded certificate documents.

Supports:
  - PDF  → pdfplumber (text-layer) with pytesseract OCR fallback
  - Images (png/jpg/tiff) → pytesseract OCR
  - Plain text / CSV → direct read
"""

from __future__ import annotations

import io
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


def extract_text(file_path: str, content_type: str) -> str:
    """
    Extract plain text from a certificate file.

    Returns the full text content or raises ValueError if extraction fails.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Document not found: {file_path}")

    ct = content_type.lower()

    if ct in ("text/plain", "text/csv"):
        return path.read_text(encoding="utf-8", errors="replace")

    if ct == "application/pdf" or path.suffix.lower() == ".pdf":
        return _extract_pdf(path)

    if ct.startswith("image/") or path.suffix.lower() in (".png", ".jpg", ".jpeg", ".tiff", ".bmp"):
        return _extract_image(path)

    # Fallback: try reading as text
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        raise ValueError(f"Unsupported content type: {content_type}")


def _extract_pdf(path: Path) -> str:
    """Extract text from PDF using pdfplumber, fall back to OCR if sparse."""
    try:
        import pdfplumber
    except ImportError:
        logger.warning("pdfplumber not installed — attempting OCR fallback for PDF")
        return _ocr_pdf(path)

    text_parts = []
    with pdfplumber.open(str(path)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text_parts.append(page_text)

    full_text = "\n".join(text_parts).strip()

    # If pdfplumber yielded very little, try OCR
    if len(full_text) < 50:
        logger.info("PDF text layer sparse — falling back to OCR")
        return _ocr_pdf(path)

    return full_text


def _ocr_pdf(path: Path) -> str:
    """Convert PDF pages to images and OCR each."""
    try:
        from pdf2image import convert_from_path
        import pytesseract
    except ImportError:
        raise RuntimeError(
            "pdf2image and pytesseract are required for scanned PDF OCR. "
            "Install with: pip install pdf2image pytesseract"
        )

    images = convert_from_path(str(path), dpi=300)
    text_parts = []
    for img in images:
        text_parts.append(pytesseract.image_to_string(img))
    return "\n".join(text_parts).strip()


def _extract_image(path: Path) -> str:
    """OCR an image file."""
    try:
        import pytesseract
        from PIL import Image
    except ImportError:
        raise RuntimeError(
            "pytesseract and Pillow are required for image OCR. "
            "Install with: pip install pytesseract Pillow"
        )

    img = Image.open(str(path))
    return pytesseract.image_to_string(img).strip()
