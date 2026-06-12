"""
Pluggable email provider — the real delivery seam.

Mode via EMAIL_PROVIDER env:
  • smtp     — actually send over SMTP (aiosmtplib). Config: SMTP_HOST, SMTP_PORT,
               SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_USE_TLS. Returns Sent on
               success / Failed on error. Real opens & clicks arrive later via the
               public tracking endpoints (/api/v1/public/email/{id}/open|click).
  • console  — print the message and mark Sent (dev visibility, no mail server).
  • simulate — DEFAULT. Immediately mark Delivered and roll Opened/Clicked so demo
               flows + scoring work with no provider configured.

This is the only place that talks to a mail transport; the rest of the stack
(queue, journeys, automations, scoring) is provider-agnostic.
"""
from __future__ import annotations

import os
import random
from datetime import datetime


def provider_name() -> str:
    return os.getenv("EMAIL_PROVIDER", "simulate").lower()


def default_from() -> str:
    return os.getenv("SMTP_FROM", "no-reply@nexacore.local")


async def deliver(*, to_email: str | None, subject: str | None = None,
                  html: str | None = None, text: str | None = None,
                  from_email: str | None = None) -> dict:
    now = datetime.utcnow().isoformat()
    mode = provider_name()

    if not to_email:
        return {"status": "Failed", "error": "no recipient", "sent_at": now, "provider": mode}

    sender = from_email or default_from()
    subj = subject or "(no subject)"
    body_text = text or (html or "")

    if mode == "smtp":
        try:
            import aiosmtplib
            from email.message import EmailMessage
            msg = EmailMessage()
            msg["From"] = sender
            msg["To"] = to_email
            msg["Subject"] = subj
            msg.set_content(body_text)
            if html:
                msg.add_alternative(html, subtype="html")
            await aiosmtplib.send(
                msg,
                hostname=os.getenv("SMTP_HOST", "localhost"),
                port=int(os.getenv("SMTP_PORT", "587")),
                username=os.getenv("SMTP_USER") or None,
                password=os.getenv("SMTP_PASSWORD") or None,
                start_tls=os.getenv("SMTP_USE_TLS", "true").lower() == "true",
                timeout=15,
            )
            return {"status": "Sent", "sent_at": now, "provider": "smtp"}
        except Exception as e:  # bad creds / host down / refused → Failed, not a crash
            return {"status": "Failed", "sent_at": now, "provider": "smtp", "error": str(e)[:200]}

    if mode == "console":
        print(f"[email:console] To={to_email} From={sender} Subject={subj!r}\n{body_text[:500]}")
        return {"status": "Sent", "sent_at": now, "provider": "console"}

    # simulate (default)
    opened = random.random() < 0.45
    clicked = opened and random.random() < 0.4
    status = "Clicked" if clicked else ("Opened" if opened else "Delivered")
    out = {"status": status, "sent_at": now, "delivered_at": now, "provider": "simulate"}
    if opened:
        out["opened_at"] = now
    if clicked:
        out["clicked_at"] = now
    return out
