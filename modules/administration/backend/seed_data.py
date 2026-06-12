"""
Seed data script for Administration module.
Run this script to populate the database with sample data.
"""

import asyncio
import sys
import json
from datetime import datetime, date, timedelta
from sqlalchemy import text
from app.core.database import AsyncSessionLocal


async def seed_executive_board():
    """Seed sample executive board members."""
    async with AsyncSessionLocal() as session:
        # First, seed the CEO (no reports_to)
        ceo_query = text("""
            INSERT INTO executive_board (
                id, member_name, position, department, email, phone,
                start_date, status, bio, photo_url, reports_to_id
            ) VALUES (
                gen_random_uuid(), :member_name, :position, :department, :email, :phone,
                :start_date, :status, :bio, :photo_url, NULL
            )
            ON CONFLICT DO NOTHING
            RETURNING id
        """)

        ceo_data = {
            "member_name": "Sarah Johnson",
            "position": "CEO",
            "department": "Executive",
            "email": "sarah.johnson@company.com",
            "phone": "+1-555-0101",
            "start_date": date(2020, 1, 15),
            "status": "active",
            "bio": "Visionary leader with 20+ years of experience in corporate strategy and business transformation. Led the company through significant growth and market expansion.",
            "photo_url": "/images/executives/sarah_johnson.jpg"
        }
        result = await session.execute(ceo_query, ceo_data)
        ceo_row = result.first()
        ceo_id = str(ceo_row[0]) if ceo_row else None
        await session.commit()

        # Now seed C-Suite executives reporting to CEO
        executives = [
            {
                "member_name": "Michael Chen",
                "position": "CFO",
                "department": "Finance",
                "email": "michael.chen@company.com",
                "phone": "+1-555-0102",
                "start_date": date(2020, 3, 1),
                "status": "active",
                "bio": "Former investment banker with expertise in corporate finance, M&A, and strategic financial planning. CPA certified.",
                "photo_url": "/images/executives/michael_chen.jpg",
                "reports_to_id": ceo_id
            },
            {
                "member_name": "Jennifer Martinez",
                "position": "COO",
                "department": "Operations",
                "email": "jennifer.martinez@company.com",
                "phone": "+1-555-0103",
                "start_date": date(2021, 6, 15),
                "status": "active",
                "bio": "Operations expert with proven track record in process optimization, supply chain management, and operational excellence.",
                "photo_url": "/images/executives/jennifer_martinez.jpg",
                "reports_to_id": ceo_id
            },
            {
                "member_name": "David Thompson",
                "position": "CTO",
                "department": "Technology",
                "email": "david.thompson@company.com",
                "phone": "+1-555-0104",
                "start_date": date(2019, 9, 1),
                "status": "active",
                "bio": "Technology innovator with deep expertise in cloud architecture, AI/ML, and digital transformation initiatives.",
                "photo_url": "/images/executives/david_thompson.jpg",
                "reports_to_id": ceo_id
            },
            {
                "member_name": "Lisa Anderson",
                "position": "CHRO",
                "department": "Human Resources",
                "email": "lisa.anderson@company.com",
                "phone": "+1-555-0105",
                "start_date": date(2021, 2, 1),
                "status": "active",
                "bio": "HR strategist focused on talent development, organizational culture, and employee engagement.",
                "photo_url": "/images/executives/lisa_anderson.jpg",
                "reports_to_id": ceo_id
            },
            {
                "member_name": "Robert Williams",
                "position": "CMO",
                "department": "Marketing",
                "email": "robert.williams@company.com",
                "phone": "+1-555-0106",
                "start_date": date(2022, 1, 10),
                "status": "active",
                "bio": "Marketing leader with expertise in brand strategy, digital marketing, and customer experience.",
                "photo_url": "/images/executives/robert_williams.jpg",
                "reports_to_id": ceo_id
            },
            {
                "member_name": "Emily Davis",
                "position": "General Counsel",
                "department": "Legal",
                "email": "emily.davis@company.com",
                "phone": "+1-555-0107",
                "start_date": date(2020, 7, 1),
                "status": "active",
                "bio": "Experienced attorney specializing in corporate law, compliance, and risk management.",
                "photo_url": "/images/executives/emily_davis.jpg",
                "reports_to_id": ceo_id
            },
            {
                "member_name": "James Wilson",
                "position": "Board Member",
                "department": "Board of Directors",
                "email": "james.wilson@boardmember.com",
                "phone": "+1-555-0108",
                "start_date": date(2018, 1, 1),
                "status": "active",
                "bio": "Independent board member with extensive experience in corporate governance and strategic advisory.",
                "photo_url": "/images/executives/james_wilson.jpg",
                "reports_to_id": None
            },
            {
                "member_name": "Patricia Brown",
                "position": "Board Member",
                "department": "Board of Directors",
                "email": "patricia.brown@boardmember.com",
                "phone": "+1-555-0109",
                "start_date": date(2019, 6, 1),
                "status": "active",
                "bio": "Board member specializing in finance and audit oversight. Former CFO of Fortune 500 company.",
                "photo_url": "/images/executives/patricia_brown.jpg",
                "reports_to_id": None
            },
            {
                "member_name": "Thomas Garcia",
                "position": "Board Member",
                "department": "Board of Directors",
                "email": "thomas.garcia@boardmember.com",
                "phone": "+1-555-0110",
                "start_date": date(2021, 1, 1),
                "end_date": date(2024, 12, 31),
                "status": "inactive",
                "bio": "Former board member with expertise in technology and innovation.",
                "photo_url": "/images/executives/thomas_garcia.jpg",
                "reports_to_id": None
            }
        ]

        for exec_data in executives:
            # Add end_date if not present
            if 'end_date' not in exec_data:
                exec_data['end_date'] = None

            query = text("""
                INSERT INTO executive_board (
                    id, member_name, position, department, email, phone,
                    start_date, end_date, status, bio, photo_url, reports_to_id
                ) VALUES (
                    gen_random_uuid(), :member_name, :position, :department, :email, :phone,
                    :start_date, :end_date, :status, :bio, :photo_url, CAST(:reports_to_id AS uuid)
                )
                ON CONFLICT DO NOTHING
            """)
            await session.execute(query, exec_data)

        await session.commit()
        print("Executive board members seeded successfully!")


