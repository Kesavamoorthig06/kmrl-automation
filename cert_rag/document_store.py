"""
Raw document storage.

Receives uploaded files from the webhook, writes them to
object_storage/raw_certificates/ with a deterministic path,
and returns a DocumentMeta.
"""

from __future__ import annotations

import hashlib
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from config import RAW_CERT_DIR
from models import DocumentMeta, CertStatus


def _deterministic_id(filename: str, content: bytes) -> str:
    """SHA-256 of content → first 16 hex chars.  Ensures idempotent re-upload."""
    h = hashlib.sha256(content).hexdigest()[:16]
    return f"doc-{h}"


def store_document(
    filename: str,
    content: bytes,
    content_type: str,
    train_id: Optional[str] = None,
    caption: Optional[str] = None,
) -> DocumentMeta:
    """
    Persist the raw certificate file and return metadata.

    Idempotent: same file content → same document_id, overwrites on disk.
    """
    doc_id = _deterministic_id(filename, content)

    # Sub-directory per first 4 hex chars (light sharding)
    shard = doc_id[4:8]
    dest_dir = RAW_CERT_DIR / shard
    dest_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(filename).suffix or ""
    dest_path = dest_dir / f"{doc_id}{ext}"
    dest_path.write_bytes(content)

    return DocumentMeta(
        document_id=doc_id,
        filename=filename,
        content_type=content_type,
        train_id=train_id,
        caption=caption,
        received_at=datetime.utcnow(),
        status=CertStatus.PROCESSING,
        file_path=str(dest_path),
    )
