from sqlalchemy import Column, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.core.database import Base


class ExecutiveBoard(Base):
    __tablename__ = "executive_board"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_name = Column(String(255), nullable=False)
    position = Column(String(100), nullable=False)  # CEO, CFO, COO, CTO, Board Member, etc.
    department = Column(String(100))
    email = Column(String(255))
    phone = Column(String(50))
    start_date = Column(Date)
    end_date = Column(Date, nullable=True)
    status = Column(String(50), default="active")  # active, inactive, on_leave
    bio = Column(Text)
    photo_url = Column(String(500))
    reports_to_id = Column(UUID(as_uuid=True), ForeignKey('executive_board.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "member_name": self.member_name,
            "position": self.position,
            "department": self.department,
            "email": self.email,
            "phone": self.phone,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "status": self.status,
            "bio": self.bio,
            "photo_url": self.photo_url,
            "reports_to_id": str(self.reports_to_id) if self.reports_to_id else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