async def seed_legal_cases():
    """Seed sample legal cases."""
    async with AsyncSessionLocal() as session:
        today = date.today()
        cases = [
            {
                "case_number": "LC-2024-001",
                "case_title": "Contract Dispute - Vendor Agreement",
                "case_type": "contract",
                "status": "in_progress",
                "priority": "high",
                "plaintiff": "Our Company Inc.",
                "defendant": "ABC Suppliers Ltd.",
                "court_name": "Superior Court of Commerce",
                "assigned_counsel": "Emily Davis",
                "external_counsel": "Smith & Associates LLP",
                "case_value": 250000.00,
                "filing_date": today - timedelta(days=45),
                "hearing_date": today + timedelta(days=30),
                "description": "Dispute regarding breach of supply contract terms and delivery obligations.",
                "documents": [
                    {"name": "Contract Agreement", "url": "/docs/contract_001.pdf", "date": "2024-01-15"},
                    {"name": "Breach Notice", "url": "/docs/breach_notice_001.pdf", "date": "2024-02-20"}
                ]
            },
            {
                "case_number": "LC-2024-002",
                "case_title": "Employment Discrimination Claim",
                "case_type": "employment",
                "status": "open",
                "priority": "critical",
                "plaintiff": "John Doe",
                "defendant": "Our Company Inc.",
                "court_name": "District Labor Court",
                "assigned_counsel": "Emily Davis",
                "external_counsel": "Johnson Employment Law",
                "case_value": 500000.00,
                "filing_date": today - timedelta(days=30),
                "hearing_date": today + timedelta(days=60),
                "description": "Former employee alleging wrongful termination and discrimination.",
                "documents": [
                    {"name": "Complaint Filing", "url": "/docs/complaint_002.pdf", "date": "2024-03-01"}
                ]
            },
            {
                "case_number": "LC-2023-015",
                "case_title": "Patent Infringement Defense",
                "case_type": "intellectual_property",
                "status": "closed",
                "priority": "high",
                "plaintiff": "TechCorp Industries",
                "defendant": "Our Company Inc.",
                "court_name": "Federal IP Court",
                "assigned_counsel": "Emily Davis",
                "external_counsel": "IP Defense Attorneys",
                "case_value": 1000000.00,
                "filing_date": date(2023, 6, 15),
                "hearing_date": date(2023, 11, 20),
                "resolution_date": date(2024, 1, 10),
                "outcome": "Case dismissed - no infringement found",
                "description": "Defense against patent infringement claims on product design.",
                "documents": [
                    {"name": "Patent Documents", "url": "/docs/patent_analysis.pdf", "date": "2023-06-15"},
                    {"name": "Expert Report", "url": "/docs/expert_report.pdf", "date": "2023-10-01"},
                    {"name": "Final Ruling", "url": "/docs/ruling_015.pdf", "date": "2024-01-10"}
                ]
            },
            {
                "case_number": "LC-2024-003",
                "case_title": "Regulatory Compliance Investigation",
                "case_type": "regulatory",
                "status": "in_progress",
                "priority": "critical",
                "plaintiff": "State Regulatory Board",
                "defendant": "Our Company Inc.",
                "court_name": "Administrative Court",
                "assigned_counsel": "Emily Davis",
                "external_counsel": "Compliance Legal Group",
                "case_value": 750000.00,
                "filing_date": today - timedelta(days=60),
                "hearing_date": today + timedelta(days=45),
                "description": "Investigation into alleged regulatory compliance violations.",
                "documents": [
                    {"name": "Notice of Investigation", "url": "/docs/investigation_notice.pdf", "date": "2024-02-01"}
                ]
            },
            {
                "case_number": "LC-2024-004",
                "case_title": "Shareholder Derivative Action",
                "case_type": "litigation",
                "status": "open",
                "priority": "high",
                "plaintiff": "Minority Shareholders Group",
                "defendant": "Board of Directors",
                "court_name": "Corporate Court",
                "assigned_counsel": "Emily Davis",
                "external_counsel": "Corporate Defense LLC",
                "case_value": 2000000.00,
                "filing_date": today - timedelta(days=20),
                "hearing_date": today + timedelta(days=90),
                "description": "Shareholder lawsuit alleging breach of fiduciary duty.",
                "documents": []
            },
            {
                "case_number": "LC-2023-008",
                "case_title": "Commercial Lease Dispute",
                "case_type": "contract",
                "status": "settled",
                "priority": "medium",
                "plaintiff": "Our Company Inc.",
                "defendant": "Property Management LLC",
                "court_name": "Civil Court",
                "assigned_counsel": "Emily Davis",
                "external_counsel": "Real Estate Legal",
                "case_value": 150000.00,
                "filing_date": date(2023, 8, 1),
                "hearing_date": date(2023, 10, 15),
                "resolution_date": date(2023, 11, 30),
                "outcome": "Settlement reached - $75,000 reduction in lease obligations",
                "description": "Dispute over commercial property lease terms and maintenance obligations.",
                "documents": [
                    {"name": "Lease Agreement", "url": "/docs/lease_008.pdf", "date": "2023-08-01"},
                    {"name": "Settlement Agreement", "url": "/docs/settlement_008.pdf", "date": "2023-11-30"}
                ]
            },
            {
                "case_number": "LC-2024-005",
                "case_title": "Data Privacy Violation Claim",
                "case_type": "regulatory",
                "status": "in_progress",
                "priority": "critical",
                "plaintiff": "Privacy Protection Agency",
                "defendant": "Our Company Inc.",
                "court_name": "Federal Privacy Court",
                "assigned_counsel": "Emily Davis",
                "external_counsel": "Privacy Law Specialists",
                "case_value": 500000.00,
                "filing_date": today - timedelta(days=15),
                "hearing_date": today + timedelta(days=75),
                "description": "Investigation into alleged GDPR and data privacy violations.",
                "documents": []
            },
            {
                "case_number": "LC-2024-006",
                "case_title": "Product Liability Class Action",
                "case_type": "litigation",
                "status": "on_hold",
                "priority": "critical",
                "plaintiff": "Consumer Class Action Group",
                "defendant": "Our Company Inc.",
                "court_name": "Federal District Court",
                "assigned_counsel": "Emily Davis",
                "external_counsel": "Product Liability Defense",
                "case_value": 5000000.00,
                "filing_date": today - timedelta(days=90),
                "hearing_date": today + timedelta(days=120),
                "description": "Class action lawsuit regarding alleged product defects and consumer harm.",
                "documents": [
                    {"name": "Class Certification Motion", "url": "/docs/class_cert.pdf", "date": "2024-01-15"}
                ]
            },
            {
                "case_number": "LC-2023-020",
                "case_title": "Trademark Opposition",
                "case_type": "intellectual_property",
                "status": "closed",
                "priority": "medium",
                "plaintiff": "Our Company Inc.",
                "defendant": "Competitor Corp",
                "court_name": "Trademark Office",
                "assigned_counsel": "Emily Davis",
                "external_counsel": "Trademark Attorneys",
                "case_value": 100000.00,
                "filing_date": date(2023, 4, 1),
                "hearing_date": date(2023, 9, 15),
                "resolution_date": date(2023, 10, 30),
                "outcome": "Opposition successful - competitor withdrew trademark application",
                "description": "Opposition to competitor's trademark application for confusingly similar mark.",
                "documents": [
                    {"name": "Opposition Filing", "url": "/docs/opposition_020.pdf", "date": "2023-04-01"},
                    {"name": "Final Decision", "url": "/docs/decision_020.pdf", "date": "2023-10-30"}
                ]
            },
            {
                "case_number": "LC-2024-007",
                "case_title": "Environmental Compliance Matter",
                "case_type": "regulatory",
                "status": "open",
                "priority": "high",
                "plaintiff": "Environmental Protection Agency",
                "defendant": "Our Company Inc.",
                "court_name": "Environmental Court",
                "assigned_counsel": "Emily Davis",
                "external_counsel": "Environmental Law Group",
                "case_value": 300000.00,
                "filing_date": today - timedelta(days=10),
                "hearing_date": today + timedelta(days=60),
                "description": "Investigation into alleged environmental regulation violations at manufacturing facility.",
                "documents": []
            },
            {
                "case_number": "LC-2023-025",
                "case_title": "Merger Agreement Dispute",
                "case_type": "contract",
                "status": "settled",
                "priority": "critical",
                "plaintiff": "Our Company Inc.",
                "defendant": "Acquisition Target Inc.",
                "court_name": "Business Court",
                "assigned_counsel": "Emily Davis",
                "external_counsel": "M&A Legal Advisors",
                "case_value": 3000000.00,
                "filing_date": date(2023, 7, 1),
                "hearing_date": date(2023, 10, 1),
                "resolution_date": date(2023, 11, 15),
                "outcome": "Settlement - Price adjustment of $1.5M in favor of acquirer",
                "description": "Dispute over merger agreement terms and purchase price adjustments.",
                "documents": [
                    {"name": "Merger Agreement", "url": "/docs/merger_025.pdf", "date": "2023-07-01"},
                    {"name": "Settlement Terms", "url": "/docs/settlement_025.pdf", "date": "2023-11-15"}
                ]
            },
            {
                "case_number": "LC-2024-008",
                "case_title": "Non-Compete Enforcement",
                "case_type": "employment",
                "status": "in_progress",
                "priority": "high",
                "plaintiff": "Our Company Inc.",
                "defendant": "Former Executive",
                "court_name": "Superior Court",
                "assigned_counsel": "Emily Davis",
                "external_counsel": "Employment Law Partners",
                "case_value": 400000.00,
                "filing_date": today - timedelta(days=25),
                "hearing_date": today + timedelta(days=35),
                "description": "Enforcement of non-compete agreement against former executive now working for competitor.",
                "documents": [
                    {"name": "Employment Agreement", "url": "/docs/employment_008.pdf", "date": "2024-02-15"}
                ]
            },
            {
                "case_number": "LC-2024-009",
                "case_title": "Securities Fraud Investigation",
                "case_type": "regulatory",
                "status": "open",
                "priority": "critical",
                "plaintiff": "Securities and Exchange Commission",
                "defendant": "Our Company Inc.",
                "court_name": "Federal Securities Court",
                "assigned_counsel": "Emily Davis",
                "external_counsel": "Securities Defense Counsel",
                "case_value": 10000000.00,
                "filing_date": today - timedelta(days=5),
                "hearing_date": today + timedelta(days=90),
                "description": "SEC investigation into alleged securities fraud and financial reporting violations.",
                "documents": []
            },
            {
                "case_number": "LC-2023-030",
                "case_title": "Antitrust Review",
                "case_type": "regulatory",
                "status": "closed",
                "priority": "high",
                "plaintiff": "Federal Trade Commission",
                "defendant": "Our Company Inc.",
                "court_name": "Federal Trade Court",
                "assigned_counsel": "Emily Davis",
                "external_counsel": "Antitrust Legal Group",
                "case_value": 500000.00,
                "filing_date": date(2023, 3, 1),
                "hearing_date": date(2023, 8, 15),
                "resolution_date": date(2023, 9, 30),
                "outcome": "Investigation closed - no violations found",
                "description": "FTC review of market practices and competitive behavior.",
                "documents": [
                    {"name": "Investigation Report", "url": "/docs/ftc_report_030.pdf", "date": "2023-09-30"}
                ]
            },
            {
                "case_number": "LC-2024-010",
                "case_title": "Trade Secret Misappropriation",
                "case_type": "intellectual_property",
                "status": "in_progress",
                "priority": "critical",
                "plaintiff": "Our Company Inc.",
                "defendant": "Competitor Technologies",
                "court_name": "Federal IP Court",
                "assigned_counsel": "Emily Davis",
                "external_counsel": "Trade Secret Litigation",
                "case_value": 2500000.00,
                "filing_date": today - timedelta(days=35),
                "hearing_date": today + timedelta(days=50),
                "description": "Lawsuit against competitor for alleged theft and misuse of proprietary trade secrets.",
                "documents": [
                    {"name": "Complaint", "url": "/docs/complaint_010.pdf", "date": "2024-03-01"},
                    {"name": "Preliminary Injunction Motion", "url": "/docs/injunction_010.pdf", "date": "2024-03-15"}
                ]
            }
        ]

        for case in cases:
            # Add optional fields if not present
            if 'resolution_date' not in case:
                case['resolution_date'] = None
            if 'outcome' not in case:
                case['outcome'] = None

            case_data = {**case, 'documents': json.dumps(case['documents'])}
            query = text("""
                INSERT INTO legal_cases (
                    id, case_number, case_title, case_type, status, priority,
                    plaintiff, defendant, court_name, assigned_counsel, external_counsel,
                    case_value, filing_date, hearing_date, resolution_date, outcome,
                    description, documents
                ) VALUES (
                    gen_random_uuid(), :case_number, :case_title, :case_type, :status, :priority,
                    :plaintiff, :defendant, :court_name, :assigned_counsel, :external_counsel,
                    :case_value, :filing_date, :hearing_date, :resolution_date, :outcome,
                    :description, CAST(:documents AS jsonb)
                )
                ON CONFLICT (case_number) DO NOTHING
            """)
            await session.execute(query, case_data)

        await session.commit()
        print("Legal cases seeded successfully!")


