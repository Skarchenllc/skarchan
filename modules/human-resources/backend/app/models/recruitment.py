from sqlalchemy import Column, String, Float, DateTime, Enum as SQLEnum, ForeignKey, Text, Date, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class JobRequisitionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    OPEN = "OPEN"
    ON_HOLD = "ON_HOLD"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"


class JobRequisition(Base):
    """Job Requisition/Opening"""
    __tablename__ = "job_requisitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Information
    job_title = Column(String(255), nullable=False)
    department = Column(String(255), nullable=False)
    location = Column(String(255))
    employment_type = Column(String(50), nullable=False)  # full_time, part_time, contract, internship

    # Position Details
    positions = Column(Integer, default=1)
    salary_range_min = Column(Integer)
    salary_range_max = Column(Integer)

    # Status and Dates
    status = Column(SQLEnum(JobRequisitionStatus), default=JobRequisitionStatus.OPEN, index=True)
    posted_date = Column(Date, default=datetime.utcnow)
    closing_date = Column(Date)

    # Job Description
    job_summary = Column(Text)
    key_responsibilities = Column(Text)

    # Requirements
    required_education = Column(String(100))
    preferred_education = Column(String(100))
    min_experience_years = Column(Integer)
    max_experience_years = Column(Integer)
    age_min = Column(Integer)
    age_max = Column(Integer)

    # Skills & Competencies (stored as comma-separated or JSON)
    required_skills = Column(Text)
    preferred_skills = Column(Text)
    certifications = Column(Text)
    languages = Column(Text)

    # Work Conditions
    work_schedule = Column(String(255))
    travel_required = Column(String(50))
    physical_requirements = Column(Text)

    # Benefits & Perks
    benefits = Column(Text)

    # Hiring Process
    interview_stages = Column(Text)
    onboarding_duration = Column(Integer)  # in days
    training_required = Column(Text)

    # Process Planning
    process_phases = Column(JSONB)  # Array of phase objects

    # Metrics
    applicants_count = Column(Integer, default=0)
    interviews_scheduled = Column(Integer, default=0)
    offers_made = Column(Integer, default=0)

    # Metadata
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<JobRequisition {self.job_title} - {self.status}>"


class ApplicantStatus(str, enum.Enum):
    NEW = "NEW"
    SCREENING = "SCREENING"
    INTERVIEW = "INTERVIEW"
    OFFER = "OFFER"
    HIRED = "HIRED"
    REJECTED = "REJECTED"


class Applicant(Base):
    """Job Applicant"""
    __tablename__ = "applicants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Job Application
    job_id = Column(UUID(as_uuid=True), ForeignKey("job_requisitions.id"), nullable=False)
    job_title = Column(String(255), nullable=False)
    application_date = Column(Date, default=datetime.utcnow)

    # Status
    status = Column(SQLEnum(ApplicantStatus), default=ApplicantStatus.NEW, index=True)
    current_stage = Column(String(255))

    # Basic Information
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=False)

    # Documents
    resume_url = Column(String(500))
    cv_file_name = Column(String(255))
    cover_letter = Column(Text)
    portfolio_url = Column(String(500))
    linkedin_url = Column(String(500))

    # Professional Background
    experience_years = Column(Integer, default=0)
    education = Column(String(255))
    skills = Column(JSONB)  # Array of skills

    # Personal Information
    date_of_birth = Column(Date)
    gender = Column(String(50))
    nationality = Column(String(100))

    # Address
    address = Column(String(500))
    city = Column(String(100))
    state = Column(String(50))
    zip_code = Column(String(20))
    country = Column(String(100))

    # Emergency Contact
    emergency_contact_name = Column(String(255))
    emergency_contact_phone = Column(String(50))
    emergency_contact_relationship = Column(String(100))

    # Conversion Tracking
    converted_to_employee = Column(Boolean, default=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"))
    conversion_date = Column(Date)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Applicant {self.name} - {self.job_title} - {self.status}>"


class AdvertisementStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Advertisement(Base):
    """Job Advertisement/Posting"""
    __tablename__ = "advertisements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Job Reference
    job_id = Column(UUID(as_uuid=True), ForeignKey("job_requisitions.id"), nullable=False)
    job_title = Column(String(255), nullable=False)

    # Advertisement Details
    platform = Column(String(255), nullable=False)  # LinkedIn, Indeed, Company Website, etc.
    ad_title = Column(String(500), nullable=False)
    ad_content = Column(Text)
    target_audience = Column(Text)

    # Budget & Costs
    budget = Column(Float)
    cost_per_click = Column(Float)
    total_spent = Column(Float, default=0.0)

    # Status & Dates
    status = Column(SQLEnum(AdvertisementStatus), default=AdvertisementStatus.DRAFT, index=True)
    start_date = Column(Date)
    end_date = Column(Date)
    posted_date = Column(Date)

    # Performance Metrics
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    applications_received = Column(Integer, default=0)
    conversion_rate = Column(Float, default=0.0)

    # Links & References
    ad_url = Column(String(500))
    tracking_code = Column(String(255))

    # Metadata
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Advertisement {self.platform} - {self.job_title} - {self.status}>"


class InterviewType(str, enum.Enum):
    PHONE_SCREENING = "phone_screening"
    VIDEO_INTERVIEW = "video_interview"
    IN_PERSON = "in_person"
    TECHNICAL = "technical"
    PANEL = "panel"
    BEHAVIORAL = "behavioral"
    CASE_STUDY = "case_study"


class Interview(Base):
    """Interview Schedule and Feedback"""
    __tablename__ = "interviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # References
    job_id = Column(UUID(as_uuid=True), ForeignKey("job_requisitions.id"), nullable=False)
    applicant_id = Column(UUID(as_uuid=True), ForeignKey("applicants.id"), nullable=False)

    # Interview Details
    interview_type = Column(SQLEnum(InterviewType), nullable=False)
    interview_round = Column(Integer, default=1)
    scheduled_date = Column(DateTime)
    duration_minutes = Column(Integer)
    location = Column(String(500))  # Can be physical location or video link

    # Interviewers
    interviewer_names = Column(JSONB)  # Array of interviewer names
    panel_members = Column(JSONB)  # Array of panel member objects

    # Status
    status = Column(String(50), default="scheduled")  # scheduled, completed, cancelled, rescheduled
    completed_date = Column(DateTime)

    # Feedback
    overall_rating = Column(Integer)  # 1-10 scale
    technical_rating = Column(Integer)
    communication_rating = Column(Integer)
    cultural_fit_rating = Column(Integer)
    strengths = Column(Text)
    weaknesses = Column(Text)
    notes = Column(Text)
    recommendation = Column(String(50))  # hire, maybe, reject

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Interview {self.interview_type} - {self.status}>"


class AssessmentType(str, enum.Enum):
    CODING_TEST = "coding_test"
    WRITTEN_TEST = "written_test"
    APTITUDE_TEST = "aptitude_test"
    PERSONALITY_TEST = "personality_test"
    SKILL_TEST = "skill_test"
    CASE_STUDY = "case_study"


class Assessment(Base):
    """Assessment/Test Results"""
    __tablename__ = "assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # References
    job_id = Column(UUID(as_uuid=True), ForeignKey("job_requisitions.id"), nullable=False)
    applicant_id = Column(UUID(as_uuid=True), ForeignKey("applicants.id"), nullable=False)

    # Assessment Details
    assessment_type = Column(SQLEnum(AssessmentType), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)

    # Scheduling
    assigned_date = Column(Date)
    due_date = Column(Date)
    completed_date = Column(Date)
    duration_minutes = Column(Integer)

    # Results
    score = Column(Float)
    max_score = Column(Float)
    percentage = Column(Float)
    pass_fail = Column(String(20))  # passed, failed, pending

    # Details
    test_link = Column(String(500))
    submission_link = Column(String(500))
    evaluator_notes = Column(Text)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Assessment {self.assessment_type} - {self.applicant_id}>"


class BackgroundCheckStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "COMPLETED"
    VERIFIED = "verified"
    FLAGGED = "flagged"


class BackgroundCheck(Base):
    """Background Verification Records"""
    __tablename__ = "background_checks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # References
    job_id = Column(UUID(as_uuid=True), ForeignKey("job_requisitions.id"), nullable=False)
    applicant_id = Column(UUID(as_uuid=True), ForeignKey("applicants.id"), nullable=False)

    # Check Details
    check_type = Column(String(100), nullable=False)  # employment, education, criminal, credit, reference
    status = Column(SQLEnum(BackgroundCheckStatus), default=BackgroundCheckStatus.PENDING)

    # Dates
    initiated_date = Column(Date)
    completed_date = Column(Date)
    verified_date = Column(Date)

    # Verification Details
    verified_by = Column(String(255))
    verification_agency = Column(String(255))
    verification_result = Column(String(50))  # verified, discrepancy, failed

    # Notes
    notes = Column(Text)
    discrepancies = Column(Text)
    documents = Column(JSONB)  # Array of document URLs

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<BackgroundCheck {self.check_type} - {self.status}>"


class OfferStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING = "pending"
    SENT = "sent"
    ACCEPTED = "accepted"
    REJECTED = "REJECTED"
    WITHDRAWN = "withdrawn"


class JobOffer(Base):
    """Job Offer Details"""
    __tablename__ = "job_offers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # References
    job_id = Column(UUID(as_uuid=True), ForeignKey("job_requisitions.id"), nullable=False)
    applicant_id = Column(UUID(as_uuid=True), ForeignKey("applicants.id"), nullable=False)

    # Offer Details
    offer_letter_url = Column(String(500))
    position_title = Column(String(255), nullable=False)
    department = Column(String(255))

    # Compensation
    base_salary = Column(Float, nullable=False)
    bonus = Column(Float)
    commission = Column(Float)
    equity_shares = Column(Integer)
    other_compensation = Column(JSONB)

    # Benefits
    benefits = Column(Text)
    health_insurance = Column(Boolean, default=False)
    retirement_plan = Column(Boolean, default=False)
    paid_time_off = Column(Integer)  # days

    # Employment Terms
    employment_type = Column(String(50))  # full_time, part_time, contract
    start_date = Column(Date)
    probation_period_days = Column(Integer, default=90)
    work_location = Column(String(255))
    work_schedule = Column(String(255))

    # Status & Dates
    status = Column(SQLEnum(OfferStatus), default=OfferStatus.DRAFT)
    sent_date = Column(Date)
    response_deadline = Column(Date)
    accepted_date = Column(Date)
    rejected_date = Column(Date)

    # Negotiation
    negotiation_notes = Column(Text)
    counter_offer = Column(JSONB)

    # Metadata
    created_by = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<JobOffer {self.position_title} - {self.status}>"
