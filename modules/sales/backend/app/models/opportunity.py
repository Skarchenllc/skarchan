from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Numeric, Date, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.core.database import Base


class Opportunity(Base):
    """Sales Opportunity/Deal"""
    __tablename__ = "opportunities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Information
    opportunity_name = Column(String(255), nullable=False, index=True)
    opportunity_code = Column(String(100), unique=True, nullable=False)

    # Customer Association
    customer_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Opportunity Details
    stage = Column(String(50), default="prospecting")  # prospecting, qualification, proposal, negotiation, closed_won, closed_lost
    probability = Column(Integer, default=0)  # 0-100
    amount = Column(Numeric(15, 2), nullable=False)
    expected_close_date = Column(Date)
    actual_close_date = Column(Date)

    # Source and Type
    source = Column(String(100))  # inbound, outbound, referral, partner
    opportunity_type = Column(String(100))  # new_business, upsell, renewal

    # Sales Information
    assigned_to = Column(String(100))
    next_step = Column(Text)
    description = Column(Text)

    # Competition
    competitors = Column(JSONB)  # Array of competitor names

    # Products/Services
    products = Column(JSONB)  # Array of {product_name, quantity, price}

    # Status
    is_won = Column(String(50), default="open")  # open, won, lost
    loss_reason = Column(Text)

    # Metadata
    notes = Column(Text)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Opportunity {self.opportunity_code} - {self.opportunity_name}>"


class OpportunityActivity(Base):
    """Activity log for opportunities"""
    __tablename__ = "opportunity_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True)

    activity_type = Column(String(50), nullable=False)  # call, meeting, email, note, task
    activity_date = Column(DateTime, default=datetime.utcnow)

    subject = Column(String(255))
    description = Column(Text)
    outcome = Column(String(100))

    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<OpportunityActivity {self.activity_type} - {self.activity_date}>"