async def seed_compliance_policies():
    """Seed sample compliance policies."""
    async with AsyncSessionLocal() as session:
        today = date.today()
        policies = [
            {
                "policy_code": "POL-DP-001",
                "policy_name": "Data Protection and Privacy Policy",
                "category": "data_protection",
                "version": "3.2",
                "status": "active",
                "effective_date": date(2024, 1, 1),
                "review_date": date(2024, 12, 31),
                "expiry_date": date(2026, 12, 31),
                "owner": "Chief Information Security Officer",
                "approver": "CEO & Board of Directors",
                "description": "Comprehensive policy covering data protection, GDPR compliance, and privacy requirements.",
                "policy_document_url": "/policies/data_protection_v3.2.pdf",
                "scope": {
                    "departments": ["All"],
                    "applies_to": ["Employees", "Contractors", "Partners"],
                    "regions": ["Global"]
                }
            },
            {
                "policy_code": "POL-FIN-001",
                "policy_name": "Financial Controls and SOX Compliance",
                "category": "financial",
                "version": "2.1",
                "status": "active",
                "effective_date": date(2024, 1, 1),
                "review_date": date(2024, 6, 30),
                "owner": "CFO",
                "approver": "Audit Committee",
                "description": "Policy ensuring compliance with Sarbanes-Oxley Act and financial control requirements.",
                "policy_document_url": "/policies/financial_controls_v2.1.pdf",
                "scope": {
                    "departments": ["Finance", "Accounting", "Treasury"],
                    "applies_to": ["Finance Team", "Management"],
                    "regulations": ["SOX", "GAAP"]
                }
            },
            {
                "policy_code": "POL-HS-001",
                "policy_name": "Workplace Health and Safety Policy",
                "category": "health_safety",
                "version": "4.0",
                "status": "active",
                "effective_date": date(2024, 1, 1),
                "review_date": date(2024, 12, 31),
                "owner": "Head of Operations",
                "approver": "COO",
                "description": "Comprehensive workplace health, safety, and accident prevention policy.",
                "policy_document_url": "/policies/health_safety_v4.0.pdf",
                "scope": {
                    "departments": ["All"],
                    "facilities": ["All locations", "Manufacturing sites", "Offices"],
                    "compliance": ["OSHA"]
                }
            },
            {
                "policy_code": "POL-ENV-001",
                "policy_name": "Environmental Sustainability Policy",
                "category": "environmental",
                "version": "2.5",
                "status": "active",
                "effective_date": date(2024, 1, 1),
                "review_date": date(2025, 1, 1),
                "owner": "Sustainability Director",
                "approver": "Board of Directors",
                "description": "Policy governing environmental practices, emissions, waste management, and sustainability initiatives.",
                "policy_document_url": "/policies/environmental_v2.5.pdf",
                "scope": {
                    "departments": ["Operations", "Manufacturing", "Supply Chain"],
                    "standards": ["ISO 14001", "EPA Regulations"]
                }
            },
            {
                "policy_code": "POL-ETH-001",
                "policy_name": "Code of Business Conduct and Ethics",
                "category": "ethics",
                "version": "5.0",
                "status": "active",
                "effective_date": date(2024, 1, 1),
                "review_date": date(2024, 12, 31),
                "owner": "Chief Compliance Officer",
                "approver": "Board of Directors",
                "description": "Comprehensive code of conduct covering ethical business practices, conflicts of interest, and corporate values.",
                "policy_document_url": "/policies/code_of_conduct_v5.0.pdf",
                "scope": {
                    "departments": ["All"],
                    "applies_to": ["All employees", "Board members", "Contractors"]
                }
            },
            {
                "policy_code": "POL-INFO-001",
                "policy_name": "Information Security Policy",
                "category": "data_protection",
                "version": "3.0",
                "status": "active",
                "effective_date": date(2024, 1, 1),
                "review_date": date(2024, 6, 30),
                "owner": "CISO",
                "approver": "CTO & CEO",
                "description": "Policy covering information security practices, access controls, and cybersecurity requirements.",
                "policy_document_url": "/policies/infosec_v3.0.pdf",
                "scope": {
                    "departments": ["All"],
                    "systems": ["All IT systems", "Cloud platforms"],
                    "standards": ["ISO 27001", "NIST"]
                }
            },
            {
                "policy_code": "POL-AML-001",
                "policy_name": "Anti-Money Laundering Policy",
                "category": "financial",
                "version": "1.8",
                "status": "active",
                "effective_date": date(2024, 1, 1),
                "review_date": date(2024, 12, 31),
                "owner": "Chief Compliance Officer",
                "approver": "CFO & Board",
                "description": "Policy ensuring compliance with anti-money laundering regulations and KYC requirements.",
                "policy_document_url": "/policies/aml_v1.8.pdf",
                "scope": {
                    "departments": ["Finance", "Sales", "Legal"],
                    "regulations": ["Bank Secrecy Act", "FinCEN"]
                }
            },
            {
                "policy_code": "POL-HR-001",
                "policy_name": "Equal Employment Opportunity Policy",
                "category": "ethics",
                "version": "2.3",
                "status": "active",
                "effective_date": date(2024, 1, 1),
                "review_date": date(2024, 12, 31),
                "owner": "CHRO",
                "approver": "CEO",
                "description": "Policy prohibiting discrimination and ensuring equal employment opportunities.",
                "policy_document_url": "/policies/eeo_v2.3.pdf",
                "scope": {
                    "departments": ["All"],
                    "applies_to": ["All employees", "Candidates"],
                    "compliance": ["EEOC", "Civil Rights Act"]
                }
            },
            {
                "policy_code": "POL-IP-001",
                "policy_name": "Intellectual Property Protection Policy",
                "category": "other",
                "version": "1.5",
                "status": "active",
                "effective_date": date(2024, 1, 1),
                "review_date": date(2025, 1, 1),
                "owner": "General Counsel",
                "approver": "CEO",
                "description": "Policy governing protection and management of company intellectual property assets.",
                "policy_document_url": "/policies/ip_protection_v1.5.pdf",
                "scope": {
                    "departments": ["R&D", "Engineering", "Legal"],
                    "assets": ["Patents", "Trademarks", "Trade Secrets"]
                }
            },
            {
                "policy_code": "POL-VEN-001",
                "policy_name": "Vendor and Third-Party Risk Management",
                "category": "other",
                "version": "2.0",
                "status": "active",
                "effective_date": date(2024, 1, 1),
                "review_date": date(2024, 6, 30),
                "owner": "Chief Procurement Officer",
                "approver": "COO",
                "description": "Policy for assessing and managing risks associated with vendors and third-party relationships.",
                "policy_document_url": "/policies/vendor_risk_v2.0.pdf",
                "scope": {
                    "departments": ["Procurement", "Legal", "Operations"],
                    "applies_to": ["All vendor relationships"]
                }
            },
            {
                "policy_code": "POL-WB-001",
                "policy_name": "Whistleblower Protection Policy",
                "category": "ethics",
                "version": "1.9",
                "status": "active",
                "effective_date": date(2024, 1, 1),
                "review_date": date(2024, 12, 31),
                "owner": "Chief Compliance Officer",
                "approver": "Board of Directors",
                "description": "Policy protecting employees who report suspected violations or misconduct.",
                "policy_document_url": "/policies/whistleblower_v1.9.pdf",
                "scope": {
                    "departments": ["All"],
                    "applies_to": ["All employees"],
                    "compliance": ["SOX Section 806"]
                }
            },
            {
                "policy_code": "POL-SOC-001",
                "policy_name": "Social Media and External Communications",
                "category": "other",
                "version": "3.1",
                "status": "active",
                "effective_date": date(2024, 1, 1),
                "review_date": date(2024, 12, 31),
                "owner": "CMO",
                "approver": "CEO",
                "description": "Policy governing employee use of social media and external communications on behalf of the company.",
                "policy_document_url": "/policies/social_media_v3.1.pdf",
                "scope": {
                    "departments": ["All"],
                    "applies_to": ["All employees"]
                }
            },
            {
                "policy_code": "POL-DR-001",
                "policy_name": "Business Continuity and Disaster Recovery",
                "category": "other",
                "version": "2.7",
                "status": "active",
                "effective_date": date(2024, 1, 1),
                "review_date": date(2024, 6, 30),
                "owner": "CTO",
                "approver": "COO",
                "description": "Policy ensuring business continuity and disaster recovery preparedness.",
                "policy_document_url": "/policies/bcdr_v2.7.pdf",
                "scope": {
                    "departments": ["IT", "Operations", "All critical functions"],
                    "systems": ["All critical systems"]
                }
            },
            {
                "policy_code": "POL-DP-002",
                "policy_name": "Data Retention and Disposal Policy",
                "category": "data_protection",
                "version": "1.3",
                "status": "under_review",
                "effective_date": date(2023, 1, 1),
                "review_date": date(2024, 3, 31),
                "owner": "CISO",
                "approver": "General Counsel",
                "description": "Policy governing retention periods and secure disposal of company data.",
                "policy_document_url": "/policies/data_retention_v1.3.pdf",
                "scope": {
                    "departments": ["All"],
                    "data_types": ["Customer data", "Financial records", "Employee records"]
                }
            },
            {
                "policy_code": "POL-TRV-001",
                "policy_name": "Travel and Expense Policy",
                "category": "financial",
                "version": "4.2",
                "status": "active",
                "effective_date": date(2024, 1, 1),
                "review_date": date(2024, 12, 31),
                "owner": "CFO",
                "approver": "CEO",
                "description": "Policy governing business travel, expense reimbursement, and spending limits.",
                "policy_document_url": "/policies/travel_expense_v4.2.pdf",
                "scope": {
                    "departments": ["All"],
                    "applies_to": ["All employees traveling on business"]
                }
            }
        ]

        for policy in policies:
            # Add optional fields if not present
            if 'expiry_date' not in policy:
                policy['expiry_date'] = None

            policy_data = {**policy, 'scope': json.dumps(policy['scope'])}
            query = text("""
                INSERT INTO compliance_policies (
                    id, policy_code, policy_name, category, version, status,
                    effective_date, review_date, expiry_date, owner, approver,
                    description, policy_document_url, scope
                ) VALUES (
                    gen_random_uuid(), :policy_code, :policy_name, :category, :version, :status,
                    :effective_date, :review_date, :expiry_date, :owner, :approver,
                    :description, :policy_document_url, CAST(:scope AS jsonb)
                )
                ON CONFLICT (policy_code) DO NOTHING
            """)
            await session.execute(query, policy_data)

        await session.commit()
        print("Compliance policies seeded successfully!")


