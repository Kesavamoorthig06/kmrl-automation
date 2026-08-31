"""
File Forwarder — relay uploaded files from WhatsApp to the RAG processing server.

Pipeline:
  1. Download media from Twilio (authenticated with Twilio creds)
  2. Store temporarily on EC2 filesystem  (~/whatsapp/temp_uploads/)
  3. Forward to RAG server via HTTP POST multipart
  4. Return structured JSON response to caller
  5. Clean up temp file

The RAG server endpoint is configurable via RAG_PROCESS_URL env var.
"""

from __future__ import annotations

import logging
import os
import tempfile
from datetime import datetime, timezone
from typing import Optional

import httpx

from config import (
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
)

logger = logging.getLogger(__name__)

# ── Configuration ────────────────────────────────────────────────

RAG_PROCESS_URL: str = os.getenv("RAG_PROCESS_URL", "http://localhost:9000/process")
RAG_TIMEOUT: int = int(os.getenv("RAG_TIMEOUT_SECONDS", "120"))

_TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp_uploads")
os.makedirs(_TEMP_DIR, exist_ok=True)


# ── Download from Twilio ─────────────────────────────────────────

async def download_twilio_media(media_url: str) -> tuple[Optional[bytes], str]:
    """
    Download a media file from Twilio.

    Returns (file_bytes, content_type) or (None, "") on failure.
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                media_url,
                auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
                follow_redirects=True,
            )
            resp.raise_for_status()
            ct = resp.headers.get("content-type", "application/octet-stream")
            logger.info("Downloaded Twilio media: %d bytes, ct=%s", len(resp.content), ct)
            return resp.content, ct
    except Exception as e:
        logger.exception("Failed to download Twilio media: %s", e)
        return None, ""


# ── Store temporarily ────────────────────────────────────────────

def store_temp_file(
    file_bytes: bytes,
    filename: str = "upload",
    extension: str = ".pdf",
) -> str:
    """
    Write bytes to a temporary file on disk.
    Returns the absolute path of the temp file.
    """
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    safe_name = f"{filename}_{ts}{extension}"
    path = os.path.join(_TEMP_DIR, safe_name)
    with open(path, "wb") as f:
        f.write(file_bytes)
    logger.info("Stored temp file: %s (%d bytes)", path, len(file_bytes))
    return path


def cleanup_temp_file(path: str) -> None:
    """Remove a temporary file if it exists."""
    try:
        if os.path.isfile(path):
            os.remove(path)
            logger.debug("Cleaned up temp file: %s", path)
    except OSError as e:
        logger.warning("Failed to clean up %s: %s", path, e)


# ── Forward to RAG server ────────────────────────────────────────

async def forward_to_rag(
    file_bytes: bytes,
    filename: str,
    content_type: str = "application/pdf",
    metadata: Optional[dict] = None,
) -> dict:
    """
    POST a file to the RAG processing server as multipart/form-data.

    Parameters
    ----------
    file_bytes : raw file content
    filename : original or generated filename
    content_type : MIME type of the file
    metadata : optional dict of extra form fields to include

    Returns
    -------
    dict with either {success: True, data: <RAG JSON response>}
    or {success: False, error: <error message>}
    """
    try:
        files = {"file": (filename, file_bytes, content_type)}
        data = metadata or {}

        async with httpx.AsyncClient(timeout=RAG_TIMEOUT) as client:
            resp = await client.post(
                RAG_PROCESS_URL,
                files=files,
                data=data,
            )
            resp.raise_for_status()
            result = resp.json()

        logger.info("RAG server responded: status=%d keys=%s", resp.status_code, list(result.keys()))
        return {"success": True, "data": result}

    except httpx.TimeoutException:
        logger.error("RAG server timeout after %ds", RAG_TIMEOUT)
        return {"success": False, "error": f"RAG server timeout ({RAG_TIMEOUT}s)"}
    except httpx.HTTPStatusError as e:
        logger.error("RAG server error: %s %s", e.response.status_code, e.response.text[:200])
        return {"success": False, "error": f"RAG server returned {e.response.status_code}"}
    except Exception as e:
        logger.exception("RAG forward error: %s", e)
        return {"success": False, "error": str(e)}


# ── Full pipeline: download → store → forward → cleanup ──────────

async def process_whatsapp_upload(
    media_url: str,
    phone_number: str,
    employee_id: str,
    train_id: Optional[str] = None,
    doc_type: str = "certificate",
) -> dict:
    """
    Complete file processing pipeline:
      1. Download from Twilio
      2. Store temporarily on EC2
      3. Forward to RAG server
      4. Clean up temp file
      5. Return structured result

    Returns dict with {success, data?, error?}
    """
    # 1. Download
    file_bytes, content_type = await download_twilio_media(media_url)
    if file_bytes is None:
        return {"success": False, "error": "Failed to download file from Twilio"}

    # Determine extension
    ext_map = {
        "application/pdf": ".pdf",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/tiff": ".tiff",
    }
    ext = ext_map.get(content_type.split(";")[0].strip(), ".bin")
    filename = f"{employee_id}_{doc_type}_{train_id or 'unknown'}{ext}"

    # 2. Store temp
    temp_path = store_temp_file(file_bytes, filename=filename.replace(ext, ""), extension=ext)

    try:
        # 3. Forward to RAG
        metadata = {
            "phone_number": phone_number,
            "employee_id": employee_id,
            "train_id": train_id or "",
            "doc_type": doc_type,
            "content_type": content_type,
        }

        result = await forward_to_rag(
            file_bytes=file_bytes,
            filename=filename,
            content_type=content_type,
            metadata=metadata,
        )

        return result

    finally:
        # 4. Cleanup
        cleanup_temp_file(temp_path)
