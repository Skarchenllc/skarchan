import asyncio
from datetime import datetime, date, timedelta
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models import (
    Customer, CustomerContact,
    Opportunity, OpportunityActivity,
    Quote, Order
)


async def seed_customers(session: AsyncSession):
    """Create sample customers"""
    result = await session.execute(select(Customer).limit(1))
    if result.scalar_one_or_none():
        print("⊙ Customers already exist, loading existing data...")
        result = await session.execute(select(Customer))
        return result.scalars().all()

    customers = [
        Customer(
            customer_code="CUST-001",
            company_name="TechVision Solutions Inc",
            customer_type="active",
            primary_contact_name="Jennifer Martinez",
            primary_email="j.martinez@techvision.com",
            primary_phone="+1-555-1001",
            billing_address="1234 Innovation Drive",
            shipping_address="1234 Innovation Drive",
            city="San Francisco",
            state="CA",
            country="USA",
            postal_code="94105",
            industry="Technology",
            company_size="51-200",
            annual_revenue=Decimal("5000000.00"),
            website="https://techvision.com",
            customer_since=datetime.utcnow() - timedelta(days=730),
            total_lifetime_value=Decimal("450000.00"),
            total_orders=12,
            payment_terms="net_30",
            credit_limit=Decimal("100000.00"),
            assigned_sales_rep="John Smith",
            account_manager="Sarah Johnson",
            tags=["enterprise", "tech", "recurring"],
            is_active=True,
            notes="Key strategic account. Excellent payment history.",
        ),
        Customer(
            customer_code="CUST-002",
            company_name="Global Retail Group",
            customer_type="active",
            primary_contact_name="Michael Chen",
            primary_email="mchen@globalretail.com",
            primary_phone="+1-555-1002",
            billing_address="5678 Commerce Boulevard",
            shipping_address="5678 Commerce Boulevard",
            city="Chicago",
            state="IL",
            country="USA",
            postal_code="60601",
            industry="Retail",
            company_size="201-500",
            annual_revenue=Decimal("12000000.00"),
            website="https://globalretail.com",
            customer_since=datetime.utcnow() - timedelta(days=545),
            total_lifetime_value=Decimal("280000.00"),
            total_orders=8,
            payment_terms="net_45",
            credit_limit=Decimal("150000.00"),
            assigned_sales_rep="Emily Davis",
            account_manager="Robert Wilson",
            tags=["retail", "mid-market"],
            is_active=True,
            notes="Growing account. Seasonal purchasing patterns.",
        ),
        Customer(
            customer_code="CUST-003",
            company_name="StartupX Innovations",
            customer_type="prospect",
            primary_contact_name="Alex Thompson",
            primary_email="alex@startupx.io",
            primary_phone="+1-555-1003",
            billing_address="999 Startup Way",
            shipping_address="999 Startup Way",
            city="Austin",
            state="TX",
            country="USA",
            postal_code="78701",
            industry="Software",
            company_size="11-50",
            annual_revenue=Decimal("1200000.00"),
            website="https://startupx.io",
            customer_since=None,
            total_lifetime_value=Decimal("0.00"),
            total_orders=0,
            payment_terms="prepaid",
            credit_limit=Decimal("25000.00"),
            assigned_sales_rep="John Smith",
            account_manager="Sarah Johnson",
            tags=["prospect", "startup", "high-growth"],
            is_active=True,
            notes="High potential startup. Currently in evaluation phase.",
        ),
        Customer(
            customer_code="CUST-004",
            company_name="Manufacturing Co Ltd",
            customer_type="active",
            primary_contact_name="David Williams",
            primary_email="dwilliams@mfgco.com",
            primary_phone="+1-555-1004",
            billing_address="4321 Industrial Parkway",
            shipping_address="4321 Industrial Parkway",
            city="Detroit",
            state="MI",
            country="USA",
            postal_code="48201",
            industry="Manufacturing",
            company_size="500+",
            annual_revenue=Decimal("25000000.00"),
            website="https://mfgco.com",
            customer_since=datetime.utcnow() - timedelta(days=1095),
            total_lifetime_value=Decimal("820000.00"),
            total_orders=24,
            payment_terms="net_60",
            credit_limit=Decimal("250000.00"),
            assigned_sales_rep="Emily Davis",
            account_manager="Robert Wilson",
            tags=["enterprise", "manufacturing", "long-term"],
            is_active=True,
            notes="Largest customer by revenue. Quarterly review meetings.",
        ),
        Customer(
            customer_code="CUST-005",
            company_name="Healthcare Solutions Inc",
            customer_type="active",
            primary_contact_name="Lisa Anderson",
            primary_email="landerson@healthsolutions.com",
            primary_phone="+1-555-1005",
            billing_address="7890 Medical Center Drive",
            shipping_address="7890 Medical Center Drive",
            city="Boston",
            state="MA",
            country="USA",
            postal_code="02101",
            industry="Healthcare",
            company_size="201-500",
            annual_revenue=Decimal("18000000.00"),
            website="https://healthsolutions.com",
            customer_since=datetime.utcnow() - timedelta(days=365),
            total_lifetime_value=Decimal("195000.00"),
            total_orders=6,
            payment_terms="net_30",
            credit_limit=Decimal("120000.00"),
            assigned_sales_rep="John Smith",
            account_manager="Sarah Johnson",
            tags=["healthcare", "growing", "compliance"],
            is_active=True,
            notes="Requires strict compliance documentation. Monthly check-ins.",
        ),
    ]

    session.add_all(customers)
    await session.commit()
    print(f"✓ Created {len(customers)} customers")
    return customers


