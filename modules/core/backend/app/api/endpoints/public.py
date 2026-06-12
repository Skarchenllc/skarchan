import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.entity_record import EntityRecord
from app.services.setting_service import SettingService
from app.services.marketing.forms import capture_submission
from app.services.marketing.suppression import suppress
from app.core.ratelimit import rate_limited


router = APIRouter()

# Per-IP limits for the unauthenticated endpoints.
_form_limit = rate_limited(20, 60)    # 20 form submits / minute / IP
_track_limit = rate_limited(120, 60)  # 120 pixel/click hits / minute / IP

# 1x1 transparent GIF for the open-tracking pixel.
_PIXEL = (b"GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\x00\x00\x00!"
          b"\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;")


async def _track(db, send_id: str, status: str, ts_field: str):
    """Mark an email_send Opened/Clicked (once) and score the recipient lead."""
    try:
        sid = uuid.UUID(send_id)
    except ValueError:
        return
    rec = (await db.execute(
        select(EntityRecord).where(EntityRecord.id == sid, EntityRecord.entity_type == "email_sends")
    )).scalar_one_or_none()
    if rec is None:
        return
    d = dict(rec.data or {})
    # Only the first transition into engagement counts (don't score every pixel load).
    already = d.get("status") in ("Opened", "Clicked")
    now = datetime.utcnow().isoformat()
    d[ts_field] = now
    # Clicked outranks Opened; never downgrade.
    if status == "Clicked" or d.get("status") not in ("Clicked",):
        d["status"] = status
    rec.data = d
    rec.last_modified_at = datetime.utcnow()
    await db.commit()
    if not already and d.get("to_email"):
        from app.services.marketing.scoring import apply_event
        await apply_event(db, "link_clicked" if status == "Clicked" else "email_opened",
                          lead_email=d.get("to_email"))


@router.get("/email/{send_id}/open")
async def track_open(send_id: str, db: AsyncSession = Depends(get_db),
                     _rl: None = Depends(_track_limit)):
    """Open-tracking pixel — marks the email Opened and scores the lead."""
    await _track(db, send_id, "Opened", "opened_at")
    return Response(content=_PIXEL, media_type="image/gif")


@router.get("/email/{send_id}/click")
async def track_click(send_id: str, u: str = "/", db: AsyncSession = Depends(get_db),
                      _rl: None = Depends(_track_limit)):
    """Click-tracking redirect — marks the email Clicked, scores, then redirects."""
    await _track(db, send_id, "Clicked", "clicked_at")
    return RedirectResponse(url=u or "/")


async def _email_for_send(db, send_id):
    try:
        sid = uuid.UUID(send_id)
    except ValueError:
        return None
    rec = (await db.execute(
        select(EntityRecord).where(EntityRecord.id == sid, EntityRecord.entity_type == "email_sends")
    )).scalar_one_or_none()
    return (rec.data or {}).get("to_email") if rec else None


@router.get("/email/{send_id}/unsubscribe")
async def unsubscribe(send_id: str, db: AsyncSession = Depends(get_db),
                      _rl: None = Depends(_track_limit)):
    """One-click unsubscribe — adds the recipient to the suppression list."""
    email = await _email_for_send(db, send_id)
    if email:
        await suppress(db, email, "unsubscribe")
    body = ("You've been unsubscribed and won't receive further emails."
            if email else "We couldn't find that subscription.")
    return HTMLResponse(content=f"<!doctype html><meta charset=utf-8>"
                                f"<div style='font-family:system-ui;max-width:480px;margin:80px auto;text-align:center'>"
                                f"<h2>Unsubscribed</h2><p>{body}</p></div>")


@router.post("/email/bounce")
async def bounce(payload: dict, db: AsyncSession = Depends(get_db),
                 _rl: None = Depends(_track_limit)):
    """Provider bounce webhook — suppress the address and mark the send bounced."""
    email = payload.get("email")
    send_id = payload.get("send_id")
    if not email and send_id:
        email = await _email_for_send(db, send_id)
    if not email:
        raise HTTPException(status_code=400, detail="email or send_id required")
    newly = await suppress(db, email, "bounce")
    return {"suppressed": True, "newly_added": newly, "email": email}


@router.post("/forms/{form_id}/submit")
async def submit_form(form_id: str, payload: dict, db: AsyncSession = Depends(get_db),
                      _rl: None = Depends(_form_limit)):
    """
    Public inbound form capture (no auth — embeddable on external sites).
    Creates/dedupes a lead, logs the engagement (which scores it and can fire
    automations), records the raw submission, and optionally enrolls a journey.
    """
    try:
        fid = uuid.UUID(form_id)
    except ValueError:
        fid = None  # tolerate non-uuid form code → fall back to defaults
    form = None
    if fid is not None:
        form = (await db.execute(
            select(EntityRecord).where(
                EntityRecord.id == fid,
                EntityRecord.entity_type == "forms",
                EntityRecord.is_deleted == "N",
            )
        )).scalar_one_or_none()
    if not payload:
        raise HTTPException(status_code=400, detail="empty submission")
    return await capture_submission(db, form, payload)


@router.get("/theme")
async def get_public_theme(db: AsyncSession = Depends(get_db)):
    """
    Get shared theme settings for all modules.

    This endpoint is public (no authentication required) to allow
    all modules to fetch the theme regardless of login state.

    Returns only the branding-related settings that should be
    shared across all modules.
    """
    setting_service = SettingService(db)

    # Get all theme settings (user-level settings will be returned first)
    # This will get the theme from any user who has configured it
    all_settings = await setting_service.get_all_settings(
        module_name="core"
    )

    # Extract theme-related settings
    theme_settings = {}
    for setting in all_settings:
        if setting.setting_key.startswith("theme."):
            key = setting.setting_key.replace("theme.", "")
            # Only keep the first value found (highest priority)
            if key not in theme_settings:
                theme_settings[key] = setting.setting_value

    # Return only the shared branding fields with defaults
    return {
        "primaryColor": theme_settings.get("primaryColor", "#002868"),
        "secondaryColor": theme_settings.get("secondaryColor", "#006600"),
        "logoUrl": theme_settings.get("logoUrl", ""),
        "logoFile": theme_settings.get("logoFile", ""),
        "appName": theme_settings.get("appName", "NexaCore"),
        "faviconUrl": theme_settings.get("faviconUrl", ""),
        "faviconFile": theme_settings.get("faviconFile", ""),
    }
