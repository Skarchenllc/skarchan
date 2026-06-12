from sqlalchemy import Column, String, Text, Date, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.core.database import Base


class ComplianceAudit(Base):
    __tablename__ = "compliance_audits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_number = Column(String(100), unique=True, nullable=False, index=True)
    audit_title = Column(String(500), nullable=False)
    audit_type = Column(String(100), nullable=False)  # internal, external, regulatory, certification
    policy_id = Column(UUID(as_uuid=True), ForeignKey('compliance_policies.id'), nullable=True)
    status = Column(String(50), default="scheduled")  # scheduled, in_progress, completed, failed
    risk_level = Column(String(50), default="medium")  # low, medium, high, critical
    auditor_name = Column(String(255))
    audit_date = Column(Date)
    completion_date = Column(Date, nullable=True)
    findings = Column(JSONB, default=list)  # array of findings
    recommendations = Column(Text)
    action_items = Column(JSONB, default=list)  # array of action items
    score = Column(Integer)  # 0-100
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "audit_number": self.audit_number,
            "audit_title": self.audit_title,
            "audit_type": self.audit_type,
            "policy_id": str(self.policy_id) if self.policy_id else None,
            "status": self.status,
            "risk_level": self.risk_level,
            "auditor_name": self.auditor_name,
            "audit_date": self.audit_date.isoformat() if self.audit_date else None,
            "completion_date": self.completion_date.isoformat() if self.completion_date else None,
            "findings": self.findings,
            "recommendations": self.recommendations,
            "action_items": self.action_items,
            "score": self.score,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
