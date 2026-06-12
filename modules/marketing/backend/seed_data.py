import asyncio
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models import (
    Campaign, CampaignActivity,
    Lead, LeadActivity,
    Content, EmailTemplate,
    CampaignMetric, WebsiteAnalytic
)


async def seed_campaigns(session: AsyncSession):
    """Create sample campaigns"""
    result = await session.execute(select(Campaign).limit(1))
    if result.scalar_one_or_none():
        print("⊙ Campaigns already exist, loading existing data...")
        result = await session.execute(select(Campaign))
        return result.scalars().all()

    campaigns = [
        Campaign(
            campaign_name="Summer Product Launch 2024",
            campaign_code="SPL2024",
            campaign_type="email",
            status="active",
            start_date=date.today() - timedelta(days=30),
            end_date=date.today() + timedelta(days=30),
            description="Email campaign for new product launch",
            target_audience="Existing customers",
            goals="Generate 500 leads and achieve 50 conversions",
            budget=10000.00,
            budget_spent=3500.00,
            impressions=15000,
            clicks=1200,
            conversions=45,
            leads_generated=380,
        ),
        Campaign(
            campaign_name="Social Media Brand Awareness",
            campaign_code="SMBA2024",
            campaign_type="social",
            status="active",
            start_date=date.today() - timedelta(days=15),
            end_date=date.today() + timedelta(days=45),
            description="Social media campaign across platforms",
            target_audience="Young professionals 25-40",
            goals="Increase brand awareness by 30%",
            budget=15000.00,
            budget_spent=5200.00,
            impressions=45000,
            clicks=3200,
            conversions=28,
            leads_generated=210,
        ),
        Campaign(
            campaign_name="Google Ads Q2 Campaign",
            campaign_code="GAQ2-2024",
            campaign_type="ads",
            status="active",
            start_date=date.today() - timedelta(days=60),
            end_date=date.today() + timedelta(days=30),
            description="Paid search advertising campaign",
            target_audience="Business owners and decision makers",
            goals="Drive 200 qualified leads",
            budget=20000.00,
            budget_spent=12000.00,
            impressions=80000,
            clicks=4800,
            conversions=62,
            leads_generated=195,
        ),
        Campaign(
            campaign_name="Content Marketing Initiative",
            campaign_code="CMI2024",
            campaign_type="content",
            status="draft",
            start_date=date.today() + timedelta(days=7),
            end_date=date.today() + timedelta(days=97),
            description="Blog posts and educational content",
            target_audience="Industry professionals",
            goals="Publish 20 blog posts, achieve 10k views",
            budget=8000.00,
            budget_spent=0.00,
            impressions=0,
            clicks=0,
            conversions=0,
            leads_generated=0,
        ),
    ]

    session.add_all(campaigns)
    await session.commit()
    print(f"✓ Created {len(campaigns)} campaigns")
    return campaigns


async def seed_leads(session: AsyncSession, campaigns):
    """Create sample leads"""
    result = await session.execute(select(Lead).limit(1))
    if result.scalar_one_or_none():
        print("⊙ Leads already exist, loading existing data...")
        result = await session.execute(select(Lead))
        return result.scalars().all()

    leads = [
        Lead(
            first_name="John",
            last_name="Smith",
            email="john.smith@techcorp.com",
            phone="+1-555-0101",
            company="TechCorp Solutions",
            job_title="Marketing Director",
            source="website",
            status="qualified",
            score=75,
            campaign_id=campaigns[0].id,
            city="San Francisco",
            state="CA",
            country="USA",
        ),
        Lead(
            first_name="Emily",
            last_name="Johnson",
            email="emily.j@innovate.io",
            phone="+1-555-0202",
            company="Innovate Inc",
            job_title="CEO",
            source="social",
            status="new",
            score=60,
            campaign_id=campaigns[1].id,
            city="New York",
            state="NY",
            country="USA",
        ),
        Lead(
            first_name="Michael",
            last_name="Chen",
            email="mchen@startupx.com",
            phone="+1-555-0303",
            company="StartupX",
            job_title="Product Manager",
            source="paid_ad",
            status="contacted",
            score=85,
            campaign_id=campaigns[2].id,
            city="Austin",
            state="TX",
            country="USA",
        ),
        Lead(
            first_name="Sarah",
            last_name="Williams",
            email="sarah.williams@enterprise.com",
            phone="+1-555-0404",
            company="Enterprise Group",
            job_title="VP Marketing",
            source="referral",
            status="converted",
            score=95,
            campaign_id=campaigns[0].id,
            city="Chicago",
            state="IL",
            country="USA",
        ),
        Lead(
            first_name="David",
            last_name="Brown",
            email="david.b@growth.co",
            phone="+1-555-0505",
            company="Growth Co",
            job_title="Head of Sales",
            source="event",
            status="qualified",
            score=70,
            campaign_id=campaigns[1].id,
            city="Seattle",
            state="WA",
            country="USA",
        ),
    ]

    session.add_all(leads)
    await session.commit()
    print(f"✓ Created {len(leads)} leads")
    return leads


