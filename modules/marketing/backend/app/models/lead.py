from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Integer, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.core.database import Base


class Lead(Base):
    """Marketing Lead"""
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50))
    company = Column(String(255))
    job_title = Column(String(100))

    # Lead Details
    source = Column(String(100))  # website, social, referral, event, paid_ad
    status = Column(String(50), default="new")  # new, contacted, qualified, converted, lost
    score = Column(Integer, default=0)  # Lead scoring 0-100

    # Campaign Association
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"), index=True)

    # Address
    city = Column(String(100))
    state = Column(String(50))
    country = Column(String(100))

    # Engagement
    last_contacted = Column(DateTime)
    conversion_date = Column(Date)

    # Custom Fields
    interests = Column(JSONB)  # Array of interests
    custom_fields = Column(JSONB)

    # Metadata
    notes = Column(Text)
    assigned_to = Column(String(100))  # Sales/Marketing person
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Lead {self.first_name} {self.last_name} - {self.email}>"


class LeadActivity(Base):
    """Lead Activity/Interaction Log"""
    __tablename__ = "lead_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)

    activity_type = Column(String(50), nullable=False)  # email_opened, link_clicked, form_submitted, call_made
    activity_date = Column(DateTime, default=datetime.utcnow, index=True)

    description = Column(Text)
    activity_metadata = Column(JSONB)  # Activity-specific data

    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<LeadActivity {self.activity_type} - {self.activity_date}>"
