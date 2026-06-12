"""Cross-module analytics API."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.analytics.funnel import lifecycle_funnel
from app.services.analytics.snapshots import take_snapshot, get_trend
from app.services.analytics.winloss import win_loss
from app.services.analytics.attribution import attribution

router = APIRouter()


@router.get("/funnel")
async def funnel(db: AsyncSession = Depends(get_db)):
    """The marketing→sales lifecycle funnel + key metrics, in one rollup."""
    return await lifecycle_funnel(db)


@router.post("/snapshot")
async def snapshot(db: AsyncSession = Depends(get_db)):
    """Persist today's funnel snapshot (idempotent per day)."""
    return await take_snapshot(db)


@router.get("/trend")
async def trend(days: int = 30, db: AsyncSession = Depends(get_db)):
    """Historical funnel snapshots, oldest → newest, for trend charts."""
    return {"snapshots": await get_trend(db, days)}


@router.get("/win-loss")
async def win_loss_breakdown(db: AsyncSession = Depends(get_db)):
    """Closed-deal counts + value grouped by win/loss reason."""
    return await win_loss(db)


@router.get("/attribution")
async def campaign_attribution(db: AsyncSession = Depends(get_db)):
    """Leads + won revenue grouped by sourcing campaign."""
    return await attribution(db)
