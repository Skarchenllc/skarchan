"""
HR Module - Seed Data Script
This script populates the database with sample data for development and testing purposes.
"""

import asyncio
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.employee import (
    Employee, Department, Position, LeaveRequest, LeaveBalance,
    PerformanceReview, AttendanceRecord,
    EmploymentType, EmploymentStatus, LeaveType, LeaveStatus
)
from app.models.recruitment import (
    JobRequisition, Applicant, Advertisement, Interview, Assessment,
    BackgroundCheck, JobOffer,
    JobRequisitionStatus, ApplicantStatus, AdvertisementStatus,
    InterviewType, AssessmentType, BackgroundCheckStatus, OfferStatus
)


async def create_tables():
    """Create all tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ Database tables created")


async def seed_departments(session: AsyncSession):
    """Create sample departments"""
    from sqlalchemy import select

    # Check if departments already exist
    result = await session.execute(select(Department).limit(1))
    if result.scalar_one_or_none():
        print("⊙ Departments already exist, loading existing data...")
        result = await session.execute(select(Department))
        return result.scalars().all()

    departments = [
        Department(
            department_code="HR-001",
            name="Human Resources",
            description="Manages employee relations, recruitment, and HR policies",
            location="New York, NY",
            cost_center="CC-HR-100",
            is_active=True
        ),
        Department(
            department_code="FIN-001",
            name="Finance",
            description="Financial planning, accounting, and reporting",
            location="New York, NY",
            cost_center="CC-FIN-100",
            is_active=True
        ),
        Department(
            department_code="ENG-001",
            name="Engineering",
            description="Software development and technical operations",
            location="San Francisco, CA",
            cost_center="CC-ENG-100",
            is_active=True
        ),
        Department(
            department_code="SALES-001",
            name="Sales",
            description="Business development and customer acquisition",
            location="Austin, TX",
            cost_center="CC-SALES-100",
            is_active=True
        ),
        Department(
            department_code="MKT-001",
            name="Marketing",
            description="Brand management and marketing campaigns",
            location="Los Angeles, CA",
            cost_center="CC-MKT-100",
            is_active=True
        )
    ]

    session.add_all(departments)
    await session.commit()
    print(f"✓ Created {len(departments)} departments")
    return departments


async def seed_employees(session: AsyncSession, departments):
    """Create sample employees"""
    from sqlalchemy import select

    # Check if employees already exist
    result = await session.execute(select(Employee).limit(1))
    if result.scalar_one_or_none():
        print("⊙ Employees already exist, loading existing data...")
        result = await session.execute(select(Employee))
        return result.scalars().all()

    hr_dept = departments[0]
    finance_dept = departments[1]
    eng_dept = departments[2]

    employees = [
        Employee(
            employee_code="EMP001",
            first_name="Nicole",
            last_name="Ardis",
            work_email="nicole.ardis@company.com",
            personal_email="nicole.ardis@email.com",
            work_phone="+1 (555) 100-0001",
            employment_type=EmploymentType.FULL_TIME,
            employment_status=EmploymentStatus.ACTIVE,
            department_id=hr_dept.id,
            job_title="VP of Human Resources",
            job_level="Executive",
            hire_date=date(2020, 1, 15),
            office_location="New York",
            work_arrangement="hybrid",
            base_salary=150000,
            pay_frequency="monthly",
            currency="USD",
            overtime_eligible=False,
            bonus_amount=25000,
            date_of_birth=date(1985, 3, 20),
            address_line1="123 Broadway",
            city="New York",
            state="NY",
            zip_code="10001",
            country="USA",
            emergency_contact_name="John Ardis",
            emergency_contact_phone="+1 (555) 100-9999",
            emergency_contact_relationship="Spouse"
        ),
        Employee(
            employee_code="EMP002",
            first_name="Jennifer",
            last_name="Martinez",
            work_email="jennifer.martinez@company.com",
            personal_email="jmartinez@email.com",
            work_phone="+1 (555) 200-0002",
            employment_type=EmploymentType.FULL_TIME,
            employment_status=EmploymentStatus.ACTIVE,
            department_id=finance_dept.id,
            job_title="HR Senior Manager",
            job_level="Senior",
            hire_date=date(2024, 3, 1),
            office_location="New York",
            work_arrangement="onsite",
            base_salary=95000,
            pay_frequency="bi_weekly",
            currency="USD",
            overtime_eligible=False,
            bonus_amount=10000,
            date_of_birth=date(1990, 7, 15),
            address_line1="456 Park Ave",
            city="New York",
            state="NY",
            zip_code="10022",
            country="USA",
            emergency_contact_name="Maria Martinez",
            emergency_contact_phone="+1 (555) 200-9999",
            emergency_contact_relationship="Mother",
            reports_to_name="Nicole Ardis",
            bank_name="Chase Bank",
            bank_account_type="checking",
            bank_account_number="1234567890",
            bank_routing_number="021000021",
            tax_filing_status="single",
            tax_allowances=1
        ),
        Employee(
            employee_code="EMP003",
            first_name="Sarah",
            last_name="Johnson",
            work_email="sarah.johnson@company.com",
            work_phone="+1 (555) 300-0003",
            employment_type=EmploymentType.FULL_TIME,
            employment_status=EmploymentStatus.ACTIVE,
            department_id=hr_dept.id,
            job_title="HR Manager",
            job_level="Mid",
            hire_date=date(2022, 6, 1),
            office_location="New York",
            work_arrangement="hybrid",
            base_salary=80000,
            pay_frequency="bi_weekly",
            currency="USD",
            overtime_eligible=False,
            bonus_amount=8000,
            date_of_birth=date(1992, 11, 10),
            city="New York",
            state="NY",
            country="USA"
        ),
        Employee(
            employee_code="EMP004",
            first_name="Michael",
            last_name="Chen",
            work_email="michael.chen@company.com",
            work_phone="+1 (555) 400-0004",
            employment_type=EmploymentType.FULL_TIME,
            employment_status=EmploymentStatus.ACTIVE,
            department_id=eng_dept.id,
            job_title="Senior Software Engineer",
            job_level="Senior",
            hire_date=date(2021, 3, 15),
            office_location="San Francisco",
            work_arrangement="remote",
            base_salary=125000,
            pay_frequency="bi_weekly",
            currency="USD",
            overtime_eligible=True,
            bonus_amount=15000,
            date_of_birth=date(1988, 5, 25),
            city="San Francisco",
            state="CA",
            country="USA"
        ),
        Employee(
            employee_code="EMP005",
            first_name="Emily",
            last_name="Davis",
            work_email="emily.davis@company.com",
            work_phone="+1 (555) 500-0005",
            employment_type=EmploymentType.FULL_TIME,
            employment_status=EmploymentStatus.ACTIVE,
            department_id=eng_dept.id,
            job_title="Software Engineer",
            job_level="Mid",
            hire_date=date(2023, 1, 10),
            office_location="San Francisco",
            work_arrangement="hybrid",
            base_salary=95000,
            pay_frequency="bi_weekly",
            currency="USD",
            overtime_eligible=True,
            bonus_amount=8000,
            date_of_birth=date(1995, 2, 14),
            city="San Francisco",
            state="CA",
            country="USA"
        ),
        Employee(
            employee_code="EMP006",
            first_name="David",
            last_name="Brown",
            work_email="david.brown@company.com",
            work_phone="+1 (555) 600-0006",
            employment_type=EmploymentType.FULL_TIME,
            employment_status=EmploymentStatus.ACTIVE,
            department_id=finance_dept.id,
            job_title="Financial Analyst",
            job_level="Junior",
            hire_date=date(2023, 9, 1),
            office_location="New York",
            work_arrangement="onsite",
            base_salary=70000,
            pay_frequency="bi_weekly",
            currency="USD",
            overtime_eligible=False,
            date_of_birth=date(1997, 8, 30),
            city="New York",
            state="NY",
            country="USA"
        )
    ]

    session.add_all(employees)
    await session.commit()
    print(f"✓ Created {len(employees)} employees")
    return employees


async def seed_job_requisitions(session: AsyncSession):
    """Create sample job requisitions"""
    from sqlalchemy import select

    # Check if job requisitions already exist
    result = await session.execute(select(JobRequisition).limit(1))
    if result.scalar_one_or_none():
        print("⊙ Job requisitions already exist, loading existing data...")
        result = await session.execute(select(JobRequisition))
        return result.scalars().all()

    jobs = [
        JobRequisition(
            job_title="Senior Full Stack Developer",
            department="Engineering",
            location="San Francisco, CA / Remote",
            employment_type="full_time",
            positions=2,
            salary_range_min=120000,
            salary_range_max=160000,
            status=JobRequisitionStatus.OPEN,
            posted_date=date.today() - timedelta(days=15),
            closing_date=date.today() + timedelta(days=45),
            job_summary="We are seeking an experienced Full Stack Developer to join our engineering team.",
            key_responsibilities="Design and develop scalable web applications, collaborate with cross-functional teams, mentor junior developers.",
            required_education="Bachelor's degree in Computer Science or related field",
            min_experience_years=5,
            max_experience_years=10,
            required_skills="React, Node.js, Python, PostgreSQL, AWS",
            preferred_skills="TypeScript, Docker, Kubernetes",
            work_schedule="Flexible, 40 hours per week",
            benefits="Health insurance, 401(k) matching, unlimited PTO",
            applicants_count=12
        ),
        JobRequisition(
            job_title="HR Coordinator",
            department="Human Resources",
            location="New York, NY",
            employment_type="full_time",
            positions=1,
            salary_range_min=50000,
            salary_range_max=65000,
            status=JobRequisitionStatus.OPEN,
            posted_date=date.today() - timedelta(days=10),
            closing_date=date.today() + timedelta(days=50),
            job_summary="Looking for an organized HR Coordinator to support our HR team.",
            key_responsibilities="Manage employee records, coordinate onboarding, assist with recruitment processes.",
            required_education="Bachelor's degree in HR or related field",
            min_experience_years=2,
            max_experience_years=4,
            required_skills="HRIS systems, Microsoft Office, Communication skills",
            work_schedule="Monday-Friday, 9 AM - 5 PM",
            benefits="Health insurance, 401(k), 15 days PTO",
            applicants_count=8
        ),
        JobRequisition(
            job_title="Marketing Manager",
            department="Marketing",
            location="Los Angeles, CA",
            employment_type="full_time",
            positions=1,
            salary_range_min=90000,
            salary_range_max=120000,
            status=JobRequisitionStatus.OPEN,
            posted_date=date.today() - timedelta(days=5),
            closing_date=date.today() + timedelta(days=55),
            job_summary="Seeking a creative Marketing Manager to lead our marketing initiatives.",
            key_responsibilities="Develop marketing strategies, manage campaigns, analyze market trends.",
            required_education="Bachelor's degree in Marketing or Business",
            min_experience_years=5,
            max_experience_years=8,
            required_skills="Digital marketing, SEO/SEM, Analytics, Content strategy",
            work_schedule="Flexible, with occasional evening events",
            benefits="Comprehensive health benefits, bonus potential",
            applicants_count=15
        ),
        JobRequisition(
            job_title="Data Scientist",
            department="Engineering",
            location="Remote",
            employment_type="full_time",
            positions=1,
            salary_range_min=130000,
            salary_range_max=170000,
            status=JobRequisitionStatus.OPEN,
            posted_date=date.today() - timedelta(days=20),
            closing_date=date.today() + timedelta(days=40),
            job_summary="Join our data team to drive insights and build predictive models.",
            key_responsibilities="Analyze large datasets, build ML models, present findings to stakeholders.",
            required_education="Master's degree in Data Science, Statistics, or related field",
            min_experience_years=3,
            max_experience_years=7,
            required_skills="Python, R, SQL, Machine Learning, TensorFlow",
            preferred_skills="AWS Sagemaker, Spark, Deep Learning",
            work_schedule="Fully remote, flexible hours",
            benefits="Stock options, unlimited PTO, home office stipend",
            applicants_count=20
        )
    ]

    session.add_all(jobs)
    await session.commit()
    print(f"✓ Created {len(jobs)} job requisitions")
    return jobs


async def seed_applicants(session: AsyncSession, jobs):
    """Create sample applicants"""
    from sqlalchemy import select

    # Check if applicants already exist
    result = await session.execute(select(Applicant).limit(1))
    if result.scalar_one_or_none():
        print("⊙ Applicants already exist, skipping...")
        result = await session.execute(select(Applicant))
        return result.scalars().all()

    applicants = [
        Applicant(
            job_id=jobs[0].id,
            job_title=jobs[0].job_title,
            name="Alex Thompson",
            email="alex.thompson@email.com",
            phone="+1 (555) 700-0001",
            status=ApplicantStatus.INTERVIEW,
            application_date=date.today() - timedelta(days=10),
            experience_years=6,
            education="BS Computer Science",
            skills=["React", "Node.js", "AWS", "Python"],
            current_stage="Technical Interview",
            city="San Francisco",
            state="CA",
            country="USA"
        ),
        Applicant(
            job_id=jobs[0].id,
            job_title=jobs[0].job_title,
            name="Jessica Williams",
            email="jessica.williams@email.com",
            phone="+1 (555) 700-0002",
            status=ApplicantStatus.SCREENING,
            application_date=date.today() - timedelta(days=8),
            experience_years=5,
            education="BS Software Engineering",
            skills=["React", "TypeScript", "Node.js", "Docker"],
            current_stage="Resume Review",
            city="Seattle",
            state="WA",
            country="USA"
        ),
        Applicant(
            job_id=jobs[1].id,
            job_title=jobs[1].job_title,
            name="Robert Garcia",
            email="robert.garcia@email.com",
            phone="+1 (555) 700-0003",
            status=ApplicantStatus.NEW,
            application_date=date.today() - timedelta(days=3),
            experience_years=3,
            education="BA Human Resources Management",
            skills=["HRIS", "Recruitment", "Employee Relations"],
            current_stage="New Application",
            city="New York",
            state="NY",
            country="USA"
        ),
        Applicant(
            job_id=jobs[1].id,
            job_title=jobs[1].job_title,
            name="Maria Rodriguez",
            email="maria.rodriguez@email.com",
            phone="+1 (555) 700-0004",
            status=ApplicantStatus.SCREENING,
            application_date=date.today() - timedelta(days=5),
            experience_years=4,
            education="BA Business Administration",
            skills=["HR Operations", "Onboarding", "MS Office"],
            current_stage="Phone Screening Scheduled",
            city="Brooklyn",
            state="NY",
            country="USA"
        ),
        Applicant(
            job_id=jobs[2].id,
            job_title=jobs[2].job_title,
            name="Kevin Lee",
            email="kevin.lee@email.com",
            phone="+1 (555) 700-0005",
            status=ApplicantStatus.OFFER,
            application_date=date.today() - timedelta(days=25),
            experience_years=7,
            education="MBA Marketing",
            skills=["Digital Marketing", "SEO", "Campaign Management", "Analytics"],
            current_stage="Offer Extended",
            city="Los Angeles",
            state="CA",
            country="USA"
        ),
        Applicant(
            job_id=jobs[3].id,
            job_title=jobs[3].job_title,
            name="Priya Patel",
            email="priya.patel@email.com",
            phone="+1 (555) 700-0006",
            status=ApplicantStatus.INTERVIEW,
            application_date=date.today() - timedelta(days=15),
            experience_years=5,
            education="MS Data Science",
            skills=["Python", "Machine Learning", "SQL", "TensorFlow", "AWS"],
            current_stage="Final Round Interview",
            city="Austin",
            state="TX",
            country="USA"
        ),
        Applicant(
            job_id=jobs[0].id,
            job_title=jobs[0].job_title,
            name="James Wilson",
            email="james.wilson@email.com",
            phone="+1 (555) 700-0007",
            status=ApplicantStatus.REJECTED,
            application_date=date.today() - timedelta(days=20),
            experience_years=3,
            education="BS Computer Science",
            skills=["JavaScript", "React"],
            current_stage="Rejected - Insufficient Experience",
            city="Boston",
            state="MA",
            country="USA"
        )
    ]

    session.add_all(applicants)
    await session.commit()
    print(f"✓ Created {len(applicants)} applicants")
    return applicants


async def seed_advertisements(session: AsyncSession, jobs):
    """Create sample job advertisements"""
    advertisements = [
        Advertisement(
            job_id=jobs[0].id,
            job_title=jobs[0].job_title,
            platform="LinkedIn",
            ad_title="Senior Full Stack Developer - Join Our Innovative Team!",
            ad_content="Exciting opportunity for experienced developers...",
            status=AdvertisementStatus.ACTIVE,
            start_date=date.today() - timedelta(days=15),
            end_date=date.today() + timedelta(days=45),
            budget=2000.0,
            impressions=15000,
            clicks=450,
            applications_received=12,
            conversion_rate=2.67
        ),
        Advertisement(
            job_id=jobs[0].id,
            job_title=jobs[0].job_title,
            platform="Indeed",
            ad_title="Senior Full Stack Developer - Competitive Salary",
            ad_content="Looking for talented developers to join our team...",
            status=AdvertisementStatus.ACTIVE,
            start_date=date.today() - timedelta(days=15),
            end_date=date.today() + timedelta(days=45),
            budget=1500.0,
            impressions=12000,
            clicks=380,
            applications_received=10,
            conversion_rate=2.63
        ),
        Advertisement(
            job_id=jobs[1].id,
            job_title=jobs[1].job_title,
            platform="Indeed",
            ad_title="HR Coordinator - Great Benefits Package",
            ad_content="Join our HR team in a growing company...",
            status=AdvertisementStatus.ACTIVE,
            start_date=date.today() - timedelta(days=10),
            end_date=date.today() + timedelta(days=50),
            budget=800.0,
            impressions=8000,
            clicks=240,
            applications_received=8,
            conversion_rate=3.33
        ),
        Advertisement(
            job_id=jobs[2].id,
            job_title=jobs[2].job_title,
            platform="LinkedIn",
            ad_title="Marketing Manager - Lead Our Growth Strategy",
            ad_content="Seeking creative marketing leader...",
            status=AdvertisementStatus.ACTIVE,
            start_date=date.today() - timedelta(days=5),
            end_date=date.today() + timedelta(days=55),
            budget=1800.0,
            impressions=10000,
            clicks=350,
            applications_received=15,
            conversion_rate=4.29
        )
    ]

    session.add_all(advertisements)
    await session.commit()
    print(f"✓ Created {len(advertisements)} advertisements")


async def seed_leave_requests(session: AsyncSession, employees):
    """Create sample leave requests"""
    leave_requests = [
        LeaveRequest(
            employee_id=employees[1].id,
            leave_type=LeaveType.VACATION,
            start_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=35),
            total_days=5,
            reason="Family vacation",
            status=LeaveStatus.PENDING
        ),
        LeaveRequest(
            employee_id=employees[2].id,
            leave_type=LeaveType.SICK,
            start_date=date.today() - timedelta(days=5),
            end_date=date.today() - timedelta(days=3),
            total_days=2,
            reason="Medical appointment",
            status=LeaveStatus.APPROVED,
            approved_by_id=employees[0].id,
            approved_at=datetime.now() - timedelta(days=6)
        ),
        LeaveRequest(
            employee_id=employees[3].id,
            leave_type=LeaveType.PERSONAL,
            start_date=date.today() + timedelta(days=14),
            end_date=date.today() + timedelta(days=14),
            total_days=1,
            reason="Personal matter",
            status=LeaveStatus.APPROVED,
            approved_by_id=employees[0].id
        )
    ]

    session.add_all(leave_requests)
    await session.commit()
    print(f"✓ Created {len(leave_requests)} leave requests")


async def seed_leave_balances(session: AsyncSession, employees):
    """Create leave balances for employees"""
    current_year = date.today().year
    balances = []

    for employee in employees:
        for leave_type in [LeaveType.VACATION, LeaveType.SICK, LeaveType.PERSONAL]:
            allocated = 15 if leave_type == LeaveType.VACATION else (10 if leave_type == LeaveType.SICK else 5)
            used = 2 if employee.id == employees[2].id and leave_type == LeaveType.SICK else 0

            balance = LeaveBalance(
                employee_id=employee.id,
                leave_type=leave_type,
                year=current_year,
                total_allocated=allocated,
                total_used=used,
                total_pending=0,
                total_available=allocated - used
            )
            balances.append(balance)

    session.add_all(balances)
    await session.commit()
    print(f"✓ Created {len(balances)} leave balances")


async def seed_attendance_records(session: AsyncSession, employees):
    """Create attendance records for the past 30 days"""
    records = []
    for i in range(30):
        record_date = date.today() - timedelta(days=i)

        # Skip weekends
        if record_date.weekday() >= 5:
            continue

        for employee in employees[:4]:  # First 4 employees
            clock_in = datetime.combine(record_date, datetime.min.time()) + timedelta(hours=9)
            clock_out = datetime.combine(record_date, datetime.min.time()) + timedelta(hours=17, minutes=30)

            record = AttendanceRecord(
                employee_id=employee.id,
                attendance_date=record_date,
                clock_in=clock_in,
                clock_out=clock_out,
                regular_hours=8.0,
                overtime_hours=0.5,
                status="present",
                is_approved=True
            )
            records.append(record)

    session.add_all(records)
    await session.commit()
    print(f"✓ Created {len(records)} attendance records")


async def seed_performance_reviews(session: AsyncSession, employees):
    """Create performance reviews"""
    reviews = [
        PerformanceReview(
            employee_id=employees[1].id,
            reviewer_id=employees[0].id,
            review_period_start=date(2023, 7, 1),
            review_period_end=date(2023, 12, 31),
            review_date=date(2024, 1, 15),
            overall_rating=4.5,
            technical_skills_rating=4.0,
            communication_rating=5.0,
            teamwork_rating=4.5,
            strengths="Excellent communication skills and team collaboration",
            areas_for_improvement="Could improve technical depth in some areas",
            goals_for_next_period="Lead a major HR initiative, obtain SHRM certification",
            is_finalized=True,
            finalized_at=datetime(2024, 1, 15)
        ),
        PerformanceReview(
            employee_id=employees[3].id,
            reviewer_id=employees[0].id,
            review_period_start=date(2023, 7, 1),
            review_period_end=date(2023, 12, 31),
            review_date=date(2024, 1, 20),
            overall_rating=4.8,
            technical_skills_rating=5.0,
            communication_rating=4.5,
            teamwork_rating=5.0,
            strengths="Outstanding technical skills and mentorship abilities",
            areas_for_improvement="Could engage more in cross-team initiatives",
            goals_for_next_period="Lead architecture decisions for new projects",
            is_finalized=True
        )
    ]

    session.add_all(reviews)
    await session.commit()
    print(f"✓ Created {len(reviews)} performance reviews")


async def main():
    """Main seeding function"""
    print("\n🌱 Starting HR Module Database Seeding...\n")

    try:
        # Create tables
        await create_tables()

        # Create session
        async with AsyncSessionLocal() as session:
            # Seed data in order
            departments = await seed_departments(session)
            employees = await seed_employees(session, departments)
            jobs = await seed_job_requisitions(session)
            applicants = await seed_applicants(session, jobs)
            await seed_advertisements(session, jobs)
            await seed_leave_requests(session, employees)
            await seed_leave_balances(session, employees)
            await seed_attendance_records(session, employees)
            await seed_performance_reviews(session, employees)

        print("\n✅ Database seeding completed successfully!")
        print("\n📊 Summary:")
        print(f"   • {len(departments)} Departments")
        print(f"   • {len(employees)} Employees")
        print(f"   • {len(jobs)} Job Requisitions")
        print(f"   • {len(applicants)} Applicants")
        print(f"   • 4 Job Advertisements")
        print(f"   • Leave Requests, Balances, Attendance, and Performance Reviews")
        print("\n")

    except Exception as e:
        print(f"\n❌ Error during seeding: {str(e)}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
