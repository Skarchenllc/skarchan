"""
Theme System API - Frontend as Entity
Drupal-style theme management
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from datetime import datetime
import uuid

from app.db.session import get_db

router = APIRouter()


# Note: Models will be created next
# For now, using direct SQL queries

@router.get("/themes")
async def list_themes(
    organization_id: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List all themes"""
    from sqlalchemy import text

    query_sql = """
        SELECT id, theme_code, theme_name, theme_label, description, version,
               layout_type, color_scheme, component_library, primary_color, secondary_color,
               is_active, is_default, scope, organization_id, created_at
        FROM themes
        WHERE is_deleted = 'N'
    """

    params = {}
    if is_active is not None:
        query_sql += " AND is_active = :is_active"
        params['is_active'] = is_active

    if organization_id:
        query_sql += " AND (organization_id = :org_id OR organization_id IS NULL)"
        params['org_id'] = organization_id

    query_sql += " ORDER BY is_default DESC, theme_name"

    result = await db.execute(text(query_sql), params)
    rows = result.fetchall()

    return {
        "data": [
            {
                "id": str(row[0]),
                "theme_code": row[1],
                "theme_name": row[2],
                "theme_label": row[3],
                "description": row[4],
                "version": row[5],
                "layout_type": row[6],
                "color_scheme": row[7],
                "component_library": row[8],
                "primary_color": row[9],
                "secondary_color": row[10],
                "is_active": row[11],
                "is_default": row[12],
                "scope": row[13],
                "organization_id": str(row[14]) if row[14] else None,
                "created_at": row[15].isoformat() if row[15] else None,
            }
            for row in rows
        ]
    }


@router.get("/themes/{theme_code}")
async def get_theme(theme_code: str, db: AsyncSession = Depends(get_db)):
    """Get theme by code with full configuration"""
    from sqlalchemy import text

    query_sql = """
        SELECT id, theme_code, theme_name, theme_label, description, version, author,
               base_url, layout_type, color_scheme, logo_url, favicon_url,
               layout_config, navigation_config, component_library,
               primary_color, secondary_color, custom_css, custom_js,
               is_active, is_default, scope, organization_id
        FROM themes
        WHERE theme_code = :code AND is_deleted = 'N'
    """

    result = await db.execute(text(query_sql), {'code': theme_code})
    row = result.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Theme not found")

    return {
        "id": str(row[0]),
        "theme_code": row[1],
        "theme_name": row[2],
        "theme_label": row[3],
        "description": row[4],
        "version": row[5],
        "author": row[6],
        "base_url": row[7],
        "layout_type": row[8],
        "color_scheme": row[9],
        "logo_url": row[10],
        "favicon_url": row[11],
        "layout_config": row[12],
        "navigation_config": row[13],
        "component_library": row[14],
        "primary_color": row[15],
        "secondary_color": row[16],
        "custom_css": row[17],
        "custom_js": row[18],
        "is_active": row[19],
        "is_default": row[20],
        "scope": row[21],
        "organization_id": str(row[22]) if row[22] else None,
    }


@router.get("/pages")
async def list_pages(
    module_code: Optional[str] = Query(None),
    organization_id: Optional[str] = Query(None),
    show_in_navigation: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List all pages"""
    from sqlalchemy import text

    query_sql = """
        SELECT id, page_code, page_name, page_title, route_path, module_code,
               entity_type_code, page_type, icon, display_order, show_in_navigation,
               is_active, is_public
        FROM pages
        WHERE is_deleted = 'N'
    """

    params = {}
    if module_code:
        query_sql += " AND module_code = :module_code"
        params['module_code'] = module_code

    if organization_id:
        query_sql += " AND (organization_id = :org_id OR organization_id IS NULL)"
        params['org_id'] = organization_id

    if show_in_navigation is not None:
        query_sql += " AND show_in_navigation = :show_nav"
        params['show_nav'] = show_in_navigation

    query_sql += " ORDER BY display_order, page_name"

    result = await db.execute(text(query_sql), params)
    rows = result.fetchall()

    return {
        "data": [
            {
                "id": str(row[0]),
                "page_code": row[1],
                "page_name": row[2],
                "page_title": row[3],
                "route_path": row[4],
                "module_code": row[5],
                "entity_type_code": row[6],
                "page_type": row[7],
                "icon": row[8],
                "display_order": row[9],
                "show_in_navigation": row[10],
                "is_active": row[11],
                "is_public": row[12],
            }
            for row in rows
        ]
    }


@router.get("/pages/by-route")
async def get_page_by_route(
    path: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Get page configuration by route path"""
    from sqlalchemy import text

    query_sql = """
        SELECT id, page_code, page_name, page_title, route_path,
               module_code, entity_type_code, page_type, layout_template,
               components, page_config, required_permissions, is_public
        FROM pages
        WHERE route_path = :path AND is_deleted = 'N' AND is_active = true
    """

    result = await db.execute(text(query_sql), {'path': path})
    row = result.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Page not found")

    return {
        "id": str(row[0]),
        "page_code": row[1],
        "page_name": row[2],
        "page_title": row[3],
        "route_path": row[4],
        "module_code": row[5],
        "entity_type_code": row[6],
        "page_type": row[7],
        "layout_template": row[8],
        "components": row[9],
        "page_config": row[10],
        "required_permissions": row[11],
        "is_public": row[12],
    }


@router.get("/navigation-menus")
async def list_navigation_menus(
    menu_location: Optional[str] = Query(None),
    organization_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List navigation menus"""
    from sqlalchemy import text

    query_sql = """
        SELECT id, menu_code, menu_name, menu_location, menu_items, is_active
        FROM navigation_menus
        WHERE is_deleted = 'N'
    """

    params = {}
    if menu_location:
        query_sql += " AND menu_location = :location"
        params['location'] = menu_location

    if organization_id:
        query_sql += " AND (organization_id = :org_id OR organization_id IS NULL)"
        params['org_id'] = organization_id

    result = await db.execute(text(query_sql), params)
    rows = result.fetchall()

    return {
        "data": [
            {
                "id": str(row[0]),
                "menu_code": row[1],
                "menu_name": row[2],
                "menu_location": row[3],
                "menu_items": row[4],
                "is_active": row[5],
            }
            for row in rows
        ]
    }


@router.get("/ui-components")
async def list_ui_components(
    component_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    is_reusable: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List UI component configurations"""
    from sqlalchemy import text

    query_sql = """
        SELECT id, component_code, component_name, component_type, component_config,
               data_source_type, data_source_config, is_reusable, category
        FROM ui_components
        WHERE is_deleted = 'N'
    """

    params = {}
    if component_type:
        query_sql += " AND component_type = :comp_type"
        params['comp_type'] = component_type

    if category:
        query_sql += " AND category = :category"
        params['category'] = category

    if is_reusable is not None:
        query_sql += " AND is_reusable = :reusable"
        params['reusable'] = is_reusable

    result = await db.execute(text(query_sql), params)
    rows = result.fetchall()

    return {
        "data": [
            {
                "id": str(row[0]),
                "component_code": row[1],
                "component_name": row[2],
                "component_type": row[3],
                "component_config": row[4],
                "data_source_type": row[5],
                "data_source_config": row[6],
                "is_reusable": row[7],
                "category": row[8],
            }
            for row in rows
        ]
    }
