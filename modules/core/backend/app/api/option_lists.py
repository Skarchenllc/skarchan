"""
Option Lists API Endpoints
Handles CRUD operations for option lists and their items
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel, UUID4
from uuid import UUID
from datetime import datetime
import uuid

from app.db.session import get_db
from app.models.option_list import OptionList, OptionListItem

router = APIRouter()


# Pydantic schemas for OptionListItem
class OptionListItemCreate(BaseModel):
    option_value: str
    option_label: str
    option_description: Optional[str] = None
    item_metadata: Optional[dict] = {}
    display_order: int = 0
    is_active: bool = True
    is_default: bool = False


class OptionListItemUpdate(BaseModel):
    option_value: Optional[str] = None
    option_label: Optional[str] = None
    option_description: Optional[str] = None
    item_metadata: Optional[dict] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


class OptionListItemResponse(BaseModel):
    id: UUID
    option_list_id: UUID
    option_value: str
    option_label: str
    option_description: Optional[str] = None
    item_metadata: Optional[dict] = None
    display_order: Optional[int] = 0
    is_active: Optional[bool] = True
    is_default: Optional[bool] = False
    created_at: Optional[datetime] = None
    last_modified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Pydantic schemas for OptionList
class OptionListCreate(BaseModel):
    list_code: str
    list_name: str
    list_label: str
    description: Optional[str] = None
    scope: str = 'global'
    module_code: Optional[str] = None
    entity_type: Optional[str] = None
    organization_id: UUID4
    created_by: UUID4
    is_system_list: bool = False
    items: Optional[List[OptionListItemCreate]] = []


class OptionListUpdate(BaseModel):
    list_name: Optional[str] = None
    list_label: Optional[str] = None
    description: Optional[str] = None
    scope: Optional[str] = None
    module_code: Optional[str] = None
    entity_type: Optional[str] = None
    is_active: Optional[bool] = None
    last_modified_by: UUID4


class OptionListResponse(BaseModel):
    id: UUID
    list_code: str
    list_name: str
    list_label: str
    description: Optional[str] = None
    scope: Optional[str] = None
    module_code: Optional[str] = None
    entity_type: Optional[str] = None
    organization_id: Optional[UUID] = None
    is_system_list: Optional[bool] = False
    is_active: Optional[bool] = True
    created_at: Optional[datetime] = None
    last_modified_at: Optional[datetime] = None
    items: List[OptionListItemResponse] = []

    class Config:
        from_attributes = True


class OptionListListResponse(BaseModel):
    lists: List[OptionListResponse]
    total: int


# ========== OPTION LIST ENDPOINTS ==========

@router.post("/option-lists", response_model=OptionListResponse, status_code=status.HTTP_201_CREATED)
async def create_option_list(
    option_list: OptionListCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new option list with items"""
    # Check if list_code already exists
    existing = await db.execute(
        select(OptionList).where(
            and_(
                OptionList.list_code == option_list.list_code,
                OptionList.is_deleted == 'N'
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Option list with code '{option_list.list_code}' already exists"
        )

    # Create the option list
    new_list = OptionList(
        id=uuid.uuid4(),
        list_code=option_list.list_code,
        list_name=option_list.list_name,
        list_label=option_list.list_label,
        description=option_list.description,
        scope=option_list.scope,
        module_code=option_list.module_code,
        entity_type=option_list.entity_type,
        organization_id=option_list.organization_id,
        is_system_list=option_list.is_system_list,
        created_by=option_list.created_by,
        last_modified_by=option_list.created_by,
        is_deleted='N'
    )

    db.add(new_list)
    await db.flush()  # Flush to get the ID

    # Create the items
    for item_data in option_list.items:
        new_item = OptionListItem(
            id=uuid.uuid4(),
            option_list_id=new_list.id,
            option_value=item_data.option_value,
            option_label=item_data.option_label,
            option_description=item_data.option_description,
            item_metadata=item_data.item_metadata or {},
            display_order=item_data.display_order,
            is_active=item_data.is_active,
            is_default=item_data.is_default,
            created_by=option_list.created_by,
            last_modified_by=option_list.created_by,
            is_deleted='N'
        )
        db.add(new_item)

    await db.commit()
    await db.refresh(new_list)

    return new_list


@router.get("/option-lists", response_model=OptionListListResponse)
async def list_option_lists(
    scope: Optional[str] = None,
    module_code: Optional[str] = None,
    entity_type: Optional[str] = None,
    organization_id: Optional[UUID4] = None,
    include_system: bool = True,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """List all option lists with optional filtering"""
    conditions = [OptionList.is_deleted == 'N']

    if scope:
        conditions.append(OptionList.scope == scope)

    if module_code:
        conditions.append(OptionList.module_code == module_code)

    if entity_type:
        conditions.append(OptionList.entity_type == entity_type)

    if organization_id:
        conditions.append(OptionList.organization_id == organization_id)

    if not include_system:
        conditions.append(OptionList.is_system_list == False)

    # Get total count
    count_query = select(func.count()).select_from(OptionList).where(and_(*conditions))
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get paginated lists
    query = (
        select(OptionList)
        .options(selectinload(OptionList.options))
        .where(and_(*conditions))
        .order_by(OptionList.list_name)
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    lists = result.scalars().all()

    return OptionListListResponse(lists=lists, total=total)


@router.get("/option-lists/{list_id}", response_model=OptionListResponse)
async def get_option_list(
    list_id: UUID4,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific option list by ID"""
    query = select(OptionList).options(selectinload(OptionList.options)).where(
        and_(
            OptionList.id == list_id,
            OptionList.is_deleted == 'N'
        )
    )

    result = await db.execute(query)
    option_list = result.scalar_one_or_none()

    if not option_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Option list not found"
        )

    return option_list


@router.get("/option-lists/code/{list_code}", response_model=OptionListResponse)
async def get_option_list_by_code(
    list_code: str,
    organization_id: Optional[UUID4] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific option list by code"""
    conditions = [
        OptionList.list_code == list_code,
        OptionList.is_deleted == 'N'
    ]

    if organization_id:
        conditions.append(OptionList.organization_id == organization_id)

    query = select(OptionList).options(selectinload(OptionList.options)).where(and_(*conditions))

    result = await db.execute(query)
    option_list = result.scalar_one_or_none()

    if not option_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Option list with code '{list_code}' not found"
        )

    return option_list


@router.put("/option-lists/{list_id}", response_model=OptionListResponse)
async def update_option_list(
    list_id: UUID4,
    list_update: OptionListUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an option list"""
    query = select(OptionList).where(
        and_(
            OptionList.id == list_id,
            OptionList.is_deleted == 'N'
        )
    )

    result = await db.execute(query)
    option_list = result.scalar_one_or_none()

    if not option_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Option list not found"
        )

    # Update fields
    if list_update.list_name is not None:
        option_list.list_name = list_update.list_name
    if list_update.list_label is not None:
        option_list.list_label = list_update.list_label
    if list_update.description is not None:
        option_list.description = list_update.description
    if list_update.scope is not None:
        option_list.scope = list_update.scope
    if list_update.module_code is not None:
        option_list.module_code = list_update.module_code
    if list_update.entity_type is not None:
        option_list.entity_type = list_update.entity_type
    if list_update.is_active is not None:
        option_list.is_active = list_update.is_active

    option_list.last_modified_by = list_update.last_modified_by
    option_list.last_modified_at = datetime.utcnow()

    await db.commit()
    await db.refresh(option_list)

    return option_list


@router.delete("/option-lists/{list_id}")
async def delete_option_list(
    list_id: UUID4,
    deleted_by: UUID4,
    db: AsyncSession = Depends(get_db)
):
    """Soft delete an option list and all its items"""
    query = select(OptionList).where(
        and_(
            OptionList.id == list_id,
            OptionList.is_deleted == 'N'
        )
    )

    result = await db.execute(query)
    option_list = result.scalar_one_or_none()

    if not option_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Option list not found"
        )

    # Soft delete the list
    option_list.is_deleted = 'Y'
    option_list.deleted_by = deleted_by
    option_list.deleted_at = datetime.utcnow()

    # Soft delete all items
    items_query = select(OptionListItem).where(
        and_(
            OptionListItem.option_list_id == list_id,
            OptionListItem.is_deleted == 'N'
        )
    )
    items_result = await db.execute(items_query)
    items = items_result.scalars().all()

    for item in items:
        item.is_deleted = 'Y'
        item.deleted_by = deleted_by
        item.deleted_at = datetime.utcnow()

    await db.commit()

    return {"message": "Option list deleted successfully"}


# ========== OPTION LIST ITEMS ENDPOINTS ==========

@router.post("/option-lists/{list_id}/items", response_model=OptionListItemResponse, status_code=status.HTTP_201_CREATED)
async def create_option_list_item(
    list_id: UUID4,
    item: OptionListItemCreate,
    created_by: UUID4,
    db: AsyncSession = Depends(get_db)
):
    """Add a new item to an option list"""
    # Verify the list exists
    list_query = select(OptionList).where(
        and_(
            OptionList.id == list_id,
            OptionList.is_deleted == 'N'
        )
    )
    list_result = await db.execute(list_query)
    option_list = list_result.scalar_one_or_none()

    if not option_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Option list not found"
        )

    # Create the item
    new_item = OptionListItem(
        id=uuid.uuid4(),
        option_list_id=list_id,
        option_value=item.option_value,
        option_label=item.option_label,
        option_description=item.option_description,
        item_metadata=item.item_metadata or {},
        display_order=item.display_order,
        is_active=item.is_active,
        is_default=item.is_default,
        created_by=created_by,
        last_modified_by=created_by,
        is_deleted='N'
    )

    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)

    return new_item


@router.get("/option-lists/{list_id}/items", response_model=List[OptionListItemResponse])
async def list_option_list_items(
    list_id: UUID4,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """Get all items for a specific option list"""
    conditions = [
        OptionListItem.option_list_id == list_id,
        OptionListItem.is_deleted == 'N'
    ]

    if active_only:
        conditions.append(OptionListItem.is_active == True)

    query = (
        select(OptionListItem)
        .where(and_(*conditions))
        .order_by(OptionListItem.display_order, OptionListItem.option_label)
    )

    result = await db.execute(query)
    items = result.scalars().all()

    return items


@router.put("/option-lists/{list_id}/items/{item_id}", response_model=OptionListItemResponse)
async def update_option_list_item(
    list_id: UUID4,
    item_id: UUID4,
    item_update: OptionListItemUpdate,
    updated_by: UUID4,
    db: AsyncSession = Depends(get_db)
):
    """Update an option list item"""
    query = select(OptionListItem).where(
        and_(
            OptionListItem.id == item_id,
            OptionListItem.option_list_id == list_id,
            OptionListItem.is_deleted == 'N'
        )
    )

    result = await db.execute(query)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Option list item not found"
        )

    # Update fields
    if item_update.option_value is not None:
        item.option_value = item_update.option_value
    if item_update.option_label is not None:
        item.option_label = item_update.option_label
    if item_update.option_description is not None:
        item.option_description = item_update.option_description
    if item_update.item_metadata is not None:
        item.item_metadata = item_update.item_metadata
    if item_update.display_order is not None:
        item.display_order = item_update.display_order
    if item_update.is_active is not None:
        item.is_active = item_update.is_active
    if item_update.is_default is not None:
        item.is_default = item_update.is_default

    item.last_modified_by = updated_by
    item.last_modified_at = datetime.utcnow()

    await db.commit()
    await db.refresh(item)

    return item


@router.delete("/option-lists/{list_id}/items/{item_id}")
async def delete_option_list_item(
    list_id: UUID4,
    item_id: UUID4,
    deleted_by: UUID4,
    db: AsyncSession = Depends(get_db)
):
    """Soft delete an option list item"""
    query = select(OptionListItem).where(
        and_(
            OptionListItem.id == item_id,
            OptionListItem.option_list_id == list_id,
            OptionListItem.is_deleted == 'N'
        )
    )

    result = await db.execute(query)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Option list item not found"
        )

    # Soft delete
    item.is_deleted = 'Y'
    item.deleted_by = deleted_by
    item.deleted_at = datetime.utcnow()

    await db.commit()

    return {"message": "Option list item deleted successfully"}
