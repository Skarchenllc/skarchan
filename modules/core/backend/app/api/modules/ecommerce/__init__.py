"""E-commerce / POS Module APIs - Consolidated in Core Backend"""
from fastapi import APIRouter
from app.api.modules.entity_crud_template import create_entity_router

router = APIRouter()

router.include_router(create_entity_router("ecommerce", "products"),      prefix="/products",      tags=["E-commerce - Products"])
router.include_router(create_entity_router("ecommerce", "orders"),        prefix="/orders",        tags=["E-commerce - Orders"])
router.include_router(create_entity_router("ecommerce", "pos_sessions"),  prefix="/pos-sessions",  tags=["E-commerce - POS Sessions"])
router.include_router(create_entity_router("ecommerce", "storefronts"),   prefix="/storefronts",   tags=["E-commerce - Storefronts"])