async def seed_compliance_audits():
    """Seed sample compliance audits."""
    async with AsyncSessionLocal() as session:
        # Get policy IDs
        policies_query = text("SELECT id, policy_code FROM compliance_policies")
        result = await session.execute(policies_query)
        policies = {row[1]: str(row[0]) for row in result.all()}

        today = date.today()
        audits = [
            {
                "audit_number": "AUD-2024-001",
                "audit_title": "Annual SOX Compliance Audit",
                "audit_type": "external",
                "policy_id": policies.get("POL-FIN-001"),
                "status": "completed",
                "risk_level": "high",
                "auditor_name": "Deloitte LLP",
                "audit_date": today - timedelta(days=30),
                "completion_date": today - timedelta(days=5),
                "findings": [
                    {"severity": "low", "finding": "Minor documentation gaps in Q1 controls", "status": "resolved"},
                    {"severity": "medium", "finding": "Delayed reconciliation in March", "status": "in_progress"}
                ],
                "recommendations": "Strengthen monthly reconciliation processes and enhance documentation practices.",
                "action_items": [
                    {"action": "Update reconciliation procedures", "owner": "Finance Manager", "due_date": "2024-05-15"},
                    {"action": "Provide additional training to accounting team", "owner": "CFO", "due_date": "2024-05-01"}
                ],
                "score": 92
            },
            {
                "audit_number": "AUD-2024-002",
                "audit_title": "Data Privacy Compliance Review",
                "audit_type": "internal",
                "policy_id": policies.get("POL-DP-001"),
                "status": "completed",
                "risk_level": "high",
                "auditor_name": "Internal Audit Team",
                "audit_date": today - timedelta(days=45),
                "completion_date": today - timedelta(days=20),
                "findings": [
                    {"severity": "high", "finding": "Access controls not consistently applied", "status": "resolved"},
                    {"severity": "medium", "finding": "Data retention policy not fully implemented", "status": "in_progress"},
                    {"severity": "low", "finding": "Privacy notices need updates", "status": "resolved"}
                ],
                "recommendations": "Implement automated access control reviews and enhance data retention automation.",
                "action_items": [
                    {"action": "Deploy automated access control system", "owner": "CISO", "due_date": "2024-06-30"},
                    {"action": "Update privacy notices across all platforms", "owner": "Legal", "due_date": "2024-04-30"}
                ],
                "score": 85
            },
            {
                "audit_number": "AUD-2024-003",
                "audit_title": "ISO 27001 Certification Audit",
                "audit_type": "certification",
                "policy_id": policies.get("POL-INFO-001"),
                "status": "completed",
                "risk_level": "critical",
                "auditor_name": "BSI Group",
                "audit_date": today - timedelta(days=60),
                "completion_date": today - timedelta(days=40),
                "findings": [
                    {"severity": "medium", "finding": "Incident response procedures need enhancement", "status": "resolved"},
                    {"severity": "low", "finding": "Documentation updates required", "status": "resolved"}
                ],
                "recommendations": "Certification granted. Continue to maintain and improve security controls.",
                "action_items": [
                    {"action": "Schedule annual recertification", "owner": "CISO", "due_date": "2025-03-01"}
                ],
                "score": 94
            },
            {
                "audit_number": "AUD-2024-004",
                "audit_title": "Workplace Safety Inspection",
                "audit_type": "external",
                "policy_id": policies.get("POL-HS-001"),
                "status": "completed",
                "risk_level": "medium",
                "auditor_name": "OSHA Inspector",
                "audit_date": today - timedelta(days=20),
                "completion_date": today - timedelta(days=15),
                "findings": [
                    {"severity": "medium", "finding": "Safety signage missing in warehouse area", "status": "resolved"},
                    {"severity": "low", "finding": "First aid kits need restocking", "status": "resolved"}
                ],
                "recommendations": "Continue regular safety inspections and maintain safety equipment inventory.",
                "action_items": [
                    {"action": "Implement quarterly safety audits", "owner": "Operations Manager", "due_date": "2024-06-01"}
                ],
                "score": 88
            },
            {
                "audit_number": "AUD-2024-005",
                "audit_title": "Anti-Money Laundering Compliance Review",
                "audit_type": "internal",
                "policy_id": policies.get("POL-AML-001"),
                "status": "in_progress",
                "risk_level": "high",
                "auditor_name": "Compliance Team",
                "audit_date": today - timedelta(days=10),
                "findings": [],
                "recommendations": "",
                "action_items": [],
                "score": None
            },
            {
                "audit_number": "AUD-2024-006",
                "audit_title": "Environmental Compliance Audit",
                "audit_type": "regulatory",
                "policy_id": policies.get("POL-ENV-001"),
                "status": "completed",
                "risk_level": "medium",
                "auditor_name": "EPA Regional Office",
                "audit_date": today - timedelta(days=50),
                "completion_date": today - timedelta(days=35),
                "findings": [
                    {"severity": "low", "finding": "Emissions monitoring logs incomplete for one month", "status": "resolved"},
                    {"severity": "low", "finding": "Waste disposal records need better organization", "status": "resolved"}
                ],
                "recommendations": "Continue environmental monitoring and maintain comprehensive records.",
                "action_items": [
                    {"action": "Implement automated emissions monitoring system", "owner": "Operations", "due_date": "2024-07-01"}
                ],
                "score": 90
            },
            {
                "audit_number": "AUD-2024-007",
                "audit_title": "Vendor Risk Assessment Audit",
                "audit_type": "internal",
                "policy_id": policies.get("POL-VEN-001"),
                "status": "in_progress",
                "risk_level": "medium",
                "auditor_name": "Risk Management Team",
                "audit_date": today - timedelta(days=5),
                "findings": [
                    {"severity": "medium", "finding": "15% of vendors lack current security assessments", "status": "open"}
                ],
                "recommendations": "",
                "action_items": [
                    {"action": "Complete security assessments for all critical vendors", "owner": "Procurement", "due_date": "2024-05-31"}
                ],
                "score": None
            },
            {
                "audit_number": "AUD-2023-015",
                "audit_title": "Annual Ethics and Code of Conduct Review",
                "audit_type": "internal",
                "policy_id": policies.get("POL-ETH-001"),
                "status": "completed",
                "risk_level": "medium",
                "auditor_name": "Internal Audit",
                "audit_date": date(2023, 11, 1),
                "completion_date": date(2023, 12, 15),
                "findings": [
                    {"severity": "low", "finding": "95% training completion rate (target: 100%)", "status": "resolved"},
                    {"severity": "low", "finding": "Three minor policy violations reported and addressed", "status": "resolved"}
                ],
                "recommendations": "Maintain strong ethics culture and continue annual training programs.",
                "action_items": [
                    {"action": "Achieve 100% training completion", "owner": "HR", "due_date": "2024-01-31"}
                ],
                "score": 91
            },
            {
                "audit_number": "AUD-2024-008",
                "audit_title": "Business Continuity Readiness Assessment",
                "audit_type": "internal",
                "policy_id": policies.get("POL-DR-001"),
                "status": "scheduled",
                "risk_level": "high",
                "auditor_name": "Risk Management Team",
                "audit_date": today + timedelta(days=15),
                "findings": [],
                "recommendations": "",
                "action_items": [],
                "score": None
            },
            {
                "audit_number": "AUD-2024-009",
                "audit_title": "Intellectual Property Protection Audit",
                "audit_type": "internal",
                "policy_id": policies.get("POL-IP-001"),
                "status": "in_progress",
                "risk_level": "medium",
                "auditor_name": "Legal Team",
                "audit_date": today - timedelta(days=7),
                "findings": [
                    {"severity": "medium", "finding": "Patent filing backlog identified", "status": "open"}
                ],
                "recommendations": "",
                "action_items": [
                    {"action": "Prioritize patent filings for key innovations", "owner": "General Counsel", "due_date": "2024-06-30"}
                ],
                "score": None
            }
        ]

        for audit in audits:
            if audit["policy_id"]:  # Only insert if policy exists
                # Add optional fields if not present
                if 'completion_date' not in audit:
                    audit['completion_date'] = None

                audit_data = {
                    **audit,
                    'findings': json.dumps(audit['findings']),
                    'action_items': json.dumps(audit['action_items'])
                }
                query = text("""
                    INSERT INTO compliance_audits (
                        id, audit_number, audit_title, audit_type, policy_id, status,
                        risk_level, auditor_name, audit_date, completion_date, findings,
                        recommendations, action_items, score
                    ) VALUES (
                        gen_random_uuid(), :audit_number, :audit_title, :audit_type, CAST(:policy_id AS uuid), :status,
                        :risk_level, :auditor_name, :audit_date, :completion_date, CAST(:findings AS jsonb),
                        :recommendations, CAST(:action_items AS jsonb), :score
                    )
                    ON CONFLICT (audit_number) DO NOTHING
                """)
                await session.execute(query, audit_data)

        await session.commit()
        print("Compliance audits seeded successfully!")


