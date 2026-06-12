from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta, date
import uuid
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete as sql_delete

from app.core.database import get_db
from app.models.recruitment import (
    JobRequisition, Applicant, Advertisement, Interview, Assessment, BackgroundCheck, JobOffer,
    JobRequisitionStatus, ApplicantStatus, AdvertisementStatus, InterviewType, AssessmentType, BackgroundCheckStatus, OfferStatus
)

router = APIRouter()

# ============================================================================
# JOB REQUISITIONS
# ============================================================================

class JobRequisitionCreate(BaseModel):
    job_title: str
    department: str
    location: str
    employment_type: str
    positions: int
    salary_range_min: int
    salary_range_max: int
    closing_date: Optional[str] = None
    job_summary: Optional[str] = None
    key_responsibilities: Optional[str] = None
    required_education: Optional[str] = None
    preferred_education: Optional[str] = None
    min_experience_years: Optional[int] = None
    max_experience_years: Optional[int] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    required_skills: Optional[str] = None
    preferred_skills: Optional[str] = None
    certifications: Optional[str] = None
    languages: Optional[str] = None
    work_schedule: Optional[str] = None
    travel_required: Optional[str] = None
    physical_requirements: Optional[str] = None
    benefits: Optional[str] = None
    interview_stages: Optional[str] = None
    onboarding_duration: Optional[int] = None
    training_required: Optional[str] = None


@router.get("/job-requisitions")
async def get_job_requisitions(
    status: Optional[str] = None,
    department: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all job requisitions"""
    query = select(JobRequisition)

    if status:
        query = query.where(JobRequisition.status == status)
    if department:
        query = query.where(JobRequisition.department.ilike(f"%{department}%"))

    result = await db.execute(query)
    jobs = result.scalars().all()

    return [
        {
            "id": str(job.id),
            "job_title": job.job_title,
            "department": job.department,
            "location": job.location or "",
            "employment_type": job.employment_type,
            "positions": job.positions or 1,
            "salary_range_min": job.salary_range_min or 0,
            "salary_range_max": job.salary_range_max or 0,
            "status": job.status.value if job.status else "OPEN",
            "posted_date": job.posted_date.isoformat() if job.posted_date else None,
            "closing_date": job.closing_date.isoformat() if job.closing_date else None,
            "applicants_count": job.applicants_count or 0,
            "interviews_scheduled": job.interviews_scheduled or 0,
            "offers_made": job.offers_made or 0,
            "job_summary": job.job_summary,
            "key_responsibilities": job.key_responsibilities,
            "required_skills": job.required_skills,
            "required_education": job.required_education,
            "min_experience_years": job.min_experience_years,
            "max_experience_years": job.max_experience_years
        }
        for job in jobs
    ]


@router.get("/job-requisitions/{job_id}")
async def get_job_requisition(job_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific job requisition"""
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    result = await db.execute(select(JobRequisition).where(JobRequisition.id == job_uuid))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "id": str(job.id),
        "job_title": job.job_title,
        "department": job.department,
        "location": job.location,
        "employment_type": job.employment_type,
        "positions": job.positions,
        "salary_range_min": job.salary_range_min,
        "salary_range_max": job.salary_range_max,
        "status": job.status.value if job.status else "OPEN",
        "posted_date": job.posted_date.isoformat() if job.posted_date else None,
        "closing_date": job.closing_date.isoformat() if job.closing_date else None,
        "job_summary": job.job_summary,
        "key_responsibilities": job.key_responsibilities,
        "required_education": job.required_education,
        "preferred_education": job.preferred_education,
        "min_experience_years": job.min_experience_years,
        "max_experience_years": job.max_experience_years,
        "required_skills": job.required_skills,
        "preferred_skills": job.preferred_skills,
        "certifications": job.certifications,
        "languages": job.languages,
        "benefits": job.benefits,
        "applicants_count": job.applicants_count or 0,
        "interviews_scheduled": job.interviews_scheduled or 0,
        "offers_made": job.offers_made or 0
    }


