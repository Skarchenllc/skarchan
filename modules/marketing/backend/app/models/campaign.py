from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Integer, Numeric, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.core.database import Base


class Campaign(Base):
    """Marketing Campaign"""
    __tablename__ = "campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Information
    campaign_name = Column(String(255), nullable=False, index=True)
    campaign_code = Column(String(100), unique=True, nullable=False)
    campaign_type = Column(String(50), nullable=False)  # email, social, ads, content

    # Status and Dates
    status = Column(String(50), default="draft")  # draft, active, paused, completed, archived
    start_date = Column(Date)
    end_date = Column(Date)

    # Campaign Details
    description = Column(Text)
    target_audience = Column(String(255))
    goals = Column(Text)

    # Budget and Performance
    budget = Column(Numeric(12, 2), default=0.0)
    budget_spent = Column(Numeric(12, 2), default=0.0)

    # Metrics
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    leads_generated = Column(Integer, default=0)

    # Campaign Settings (JSONB for flexibility)
    settings = Column(JSONB)  # email templates, social posts, ad creatives, etc.

    # Metadata
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Campaign {self.campaign_code} - {self.campaign_name}>"


class CampaignActivity(Base):
    """Campaign Activity Log"""
    __tablename__ = "campaign_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)

    activity_type = Column(String(50), nullable=False)  # email_sent, post_published, ad_launched, etc.
    activity_date = Column(DateTime, default=datetime.utcnow)

    description = Column(Text)
    metrics = Column(JSONB)  # Activity-specific metrics

    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<CampaignActivity {self.activity_type} - {self.activity_date}>"
