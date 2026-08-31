"""
S3 Document Storage — AWS S3 integration for secure document storage.

Replaces local file storage with S3 for production deployments.
Documents are stored in a private bucket with server-side encryption.

Bucket structure:
  s3://<bucket>/
    certificates/<train_id>/<domain>/<timestamp>.pdf
    contracts/<employee_id>/<timestamp>.pdf
    job_cards/<upload_id>.csv
    cleaning_slots/<upload_id>.csv
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from io import BytesIO
from typing import Optional

import boto3
from botocore.exceptions import ClientError

from config import (
    AWS_REGION,
    S3_BUCKET_NAME,
    S3_BUCKET_PREFIX,
)

logger = logging.getLogger(__name__)

_s3_client = None


def _get_s3_client():
    """Lazy-initialised S3 client."""
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client("s3", region_name=AWS_REGION)
        logger.info("S3 client initialised: bucket=%s region=%s", S3_BUCKET_NAME, AWS_REGION)
    return _s3_client


def _make_key(prefix: str, *parts: str) -> str:
    """Build an S3 key with optional bucket prefix."""
    key_parts = [S3_BUCKET_PREFIX] if S3_BUCKET_PREFIX else []
    key_parts.append(prefix)
    key_parts.extend(parts)
    return "/".join(p.strip("/") for p in key_parts if p)


# ── Upload ────────────────────────────────────────────────────────

async def upload_certificate(
    pdf_bytes: bytes,
    train_id: str,
    domain: str,
    content_type: str = "application/pdf",
) -> dict:
    """
    Upload a fitness certificate PDF to S3.

    Returns: {success, s3_key, bucket, url}
    """
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    key = _make_key("certificates", train_id, domain, f"{ts}.pdf")

    return await _upload_bytes(pdf_bytes, key, content_type, metadata={
        "train_id": train_id,
        "domain": domain,
        "uploaded_at": ts,
    })


async def upload_contract(
    pdf_bytes: bytes,
    employee_id: str,
    content_type: str = "application/pdf",
) -> dict:
    """Upload a branding contract PDF to S3."""
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    key = _make_key("contracts", employee_id, f"{ts}.pdf")

    return await _upload_bytes(pdf_bytes, key, content_type, metadata={
        "employee_id": employee_id,
        "uploaded_at": ts,
    })


async def upload_data_file(
    content: bytes,
    category: str,
    filename: str,
    content_type: str = "text/csv",
) -> dict:
    """Upload a data file (job cards CSV, cleaning slots CSV) to S3."""
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    key = _make_key(category, f"{ts}_{filename}")

    return await _upload_bytes(content, key, content_type, metadata={
        "category": category,
        "original_filename": filename,
    })


async def _upload_bytes(
    data: bytes,
    key: str,
    content_type: str,
    metadata: Optional[dict] = None,
) -> dict:
    """Core upload to S3 with server-side encryption."""
    try:
        client = _get_s3_client()
        extra_args = {
            "ContentType": content_type,
            "ServerSideEncryption": "AES256",
        }
        if metadata:
            extra_args["Metadata"] = {k: str(v) for k, v in metadata.items()}

        client.upload_fileobj(
            BytesIO(data),
            S3_BUCKET_NAME,
            key,
            ExtraArgs=extra_args,
        )

        logger.info("S3 upload success: s3://%s/%s (%d bytes)", S3_BUCKET_NAME, key, len(data))

        return {
            "success": True,
            "s3_key": key,
            "bucket": S3_BUCKET_NAME,
            "url": f"s3://{S3_BUCKET_NAME}/{key}",
            "size_bytes": len(data),
        }

    except ClientError as e:
        logger.error("S3 upload failed: %s", e)
        return {"success": False, "error": str(e)}
    except Exception as e:
        logger.exception("S3 upload error: %s", e)
        return {"success": False, "error": str(e)}


# ── Download ──────────────────────────────────────────────────────

async def download_document(s3_key: str) -> Optional[bytes]:
    """Download a document from S3."""
    try:
        client = _get_s3_client()
        response = client.get_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
        data = response["Body"].read()
        logger.info("S3 download: %s (%d bytes)", s3_key, len(data))
        return data
    except ClientError as e:
        logger.error("S3 download failed for %s: %s", s3_key, e)
        return None


# ── List documents ───────────────────────────────────────────────

async def list_documents(prefix: str, max_keys: int = 100) -> list[dict]:
    """List documents under a prefix."""
    try:
        client = _get_s3_client()
        full_prefix = _make_key(prefix)

        response = client.list_objects_v2(
            Bucket=S3_BUCKET_NAME,
            Prefix=full_prefix,
            MaxKeys=max_keys,
        )

        documents = []
        for obj in response.get("Contents", []):
            documents.append({
                "key": obj["Key"],
                "size": obj["Size"],
                "last_modified": obj["LastModified"].isoformat(),
            })
        return documents

    except ClientError as e:
        logger.error("S3 list failed for prefix=%s: %s", prefix, e)
        return []


# ── Delete ────────────────────────────────────────────────────────

async def delete_document(s3_key: str) -> bool:
    """Delete a document from S3."""
    try:
        client = _get_s3_client()
        client.delete_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
        logger.info("S3 delete: %s", s3_key)
        return True
    except ClientError as e:
        logger.error("S3 delete failed for %s: %s", s3_key, e)
        return False


# ── Pre-signed URL (for time-limited access) ─────────────────────

def generate_presigned_url(s3_key: str, expires_in: int = 3600) -> Optional[str]:
    """Generate a pre-signed URL for temporary download access."""
    try:
        client = _get_s3_client()
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET_NAME, "Key": s3_key},
            ExpiresIn=expires_in,
        )
        return url
    except ClientError as e:
        logger.error("Pre-signed URL generation failed: %s", e)
        return None
