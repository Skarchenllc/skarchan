"""Generic file upload endpoint.

Accepts multipart/form-data, stores the file under /app/uploads in the
container (mounted to a host volume), and returns a URL that the frontend
can store in an entity_record `file`-type field.
"""
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, File, UploadFile, HTTPException

router = APIRouter()

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "/app/uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Max file size: 100 MB
MAX_BYTES = 100 * 1024 * 1024


@router.post("")
async def upload_file(file: UploadFile = File(...)):
    """Stream upload to disk, return a stable URL."""
    suffix = Path(file.filename or "").suffix
    name = f"{uuid.uuid4().hex}{suffix}"
    dest = UPLOAD_DIR / name

    size = 0
    with dest.open("wb") as out:
        while True:
            chunk = await file.read(1024 * 64)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_BYTES:
                out.close()
                dest.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="File exceeds 100 MB limit")
            out.write(chunk)

    return {
        "url": f"/uploads/{name}",
        "filename": file.filename,
        "content_type": file.content_type,
        "size": size,
    }