async def seed_strategic_initiatives():
    """Seed sample strategic initiatives."""
    async with AsyncSessionLocal() as session:
        today = date.today()
        initiatives = [
            {
                "initiative_code": "SI-2024-001",
                "initiative_name": "Digital Transformation Program",
                "category": "transformation",
                "status": "in_progress",
                "priority": "critical",
                "owner": "CEO - Sarah Johnson",
                "champion": "CTO - David Thompson",
                "start_date": date(2024, 1, 1),
                "target_completion_date": date(2025, 12, 31),
                "budget_allocated": 5000000.00,
                "budget_spent": 1200000.00,
                "progress_percentage": 25,
                "objectives": [
                    "Modernize legacy IT systems",
                    "Implement cloud-first infrastructure",
                    "Digitize core business processes",
                    "Enhance customer digital experience"
                ],
                "kpis": [
                    {"metric": "System Migration", "target": "100%", "current": "30%"},
                    {"metric": "Cloud Adoption", "target": "80%", "current": "20%"},
                    {"metric": "Process Automation", "target": "60%", "current": "15%"}
                ],
                "milestones": [
                    {"name": "Cloud Infrastructure Setup", "date": "2024-03-31", "status": "completed"},
                    {"name": "ERP System Migration", "date": "2024-09-30", "status": "in_progress"},
                    {"name": "Customer Portal Launch", "date": "2025-03-31", "status": "planned"}
                ],
                "risks": [
                    {"risk": "Technical complexity", "impact": "high", "mitigation": "Engage external consultants"},
                    {"risk": "Budget overruns", "impact": "medium", "mitigation": "Monthly budget reviews"}
                ],
                "description": "Comprehensive digital transformation initiative to modernize technology infrastructure and enhance digital capabilities."
            },
            {
                "initiative_code": "SI-2024-002",
                "initiative_name": "Market Expansion - Asia Pacific",
                "category": "growth",
                "status": "in_progress",
                "priority": "high",
                "owner": "CEO - Sarah Johnson",
                "champion": "VP International - Regional Lead",
                "start_date": date(2024, 2, 1),
                "target_completion_date": date(2025, 6, 30),
                "budget_allocated": 3000000.00,
                "budget_spent": 800000.00,
                "progress_percentage": 35,
                "objectives": [
                    "Establish operations in 3 APAC countries",
                    "Achieve $10M revenue in first year",
                    "Build local partnerships",
                    "Hire regional leadership team"
                ],
                "kpis": [
                    {"metric": "Countries Launched", "target": "3", "current": "1"},
                    {"metric": "Revenue Generated", "target": "$10M", "current": "$2M"},
                    {"metric": "Local Partnerships", "target": "5", "current": "2"}
                ],
                "milestones": [
                    {"name": "Singapore Office Opening", "date": "2024-04-15", "status": "completed"},
                    {"name": "Australia Market Entry", "date": "2024-08-01", "status": "in_progress"},
                    {"name": "Japan Partnership Launch", "date": "2025-01-15", "status": "planned"}
                ],
                "risks": [
                    {"risk": "Regulatory challenges", "impact": "high", "mitigation": "Engage local legal counsel"},
                    {"risk": "Cultural barriers", "impact": "medium", "mitigation": "Hire local talent"}
                ],
                "description": "Strategic expansion into Asia Pacific markets to drive international growth."
            },
            {
                "initiative_code": "SI-2024-003",
                "initiative_name": "Operational Excellence Program",
                "category": "efficiency",
                "status": "in_progress",
                "priority": "high",
                "owner": "COO - Jennifer Martinez",
                "champion": "VP Operations",
                "start_date": date(2024, 1, 15),
                "target_completion_date": date(2024, 12, 31),
                "budget_allocated": 2000000.00,
                "budget_spent": 750000.00,
                "progress_percentage": 45,
                "objectives": [
                    "Reduce operational costs by 15%",
                    "Improve process efficiency by 25%",
                    "Implement lean manufacturing principles",
                    "Enhance supply chain resilience"
                ],
                "kpis": [
                    {"metric": "Cost Reduction", "target": "15%", "current": "8%"},
                    {"metric": "Process Efficiency", "target": "25%", "current": "12%"},
                    {"metric": "Defect Rate", "target": "<2%", "current": "3.5%"}
                ],
                "milestones": [
                    {"name": "Lean Training Completion", "date": "2024-03-31", "status": "completed"},
                    {"name": "Process Optimization Phase 1", "date": "2024-06-30", "status": "completed"},
                    {"name": "Supply Chain Redesign", "date": "2024-10-31", "status": "in_progress"}
                ],
                "risks": [
                    {"risk": "Resistance to change", "impact": "medium", "mitigation": "Change management program"},
                    {"risk": "Supplier disruption", "impact": "high", "mitigation": "Diversify supplier base"}
                ],
                "description": "Initiative to drive operational excellence and cost efficiency across all operations."
            },
            {
                "initiative_code": "SI-2024-004",
                "initiative_name": "AI and Machine Learning Integration",
                "category": "innovation",
                "status": "in_progress",
                "priority": "high",
                "owner": "CTO - David Thompson",
                "champion": "Head of AI/ML",
                "start_date": date(2024, 3, 1),
                "target_completion_date": date(2025, 3, 31),
                "budget_allocated": 2500000.00,
                "budget_spent": 500000.00,
                "progress_percentage": 20,
                "objectives": [
                    "Implement AI-powered customer service",
                    "Deploy ML for demand forecasting",
                    "Automate quality control with computer vision",
                    "Build AI/ML competency center"
                ],
                "kpis": [
                    {"metric": "AI Use Cases Deployed", "target": "10", "current": "2"},
                    {"metric": "Customer Service Automation", "target": "60%", "current": "15%"},
                    {"metric": "Forecast Accuracy", "target": "90%", "current": "75%"}
                ],
                "milestones": [
                    {"name": "AI Platform Selection", "date": "2024-04-30", "status": "completed"},
                    {"name": "Chatbot Deployment", "date": "2024-07-31", "status": "in_progress"},
                    {"name": "ML Forecasting Go-Live", "date": "2024-11-30", "status": "planned"}
                ],
                "risks": [
                    {"risk": "Talent shortage", "impact": "high", "mitigation": "Partner with universities, offer competitive comp"},
                    {"risk": "Data quality issues", "impact": "medium", "mitigation": "Data cleansing initiative"}
                ],
                "description": "Strategic initiative to integrate AI and ML capabilities across business functions."
            },
            {
                "initiative_code": "SI-2024-005",
                "initiative_name": "Cybersecurity Enhancement Program",
                "category": "risk_management",
                "status": "in_progress",
                "priority": "critical",
                "owner": "CTO - David Thompson",
                "champion": "CISO",
                "start_date": date(2024, 1, 1),
                "target_completion_date": date(2024, 12, 31),
                "budget_allocated": 1500000.00,
                "budget_spent": 600000.00,
                "progress_percentage": 40,
                "objectives": [
                    "Achieve zero-trust architecture",
                    "Implement advanced threat detection",
                    "Enhance incident response capabilities",
                    "Achieve SOC 2 Type II certification"
                ],
                "kpis": [
                    {"metric": "Security Incidents", "target": "<5/year", "current": "12/year"},
                    {"metric": "Vulnerability Remediation", "target": "<24hrs", "current": "48hrs"},
                    {"metric": "Security Training", "target": "100%", "current": "85%"}
                ],
                "milestones": [
                    {"name": "Zero Trust Design", "date": "2024-03-31", "status": "completed"},
                    {"name": "SIEM Implementation", "date": "2024-06-30", "status": "completed"},
                    {"name": "SOC 2 Audit", "date": "2024-11-30", "status": "planned"}
                ],
                "risks": [
                    {"risk": "Evolving threat landscape", "impact": "critical", "mitigation": "Continuous monitoring and updates"},
                    {"risk": "Resource constraints", "impact": "medium", "mitigation": "Managed security services"}
                ],
                "description": "Comprehensive program to enhance cybersecurity posture and achieve compliance certifications."
            },
            {
                "initiative_code": "SI-2023-010",
                "initiative_name": "Product Line Diversification",
                "category": "growth",
                "status": "completed",
                "priority": "high",
                "owner": "CEO - Sarah Johnson",
                "champion": "VP Product",
                "start_date": date(2023, 1, 1),
                "target_completion_date": date(2023, 12, 31),
                "actual_completion_date": date(2023, 12, 15),
                "budget_allocated": 1800000.00,
                "budget_spent": 1650000.00,
                "progress_percentage": 100,
                "objectives": [
                    "Launch 3 new product lines",
                    "Achieve $5M revenue from new products",
                    "Expand addressable market by 30%"
                ],
                "kpis": [
                    {"metric": "New Products Launched", "target": "3", "current": "3"},
                    {"metric": "Revenue from New Products", "target": "$5M", "current": "$5.8M"},
                    {"metric": "Market Expansion", "target": "30%", "current": "32%"}
                ],
                "milestones": [
                    {"name": "Product A Launch", "date": "2023-04-30", "status": "completed"},
                    {"name": "Product B Launch", "date": "2023-08-31", "status": "completed"},
                    {"name": "Product C Launch", "date": "2023-11-30", "status": "completed"}
                ],
                "risks": [],
                "description": "Successfully completed initiative to diversify product portfolio and expand market reach."
            },
            {
                "initiative_code": "SI-2024-006",
                "initiative_name": "Sustainability and ESG Program",
                "category": "other",
                "status": "in_progress",
                "priority": "medium",
                "owner": "CEO - Sarah Johnson",
                "champion": "Sustainability Director",
                "start_date": date(2024, 2, 1),
                "target_completion_date": date(2026, 12, 31),
                "budget_allocated": 3500000.00,
                "budget_spent": 400000.00,
                "progress_percentage": 15,
                "objectives": [
                    "Achieve carbon neutrality by 2026",
                    "Implement circular economy practices",
                    "Publish annual ESG report",
                    "Achieve B Corp certification"
                ],
                "kpis": [
                    {"metric": "Carbon Emissions Reduction", "target": "100%", "current": "10%"},
                    {"metric": "Renewable Energy Usage", "target": "75%", "current": "15%"},
                    {"metric": "Waste Reduction", "target": "50%", "current": "12%"}
                ],
                "milestones": [
                    {"name": "ESG Baseline Assessment", "date": "2024-04-30", "status": "in_progress"},
                    {"name": "Solar Panel Installation", "date": "2024-09-30", "status": "planned"},
                    {"name": "First ESG Report", "date": "2025-01-31", "status": "planned"}
                ],
                "risks": [
                    {"risk": "Technology costs", "impact": "medium", "mitigation": "Explore government incentives"},
                    {"risk": "Supply chain compliance", "impact": "high", "mitigation": "Vendor ESG assessments"}
                ],
                "description": "Long-term initiative to enhance environmental, social, and governance practices."
            },
            {
                "initiative_code": "SI-2024-007",
                "initiative_name": "Customer Experience Transformation",
                "category": "transformation",
                "status": "approved",
                "priority": "high",
                "owner": "CMO - Robert Williams",
                "champion": "VP Customer Experience",
                "start_date": date(2024, 5, 1),
                "target_completion_date": date(2025, 4, 30),
                "budget_allocated": 1200000.00,
                "budget_spent": 0.00,
                "progress_percentage": 0,
                "objectives": [
                    "Improve NPS score from 45 to 70",
                    "Reduce customer churn by 25%",
                    "Implement omnichannel customer service",
                    "Launch customer loyalty program"
                ],
                "kpis": [
                    {"metric": "NPS Score", "target": "70", "current": "45"},
                    {"metric": "Customer Churn", "target": "-25%", "current": "baseline"},
                    {"metric": "Customer Satisfaction", "target": "90%", "current": "75%"}
                ],
                "milestones": [
                    {"name": "CX Strategy Development", "date": "2024-06-30", "status": "planned"},
                    {"name": "Omnichannel Platform Launch", "date": "2024-10-31", "status": "planned"},
                    {"name": "Loyalty Program Launch", "date": "2025-02-28", "status": "planned"}
                ],
                "risks": [
                    {"risk": "Integration complexity", "impact": "medium", "mitigation": "Phased rollout approach"},
                    {"risk": "User adoption", "impact": "medium", "mitigation": "Comprehensive training program"}
                ],
                "description": "Initiative to transform customer experience and drive customer satisfaction and loyalty."
            },
            {
                "initiative_code": "SI-2024-008",
                "initiative_name": "Workforce Development and Upskilling",
                "category": "other",
                "status": "in_progress",
                "priority": "medium",
                "owner": "CHRO - Lisa Anderson",
                "champion": "Head of Learning & Development",
                "start_date": date(2024, 1, 15),
                "target_completion_date": date(2025, 12, 31),
                "budget_allocated": 800000.00,
                "budget_spent": 250000.00,
                "progress_percentage": 30,
                "objectives": [
                    "Train 100% of employees in digital skills",
                    "Implement career development framework",
                    "Reduce skill gaps by 50%",
                    "Improve internal mobility by 40%"
                ],
                "kpis": [
                    {"metric": "Training Completion", "target": "100%", "current": "35%"},
                    {"metric": "Skill Gap Reduction", "target": "50%", "current": "15%"},
                    {"metric": "Internal Promotions", "target": "+40%", "current": "+10%"}
                ],
                "milestones": [
                    {"name": "Learning Platform Launch", "date": "2024-03-31", "status": "completed"},
                    {"name": "Core Skills Program Rollout", "date": "2024-08-31", "status": "in_progress"},
                    {"name": "Leadership Development Program", "date": "2025-03-31", "status": "planned"}
                ],
                "risks": [
                    {"risk": "Low engagement", "impact": "medium", "mitigation": "Gamification and incentives"},
                    {"risk": "Budget constraints", "impact": "low", "mitigation": "Prioritize critical skills"}
                ],
                "description": "Initiative to develop workforce capabilities and prepare employees for future skill requirements."
            },
            {
                "initiative_code": "SI-2024-009",
                "initiative_name": "M&A Integration - TechCo Acquisition",
                "category": "growth",
                "status": "on_hold",
                "priority": "high",
                "owner": "CFO - Michael Chen",
                "champion": "Integration PMO Lead",
                "start_date": date(2024, 3, 1),
                "target_completion_date": date(2024, 12, 31),
                "budget_allocated": 5000000.00,
                "budget_spent": 1000000.00,
                "progress_percentage": 20,
                "objectives": [
                    "Complete post-merger integration",
                    "Realize $3M in synergies",
                    "Retain 90% of key talent",
                    "Integrate IT systems within 9 months"
                ],
                "kpis": [
                    {"metric": "Integration Completion", "target": "100%", "current": "20%"},
                    {"metric": "Synergies Realized", "target": "$3M", "current": "$500K"},
                    {"metric": "Key Talent Retention", "target": "90%", "current": "85%"}
                ],
                "milestones": [
                    {"name": "Day 1 Readiness", "date": "2024-03-15", "status": "completed"},
                    {"name": "HR Integration", "date": "2024-06-30", "status": "on_hold"},
                    {"name": "IT Systems Integration", "date": "2024-11-30", "status": "planned"}
                ],
                "risks": [
                    {"risk": "Cultural integration challenges", "impact": "high", "mitigation": "Change management program"},
                    {"risk": "Regulatory approvals", "impact": "high", "mitigation": "On hold pending approvals"}
                ],
                "description": "Integration of recently acquired technology company - currently on hold pending regulatory approvals."
            },
            {
                "initiative_code": "SI-2024-010",
                "initiative_name": "Next-Gen Product Platform Development",
                "category": "innovation",
                "status": "proposed",
                "priority": "medium",
                "owner": "CTO - David Thompson",
                "champion": "VP Engineering",
                "start_date": date(2024, 7, 1),
                "target_completion_date": date(2026, 6, 30),
                "budget_allocated": 4000000.00,
                "budget_spent": 0.00,
                "progress_percentage": 0,
                "objectives": [
                    "Develop next-generation product platform",
                    "Incorporate IoT and edge computing",
                    "Achieve 50% faster time-to-market",
                    "Enable modular product architecture"
                ],
                "kpis": [
                    {"metric": "Platform Development", "target": "100%", "current": "0%"},
                    {"metric": "Time to Market", "target": "-50%", "current": "baseline"},
                    {"metric": "Product Modularity", "target": "80%", "current": "20%"}
                ],
                "milestones": [
                    {"name": "Platform Architecture Design", "date": "2024-09-30", "status": "planned"},
                    {"name": "Alpha Release", "date": "2025-06-30", "status": "planned"},
                    {"name": "Commercial Launch", "date": "2026-06-30", "status": "planned"}
                ],
                "risks": [
                    {"risk": "Technical feasibility", "impact": "high", "mitigation": "POC and prototyping"},
                    {"risk": "Market timing", "impact": "medium", "mitigation": "Continuous market research"}
                ],
                "description": "Proposed initiative to develop next-generation product platform with advanced IoT capabilities."
            },
            {
                "initiative_code": "SI-2023-005",
                "initiative_name": "Legacy System Decommissioning",
                "category": "efficiency",
                "status": "cancelled",
                "priority": "low",
                "owner": "CTO - David Thompson",
                "champion": "IT Operations Lead",
                "start_date": date(2023, 6, 1),
                "target_completion_date": date(2024, 3, 31),
                "budget_allocated": 500000.00,
                "budget_spent": 150000.00,
                "progress_percentage": 30,
                "objectives": [
                    "Decommission 5 legacy systems",
                    "Reduce IT maintenance costs by $200K/year",
                    "Migrate data to modern platforms"
                ],
                "kpis": [
                    {"metric": "Systems Decommissioned", "target": "5", "current": "1"},
                    {"metric": "Cost Savings", "target": "$200K", "current": "$40K"}
                ],
                "milestones": [
                    {"name": "Legacy System Assessment", "date": "2023-08-31", "status": "completed"},
                    {"name": "Data Migration Phase 1", "date": "2023-12-31", "status": "completed"}
                ],
                "risks": [],
                "description": "Cancelled initiative - merged into Digital Transformation Program (SI-2024-001)."
            }
        ]

        for initiative in initiatives:
            # Add optional fields if not present
            if 'actual_completion_date' not in initiative:
                initiative['actual_completion_date'] = None

            initiative_data = {
                **initiative,
                'objectives': json.dumps(initiative['objectives']),
                'kpis': json.dumps(initiative['kpis']),
                'milestones': json.dumps(initiative['milestones']),
                'risks': json.dumps(initiative['risks'])
            }
            query = text("""
                INSERT INTO strategic_initiatives (
                    id, initiative_code, initiative_name, category, status, priority,
                    owner, champion, start_date, target_completion_date, actual_completion_date,
                    budget_allocated, budget_spent, progress_percentage, objectives,
                    kpis, milestones, risks, description
                ) VALUES (
                    gen_random_uuid(), :initiative_code, :initiative_name, :category, :status, :priority,
                    :owner, :champion, :start_date, :target_completion_date, :actual_completion_date,
                    :budget_allocated, :budget_spent, :progress_percentage, CAST(:objectives AS jsonb),
                    CAST(:kpis AS jsonb), CAST(:milestones AS jsonb), CAST(:risks AS jsonb), :description
                )
                ON CONFLICT (initiative_code) DO NOTHING
            """)
            await session.execute(query, initiative_data)

        await session.commit()
        print("Strategic initiatives seeded successfully!")


async def main():
    """Main function to run all seed operations."""
    print("Starting database seeding...")
    print("-" * 50)

    try:
        await seed_executive_board()
        await seed_legal_cases()
        await seed_compliance_policies()
        await seed_compliance_audits()
        await seed_strategic_initiatives()

        print("-" * 50)
        print("Database seeding completed successfully!")
        print("\nSummary:")
        print("- 10 Executive Board Members (CEO, C-Suite, Board Members)")
        print("- 15 Legal Cases (various types and statuses)")
        print("- 15 Compliance Policies (covering different categories)")
        print("- 10 Compliance Audits (mix of completed and in-progress)")
        print("- 12 Strategic Initiatives (mix of statuses and priorities)")

    except Exception as e:
        print(f"\nError during seeding: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
