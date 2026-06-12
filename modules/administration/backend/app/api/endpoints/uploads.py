from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import uuid
import os
from typing import Optional

router = APIRouter(prefix="/uploads", tags=["uploads"])

# Define upload directory
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/photo")
async def upload_photo(file: UploadFile = File(...)):
    """Upload a profile photo for executive board members."""

    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename

    # Save file
    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Return file URL
    file_url = f"/uploads/{unique_filename}"

    return {
        "filename": unique_filename,
        "original_filename": file.filename,
        "url": file_url,
        "size": len(content),
        "content_type": file.content_type
    }


@router.delete("/photo/{filename}")
async def delete_photo(filename: str):
    """Delete an uploaded photo."""

    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    try:
        os.remove(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

    return {"message": "File deleted successfully", "filename": filename}