async def seed_customer_contacts(session: AsyncSession, customers):
    """Create sample customer contacts"""
    result = await session.execute(select(CustomerContact).limit(1))
    if result.scalar_one_or_none():
        print("⊙ Customer contacts already exist")
        return

    contacts = [
        # TechVision Solutions contacts
        CustomerContact(
            customer_id=customers[0].id,
            first_name="Jennifer",
            last_name="Martinez",
            job_title="VP of Procurement",
            email="j.martinez@techvision.com",
            phone="+1-555-1001",
            mobile="+1-555-2001",
            is_primary=True,
            is_billing=True,
            is_technical=False,
        ),
        CustomerContact(
            customer_id=customers[0].id,
            first_name="Tom",
            last_name="Richardson",
            job_title="IT Manager",
            email="t.richardson@techvision.com",
            phone="+1-555-1011",
            mobile="+1-555-2011",
            is_primary=False,
            is_billing=False,
            is_technical=True,
        ),
        # Global Retail contacts
        CustomerContact(
            customer_id=customers[1].id,
            first_name="Michael",
            last_name="Chen",
            job_title="Purchasing Director",
            email="mchen@globalretail.com",
            phone="+1-555-1002",
            mobile="+1-555-2002",
            is_primary=True,
            is_billing=True,
            is_technical=False,
        ),
        # StartupX contacts
        CustomerContact(
            customer_id=customers[2].id,
            first_name="Alex",
            last_name="Thompson",
            job_title="CEO",
            email="alex@startupx.io",
            phone="+1-555-1003",
            mobile="+1-555-2003",
            is_primary=True,
            is_billing=True,
            is_technical=True,
        ),
    ]

    session.add_all(contacts)
    await session.commit()
    print(f"✓ Created {len(contacts)} customer contacts")


