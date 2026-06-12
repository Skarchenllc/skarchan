from sqlalchemy import Column, String, Text, Date, DateTime, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.core.database import Base


class StrategicInitiative(Base):
    __tablename__ = "strategic_initiatives"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    initiative_code = Column(String(100), unique=True, nullable=False, index=True)
    initiative_name = Column(String(500), nullable=False)
    category = Column(String(100), nullable=False)  # growth, efficiency, innovation, transformation, risk_management, other
    status = Column(String(50), default="proposed")  # proposed, approved, in_progress, on_hold, completed, cancelled
    priority = Column(String(50), default="medium")  # low, medium, high, critical
    owner = Column(String(255))  # executive sponsor
    champion = Column(String(255))  # project lead
    start_date = Column(Date)
    target_completion_date = Column(Date)
    actual_completion_date = Column(Date, nullable=True)
    budget_allocated = Column(Numeric(15, 2))
    budget_spent = Column(Numeric(15, 2))
    progress_percentage = Column(Integer, default=0)  # 0-100
    objectives = Column(JSONB, default=list)  # array of objectives
    kpis = Column(JSONB, default=list)  # array of KPIs
    milestones = Column(JSONB, default=list)  # array of milestones
    risks = Column(JSONB, default=list)  # array of risks
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "initiative_code": self.initiative_code,
            "initiative_name": self.initiative_name,
            "category": self.category,
            "status": self.status,
            "priority": self.priority,
            "owner": self.owner,
            "champion": self.champion,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "target_completion_date": self.target_completion_date.isoformat() if self.target_completion_date else None,
            "actual_completion_date": self.actual_completion_date.isoformat() if self.actual_completion_date else None,
            "budget_allocated": float(self.budget_allocated) if self.budget_allocated else None,
            "budget_spent": float(self.budget_spent) if self.budget_spent else None,
            "progress_percentage": self.progress_percentage,
            "objectives": self.objectives,
            "kpis": self.kpis,
            "milestones": self.milestones,
            "risks": self.risks,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
