"""
Customer Service Module APIs - Consolidated in Core Backend
"""
from fastapi import APIRouter
from . import support_tickets, knowledge_base, service_requests, customer_feedback, sla_agreements

router = APIRouter()

router.include_router(support_tickets.router, prefix="/support-tickets", tags=["Customer Service - Tickets"])
router.include_router(knowledge_base.router, prefix="/knowledge-base", tags=["Customer Service - Knowledge Base"])
router.include_router(service_requests.router, prefix="/service-requests", tags=["Customer Service - Service Requests"])
router.include_router(customer_feedback.router, prefix="/customer-feedback", tags=["Customer Service - Feedback"])
router.include_router(sla_agreements.router, prefix="/sla-agreements", tags=["Customer Service - SLA"])