async def seed_opportunities(session: AsyncSession, customers):
    """Create sample opportunities"""
    result = await session.execute(select(Opportunity).limit(1))
    if result.scalar_one_or_none():
        print("⊙ Opportunities already exist, loading existing data...")
        result = await session.execute(select(Opportunity))
        return result.scalars().all()

    opportunities = [
        Opportunity(
            opportunity_name="TechVision Q2 Expansion",
            opportunity_code="OPP-2024-001",
            customer_id=customers[0].id,
            stage="proposal",
            probability=75,
            amount=Decimal("125000.00"),
            expected_close_date=date.today() + timedelta(days=30),
            source="existing_customer",
            opportunity_type="upsell",
            assigned_to="John Smith",
            next_step="Follow up on proposal review meeting",
            description="Expansion of existing services to include premium support package",
            competitors=["CompetitorA", "CompetitorB"],
            products=[
                {"product_name": "Premium Support Package", "quantity": 1, "price": "85000.00"},
                {"product_name": "Training Services", "quantity": 5, "price": "8000.00"}
            ],
            is_won="open",
            notes="Strong relationship. Decision expected by end of month.",
        ),
        Opportunity(
            opportunity_name="Global Retail System Integration",
            opportunity_code="OPP-2024-002",
            customer_id=customers[1].id,
            stage="negotiation",
            probability=85,
            amount=Decimal("250000.00"),
            expected_close_date=date.today() + timedelta(days=15),
            source="existing_customer",
            opportunity_type="new_business",
            assigned_to="Emily Davis",
            next_step="Contract review with legal team",
            description="Large-scale system integration project",
            competitors=["CompetitorC"],
            products=[
                {"product_name": "Enterprise Integration Platform", "quantity": 1, "price": "180000.00"},
                {"product_name": "Implementation Services", "quantity": 1, "price": "70000.00"}
            ],
            is_won="open",
            notes="Final negotiations on payment terms. Very likely to close.",
        ),
        Opportunity(
            opportunity_name="StartupX Initial Deployment",
            opportunity_code="OPP-2024-003",
            customer_id=customers[2].id,
            stage="qualification",
            probability=40,
            amount=Decimal("45000.00"),
            expected_close_date=date.today() + timedelta(days=60),
            source="inbound",
            opportunity_type="new_business",
            assigned_to="John Smith",
            next_step="Schedule technical demo",
            description="Initial product deployment for startup",
            competitors=["CompetitorA", "CompetitorD"],
            products=[
                {"product_name": "Starter Package", "quantity": 1, "price": "35000.00"},
                {"product_name": "Setup Services", "quantity": 1, "price": "10000.00"}
            ],
            is_won="open",
            notes="Budget constraints. May need to offer startup discount.",
        ),
        Opportunity(
            opportunity_name="Manufacturing Co Annual Renewal",
            opportunity_code="OPP-2024-004",
            customer_id=customers[3].id,
            stage="closed_won",
            probability=100,
            amount=Decimal("380000.00"),
            expected_close_date=date.today() - timedelta(days=10),
            actual_close_date=date.today() - timedelta(days=10),
            source="existing_customer",
            opportunity_type="renewal",
            assigned_to="Emily Davis",
            next_step="Process order and schedule kickoff",
            description="Annual contract renewal with expanded scope",
            competitors=[],
            products=[
                {"product_name": "Enterprise License", "quantity": 1, "price": "300000.00"},
                {"product_name": "Premium Support", "quantity": 1, "price": "80000.00"}
            ],
            is_won="won",
            notes="Smooth renewal. Customer very satisfied.",
        ),
        Opportunity(
            opportunity_name="Healthcare Solutions Pilot",
            opportunity_code="OPP-2024-005",
            customer_id=customers[4].id,
            stage="prospecting",
            probability=25,
            amount=Decimal("75000.00"),
            expected_close_date=date.today() + timedelta(days=90),
            source="referral",
            opportunity_type="new_business",
            assigned_to="John Smith",
            next_step="Initial discovery call scheduled",
            description="Pilot program for healthcare compliance solution",
            competitors=["CompetitorB", "CompetitorE"],
            products=[
                {"product_name": "Healthcare Compliance Suite", "quantity": 1, "price": "60000.00"},
                {"product_name": "Consulting Services", "quantity": 1, "price": "15000.00"}
            ],
            is_won="open",
            notes="Early stage. Need to understand compliance requirements better.",
        ),
    ]

    session.add_all(opportunities)
    await session.commit()
    print(f"✓ Created {len(opportunities)} opportunities")
    return opportunities


