from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from datetime import date

from app.core.database import get_db
from app.models.fixed_asset import FixedAsset, DepreciationMethod
from app.schemas.fixed_asset import FixedAssetCreate, FixedAssetUpdate, FixedAssetResponse

router = APIRouter()


@router.post("/", response_model=FixedAssetResponse, status_code=status.HTTP_201_CREATED)
async def create_fixed_asset(
    asset: FixedAssetCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new fixed asset"""
    db_asset = FixedAsset(**asset.model_dump())
    db.add(db_asset)
    await db.commit()
    await db.refresh(db_asset)
    return db_asset


@router.get("/", response_model=List[FixedAssetResponse])
async def list_fixed_assets(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    db: AsyncSession = Depends(get_db)
):
    """List all fixed assets with optional filters"""
    query = select(FixedAsset)

    if category:
        query = query.where(FixedAsset.category == category)

    query = query.offset(skip).limit(limit).order_by(FixedAsset.purchase_date.desc())
    result = await db.execute(query)
    assets = result.scalars().all()
    return assets


@router.get("/summary")
async def get_assets_summary(db: AsyncSession = Depends(get_db)):
    """Get summary of all fixed assets"""
    result = await db.execute(select(FixedAsset))
    assets = result.scalars().all()

    total_cost = sum(asset.cost for asset in assets)
    total_accumulated = sum(asset.accumulated_depreciation for asset in assets)
    net_book_value = total_cost - total_accumulated

    return {
        "total_assets": len(assets),
        "total_cost": total_cost,
        "total_accumulated_depreciation": total_accumulated,
        "net_book_value": net_book_value
    }


@router.get("/{asset_id}", response_model=FixedAssetResponse)
async def get_fixed_asset(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific fixed asset by ID"""
    result = await db.execute(
        select(FixedAsset).where(FixedAsset.id == asset_id)
    )
    asset = result.scalar_one_or_none()

    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fixed asset not found"
        )

    return asset


@router.put("/{asset_id}", response_model=FixedAssetResponse)
async def update_fixed_asset(
    asset_id: UUID,
    asset_update: FixedAssetUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing fixed asset"""
    result = await db.execute(
        select(FixedAsset).where(FixedAsset.id == asset_id)
    )
    db_asset = result.scalar_one_or_none()

    if not db_asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fixed asset not found"
        )

    # Update fields
    update_data = asset_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_asset, field, value)

    await db.commit()
    await db.refresh(db_asset)
    return db_asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fixed_asset(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete a fixed asset"""
    result = await db.execute(
        select(FixedAsset).where(FixedAsset.id == asset_id)
    )
    db_asset = result.scalar_one_or_none()

    if not db_asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fixed asset not found"
        )

    await db.delete(db_asset)
    await db.commit()
    return None


@router.post("/calculate-depreciation")
async def calculate_depreciation(db: AsyncSession = Depends(get_db)):
    """Calculate and update depreciation for all assets"""
    result = await db.execute(select(FixedAsset))
    assets = result.scalars().all()

    updated_count = 0
    for asset in assets:
        if asset.depreciation_method == DepreciationMethod.STRAIGHT_LINE:
            # Calculate straight-line depreciation
            cost = float(asset.cost)
            salvage = float(asset.salvage_value)
            life = int(asset.useful_life)
            annual_depreciation = (cost - salvage) / life

            # Calculate months since purchase
            purchase_date = asset.purchase_date
            today = date.today()
            months = (today.year - purchase_date.year) * 12 + (today.month - purchase_date.month)

            # Calculate total depreciation
            total_depreciation = (annual_depreciation / 12) * months
            asset.accumulated_depreciation = min(total_depreciation, cost - salvage)
            updated_count += 1

    await db.commit()

    return {
        "success": True,
        "message": f"Depreciation calculated for {updated_count} assets"
    }
