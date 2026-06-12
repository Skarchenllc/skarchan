from sqlalchemy import Column, String, DateTime, Integer, Numeric, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.core.database import Base


class CampaignMetric(Base):
    """Daily Campaign Performance Metrics"""
    __tablename__ = "campaign_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    metric_date = Column(Date, nullable=False, index=True)

    # Traffic Metrics
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    unique_visitors = Column(Integer, default=0)

    # Engagement Metrics
    engagement_rate = Column(Numeric(5, 2), default=0.0)  # Percentage
    bounce_rate = Column(Numeric(5, 2), default=0.0)  # Percentage
    avg_time_on_page = Column(Integer, default=0)  # Seconds

    # Conversion Metrics
    conversions = Column(Integer, default=0)
    conversion_rate = Column(Numeric(5, 2), default=0.0)  # Percentage
    leads_generated = Column(Integer, default=0)

    # Financial Metrics
    cost = Column(Numeric(12, 2), default=0.0)
    revenue = Column(Numeric(12, 2), default=0.0)
    roi = Column(Numeric(8, 2), default=0.0)  # Return on Investment percentage

    # Additional Metrics
    custom_metrics = Column(JSONB)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<CampaignMetric {self.campaign_id} - {self.metric_date}>"


class WebsiteAnalytic(Base):
    """Overall Website/Marketing Analytics"""
    __tablename__ = "website_analytics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    metric_date = Column(Date, nullable=False, index=True, unique=True)

    # Traffic
    total_visitors = Column(Integer, default=0)
    unique_visitors = Column(Integer, default=0)
    page_views = Column(Integer, default=0)

    # Sources
    organic_traffic = Column(Integer, default=0)
    direct_traffic = Column(Integer, default=0)
    referral_traffic = Column(Integer, default=0)
    social_traffic = Column(Integer, default=0)
    paid_traffic = Column(Integer, default=0)

    # Engagement
    avg_session_duration = Column(Integer, default=0)  # Seconds
    bounce_rate = Column(Numeric(5, 2), default=0.0)
    pages_per_session = Column(Numeric(4, 2), default=0.0)

    # Conversions
    total_conversions = Column(Integer, default=0)
    conversion_rate = Column(Numeric(5, 2), default=0.0)

    # Top Pages (JSONB)
    top_pages = Column(JSONB)  # [{url, views, title}]

    # Additional Data
    custom_data = Column(JSONB)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<WebsiteAnalytic {self.metric_date}>"