async def seed_opportunity_activities(session: AsyncSession, opportunities):
    """Create sample opportunity activities"""
    result = await session.execute(select(OpportunityActivity).limit(1))
    if result.scalar_one_or_none():
        print("⊙ Opportunity activities already exist")
        return

    activities = [
        # Activities for TechVision opportunity
        OpportunityActivity(
            opportunity_id=opportunities[0].id,
            activity_type="call",
            activity_date=datetime.utcnow() - timedelta(days=5),
            subject="Proposal Discussion",
            description="Discussed proposal details and answered questions about premium support",
            outcome="positive",
            created_by="John Smith",
        ),
        OpportunityActivity(
            opportunity_id=opportunities[0].id,
            activity_type="meeting",
            activity_date=datetime.utcnow() - timedelta(days=2),
            subject="Executive Review Meeting",
            description="Presented proposal to executive team",
            outcome="pending_decision",
            created_by="John Smith",
        ),
        # Activities for Global Retail opportunity
        OpportunityActivity(
            opportunity_id=opportunities[1].id,
            activity_type="meeting",
            activity_date=datetime.utcnow() - timedelta(days=7),
            subject="Technical Workshop",
            description="Conducted technical workshop on integration capabilities",
            outcome="positive",
            created_by="Emily Davis",
        ),
        OpportunityActivity(
            opportunity_id=opportunities[1].id,
            activity_type="email",
            activity_date=datetime.utcnow() - timedelta(days=3),
            subject="Contract Terms Negotiation",
            description="Sent revised contract with updated payment terms",
            outcome="awaiting_response",
            created_by="Emily Davis",
        ),
    ]

    session.add_all(activities)
    await session.commit()
    print(f"✓ Created {len(activities)} opportunity activities")


