from sqlalchemy import Column, String, Text, Date, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.core.database import Base


class CompliancePolicy(Base):
    __tablename__ = "compliance_policies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_code = Column(String(100), unique=True, nullable=False, index=True)
    policy_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)  # data_protection, financial, health_safety, environmental, ethics, other
    version = Column(String(50), nullable=False)
    status = Column(String(50), default="draft")  # draft, active, under_review, archived
    effective_date = Column(Date)
    review_date = Column(Date)
    expiry_date = Column(Date, nullable=True)
    owner = Column(String(255))  # responsible person/department
    approver = Column(String(255))
    description = Column(Text)
    policy_document_url = Column(String(500))
    scope = Column(JSONB, default=dict)  # applicable departments, roles, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "policy_code": self.policy_code,
            "policy_name": self.policy_name,
            "category": self.category,
            "version": self.version,
            "status": self.status,
            "effective_date": self.effective_date.isoformat() if self.effective_date else None,
            "review_date": self.review_date.isoformat() if self.review_date else None,
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "owner": self.owner,
            "approver": self.approver,
            "description": self.description,
            "policy_document_url": self.policy_document_url,
            "scope": self.scope,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
