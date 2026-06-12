"""
Marketing Automation Module APIs - Consolidated in Core Backend
"""
from fastapi import APIRouter
from . import campaign_activities
from . import campaign_metrics
from . import website_analytics
from . import contents
from . import marketing_email_templates
from . import lead_activities
from . import leads
from . import campaigns
from . import segments
from . import lists
from . import email_sends
from . import journeys
from . import journey_enrollments
from . import scoring_rules
from . import lead_score_events
from . import forms
from . import form_submissions
from . import suppressions

router = APIRouter()

router.include_router(campaign_activities.router, prefix="/campaign-activities", tags=["Marketing Automation - Campaign Activities"])
router.include_router(campaign_metrics.router, prefix="/campaign-metrics", tags=["Marketing Automation - Campaign Metrics"])
router.include_router(website_analytics.router, prefix="/website-analytics", tags=["Marketing Automation - Website Analytics"])
router.include_router(contents.router, prefix="/contents", tags=["Marketing Automation - Marketing Content"])
router.include_router(marketing_email_templates.router, prefix="/marketing-email-templates", tags=["Marketing Automation - Email Templates"])
router.include_router(lead_activities.router, prefix="/lead-activities", tags=["Marketing Automation - Lead Activities"])
router.include_router(leads.router, prefix="/leads", tags=["Marketing Automation - Marketing Leads"])
router.include_router(campaigns.router, prefix="/campaigns", tags=["Marketing Automation - Marketing Campaigns"])
router.include_router(segments.router, prefix="/segments", tags=["Marketing Automation - Segments"])
router.include_router(lists.router, prefix="/lists", tags=["Marketing Automation - Lists"])
router.include_router(email_sends.router, prefix="/email-sends", tags=["Marketing Automation - Email Sends"])
router.include_router(journeys.router, prefix="/journeys", tags=["Marketing Automation - Journeys"])
router.include_router(journey_enrollments.router, prefix="/journey-enrollments", tags=["Marketing Automation - Journey Enrollments"])
router.include_router(scoring_rules.router, prefix="/scoring-rules", tags=["Marketing Automation - Scoring Rules"])
router.include_router(lead_score_events.router, prefix="/lead-score-events", tags=["Marketing Automation - Lead Score Events"])
router.include_router(forms.router, prefix="/forms", tags=["Marketing Automation - Forms"])
router.include_router(form_submissions.router, prefix="/form-submissions", tags=["Marketing Automation - Form Submissions"])
router.include_router(suppressions.router, prefix="/suppressions", tags=["Marketing Automation - Suppressions"])
