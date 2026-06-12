from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.models.transaction import Transaction, TransactionStatus
from app.models.account import Account
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionWithAccounts
)

router = APIRouter()


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction: TransactionCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new transaction"""
    # Validate accounts exist
    debit_result = await db.execute(
        select(Account).where(Account.id == transaction.debit_account_id)
    )
    debit_account = debit_result.scalar_one_or_none()

    credit_result = await db.execute(
        select(Account).where(Account.id == transaction.credit_account_id)
    )
    credit_account = credit_result.scalar_one_or_none()

    if not debit_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debit account not found"
        )

    if not credit_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credit account not found"
        )

    # Auto-generate reference if not provided
    if not transaction.reference:
        # Extract date from transaction
        if isinstance(transaction.date, str):
            ref_date = datetime.strptime(transaction.date, '%Y-%m-%d').date()
        else:
            ref_date = transaction.date.date() if hasattr(transaction.date, 'date') else transaction.date

        date_prefix = ref_date.strftime('%Y%m%d')
        reference_prefix = f"TXN-{date_prefix}-"

        # Find all references that start with this date's prefix
        result = await db.execute(
            select(Transaction.reference).where(
                Transaction.reference.like(f"{reference_prefix}%")
            ).order_by(Transaction.reference.desc())
        )
        existing_refs = result.scalars().all()

        # Find the maximum sequence number
        max_seq = 0
        for ref in existing_refs:
            try:
                seq_str = ref.split('-')[-1]
                seq_num = int(seq_str)
                if seq_num > max_seq:
                    max_seq = seq_num
            except (IndexError, ValueError):
                continue

        # Generate new reference with incremented sequence
        new_seq = max_seq + 1
        transaction.reference = f"{reference_prefix}{new_seq:04d}"

    # Check if reference already exists (for manual references)
    ref_result = await db.execute(
        select(Transaction).where(Transaction.reference == transaction.reference)
    )
    existing_transaction = ref_result.scalar_one_or_none()

    if existing_transaction:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transaction with reference {transaction.reference} already exists"
        )

    # Create transaction
    db_transaction = Transaction(**transaction.model_dump())
    db.add(db_transaction)

    # Update account balances if transaction is posted
    if transaction.status == TransactionStatus.POSTED:
        debit_account.balance += transaction.amount
        credit_account.balance -= transaction.amount

    await db.commit()
    await db.refresh(db_transaction)
    return db_transaction


@router.get("/", response_model=List[TransactionResponse])
async def list_transactions(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    start_date: datetime = None,
    end_date: datetime = None,
    db: AsyncSession = Depends(get_db)
):
    """List all transactions with optional filters"""
    query = select(Transaction)

    filters = []
    if status:
        filters.append(Transaction.status == status)
    if start_date:
        filters.append(Transaction.date >= start_date)
    if end_date:
        filters.append(Transaction.date <= end_date)

    if filters:
        query = query.where(and_(*filters))

    query = query.offset(skip).limit(limit).order_by(Transaction.date.desc())
    result = await db.execute(query)
    transactions = result.scalars().all()
    return transactions


@router.get("/generate-reference")
async def generate_reference(
    date: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Generate a unique transaction reference for a given date"""
    # Use provided date or default to today
    if date:
        try:
            ref_date = datetime.strptime(date, '%Y-%m-%d').date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    else:
        ref_date = datetime.utcnow().date()

    date_prefix = ref_date.strftime('%Y%m%d')
    reference_prefix = f"TXN-{date_prefix}-"

    # Find all references that start with this date's prefix
    result = await db.execute(
        select(Transaction.reference).where(
            Transaction.reference.like(f"{reference_prefix}%")
        ).order_by(Transaction.reference.desc())
    )
    existing_refs = result.scalars().all()

    # Find the maximum sequence number
    max_seq = 0
    for ref in existing_refs:
        try:
            # Extract the sequence number from references like "TXN-20260126-0001"
            seq_str = ref.split('-')[-1]
            seq_num = int(seq_str)
            if seq_num > max_seq:
                max_seq = seq_num
        except (IndexError, ValueError):
            continue

    # Generate new reference with incremented sequence
    new_seq = max_seq + 1
    reference = f"{reference_prefix}{new_seq:04d}"

    return {"reference": reference}


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific transaction by ID"""
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    return transaction


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: UUID,
    transaction_update: TransactionUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing transaction"""
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    db_transaction = result.scalar_one_or_none()

    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    # If transaction was posted, reverse the balances first
    if db_transaction.status == TransactionStatus.POSTED:
        # Get accounts
        debit_result = await db.execute(
            select(Account).where(Account.id == db_transaction.debit_account_id)
        )
        debit_account = debit_result.scalar_one_or_none()

        credit_result = await db.execute(
            select(Account).where(Account.id == db_transaction.credit_account_id)
        )
        credit_account = credit_result.scalar_one_or_none()

        # Reverse old balances
        if debit_account:
            debit_account.balance -= db_transaction.amount
        if credit_account:
            credit_account.balance += db_transaction.amount

    # Update fields
    update_data = transaction_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_transaction, field, value)

    # If new status is posted, apply new balances
    if hasattr(transaction_update, 'status') and transaction_update.status == TransactionStatus.POSTED:
        # Get (possibly new) accounts
        debit_result = await db.execute(
            select(Account).where(Account.id == db_transaction.debit_account_id)
        )
        debit_account = debit_result.scalar_one_or_none()

        credit_result = await db.execute(
            select(Account).where(Account.id == db_transaction.credit_account_id)
        )
        credit_account = credit_result.scalar_one_or_none()

        # Apply new balances
        if debit_account:
            debit_account.balance += db_transaction.amount
        if credit_account:
            credit_account.balance -= db_transaction.amount

    await db.commit()
    await db.refresh(db_transaction)
    return db_transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete a transaction (only if not posted)"""
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    db_transaction = result.scalar_one_or_none()

    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    if db_transaction.status == TransactionStatus.POSTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete posted transaction. Void it instead."
        )

    await db.delete(db_transaction)
    await db.commit()
    return None


@router.post("/{transaction_id}/post", response_model=TransactionResponse)
async def post_transaction(
    transaction_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Post a transaction and update account balances"""
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    if transaction.status != TransactionStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending transactions can be posted"
        )

    # Get accounts
    debit_result = await db.execute(
        select(Account).where(Account.id == transaction.debit_account_id)
    )
    debit_account = debit_result.scalar_one_or_none()

    credit_result = await db.execute(
        select(Account).where(Account.id == transaction.credit_account_id)
    )
    credit_account = credit_result.scalar_one_or_none()

    # Update balances
    debit_account.balance += transaction.amount
    credit_account.balance -= transaction.amount

    # Update transaction status
    transaction.status = TransactionStatus.POSTED

    await db.commit()
    await db.refresh(transaction)
    return transaction


@router.post("/{transaction_id}/void", response_model=TransactionResponse)
async def void_transaction(
    transaction_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Void a posted transaction and reverse account balances"""
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    if transaction.status != TransactionStatus.POSTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only posted transactions can be voided"
        )

    # Get accounts
    debit_result = await db.execute(
        select(Account).where(Account.id == transaction.debit_account_id)
    )
    debit_account = debit_result.scalar_one_or_none()

    credit_result = await db.execute(
        select(Account).where(Account.id == transaction.credit_account_id)
    )
    credit_account = credit_result.scalar_one_or_none()

    # Reverse balances
    debit_account.balance -= transaction.amount
    credit_account.balance += transaction.amount

    # Update transaction status
    transaction.status = TransactionStatus.VOID

    await db.commit()
    await db.refresh(transaction)
    return transaction