async def seed_quotes(session: AsyncSession, customers, opportunities):
    """Create sample quotes"""
    result = await session.execute(select(Quote).limit(1))
    if result.scalar_one_or_none():
        print("⊙ Quotes already exist, loading existing data...")
        result = await session.execute(select(Quote))
        return result.scalars().all()

    quotes = [
        Quote(
            quote_number="QT-2024-001",
            quote_name="TechVision Q2 Expansion Proposal",
            customer_id=customers[0].id,
            opportunity_id=opportunities[0].id,
            status="sent",
            quote_date=date.today() - timedelta(days=7),
            valid_until=date.today() + timedelta(days=23),
            subtotal=Decimal("125000.00"),
            discount_amount=Decimal("6250.00"),
            discount_percentage=Decimal("5.00"),
            tax_amount=Decimal("9506.25"),
            shipping_amount=Decimal("0.00"),
            total_amount=Decimal("128256.25"),
            line_items=[
                {
                    "product": "Premium Support Package",
                    "description": "24/7 premium support with 1-hour response time",
                    "quantity": 1,
                    "unit_price": "85000.00",
                    "total": "85000.00"
                },
                {
                    "product": "Training Services",
                    "description": "On-site training sessions (5 days)",
                    "quantity": 5,
                    "unit_price": "8000.00",
                    "total": "40000.00"
                }
            ],
            payment_terms="net_30",
            delivery_terms="Services begin within 30 days of contract signing",
            terms_and_conditions="Standard terms and conditions apply. See attached document.",
            sent_date=datetime.utcnow() - timedelta(days=7),
            prepared_by="John Smith",
            approved_by="Sarah Johnson",
            notes="Offered 5% discount for annual commitment",
        ),
        Quote(
            quote_number="QT-2024-002",
            quote_name="Global Retail Integration Quote",
            customer_id=customers[1].id,
            opportunity_id=opportunities[1].id,
            status="accepted",
            quote_date=date.today() - timedelta(days=14),
            valid_until=date.today() + timedelta(days=16),
            subtotal=Decimal("250000.00"),
            discount_amount=Decimal("0.00"),
            discount_percentage=Decimal("0.00"),
            tax_amount=Decimal("20000.00"),
            shipping_amount=Decimal("0.00"),
            total_amount=Decimal("270000.00"),
            line_items=[
                {
                    "product": "Enterprise Integration Platform",
                    "description": "Full enterprise integration solution",
                    "quantity": 1,
                    "unit_price": "180000.00",
                    "total": "180000.00"
                },
                {
                    "product": "Implementation Services",
                    "description": "Complete implementation and migration",
                    "quantity": 1,
                    "unit_price": "70000.00",
                    "total": "70000.00"
                }
            ],
            payment_terms="net_45",
            delivery_terms="Implementation to be completed within 90 days",
            terms_and_conditions="Enterprise agreement terms apply",
            sent_date=datetime.utcnow() - timedelta(days=14),
            accepted_date=datetime.utcnow() - timedelta(days=1),
            prepared_by="Emily Davis",
            approved_by="Robert Wilson",
            notes="Large deal. Payment in 3 installments agreed.",
        ),
        Quote(
            quote_number="QT-2024-003",
            quote_name="Manufacturing Co Renewal Quote",
            customer_id=customers[3].id,
            opportunity_id=opportunities[3].id,
            status="accepted",
            quote_date=date.today() - timedelta(days=25),
            valid_until=date.today() - timedelta(days=5),
            subtotal=Decimal("380000.00"),
            discount_amount=Decimal("19000.00"),
            discount_percentage=Decimal("5.00"),
            tax_amount=Decimal("28880.00"),
            shipping_amount=Decimal("0.00"),
            total_amount=Decimal("389880.00"),
            line_items=[
                {
                    "product": "Enterprise License",
                    "description": "Annual enterprise license renewal",
                    "quantity": 1,
                    "unit_price": "300000.00",
                    "total": "300000.00"
                },
                {
                    "product": "Premium Support",
                    "description": "Premium support package",
                    "quantity": 1,
                    "unit_price": "80000.00",
                    "total": "80000.00"
                }
            ],
            payment_terms="net_60",
            delivery_terms="Services continue uninterrupted",
            terms_and_conditions="Standard renewal terms",
            sent_date=datetime.utcnow() - timedelta(days=25),
            accepted_date=datetime.utcnow() - timedelta(days=10),
            prepared_by="Emily Davis",
            approved_by="Robert Wilson",
            notes="Loyal customer discount applied",
        ),
        Quote(
            quote_number="QT-2024-004",
            quote_name="StartupX Starter Package",
            customer_id=customers[2].id,
            opportunity_id=opportunities[2].id,
            status="draft",
            quote_date=date.today(),
            valid_until=date.today() + timedelta(days=30),
            subtotal=Decimal("45000.00"),
            discount_amount=Decimal("4500.00"),
            discount_percentage=Decimal("10.00"),
            tax_amount=Decimal("3240.00"),
            shipping_amount=Decimal("0.00"),
            total_amount=Decimal("43740.00"),
            line_items=[
                {
                    "product": "Starter Package",
                    "description": "Starter package with basic features",
                    "quantity": 1,
                    "unit_price": "35000.00",
                    "total": "35000.00"
                },
                {
                    "product": "Setup Services",
                    "description": "Initial setup and configuration",
                    "quantity": 1,
                    "unit_price": "10000.00",
                    "total": "10000.00"
                }
            ],
            payment_terms="prepaid",
            delivery_terms="Setup begins within 14 days of payment",
            terms_and_conditions="Startup terms and conditions",
            prepared_by="John Smith",
            notes="10% startup discount offered",
        ),
    ]

    session.add_all(quotes)
    await session.commit()
    print(f"✓ Created {len(quotes)} quotes")
    return quotes


