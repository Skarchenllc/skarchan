from sqlalchemy import Column, String, DateTime, Boolean, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.core.database import Base


class Content(Base):
    """Marketing Content (Blog Posts, Landing Pages, etc.)"""
    __tablename__ = "contents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Information
    title = Column(String(500), nullable=False, index=True)
    slug = Column(String(500), unique=True, nullable=False, index=True)
    content_type = Column(String(50), nullable=False)  # blog_post, landing_page, email_template, social_post

    # Content
    body = Column(Text)
    excerpt = Column(Text)

    # SEO
    meta_title = Column(String(500))
    meta_description = Column(String(1000))
    keywords = Column(JSONB)  # Array of keywords

    # Status and Publishing
    status = Column(String(50), default="draft")  # draft, published, archived
    published_at = Column(DateTime)
    author = Column(String(100))

    # Engagement Metrics
    views = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    likes = Column(Integer, default=0)

    # Media
    featured_image = Column(String(500))
    images = Column(JSONB)  # Array of image URLs

    # Categories and Tags
    category = Column(String(100))
    tags = Column(JSONB)  # Array of tags

    # Custom Fields
    custom_fields = Column(JSONB)

    # Metadata
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Content {self.content_type} - {self.title}>"


class EmailTemplate(Base):
    """Email Templates for Marketing Campaigns"""
    __tablename__ = "email_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Information
    template_name = Column(String(255), nullable=False, index=True)
    template_code = Column(String(100), unique=True, nullable=False)

    # Email Details
    subject = Column(String(500), nullable=False)
    preview_text = Column(String(500))
    from_name = Column(String(100))
    from_email = Column(String(255))

    # Content
    html_content = Column(Text)
    text_content = Column(Text)

    # Template Variables
    variables = Column(JSONB)  # Array of template variables like {{first_name}}

    # Status
    is_active = Column(Boolean, default=True)

    # Metadata
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<EmailTemplate {self.template_code} - {self.template_name}>"
