from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.account import Account
from app.schemas.account import AccountCreate, AccountUpdate, AccountResponse, AccountSummary

router = APIRouter()


@router.post("/", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    account: AccountCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new account"""
    # Check if account code already exists
    result = await db.execute(
        select(Account).where(Account.code == account.code)
    )
    existing_account = result.scalar_one_or_none()

    if existing_account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Account with code {account.code} already exists"
        )

    db_account = Account(**account.model_dump())
    db.add(db_account)
    await db.commit()
    await db.refresh(db_account)
    return db_account


@router.get("/", response_model=List[AccountResponse])
async def list_accounts(
    skip: int = 0,
    limit: int = 100,
    is_active: bool = None,
    account_type: str = None,
    db: AsyncSession = Depends(get_db)
):
    """List all accounts with optional filters"""
    query = select(Account)

    filters = []
    if is_active is not None:
        filters.append(Account.is_active == is_active)
    if account_type:
        filters.append(Account.type == account_type)

    if filters:
        query = query.where(and_(*filters))

    query = query.offset(skip).limit(limit).order_by(Account.code)
    result = await db.execute(query)
    accounts = result.scalars().all()
    return accounts


@router.get("/summary", response_model=List[AccountSummary])
async def get_accounts_summary(db: AsyncSession = Depends(get_db)):
    """Get account summary for quick reference"""
    result = await db.execute(
        select(Account)
        .where(Account.is_active == True)
        .order_by(Account.code)
    )
    accounts = result.scalars().all()
    return accounts


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific account by ID"""
    result = await db.execute(
        select(Account).where(Account.id == account_id)
    )
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )

    return account


@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: UUID,
    account_update: AccountUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing account"""
    result = await db.execute(
        select(Account).where(Account.id == account_id)
    )
    db_account = result.scalar_one_or_none()

    if not db_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )

    # Check if new code conflicts with existing account
    if account_update.code and account_update.code != db_account.code:
        result = await db.execute(
            select(Account).where(Account.code == account_update.code)
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Account with code {account_update.code} already exists"
            )

    # Update fields
    update_data = account_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_account, field, value)

    await db.commit()
    await db.refresh(db_account)
    return db_account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete an account (soft delete by setting is_active to False)"""
    result = await db.execute(
        select(Account).where(Account.id == account_id)
    )
    db_account = result.scalar_one_or_none()

    if not db_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )

    # Soft delete
    db_account.is_active = False
    await db.commit()
    return None


@router.get("/{account_id}/balance")
async def get_account_balance(
    account_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get current balance of an account"""
    result = await db.execute(
        select(Account).where(Account.id == account_id)
    )
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )

    return {
        "account_id": account.id,
        "code": account.code,
        "name": account.name,
        "balance": account.balance,
        "currency": account.currency
    }