async def seed_content(session: AsyncSession):
    """Create sample content"""
    result = await session.execute(select(Content).limit(1))
    if result.scalar_one_or_none():
        print("⊙ Content already exists, loading existing data...")
        result = await session.execute(select(Content))
        return result.scalars().all()

    contents = [
        Content(
            title="10 Marketing Strategies for Small Businesses in 2024",
            slug="10-marketing-strategies-small-business-2024",
            content_type="blog_post",
            body="Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
            excerpt="Discover the top marketing strategies that small businesses can implement to grow their customer base.",
            meta_title="10 Marketing Strategies for Small Businesses | Marketing Blog",
            meta_description="Learn proven marketing strategies for small businesses in 2024.",
            keywords=["marketing", "small business", "strategies", "2024"],
            status="published",
            published_at=datetime.utcnow() - timedelta(days=10),
            author="Marketing Team",
            views=1250,
            shares=45,
            category="Marketing Tips",
            tags=["marketing", "business", "strategy"],
        ),
        Content(
            title="The Ultimate Guide to Email Marketing",
            slug="ultimate-guide-email-marketing",
            content_type="blog_post",
            body="Email marketing remains one of the most effective channels...",
            excerpt="A comprehensive guide to building successful email marketing campaigns.",
            status="published",
            published_at=datetime.utcnow() - timedelta(days=20),
            author="Marketing Team",
            views=2100,
            shares=78,
            category="Email Marketing",
            tags=["email", "marketing", "guide"],
        ),
        Content(
            title="Welcome to Our Platform",
            slug="welcome-landing-page",
            content_type="landing_page",
            body="Transform your marketing efforts with our all-in-one platform...",
            excerpt="Get started with the best marketing automation tool",
            status="published",
            published_at=datetime.utcnow() - timedelta(days=5),
            views=5400,
            shares=120,
        ),
        Content(
            title="Social Media Marketing Best Practices",
            slug="social-media-marketing-best-practices",
            content_type="blog_post",
            body="Social media has become an essential part of modern marketing...",
            excerpt="Learn how to maximize your social media marketing ROI",
            status="draft",
            author="Marketing Team",
            views=0,
            shares=0,
            category="Social Media",
            tags=["social media", "marketing", "best practices"],
        ),
    ]

    session.add_all(contents)
    await session.commit()
    print(f"✓ Created {len(contents)} content items")
    return contents


async def seed_email_templates(session: AsyncSession):
    """Create sample email templates"""
    result = await session.execute(select(EmailTemplate).limit(1))
    if result.scalar_one_or_none():
        print("⊙ Email templates already exist")
        return

    templates = [
        EmailTemplate(
            template_name="Welcome Email",
            template_code="WELCOME_001",
            subject="Welcome to Our Platform, {{first_name}}!",
            preview_text="Get started with your new account",
            from_name="Marketing Team",
            from_email="marketing@company.com",
            html_content="<h1>Welcome {{first_name}}!</h1><p>We're excited to have you on board.</p>",
            text_content="Welcome {{first_name}}! We're excited to have you on board.",
            variables=["first_name"],
            is_active=True,
        ),
        EmailTemplate(
            template_name="Product Launch Announcement",
            template_code="PRODUCT_LAUNCH_001",
            subject="Introducing Our Latest Product",
            preview_text="Check out what's new",
            from_name="Product Team",
            from_email="products@company.com",
            html_content="<h1>New Product Launch!</h1><p>We're thrilled to announce...</p>",
            text_content="New Product Launch! We're thrilled to announce...",
            variables=[],
            is_active=True,
        ),
    ]

    session.add_all(templates)
    await session.commit()
    print(f"✓ Created {len(templates)} email templates")


async def main():
    print("\n🌱 Seeding Marketing module data...\n")

    async with AsyncSessionLocal() as session:
        try:
            # Seed in order due to dependencies
            campaigns = await seed_campaigns(session)
            leads = await seed_leads(session, campaigns)
            content = await seed_content(session)
            await seed_email_templates(session)

            print("\n✅ Marketing module seeding completed successfully!\n")
            print("Summary:")
            print(f"  - {len(campaigns)} campaigns")
            print(f"  - {len(leads)} leads")
            print(f"  - {len(content)} content items")
            print(f"  - 2 email templates")
            print("\n")

        except Exception as e:
            print(f"\n❌ Error during seeding: {str(e)}\n")
            raise


if __name__ == "__main__":
    asyncio.run(main())
