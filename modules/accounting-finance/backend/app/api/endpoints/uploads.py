from fastapi import APIRouter, UploadFile, File, HTTPException, status
from typing import List
import os
import uuid
from pathlib import Path
import json

router = APIRouter()

# Upload directory
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf", ".gif", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a single file (receipt/invoice)"""
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename

    # Save file
    with open(file_path, "wb") as f:
        f.write(content)

    return {
        "filename": unique_filename,
        "original_filename": file.filename,
        "url": f"/static/uploads/{unique_filename}",
        "size": len(content),
        "content_type": file.content_type
    }


@router.post("/upload-multiple")
async def upload_multiple_files(files: List[UploadFile] = File(...)):
    """Upload multiple files (receipts/invoices)"""
    uploaded_files = []

    for file in files:
        # Validate file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            continue  # Skip invalid files

        # Read file content
        content = await file.read()

        # Validate file size
        if len(content) > MAX_FILE_SIZE:
            continue  # Skip large files

        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / unique_filename

        # Save file
        with open(file_path, "wb") as f:
            f.write(content)

        uploaded_files.append({
            "filename": unique_filename,
            "original_filename": file.filename,
            "url": f"/static/uploads/{unique_filename}",
            "size": len(content),
            "content_type": file.content_type
        })

    return {"files": uploaded_files, "count": len(uploaded_files)}


@router.delete("/upload/{filename}")
async def delete_file(filename: str):
    """Delete an uploaded file"""
    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    try:
        os.remove(file_path)
        return {"message": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )
