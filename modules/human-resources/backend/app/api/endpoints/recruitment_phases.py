"""
API endpoints for recruitment phases (Interviews, Assessments, Background Checks, Job Offers)
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.recruitment import (
    Interview, Assessment, BackgroundCheck, JobOffer, JobRequisition, Applicant,
    InterviewType, AssessmentType, BackgroundCheckStatus, OfferStatus
)

router = APIRouter()


# ==================================
# INTERVIEW ENDPOINTS (Phase 5)
# ==================================

class InterviewCreate(BaseModel):
    job_id: str
    applicant_id: str
    interview_type: str
    interview_round: int = 1
    scheduled_date: Optional[str] = None
    duration_minutes: Optional[int] = 60
    location: Optional[str] = None
    interviewer_names: Optional[List[str]] = None
    panel_members: Optional[List[dict]] = None


class InterviewUpdate(BaseModel):
    overall_rating: Optional[int] = None
    technical_rating: Optional[int] = None
    communication_rating: Optional[int] = None
    cultural_fit_rating: Optional[int] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    notes: Optional[str] = None
    recommendation: Optional[str] = None  # hire, maybe, reject
    status: Optional[str] = None


class InterviewResponse(BaseModel):
    id: str
    job_id: str
    applicant_id: str
    interview_type: str
    interview_round: int
    scheduled_date: Optional[str] = None
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    interviewer_names: Optional[List[str]] = None
    panel_members: Optional[List[dict]] = None
    status: str
    completed_date: Optional[str] = None
    overall_rating: Optional[int] = None
    technical_rating: Optional[int] = None
    communication_rating: Optional[int] = None
    cultural_fit_rating: Optional[int] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    notes: Optional[str] = None
    recommendation: Optional[str] = None


@router.post("/interviews", response_model=InterviewResponse)
async def create_interview(interview: InterviewCreate, db: AsyncSession = Depends(get_db)):
    """Create a new interview schedule"""

    # Validate job_id and applicant_id
    try:
        job_uuid = uuid.UUID(interview.job_id)
        applicant_uuid = uuid.UUID(interview.applicant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    # Verify entities exist
    job_result = await db.execute(select(JobRequisition).where(JobRequisition.id == job_uuid))
    if not job_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Job requisition not found")

    applicant_result = await db.execute(select(Applicant).where(Applicant.id == applicant_uuid))
    if not applicant_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Applicant not found")

    # Parse scheduled_date
    scheduled_date_obj = None
    if interview.scheduled_date:
        try:
            scheduled_date_obj = datetime.strptime(interview.scheduled_date, "%Y-%m-%dT%H:%M")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid scheduled_date format. Use YYYY-MM-DDTHH:MM")

    # Create interview
    db_interview = Interview(
        job_id=job_uuid,
        applicant_id=applicant_uuid,
        interview_type=InterviewType(interview.interview_type),
        interview_round=interview.interview_round,
        scheduled_date=scheduled_date_obj,
        duration_minutes=interview.duration_minutes,
        location=interview.location,
        interviewer_names=interview.interviewer_names,
        panel_members=interview.panel_members,
        status="scheduled"
    )

    db.add(db_interview)
    await db.flush()
    await db.refresh(db_interview)

    # Update job requisition interviews_scheduled count
    job_result = await db.execute(select(JobRequisition).where(JobRequisition.id == job_uuid))
    db_job = job_result.scalar_one_or_none()
    if db_job:
        db_job.interviews_scheduled += 1
        await db.flush()

    return InterviewResponse(
        id=str(db_interview.id),
        job_id=str(db_interview.job_id),
        applicant_id=str(db_interview.applicant_id),
        interview_type=db_interview.interview_type.value,
        interview_round=db_interview.interview_round,
        scheduled_date=db_interview.scheduled_date.strftime("%Y-%m-%dT%H:%M") if db_interview.scheduled_date else None,
        duration_minutes=db_interview.duration_minutes,
        location=db_interview.location,
        interviewer_names=db_interview.interviewer_names,
        panel_members=db_interview.panel_members,
        status=db_interview.status,
        completed_date=db_interview.completed_date.strftime("%Y-%m-%dT%H:%M") if db_interview.completed_date else None,
        overall_rating=db_interview.overall_rating,
        technical_rating=db_interview.technical_rating,
        communication_rating=db_interview.communication_rating,
        cultural_fit_rating=db_interview.cultural_fit_rating,
        strengths=db_interview.strengths,
        weaknesses=db_interview.weaknesses,
        notes=db_interview.notes,
        recommendation=db_interview.recommendation
    )


@router.get("/interviews", response_model=List[InterviewResponse])
async def get_interviews(
    job_id: Optional[str] = None,
    applicant_id: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all interviews with optional filters"""

    query = select(Interview)

    if job_id:
        try:
            job_uuid = uuid.UUID(job_id)
            query = query.where(Interview.job_id == job_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid job ID format")

    if applicant_id:
        try:
            applicant_uuid = uuid.UUID(applicant_id)
            query = query.where(Interview.applicant_id == applicant_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid applicant ID format")

    if status:
        query = query.where(Interview.status == status)

    result = await db.execute(query)
    interviews = result.scalars().all()

    return [
        InterviewResponse(
            id=str(interview.id),
            job_id=str(interview.job_id),
            applicant_id=str(interview.applicant_id),
            interview_type=interview.interview_type.value,
            interview_round=interview.interview_round,
            scheduled_date=interview.scheduled_date.strftime("%Y-%m-%dT%H:%M") if interview.scheduled_date else None,
            duration_minutes=interview.duration_minutes,
            location=interview.location,
            interviewer_names=interview.interviewer_names,
            panel_members=interview.panel_members,
            status=interview.status,
            completed_date=interview.completed_date.strftime("%Y-%m-%dT%H:%M") if interview.completed_date else None,
            overall_rating=interview.overall_rating,
            technical_rating=interview.technical_rating,
            communication_rating=interview.communication_rating,
            cultural_fit_rating=interview.cultural_fit_rating,
            strengths=interview.strengths,
            weaknesses=interview.weaknesses,
            notes=interview.notes,
            recommendation=interview.recommendation
        )
        for interview in interviews
    ]


@router.patch("/interviews/{interview_id}", response_model=InterviewResponse)
async def update_interview(interview_id: str, update: InterviewUpdate, db: AsyncSession = Depends(get_db)):
    """Update interview with feedback and status"""

    try:
        interview_uuid = uuid.UUID(interview_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid interview ID format")

    result = await db.execute(select(Interview).where(Interview.id == interview_uuid))
    db_interview = result.scalar_one_or_none()

    if not db_interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    # Update fields
    if update.overall_rating is not None:
        db_interview.overall_rating = update.overall_rating
    if update.technical_rating is not None:
        db_interview.technical_rating = update.technical_rating
    if update.communication_rating is not None:
        db_interview.communication_rating = update.communication_rating
    if update.cultural_fit_rating is not None:
        db_interview.cultural_fit_rating = update.cultural_fit_rating
    if update.strengths is not None:
        db_interview.strengths = update.strengths
    if update.weaknesses is not None:
        db_interview.weaknesses = update.weaknesses
    if update.notes is not None:
        db_interview.notes = update.notes
    if update.recommendation is not None:
        db_interview.recommendation = update.recommendation
    if update.status is not None:
        db_interview.status = update.status
        if update.status == "completed":
            db_interview.completed_date = datetime.utcnow()

    await db.flush()
    await db.refresh(db_interview)

    return InterviewResponse(
        id=str(db_interview.id),
        job_id=str(db_interview.job_id),
        applicant_id=str(db_interview.applicant_id),
        interview_type=db_interview.interview_type.value,
        interview_round=db_interview.interview_round,
        scheduled_date=db_interview.scheduled_date.strftime("%Y-%m-%dT%H:%M") if db_interview.scheduled_date else None,
        duration_minutes=db_interview.duration_minutes,
        location=db_interview.location,
        interviewer_names=db_interview.interviewer_names,
        panel_members=db_interview.panel_members,
        status=db_interview.status,
        completed_date=db_interview.completed_date.strftime("%Y-%m-%dT%H:%M") if db_interview.completed_date else None,
        overall_rating=db_interview.overall_rating,
        technical_rating=db_interview.technical_rating,
        communication_rating=db_interview.communication_rating,
        cultural_fit_rating=db_interview.cultural_fit_rating,
        strengths=db_interview.strengths,
        weaknesses=db_interview.weaknesses,
        notes=db_interview.notes,
        recommendation=db_interview.recommendation
    )


# ==================================
# ASSESSMENT ENDPOINTS (Phase 5)
# ==================================

class AssessmentCreate(BaseModel):
    job_id: str
    applicant_id: str
    assessment_type: str
    title: str
    description: Optional[str] = None
    assigned_date: Optional[str] = None
    due_date: Optional[str] = None
    duration_minutes: Optional[int] = None
    test_link: Optional[str] = None


class AssessmentUpdate(BaseModel):
    score: Optional[float] = None
    max_score: Optional[float] = None
    percentage: Optional[float] = None
    pass_fail: Optional[str] = None
    completed_date: Optional[str] = None
    submission_link: Optional[str] = None
    evaluator_notes: Optional[str] = None


class AssessmentResponse(BaseModel):
    id: str
    job_id: str
    applicant_id: str
    assessment_type: str
    title: str
    description: Optional[str] = None
    assigned_date: Optional[str] = None
    due_date: Optional[str] = None
    completed_date: Optional[str] = None
    duration_minutes: Optional[int] = None
    score: Optional[float] = None
    max_score: Optional[float] = None
    percentage: Optional[float] = None
    pass_fail: Optional[str] = None
    test_link: Optional[str] = None
    submission_link: Optional[str] = None
    evaluator_notes: Optional[str] = None


@router.post("/assessments", response_model=AssessmentResponse)
async def create_assessment(assessment: AssessmentCreate, db: AsyncSession = Depends(get_db)):
    """Create a new assessment"""

    # Validate IDs
    try:
        job_uuid = uuid.UUID(assessment.job_id)
        applicant_uuid = uuid.UUID(assessment.applicant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    # Parse dates
    assigned_date_obj = None
    if assessment.assigned_date:
        try:
            assigned_date_obj = datetime.strptime(assessment.assigned_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid assigned_date format")

    due_date_obj = None
    if assessment.due_date:
        try:
            due_date_obj = datetime.strptime(assessment.due_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid due_date format")

    # Create assessment
    db_assessment = Assessment(
        job_id=job_uuid,
        applicant_id=applicant_uuid,
        assessment_type=AssessmentType(assessment.assessment_type),
        title=assessment.title,
        description=assessment.description,
        assigned_date=assigned_date_obj or datetime.now().date(),
        due_date=due_date_obj,
        duration_minutes=assessment.duration_minutes,
        test_link=assessment.test_link,
        pass_fail="pending"
    )

    db.add(db_assessment)
    await db.flush()
    await db.refresh(db_assessment)

    return AssessmentResponse(
        id=str(db_assessment.id),
        job_id=str(db_assessment.job_id),
        applicant_id=str(db_assessment.applicant_id),
        assessment_type=db_assessment.assessment_type.value,
        title=db_assessment.title,
        description=db_assessment.description,
        assigned_date=db_assessment.assigned_date.strftime("%Y-%m-%d") if db_assessment.assigned_date else None,
        due_date=db_assessment.due_date.strftime("%Y-%m-%d") if db_assessment.due_date else None,
        completed_date=db_assessment.completed_date.strftime("%Y-%m-%d") if db_assessment.completed_date else None,
        duration_minutes=db_assessment.duration_minutes,
        score=db_assessment.score,
        max_score=db_assessment.max_score,
        percentage=db_assessment.percentage,
        pass_fail=db_assessment.pass_fail,
        test_link=db_assessment.test_link,
        submission_link=db_assessment.submission_link,
        evaluator_notes=db_assessment.evaluator_notes
    )


@router.get("/assessments", response_model=List[AssessmentResponse])
async def get_assessments(
    job_id: Optional[str] = None,
    applicant_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all assessments with optional filters"""

    query = select(Assessment)

    if job_id:
        try:
            job_uuid = uuid.UUID(job_id)
            query = query.where(Assessment.job_id == job_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid job ID format")

    if applicant_id:
        try:
            applicant_uuid = uuid.UUID(applicant_id)
            query = query.where(Assessment.applicant_id == applicant_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid applicant ID format")

    result = await db.execute(query)
    assessments = result.scalars().all()

    return [
        AssessmentResponse(
            id=str(a.id),
            job_id=str(a.job_id),
            applicant_id=str(a.applicant_id),
            assessment_type=a.assessment_type.value,
            title=a.title,
            description=a.description,
            assigned_date=a.assigned_date.strftime("%Y-%m-%d") if a.assigned_date else None,
            due_date=a.due_date.strftime("%Y-%m-%d") if a.due_date else None,
            completed_date=a.completed_date.strftime("%Y-%m-%d") if a.completed_date else None,
            duration_minutes=a.duration_minutes,
            score=a.score,
            max_score=a.max_score,
            percentage=a.percentage,
            pass_fail=a.pass_fail,
            test_link=a.test_link,
            submission_link=a.submission_link,
            evaluator_notes=a.evaluator_notes
        )
        for a in assessments
    ]


@router.patch("/assessments/{assessment_id}", response_model=AssessmentResponse)
async def update_assessment(assessment_id: str, update: AssessmentUpdate, db: AsyncSession = Depends(get_db)):
    """Update assessment with results"""

    try:
        assessment_uuid = uuid.UUID(assessment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid assessment ID format")

    result = await db.execute(select(Assessment).where(Assessment.id == assessment_uuid))
    db_assessment = result.scalar_one_or_none()

    if not db_assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Update fields
    if update.score is not None:
        db_assessment.score = update.score
    if update.max_score is not None:
        db_assessment.max_score = update.max_score
    if update.percentage is not None:
        db_assessment.percentage = update.percentage
    if update.pass_fail is not None:
        db_assessment.pass_fail = update.pass_fail
    if update.submission_link is not None:
        db_assessment.submission_link = update.submission_link
    if update.evaluator_notes is not None:
        db_assessment.evaluator_notes = update.evaluator_notes
    if update.completed_date:
        try:
            db_assessment.completed_date = datetime.strptime(update.completed_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid completed_date format")

    await db.flush()
    await db.refresh(db_assessment)

    return AssessmentResponse(
        id=str(db_assessment.id),
        job_id=str(db_assessment.job_id),
        applicant_id=str(db_assessment.applicant_id),
        assessment_type=db_assessment.assessment_type.value,
        title=db_assessment.title,
        description=db_assessment.description,
        assigned_date=db_assessment.assigned_date.strftime("%Y-%m-%d") if db_assessment.assigned_date else None,
        due_date=db_assessment.due_date.strftime("%Y-%m-%d") if db_assessment.due_date else None,
        completed_date=db_assessment.completed_date.strftime("%Y-%m-%d") if db_assessment.completed_date else None,
        duration_minutes=db_assessment.duration_minutes,
        score=db_assessment.score,
        max_score=db_assessment.max_score,
        percentage=db_assessment.percentage,
        pass_fail=db_assessment.pass_fail,
        test_link=db_assessment.test_link,
        submission_link=db_assessment.submission_link,
        evaluator_notes=db_assessment.evaluator_notes
    )


# ==================================
# BACKGROUND CHECK ENDPOINTS (Phase 6)
# ==================================

class BackgroundCheckCreate(BaseModel):
    job_id: str
    applicant_id: str
    check_type: str  # employment, education, criminal, credit, reference
    initiated_date: Optional[str] = None
    verification_agency: Optional[str] = None


class BackgroundCheckUpdate(BaseModel):
    status: Optional[str] = None
    completed_date: Optional[str] = None
    verified_date: Optional[str] = None
    verified_by: Optional[str] = None
    verification_result: Optional[str] = None
    notes: Optional[str] = None
    discrepancies: Optional[str] = None


class BackgroundCheckResponse(BaseModel):
    id: str
    job_id: str
    applicant_id: str
    check_type: str
    status: str
    initiated_date: Optional[str] = None
    completed_date: Optional[str] = None
    verified_date: Optional[str] = None
    verified_by: Optional[str] = None
    verification_agency: Optional[str] = None
    verification_result: Optional[str] = None
    notes: Optional[str] = None
    discrepancies: Optional[str] = None


@router.post("/background-checks", response_model=BackgroundCheckResponse)
async def create_background_check(check: BackgroundCheckCreate, db: AsyncSession = Depends(get_db)):
    """Initiate a background check"""

    # Validate IDs
    try:
        job_uuid = uuid.UUID(check.job_id)
        applicant_uuid = uuid.UUID(check.applicant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    # Parse date
    initiated_date_obj = None
    if check.initiated_date:
        try:
            initiated_date_obj = datetime.strptime(check.initiated_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid initiated_date format")

    # Create background check
    db_check = BackgroundCheck(
        job_id=job_uuid,
        applicant_id=applicant_uuid,
        check_type=check.check_type,
        status=BackgroundCheckStatus.PENDING,
        initiated_date=initiated_date_obj or datetime.now().date(),
        verification_agency=check.verification_agency
    )

    db.add(db_check)
    await db.flush()
    await db.refresh(db_check)

    return BackgroundCheckResponse(
        id=str(db_check.id),
        job_id=str(db_check.job_id),
        applicant_id=str(db_check.applicant_id),
        check_type=db_check.check_type,
        status=db_check.status.value,
        initiated_date=db_check.initiated_date.strftime("%Y-%m-%d") if db_check.initiated_date else None,
        completed_date=db_check.completed_date.strftime("%Y-%m-%d") if db_check.completed_date else None,
        verified_date=db_check.verified_date.strftime("%Y-%m-%d") if db_check.verified_date else None,
        verified_by=db_check.verified_by,
        verification_agency=db_check.verification_agency,
        verification_result=db_check.verification_result,
        notes=db_check.notes,
        discrepancies=db_check.discrepancies
    )


@router.get("/background-checks", response_model=List[BackgroundCheckResponse])
async def get_background_checks(
    job_id: Optional[str] = None,
    applicant_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all background checks with optional filters"""

    query = select(BackgroundCheck)

    if job_id:
        try:
            job_uuid = uuid.UUID(job_id)
            query = query.where(BackgroundCheck.job_id == job_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid job ID format")

    if applicant_id:
        try:
            applicant_uuid = uuid.UUID(applicant_id)
            query = query.where(BackgroundCheck.applicant_id == applicant_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid applicant ID format")

    result = await db.execute(query)
    checks = result.scalars().all()

    return [
        BackgroundCheckResponse(
            id=str(c.id),
            job_id=str(c.job_id),
            applicant_id=str(c.applicant_id),
            check_type=c.check_type,
            status=c.status.value,
            initiated_date=c.initiated_date.strftime("%Y-%m-%d") if c.initiated_date else None,
            completed_date=c.completed_date.strftime("%Y-%m-%d") if c.completed_date else None,
            verified_date=c.verified_date.strftime("%Y-%m-%d") if c.verified_date else None,
            verified_by=c.verified_by,
            verification_agency=c.verification_agency,
            verification_result=c.verification_result,
            notes=c.notes,
            discrepancies=c.discrepancies
        )
        for c in checks
    ]


@router.patch("/background-checks/{check_id}", response_model=BackgroundCheckResponse)
async def update_background_check(check_id: str, update: BackgroundCheckUpdate, db: AsyncSession = Depends(get_db)):
    """Update background check with results"""

    try:
        check_uuid = uuid.UUID(check_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid check ID format")

    result = await db.execute(select(BackgroundCheck).where(BackgroundCheck.id == check_uuid))
    db_check = result.scalar_one_or_none()

    if not db_check:
        raise HTTPException(status_code=404, detail="Background check not found")

    # Update fields
    if update.status:
        db_check.status = BackgroundCheckStatus(update.status)
    if update.completed_date:
        try:
            db_check.completed_date = datetime.strptime(update.completed_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid completed_date format")
    if update.verified_date:
        try:
            db_check.verified_date = datetime.strptime(update.verified_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid verified_date format")
    if update.verified_by is not None:
        db_check.verified_by = update.verified_by
    if update.verification_result is not None:
        db_check.verification_result = update.verification_result
    if update.notes is not None:
        db_check.notes = update.notes
    if update.discrepancies is not None:
        db_check.discrepancies = update.discrepancies

    await db.flush()
    await db.refresh(db_check)

    return BackgroundCheckResponse(
        id=str(db_check.id),
        job_id=str(db_check.job_id),
        applicant_id=str(db_check.applicant_id),
        check_type=db_check.check_type,
        status=db_check.status.value,
        initiated_date=db_check.initiated_date.strftime("%Y-%m-%d") if db_check.initiated_date else None,
        completed_date=db_check.completed_date.strftime("%Y-%m-%d") if db_check.completed_date else None,
        verified_date=db_check.verified_date.strftime("%Y-%m-%d") if db_check.verified_date else None,
        verified_by=db_check.verified_by,
        verification_agency=db_check.verification_agency,
        verification_result=db_check.verification_result,
        notes=db_check.notes,
        discrepancies=db_check.discrepancies
    )


# ==================================
# JOB OFFER ENDPOINTS (Phase 6)
# ==================================

class JobOfferCreate(BaseModel):
    job_id: str
    applicant_id: str
    position_title: str
    department: Optional[str] = None
    base_salary: float
    bonus: Optional[float] = None
    employment_type: str
    start_date: str
    probation_period_days: int = 90
    work_location: Optional[str] = None
    benefits: Optional[str] = None
    paid_time_off: Optional[int] = None


class JobOfferUpdate(BaseModel):
    status: Optional[str] = None
    sent_date: Optional[str] = None
    response_deadline: Optional[str] = None
    accepted_date: Optional[str] = None
    rejected_date: Optional[str] = None
    negotiation_notes: Optional[str] = None


class JobOfferResponse(BaseModel):
    id: str
    job_id: str
    applicant_id: str
    position_title: str
    department: Optional[str] = None
    base_salary: float
    bonus: Optional[float] = None
    employment_type: str
    start_date: str
    probation_period_days: int
    work_location: Optional[str] = None
    benefits: Optional[str] = None
    paid_time_off: Optional[int] = None
    status: str
    sent_date: Optional[str] = None
    response_deadline: Optional[str] = None
    accepted_date: Optional[str] = None
    rejected_date: Optional[str] = None
    negotiation_notes: Optional[str] = None


@router.post("/job-offers", response_model=JobOfferResponse)
async def create_job_offer(offer: JobOfferCreate, db: AsyncSession = Depends(get_db)):
    """Create a job offer"""

    # Validate IDs
    try:
        job_uuid = uuid.UUID(offer.job_id)
        applicant_uuid = uuid.UUID(offer.applicant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    # Parse start_date
    try:
        start_date_obj = datetime.strptime(offer.start_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid start_date format")

    # Create job offer
    db_offer = JobOffer(
        job_id=job_uuid,
        applicant_id=applicant_uuid,
        position_title=offer.position_title,
        department=offer.department,
        base_salary=offer.base_salary,
        bonus=offer.bonus,
        employment_type=offer.employment_type,
        start_date=start_date_obj,
        probation_period_days=offer.probation_period_days,
        work_location=offer.work_location,
        benefits=offer.benefits,
        paid_time_off=offer.paid_time_off,
        status=OfferStatus.DRAFT
    )

    db.add(db_offer)
    await db.flush()
    await db.refresh(db_offer)

    return JobOfferResponse(
        id=str(db_offer.id),
        job_id=str(db_offer.job_id),
        applicant_id=str(db_offer.applicant_id),
        position_title=db_offer.position_title,
        department=db_offer.department,
        base_salary=db_offer.base_salary,
        bonus=db_offer.bonus,
        employment_type=db_offer.employment_type,
        start_date=db_offer.start_date.strftime("%Y-%m-%d"),
        probation_period_days=db_offer.probation_period_days,
        work_location=db_offer.work_location,
        benefits=db_offer.benefits,
        paid_time_off=db_offer.paid_time_off,
        status=db_offer.status.value,
        sent_date=db_offer.sent_date.strftime("%Y-%m-%d") if db_offer.sent_date else None,
        response_deadline=db_offer.response_deadline.strftime("%Y-%m-%d") if db_offer.response_deadline else None,
        accepted_date=db_offer.accepted_date.strftime("%Y-%m-%d") if db_offer.accepted_date else None,
        rejected_date=db_offer.rejected_date.strftime("%Y-%m-%d") if db_offer.rejected_date else None,
        negotiation_notes=db_offer.negotiation_notes
    )


@router.get("/job-offers", response_model=List[JobOfferResponse])
async def get_job_offers(
    job_id: Optional[str] = None,
    applicant_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all job offers with optional filters"""

    query = select(JobOffer)

    if job_id:
        try:
            job_uuid = uuid.UUID(job_id)
            query = query.where(JobOffer.job_id == job_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid job ID format")

    if applicant_id:
        try:
            applicant_uuid = uuid.UUID(applicant_id)
            query = query.where(JobOffer.applicant_id == applicant_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid applicant ID format")

    result = await db.execute(query)
    offers = result.scalars().all()

    return [
        JobOfferResponse(
            id=str(o.id),
            job_id=str(o.job_id),
            applicant_id=str(o.applicant_id),
            position_title=o.position_title,
            department=o.department,
            base_salary=o.base_salary,
            bonus=o.bonus,
            employment_type=o.employment_type,
            start_date=o.start_date.strftime("%Y-%m-%d"),
            probation_period_days=o.probation_period_days,
            work_location=o.work_location,
            benefits=o.benefits,
            paid_time_off=o.paid_time_off,
            status=o.status.value,
            sent_date=o.sent_date.strftime("%Y-%m-%d") if o.sent_date else None,
            response_deadline=o.response_deadline.strftime("%Y-%m-%d") if o.response_deadline else None,
            accepted_date=o.accepted_date.strftime("%Y-%m-%d") if o.accepted_date else None,
            rejected_date=o.rejected_date.strftime("%Y-%m-%d") if o.rejected_date else None,
            negotiation_notes=o.negotiation_notes
        )
        for o in offers
    ]


@router.patch("/job-offers/{offer_id}", response_model=JobOfferResponse)
async def update_job_offer(offer_id: str, update: JobOfferUpdate, db: AsyncSession = Depends(get_db)):
    """Update job offer status"""

    try:
        offer_uuid = uuid.UUID(offer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid offer ID format")

    result = await db.execute(select(JobOffer).where(JobOffer.id == offer_uuid))
    db_offer = result.scalar_one_or_none()

    if not db_offer:
        raise HTTPException(status_code=404, detail="Job offer not found")

    # Update fields
    if update.status:
        db_offer.status = OfferStatus(update.status)
        # Update job requisition offers_made count when offer is sent
        if update.status == "sent" and db_offer.status != OfferStatus.SENT:
            job_result = await db.execute(select(JobRequisition).where(JobRequisition.id == db_offer.job_id))
            db_job = job_result.scalar_one_or_none()
            if db_job:
                db_job.offers_made += 1

    if update.sent_date:
        try:
            db_offer.sent_date = datetime.strptime(update.sent_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid sent_date format")

    if update.response_deadline:
        try:
            db_offer.response_deadline = datetime.strptime(update.response_deadline, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid response_deadline format")

    if update.accepted_date:
        try:
            db_offer.accepted_date = datetime.strptime(update.accepted_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid accepted_date format")

    if update.rejected_date:
        try:
            db_offer.rejected_date = datetime.strptime(update.rejected_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid rejected_date format")

    if update.negotiation_notes is not None:
        db_offer.negotiation_notes = update.negotiation_notes

    await db.flush()
    await db.refresh(db_offer)

    return JobOfferResponse(
        id=str(db_offer.id),
        job_id=str(db_offer.job_id),
        applicant_id=str(db_offer.applicant_id),
        position_title=db_offer.position_title,
        department=db_offer.department,
        base_salary=db_offer.base_salary,
        bonus=db_offer.bonus,
        employment_type=db_offer.employment_type,
        start_date=db_offer.start_date.strftime("%Y-%m-%d"),
        probation_period_days=db_offer.probation_period_days,
        work_location=db_offer.work_location,
        benefits=db_offer.benefits,
        paid_time_off=db_offer.paid_time_off,
        status=db_offer.status.value,
        sent_date=db_offer.sent_date.strftime("%Y-%m-%d") if db_offer.sent_date else None,
        response_deadline=db_offer.response_deadline.strftime("%Y-%m-%d") if db_offer.response_deadline else None,
        accepted_date=db_offer.accepted_date.strftime("%Y-%m-%d") if db_offer.accepted_date else None,
        rejected_date=db_offer.rejected_date.strftime("%Y-%m-%d") if db_offer.rejected_date else None,
        negotiation_notes=db_offer.negotiation_notes
    )
