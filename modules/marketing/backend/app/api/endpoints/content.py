from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from datetime import datetime
from uuid import UUID
import uuid as uuid_lib

from app.core.database import get_db

router = APIRouter()


@router.get("/content")
async def get_content(
    content_type: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get all content with optional filters"""
    query = "SELECT * FROM contents WHERE 1=1"
    params = {}

    if content_type:
        query += " AND content_type = :content_type"
        params["content_type"] = content_type

    if status:
        query += " AND status = :status"
        params["status"] = status

    query += " ORDER BY created_at DESC"

    result = await db.execute(text(query), params)
    content_list = result.fetchall()

    return {
        "content": [
            {
                "id": str(row[0]),
                "title": row[1],
                "slug": row[2],
                "content_type": row[3],
                "excerpt": row[5],
                "status": row[9],
                "published_at": row[10].isoformat() if row[10] else None,
                "author": row[11],
                "views": row[12] or 0,
                "shares": row[13] or 0,
                "category": row[17],
                "tags": row[18],
                "created_at": row[21].isoformat() if row[21] else None,
            }
            for row in content_list
        ],
        "total": len(content_list)
    }


@router.get("/content/{content_id}")
async def get_content_by_id(
    content_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get content by ID"""
    result = await db.execute(
        text("SELECT * FROM contents WHERE id = :id"),
        {"id": str(content_id)}
    )
    content = result.fetchone()

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    return {
        "id": str(content[0]),
        "title": content[1],
        "slug": content[2],
        "content_type": content[3],
        "body": content[4],
        "excerpt": content[5],
        "meta_title": content[6],
        "meta_description": content[7],
        "keywords": content[8],
        "status": content[9],
        "published_at": content[10].isoformat() if content[10] else None,
        "author": content[11],
        "views": content[12] or 0,
        "shares": content[13] or 0,
        "likes": content[14] or 0,
        "featured_image": content[15],
        "images": content[16],
        "category": content[17],
        "tags": content[18],
        "custom_fields": content[19],
        "created_by": content[20],
        "created_at": content[21].isoformat() if content[21] else None,
        "updated_at": content[22].isoformat() if content[22] else None,
    }


@router.post("/content")
async def create_content(
    title: str,
    slug: str,
    content_type: str,
    body: Optional[str] = None,
    excerpt: Optional[str] = None,
    author: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Create new content"""
    # Check if slug already exists
    result = await db.execute(
        text("SELECT id FROM contents WHERE slug = :slug"),
        {"slug": slug}
    )
    existing = result.fetchone()

    if existing:
        raise HTTPException(status_code=400, detail="Content with this slug already exists")

    content_id = uuid_lib.uuid4()

    await db.execute(
        text("""
            INSERT INTO contents (
                id, title, slug, content_type, body, excerpt, status,
                author, views, shares, likes, created_at, updated_at
            ) VALUES (
                :id, :title, :slug, :content_type, :body, :excerpt, 'draft',
                :author, 0, 0, 0, NOW(), NOW()
            )
        """),
        {
            "id": str(content_id),
            "title": title,
            "slug": slug,
            "content_type": content_type,
            "body": body,
            "excerpt": excerpt,
            "author": author,
        }
    )
    await db.commit()

    return {
        "message": "Content created successfully",
        "id": str(content_id),
        "slug": slug
    }


@router.put("/content/{content_id}")
async def update_content(
    content_id: UUID,
    title: Optional[str] = None,
    slug: Optional[str] = None,
    content_type: Optional[str] = None,
    body: Optional[str] = None,
    excerpt: Optional[str] = None,
    author: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Update content"""
    updates = []
    params = {"id": str(content_id)}

    if title:
        updates.append("title = :title")
        params["title"] = title

    if slug:
        updates.append("slug = :slug")
        params["slug"] = slug

    if content_type:
        updates.append("content_type = :content_type")
        params["content_type"] = content_type

    if body is not None:
        updates.append("body = :body")
        params["body"] = body

    if excerpt is not None:
        updates.append("excerpt = :excerpt")
        params["excerpt"] = excerpt

    if author is not None:
        updates.append("author = :author")
        params["author"] = author

    if status:
        updates.append("status = :status")
        params["status"] = status
        if status == "published":
            updates.append("published_at = NOW()")

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates.append("updated_at = NOW()")
    query = f"UPDATE contents SET {', '.join(updates)} WHERE id = :id"

    await db.execute(text(query), params)
    await db.commit()

    return {"message": "Content updated successfully"}


@router.delete("/content/{content_id}")
async def delete_content(
    content_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete content"""
    await db.execute(
        text("DELETE FROM contents WHERE id = :id"),
        {"id": str(content_id)}
    )
    await db.commit()

    return {"message": "Content deleted successfully"}


@router.get("/email-templates")
async def get_email_templates(db: AsyncSession = Depends(get_db)):
    """Get all email templates"""
    result = await db.execute(
        text("SELECT * FROM email_templates WHERE is_active = true ORDER BY created_at DESC")
    )
    templates = result.fetchall()

    return {
        "templates": [
            {
                "id": str(row[0]),
                "template_name": row[1],
                "template_code": row[2],
                "subject": row[3],
                "from_name": row[5],
                "from_email": row[6],
                "is_active": row[10],
                "created_at": row[12].isoformat() if row[12] else None,
            }
            for row in templates
        ]
    }


@router.get("/content/stats/overview")
async def get_content_overview(db: AsyncSession = Depends(get_db)):
    """Get overall content statistics"""
    result = await db.execute(
        text("""
            SELECT
                COUNT(*) as total_content,
                COUNT(CASE WHEN status = 'published' THEN 1 END) as published_content,
                SUM(views) as total_views,
                SUM(shares) as total_shares
            FROM contents
        """)
    )
    stats = result.fetchone()

    return {
        "total_content": stats[0] or 0,
        "published_content": stats[1] or 0,
        "total_views": stats[2] or 0,
        "total_shares": stats[3] or 0,
    }