@router.post("/job-requisitions")
async def create_job_requisition(job: JobRequisitionCreate, db: AsyncSession = Depends(get_db)):
    """Create a new job requisition"""

    # Convert closing_date string to date object
    closing_date_obj = None
    if job.closing_date:
        try:
            closing_date_obj = datetime.strptime(job.closing_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid closing_date format. Use YYYY-MM-DD")

    # Create JobRequisition
    db_job = JobRequisition(
        job_title=job.job_title,
        department=job.department,
        location=job.location,
        employment_type=job.employment_type,
        positions=job.positions,
        salary_range_min=job.salary_range_min,
        salary_range_max=job.salary_range_max,
        closing_date=closing_date_obj,
        job_summary=job.job_summary,
        key_responsibilities=job.key_responsibilities,
        required_education=job.required_education,
        preferred_education=job.preferred_education,
        min_experience_years=job.min_experience_years,
        max_experience_years=job.max_experience_years,
        age_min=job.age_min,
        age_max=job.age_max,
        required_skills=job.required_skills,
        preferred_skills=job.preferred_skills,
        certifications=job.certifications,
        languages=job.languages,
        work_schedule=job.work_schedule,
        travel_required=job.travel_required,
        physical_requirements=job.physical_requirements,
        benefits=job.benefits,
        interview_stages=job.interview_stages,
        onboarding_duration=job.onboarding_duration,
        training_required=job.training_required,
        status=JobRequisitionStatus.OPEN,
        posted_date=datetime.now().date(),
        applicants_count=0,
        interviews_scheduled=0,
        offers_made=0
    )

    db.add(db_job)
    await db.commit()
    await db.refresh(db_job)

    return {
        "id": str(db_job.id),
        "job_title": db_job.job_title,
        "department": db_job.department,
        "status": db_job.status.value,
        "posted_date": db_job.posted_date.isoformat(),
        "message": "Job created successfully"
    }


@router.delete("/job-requisitions/{job_id}")
async def delete_job_requisition(job_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a job requisition"""
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    result = await db.execute(select(JobRequisition).where(JobRequisition.id == job_uuid))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Delete related records first
    await db.execute(sql_delete(JobOffer).where(JobOffer.job_id == job_uuid))
    await db.execute(sql_delete(BackgroundCheck).where(BackgroundCheck.job_id == job_uuid))
    await db.execute(sql_delete(Assessment).where(Assessment.job_id == job_uuid))
    await db.execute(sql_delete(Interview).where(Interview.job_id == job_uuid))
    await db.execute(sql_delete(Applicant).where(Applicant.job_id == job_uuid))
    await db.execute(sql_delete(Advertisement).where(Advertisement.job_id == job_uuid))
    await db.execute(sql_delete(JobRequisition).where(JobRequisition.id == job_uuid))

    await db.commit()

    return {"message": "Job deleted successfully"}


# ============================================================================
# APPLICANTS
# ============================================================================

class ApplicantCreate(BaseModel):
    name: str
    email: str
    phone: str
    job_id: str
    job_title: str
    resume_url: Optional[str] = None
    experience_years: int = 0
    education: Optional[str] = None
    skills: Optional[List[str]] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None


@router.get("/applicants")
async def get_applicants(
    job_id: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all applicants"""
    query = select(Applicant)

    if job_id:
        try:
            job_uuid = uuid.UUID(job_id)
            query = query.where(Applicant.job_id == job_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid job ID")

    if status:
        query = query.where(Applicant.status == status.upper())

    result = await db.execute(query)
    applicants = result.scalars().all()

    return [
        {
            "id": str(app.id),
            "name": app.name,
            "email": app.email,
            "phone": app.phone,
            "job_id": str(app.job_id),
            "job_title": app.job_title,
            "status": app.status.value if app.status else "NEW",
            "current_stage": app.current_stage,
            "application_date": app.application_date.isoformat() if app.application_date else None,
            "experience_years": app.experience_years or 0,
            "education": app.education,
            "skills": app.skills,
            "city": app.city,
            "state": app.state,
            "country": app.country
        }
        for app in applicants
    ]


@router.get("/applicants/{applicant_id}")
async def get_applicant(applicant_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single applicant by id."""
    try:
        a_uuid = uuid.UUID(applicant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid applicant ID")

    result = await db.execute(select(Applicant).where(Applicant.id == a_uuid))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Applicant not found")

    return {
        "id": str(app.id),
        "name": app.name,
        "email": app.email,
        "phone": app.phone,
        "job_id": str(app.job_id) if app.job_id else None,
        "job_title": app.job_title,
        "status": app.status.value if app.status else "NEW",
        "current_stage": app.current_stage,
        "application_date": app.application_date.isoformat() if app.application_date else None,
        "experience_years": app.experience_years or 0,
        "education": app.education,
        "skills": app.skills,
        "resume_url": app.resume_url,
        "cv_file_name": app.cv_file_name,
        "cover_letter": app.cover_letter,
        "portfolio_url": app.portfolio_url,
        "linkedin_url": app.linkedin_url,
        "city": app.city,
        "state": app.state,
        "country": app.country,
        "address": app.address,
        "zip_code": app.zip_code,
        "date_of_birth": app.date_of_birth.isoformat() if app.date_of_birth else None,
        "gender": app.gender,
        "nationality": app.nationality,
    }


@router.post("/applicants")
async def create_applicant(applicant: ApplicantCreate, db: AsyncSession = Depends(get_db)):
    """Create a new applicant"""

    # Validate job exists
    try:
        job_uuid = uuid.UUID(applicant.job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    result = await db.execute(select(JobRequisition).where(JobRequisition.id == job_uuid))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Create applicant
    db_applicant = Applicant(
        name=applicant.name,
        email=applicant.email,
        phone=applicant.phone,
        job_id=job_uuid,
        job_title=applicant.job_title,
        resume_url=applicant.resume_url,
        experience_years=applicant.experience_years,
        education=applicant.education,
        skills=applicant.skills,
        city=applicant.city,
        state=applicant.state,
        country=applicant.country,
        status=ApplicantStatus.NEW,
        current_stage="Application Received",
        application_date=datetime.now().date()
    )

    db.add(db_applicant)

    # Update job applicants count
    job.applicants_count = (job.applicants_count or 0) + 1

    await db.commit()
    await db.refresh(db_applicant)

    return {
        "id": str(db_applicant.id),
        "name": db_applicant.name,
        "email": db_applicant.email,
        "status": db_applicant.status.value,
        "message": "Applicant created successfully"
    }


class UpdateStatusRequest(BaseModel):
    status: str
    current_stage: Optional[str] = None


@router.patch("/applicants/{applicant_id}/status")
async def update_applicant_status(
    applicant_id: str,
    request: UpdateStatusRequest,
    db: AsyncSession = Depends(get_db)
):
    """Update applicant status"""

    valid_statuses = ["NEW", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]
    status_upper = request.status.upper()

    if status_upper not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

    try:
        applicant_uuid = uuid.UUID(applicant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid applicant ID")

    result = await db.execute(select(Applicant).where(Applicant.id == applicant_uuid))
    applicant = result.scalar_one_or_none()

    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    applicant.status = ApplicantStatus(status_upper)
    if request.current_stage:
        applicant.current_stage = request.current_stage

    await db.commit()

    return {
        "id": str(applicant.id),
        "name": applicant.name,
        "status": applicant.status.value,
        "current_stage": applicant.current_stage,
        "message": "Status updated successfully"
    }


@router.delete("/applicants/{applicant_id}")
async def delete_applicant(applicant_id: str, db: AsyncSession = Depends(get_db)):
    """Delete an applicant"""
    try:
        applicant_uuid = uuid.UUID(applicant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid applicant ID format")

    result = await db.execute(select(Applicant).where(Applicant.id == applicant_uuid))
    applicant = result.scalar_one_or_none()

    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    # Get job_id to update count
    job_id = applicant.job_id

    # Delete related records first
    await db.execute(sql_delete(JobOffer).where(JobOffer.applicant_id == applicant_uuid))
    await db.execute(sql_delete(BackgroundCheck).where(BackgroundCheck.applicant_id == applicant_uuid))
    await db.execute(sql_delete(Assessment).where(Assessment.applicant_id == applicant_uuid))
    await db.execute(sql_delete(Interview).where(Interview.applicant_id == applicant_uuid))

    # Delete the applicant
    await db.execute(sql_delete(Applicant).where(Applicant.id == applicant_uuid))

    # Update job applicants count
    job_result = await db.execute(select(JobRequisition).where(JobRequisition.id == job_id))
    job = job_result.scalar_one_or_none()
    if job and job.applicants_count and job.applicants_count > 0:
        job.applicants_count -= 1

    await db.commit()

    return {"message": "Applicant deleted successfully"}


# ============================================================================
# ADVERTISEMENTS
# ============================================================================

class AdvertisementCreate(BaseModel):
    job_id: str
    job_title: str
    platform: str
    ad_title: str
    ad_content: Optional[str] = None
    budget: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


@router.get("/advertisements")
async def get_advertisements(
    job_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all advertisements"""
    query = select(Advertisement)

    if job_id:
        try:
            job_uuid = uuid.UUID(job_id)
            query = query.where(Advertisement.job_id == job_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid job ID")

    result = await db.execute(query)
    ads = result.scalars().all()

    return [
        {
            "id": str(ad.id),
            "job_id": str(ad.job_id),
            "job_title": ad.job_title,
            "platform": ad.platform,
            "ad_title": ad.ad_title,
            "ad_content": ad.ad_content,
            "budget": ad.budget or 0,
            "status": ad.status.value if ad.status else "DRAFT",
            "posted_date": ad.posted_date.isoformat() if ad.posted_date else None,
            "impressions": ad.impressions or 0,
            "clicks": ad.clicks or 0,
            "applications_received": ad.applications_received or 0
        }
        for ad in ads
    ]


@router.post("/advertisements")
async def create_advertisement(ad: AdvertisementCreate, db: AsyncSession = Depends(get_db)):
    """Create a new advertisement"""

    # Validate job exists
    try:
        job_uuid = uuid.UUID(ad.job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    result = await db.execute(select(JobRequisition).where(JobRequisition.id == job_uuid))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Parse dates
    start_date_obj = None
    if ad.start_date:
        try:
            start_date_obj = datetime.strptime(ad.start_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")

    end_date_obj = None
    if ad.end_date:
        try:
            end_date_obj = datetime.strptime(ad.end_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")

    # Create advertisement
    db_ad = Advertisement(
        job_id=job_uuid,
        job_title=ad.job_title,
        platform=ad.platform,
        ad_title=ad.ad_title,
        ad_content=ad.ad_content,
        budget=ad.budget,
        start_date=start_date_obj,
        end_date=end_date_obj,
        status=AdvertisementStatus.DRAFT,
        posted_date=datetime.now().date() if start_date_obj and start_date_obj <= datetime.now().date() else None,
        total_spent=0.0,
        impressions=0,
        clicks=0,
        applications_received=0,
        conversion_rate=0.0
    )

    db.add(db_ad)
    await db.commit()
    await db.refresh(db_ad)

    return {
        "id": str(db_ad.id),
        "job_id": str(db_ad.job_id),
        "platform": db_ad.platform,
        "status": db_ad.status.value,
        "message": "Advertisement created successfully"
    }