async def seed_orders(session: AsyncSession, customers, quotes):
    """Create sample orders"""
    result = await session.execute(select(Order).limit(1))
    if result.scalar_one_or_none():
        print("⊙ Orders already exist")
        return

    orders = [
        Order(
            order_number="ORD-2024-001",
            customer_id=customers[1].id,
            quote_id=quotes[1].id,
            status="confirmed",
            order_date=date.today() - timedelta(days=1),
            expected_delivery_date=date.today() + timedelta(days=89),
            subtotal=Decimal("250000.00"),
            discount_amount=Decimal("0.00"),
            tax_amount=Decimal("20000.00"),
            shipping_amount=Decimal("0.00"),
            total_amount=Decimal("270000.00"),
            paid_amount=Decimal("90000.00"),
            balance_due=Decimal("180000.00"),
            line_items=[
                {
                    "product": "Enterprise Integration Platform",
                    "description": "Full enterprise integration solution",
                    "quantity": 1,
                    "unit_price": "180000.00",
                    "total": "180000.00"
                },
                {
                    "product": "Implementation Services",
                    "description": "Complete implementation and migration",
                    "quantity": 1,
                    "unit_price": "70000.00",
                    "total": "70000.00"
                }
            ],
            shipping_address="5678 Commerce Boulevard, Chicago, IL 60601",
            shipping_method="Professional Services - On-site",
            payment_status="partial",
            payment_method="Wire Transfer",
            sales_rep="Emily Davis",
            notes="First payment received. Implementation kicked off.",
            created_by="Emily Davis",
        ),
        Order(
            order_number="ORD-2024-002",
            customer_id=customers[3].id,
            quote_id=quotes[2].id,
            status="processing",
            order_date=date.today() - timedelta(days=10),
            expected_delivery_date=date.today() + timedelta(days=1),
            subtotal=Decimal("380000.00"),
            discount_amount=Decimal("19000.00"),
            tax_amount=Decimal("28880.00"),
            shipping_amount=Decimal("0.00"),
            total_amount=Decimal("389880.00"),
            paid_amount=Decimal("389880.00"),
            balance_due=Decimal("0.00"),
            line_items=[
                {
                    "product": "Enterprise License",
                    "description": "Annual enterprise license renewal",
                    "quantity": 1,
                    "unit_price": "300000.00",
                    "total": "300000.00"
                },
                {
                    "product": "Premium Support",
                    "description": "Premium support package",
                    "quantity": 1,
                    "unit_price": "80000.00",
                    "total": "80000.00"
                }
            ],
            shipping_address="4321 Industrial Parkway, Detroit, MI 48201",
            shipping_method="Digital Delivery",
            payment_status="paid",
            payment_method="ACH",
            sales_rep="Emily Davis",
            notes="Renewal processed. Access extended for another year.",
            created_by="Emily Davis",
        ),
    ]

    session.add_all(orders)
    await session.commit()
    print(f"✓ Created {len(orders)} orders")


async def main():
    print("\n🌱 Seeding Sales module data...\n")

    async with AsyncSessionLocal() as session:
        try:
            # Seed in order due to dependencies
            customers = await seed_customers(session)
            await seed_customer_contacts(session, customers)
            opportunities = await seed_opportunities(session, customers)
            await seed_opportunity_activities(session, opportunities)
            quotes = await seed_quotes(session, customers, opportunities)
            await seed_orders(session, customers, quotes)

            print("\n✅ Sales module seeding completed successfully!\n")
            print("Summary:")
            print(f"  - {len(customers)} customers")
            print(f"  - 4 customer contacts")
            print(f"  - {len(opportunities)} opportunities")
            print(f"  - 4 opportunity activities")
            print(f"  - 4 quotes")
            print(f"  - 2 orders")
            print("\n")

        except Exception as e:
            print(f"\n❌ Error during seeding: {str(e)}\n")
            raise


if __name__ == "__main__":
    asyncio.run(main())
