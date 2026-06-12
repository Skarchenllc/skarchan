from sqlalchemy import Column, String, Text, Date, DateTime, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.core.database import Base


class LegalCase(Base):
    __tablename__ = "legal_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_number = Column(String(100), unique=True, nullable=False, index=True)
    case_title = Column(String(500), nullable=False)
    case_type = Column(String(100), nullable=False)  # litigation, contract, intellectual_property, employment, regulatory, other
    status = Column(String(50), default="open")  # open, in_progress, settled, closed, on_hold
    priority = Column(String(50), default="medium")  # low, medium, high, critical
    plaintiff = Column(String(255))
    defendant = Column(String(255))
    court_name = Column(String(255))
    assigned_counsel = Column(String(255))
    external_counsel = Column(String(255))
    case_value = Column(Numeric(15, 2))
    filing_date = Column(Date)
    hearing_date = Column(Date)
    resolution_date = Column(Date, nullable=True)
    outcome = Column(String(255))
    description = Column(Text)
    documents = Column(JSONB, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "case_number": self.case_number,
            "case_title": self.case_title,
            "case_type": self.case_type,
            "status": self.status,
            "priority": self.priority,
            "plaintiff": self.plaintiff,
            "defendant": self.defendant,
            "court_name": self.court_name,
            "assigned_counsel": self.assigned_counsel,
            "external_counsel": self.external_counsel,
            "case_value": float(self.case_value) if self.case_value else None,
            "filing_date": self.filing_date.isoformat() if self.filing_date else None,
            "hearing_date": self.hearing_date.isoformat() if self.hearing_date else None,
            "resolution_date": self.resolution_date.isoformat() if self.resolution_date else None,
            "outcome": self.outcome,
            "description": self.description,
            "documents": self.documents,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
