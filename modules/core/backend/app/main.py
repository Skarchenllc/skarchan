from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from pathlib import Path

from app.db.session import engine, Base
from app.core.config import settings
from app.api.endpoints import auth, users, notifications, roles, user_settings, public, development, themes, uploads, ai_center, automation, marketing_ops, sales_ops, analytics, company
from app.api import option_lists
from app.api.modules import (
    inventory, scm, customer_service, project_management,
    accounting, administration, hr, marketing, production, sales, rd,
    ecommerce, qms, contacts,
)


async def _ai_proactive_loop():
    """Background loop for proactive AI capabilities (risk scans, digests).

    Disabled by default — set AI_PROACTIVE_ENABLED=true to run. Interval in hours
    via AI_PROACTIVE_INTERVAL_HOURS (default 24). Honors section toggles + budget.
    """
    import asyncio
    from app.db.session import AsyncSessionLocal
    from app.services.ai import proactive

    interval = float(os.getenv("AI_PROACTIVE_INTERVAL_HOURS", "24")) * 3600
    while True:
        try:
            async with AsyncSessionLocal() as db:
                await proactive.run_proactive(db)
        except Exception as e:  # never let the loop die
            print(f"[ai-proactive] run failed: {e}")
        await asyncio.sleep(interval)


async def _automation_scheduler_loop():
    """Background scheduler that makes automation self-running.

    Every tick it advances marketing journeys (the drip runner) and delivers any
    queued emails — so enrollments progress and automation-triggered emails go
    out without anyone pressing a button.

    Enabled by default; disable with AUTOMATION_SCHEDULER_ENABLED=false. Tick
    interval in seconds via AUTOMATION_SCHEDULER_INTERVAL (default 60).
    """
    import asyncio
    from app.db.session import AsyncSessionLocal
    from app.services.marketing.ops import run_journeys, process_email_queue
    from app.services.marketing.scoring import recompute_all
    from app.services.marketing.segments import materialize_all
    from app.services.analytics.snapshots import take_snapshot
    from app.services.scheduler import due, acquire_lock, release_lock

    interval = float(os.getenv("AUTOMATION_SCHEDULER_INTERVAL", "60"))
    decay_interval = float(os.getenv("SCORE_DECAY_INTERVAL", "3600"))       # score decay + segments
    snapshot_interval = float(os.getenv("FUNNEL_SNAPSHOT_INTERVAL", "86400"))  # daily funnel snapshot
    # AI job draining is opt-in: it needs an API key and spends budget. Off by
    # default. Enabled either by the env flag (AI_JOBS_ENABLED) or, at runtime,
    # by the "Process AI jobs automatically" toggle in Governance (read each tick
    # so flipping it in the UI takes effect without a restart).
    ai_jobs_env = os.getenv("AI_JOBS_ENABLED", "false").lower() == "true"
    from app.services.ai import settings as ai_settings
    while True:
        try:
            async with AsyncSessionLocal() as db:
                # Single-runner: only the instance holding the advisory lock works.
                if await acquire_lock(db):
                    try:
                        gov = await ai_settings.get_global(db)  # global AI config (read once/tick)
                        await run_journeys(db)
                        await process_email_queue(db)
                        if ai_jobs_env or gov.get("ai_jobs_auto"):
                            from app.services.ai.jobs import process_ai_jobs
                            await process_ai_jobs(db)   # drain AI automation jobs
                        if gov.get("ceo_standup_enabled"):
                            standup_iv = float(gov.get("ceo_standup_interval_hours") or 24) * 3600
                            if await due(db, "ceo_standup", standup_iv):
                                from app.services.ai.manager import ceo_standup
                                await ceo_standup(db)    # daily org-wide CEO standup
                        if await due(db, "decay", decay_interval):
                            await recompute_all(db)     # ages out stale engagement
                            await materialize_all(db)   # refresh dynamic segments
                        if await due(db, "snapshot", snapshot_interval):
                            await take_snapshot(db)      # record today's funnel
                    finally:
                        await release_lock(db)
        except Exception as e:  # never let the loop die
            print(f"[automation-scheduler] tick failed: {e}")
        await asyncio.sleep(interval)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    import asyncio
    tasks = []
    if os.getenv("AI_PROACTIVE_ENABLED", "false").lower() == "true":
        tasks.append(asyncio.create_task(_ai_proactive_loop()))
    # Automation scheduler runs by default so journeys/emails self-advance.
    if os.getenv("AUTOMATION_SCHEDULER_ENABLED", "true").lower() == "true":
        tasks.append(asyncio.create_task(_automation_scheduler_loop()))
    yield
    # Shutdown
    for t in tasks:
        t.cancel()
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="Shared Core API - Authentication, Authorization, Notifications, and Settings",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(users.router, prefix=f"{settings.API_V1_PREFIX}/users", tags=["Users"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_PREFIX}/notifications", tags=["Notifications"])
app.include_router(roles.router, prefix=f"{settings.API_V1_PREFIX}", tags=["Roles & Permissions"])
app.include_router(user_settings.router, prefix=f"{settings.API_V1_PREFIX}/user-settings", tags=["User Settings"])
app.include_router(company.router, prefix=f"{settings.API_V1_PREFIX}/company", tags=["Company"])
app.include_router(public.router, prefix=f"{settings.API_V1_PREFIX}/public", tags=["Public"])
app.include_router(development.router, prefix=f"{settings.API_V1_PREFIX}/development", tags=["Development Center"])
app.include_router(ai_center.router, prefix=f"{settings.API_V1_PREFIX}/ai", tags=["AI Center"])
app.include_router(automation.router, prefix=f"{settings.API_V1_PREFIX}/automation", tags=["Automation Center"])
app.include_router(marketing_ops.router, prefix=f"{settings.API_V1_PREFIX}/marketing-ops", tags=["Marketing Execution"])
app.include_router(sales_ops.router, prefix=f"{settings.API_V1_PREFIX}/sales-ops", tags=["Sales Execution"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_PREFIX}/analytics", tags=["Analytics"])
app.include_router(option_lists.router, prefix=f"{settings.API_V1_PREFIX}", tags=["Option Lists"])
app.include_router(themes.router, prefix=f"{settings.API_V1_PREFIX}/frontend", tags=["Frontend Theme System"])
app.include_router(uploads.router, prefix=f"{settings.API_V1_PREFIX}/uploads", tags=["File Uploads"])

# Serve uploaded files at /uploads/* so the URL stored in entity records
# resolves directly through nginx.
UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "/app/uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Module APIs - Consolidated in Core
app.include_router(inventory.router, prefix=f"{settings.API_V1_PREFIX}/inventory", tags=["Inventory Module"])
app.include_router(scm.router, prefix=f"{settings.API_V1_PREFIX}/scm", tags=["SCM Module"])
app.include_router(customer_service.router, prefix=f"{settings.API_V1_PREFIX}/customer-service", tags=["Customer Service Module"])
app.include_router(project_management.router, prefix=f"{settings.API_V1_PREFIX}/pm", tags=["Project Management Module"])
app.include_router(accounting.router, prefix=f"{settings.API_V1_PREFIX}/accounting", tags=["Accounting Module"])
app.include_router(administration.router, prefix=f"{settings.API_V1_PREFIX}/administration", tags=["Administration Module"])
app.include_router(hr.router, prefix=f"{settings.API_V1_PREFIX}/hr", tags=["HR Module"])
app.include_router(marketing.router, prefix=f"{settings.API_V1_PREFIX}/marketing", tags=["Marketing Module"])
app.include_router(production.router, prefix=f"{settings.API_V1_PREFIX}/production", tags=["Production Module"])
app.include_router(sales.router, prefix=f"{settings.API_V1_PREFIX}/sales", tags=["Sales Module"])
app.include_router(rd.router, prefix=f"{settings.API_V1_PREFIX}/rd", tags=["R&D Module"])
app.include_router(ecommerce.router, prefix=f"{settings.API_V1_PREFIX}/ecommerce", tags=["E-commerce / POS Module"])
app.include_router(qms.router, prefix=f"{settings.API_V1_PREFIX}/qms", tags=["Quality Management Module"])
app.include_router(contacts.router, prefix=f"{settings.API_V1_PREFIX}/contacts", tags=["Contacts Module"])


@app.get("/")
async def root():
    return {
        "message": "Core API - Business Management Platform",
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
