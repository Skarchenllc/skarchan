from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date

from app.core.database import get_db
from app.models.bank_reconciliation import (
    BankAccount,
    BankReconciliation,
    BankStatement,
    BankStatementTransaction,
    ReconciliationItem,
    ReconciliationStatus,
    StatementTransactionStatus
)
from app.models.transaction import Transaction
from app.schemas.bank_reconciliation import (
    BankAccountCreate,
    BankAccountUpdate,
    BankAccountResponse,
    BankReconciliationCreate,
    BankReconciliationUpdate,
    BankReconciliationResponse,
    BankStatementCreate,
    BankStatementResponse,
    BankStatementTransactionCreate,
    BankStatementTransactionBulkCreate,
    BankStatementTransactionUpdate,
    BankStatementTransactionMatch,
    BankStatementTransactionResponse,
    ReconciliationItemCreate,
    ReconciliationItemUpdate,
    ReconciliationItemResponse,
    CSVImportRequest,
    AutoMatchRequest,
    AutoMatchResponse,
    ReconciliationSummary,
    StatementUploadResponse
)
from app.services.bank_statement_parser import BankStatementParser
from app.services.transaction_matcher import TransactionMatcher

router = APIRouter()


# ===== Bank Accounts =====

@router.post("/bank-accounts", response_model=BankAccountResponse)
async def create_bank_account(
    bank_account: BankAccountCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new bank account for reconciliation"""
    db_bank_account = BankAccount(**bank_account.model_dump())
    db.add(db_bank_account)
    await db.commit()
    await db.refresh(db_bank_account)
    return db_bank_account


@router.get("/bank-accounts", response_model=List[BankAccountResponse])
async def list_bank_accounts(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all bank accounts"""
    query = select(BankAccount)

    if is_active is not None:
        query = query.where(BankAccount.is_active == is_active)

    query = query.offset(skip).limit(limit).order_by(BankAccount.bank_name)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/bank-accounts/{bank_account_id}", response_model=BankAccountResponse)
async def get_bank_account(
    bank_account_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific bank account"""
    result = await db.execute(
        select(BankAccount).where(BankAccount.id == bank_account_id)
    )
    bank_account = result.scalar_one_or_none()

    if not bank_account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    return bank_account


@router.put("/bank-accounts/{bank_account_id}", response_model=BankAccountResponse)
async def update_bank_account(
    bank_account_id: UUID,
    bank_account_update: BankAccountUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a bank account"""
    result = await db.execute(
        select(BankAccount).where(BankAccount.id == bank_account_id)
    )
    bank_account = result.scalar_one_or_none()

    if not bank_account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    update_data = bank_account_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bank_account, field, value)

    bank_account.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(bank_account)

    return bank_account


# ===== Bank Reconciliations =====

@router.post("/reconciliations", response_model=BankReconciliationResponse)
async def create_reconciliation(
    reconciliation: BankReconciliationCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new bank reconciliation"""
    db_reconciliation = BankReconciliation(**reconciliation.model_dump())
    db_reconciliation.difference = reconciliation.statement_balance - reconciliation.book_balance

    db.add(db_reconciliation)
    await db.commit()
    await db.refresh(db_reconciliation)

    return db_reconciliation


@router.get("/reconciliations", response_model=List[BankReconciliationResponse])
async def list_reconciliations(
    bank_account_id: Optional[UUID] = None,
    status: Optional[ReconciliationStatus] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """List bank reconciliations"""
    query = select(BankReconciliation)

    if bank_account_id:
        query = query.where(BankReconciliation.bank_account_id == bank_account_id)

    if status:
        query = query.where(BankReconciliation.status == status)

    query = query.offset(skip).limit(limit).order_by(desc(BankReconciliation.statement_date))

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/reconciliations/{reconciliation_id}", response_model=BankReconciliationResponse)
async def get_reconciliation(
    reconciliation_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific reconciliation"""
    result = await db.execute(
        select(BankReconciliation).where(BankReconciliation.id == reconciliation_id)
    )
    reconciliation = result.scalar_one_or_none()

    if not reconciliation:
        raise HTTPException(status_code=404, detail="Reconciliation not found")

    return reconciliation


@router.put("/reconciliations/{reconciliation_id}", response_model=BankReconciliationResponse)
async def update_reconciliation(
    reconciliation_id: UUID,
    reconciliation_update: BankReconciliationUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a reconciliation"""
    result = await db.execute(
        select(BankReconciliation).where(BankReconciliation.id == reconciliation_id)
    )
    reconciliation = result.scalar_one_or_none()

    if not reconciliation:
        raise HTTPException(status_code=404, detail="Reconciliation not found")

    update_data = reconciliation_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(reconciliation, field, value)

    reconciliation.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(reconciliation)

    return reconciliation


@router.post("/reconciliations/{reconciliation_id}/complete")
async def complete_reconciliation(
    reconciliation_id: UUID,
    reconciled_by: str,
    db: AsyncSession = Depends(get_db)
):
    """Mark reconciliation as completed"""
    result = await db.execute(
        select(BankReconciliation).where(BankReconciliation.id == reconciliation_id)
    )
    reconciliation = result.scalar_one_or_none()

    if not reconciliation:
        raise HTTPException(status_code=404, detail="Reconciliation not found")

    # Check if reconciliation is balanced
    if abs(reconciliation.difference or 0) > 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot complete reconciliation with difference of ${reconciliation.difference}"
        )

    reconciliation.status = ReconciliationStatus.COMPLETED
    reconciliation.reconciled_by = reconciled_by
    reconciliation.reconciled_at = datetime.utcnow()

    # Update bank account last reconciliation info
    bank_account_result = await db.execute(
        select(BankAccount).where(BankAccount.id == reconciliation.bank_account_id)
    )
    bank_account = bank_account_result.scalar_one()
    bank_account.last_reconciled_date = reconciliation.statement_date
    bank_account.last_reconciled_balance = reconciliation.statement_balance

    await db.commit()
    await db.refresh(reconciliation)

    return {"message": "Reconciliation completed successfully", "reconciliation": reconciliation}


@router.get("/reconciliations/{reconciliation_id}/summary", response_model=ReconciliationSummary)
async def get_reconciliation_summary(
    reconciliation_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get detailed summary of a reconciliation"""
    # Get reconciliation
    recon_result = await db.execute(
        select(BankReconciliation).where(BankReconciliation.id == reconciliation_id)
    )
    reconciliation = recon_result.scalar_one_or_none()

    if not reconciliation:
        raise HTTPException(status_code=404, detail="Reconciliation not found")

    # Get statement transactions
    stmt_result = await db.execute(
        select(BankStatementTransaction)
        .where(BankStatementTransaction.reconciliation_id == reconciliation_id)
    )
    stmt_transactions = stmt_result.scalars().all()

    total_stmt_txns = len(stmt_transactions)
    matched_txns = sum(1 for t in stmt_transactions if t.status == StatementTransactionStatus.MATCHED)
    unmatched_txns = sum(1 for t in stmt_transactions if t.status == StatementTransactionStatus.UNMATCHED)

    # Get outstanding items
    items_result = await db.execute(
        select(ReconciliationItem)
        .where(ReconciliationItem.reconciliation_id == reconciliation_id)
    )
    recon_items = items_result.scalars().all()

    deposits_in_transit = sum(item.amount for item in recon_items
                              if item.item_type == "deposit_in_transit" and not item.is_cleared)
    outstanding_checks = sum(item.amount for item in recon_items
                            if item.item_type == "outstanding_check" and not item.is_cleared)
    bank_charges = sum(item.amount for item in recon_items
                      if item.item_type == "bank_charge" and not item.is_cleared)
    other_adjustments = sum(item.amount for item in recon_items
                          if item.item_type == "other" and not item.is_cleared)

    # Calculate adjusted balance
    adjusted_book_balance = (
        reconciliation.book_balance +
        deposits_in_transit -
        outstanding_checks -
        bank_charges +
        other_adjustments
    )

    difference = reconciliation.statement_balance - adjusted_book_balance
    is_reconciled = abs(difference) < 0.01

    return ReconciliationSummary(
        reconciliation_id=reconciliation.id,
        bank_account_id=reconciliation.bank_account_id,
        statement_date=reconciliation.statement_date,
        statement_balance=reconciliation.statement_balance,
        book_balance=reconciliation.book_balance,
        total_statement_transactions=total_stmt_txns,
        matched_transactions=matched_txns,
        unmatched_transactions=unmatched_txns,
        deposits_in_transit=deposits_in_transit,
        outstanding_checks=outstanding_checks,
        bank_charges=bank_charges,
        other_adjustments=other_adjustments,
        adjusted_book_balance=adjusted_book_balance,
        difference=difference,
        is_reconciled=is_reconciled,
        status=reconciliation.status
    )


# ===== Bank Statements =====

@router.post("/statements/import-csv", response_model=StatementUploadResponse)
async def import_statement_csv(
    import_request: CSVImportRequest,
    db: AsyncSession = Depends(get_db)
):
    """Import bank statement from CSV"""
    try:
        # Parse CSV
        parser = BankStatementParser()
        transactions = parser.parse_csv(
            import_request.csv_data,
            import_request.column_mapping,
            import_request.date_format
        )

        if not transactions:
            raise HTTPException(status_code=400, detail="No transactions found in CSV")

        # Validate statement data
        validation = parser.validate_statement_data(
            transactions,
            import_request.opening_balance,
            import_request.closing_balance
        )

        if not validation["is_valid"]:
            raise HTTPException(
                status_code=400,
                detail=f"Statement validation failed: difference of ${validation['difference']:.2f}"
            )

        # Create bank statement
        db_statement = BankStatement(
            bank_account_id=import_request.bank_account_id,
            statement_date=import_request.statement_date,
            opening_balance=import_request.opening_balance,
            closing_balance=import_request.closing_balance,
            uploaded_by="system"  # TODO: Get from auth
        )
        db.add(db_statement)
        await db.flush()

        # Create statement transactions
        for txn_data in transactions:
            stmt_txn = BankStatementTransaction(
                bank_statement_id=db_statement.id,
                **txn_data
            )
            db.add(stmt_txn)

        await db.commit()
        await db.refresh(db_statement)

        # Auto-match transactions
        matcher = TransactionMatcher(db)
        matches = await matcher.auto_match_transactions(
            import_request.bank_account_id,
            db_statement.id,
            min_confidence=0.8
        )

        # Apply auto-matches
        auto_matched = 0
        for match in matches:
            stmt_txn_result = await db.execute(
                select(BankStatementTransaction)
                .where(BankStatementTransaction.id == match["statement_transaction_id"])
            )
            stmt_txn = stmt_txn_result.scalar_one()

            stmt_txn.matched_transaction_id = match["matched_transaction_id"]
            stmt_txn.status = StatementTransactionStatus.MATCHED
            stmt_txn.match_confidence = match["confidence"]
            stmt_txn.match_reason = match["reason"]
            stmt_txn.is_manual_match = False
            auto_matched += 1

        await db.commit()

        return StatementUploadResponse(
            statement_id=db_statement.id,
            transactions_imported=len(transactions),
            auto_matched=auto_matched,
            unmatched=len(transactions) - auto_matched,
            message=f"Successfully imported {len(transactions)} transactions, auto-matched {auto_matched}"
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to import statement: {str(e)}")


@router.get("/statements", response_model=List[BankStatementResponse])
async def list_bank_statements(
    bank_account_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """List bank statements"""
    query = select(BankStatement)

    if bank_account_id:
        query = query.where(BankStatement.bank_account_id == bank_account_id)

    query = query.offset(skip).limit(limit).order_by(desc(BankStatement.statement_date))

    result = await db.execute(query)
    return result.scalars().all()


# ===== Statement Transactions =====

@router.get("/statement-transactions", response_model=List[BankStatementTransactionResponse])
async def list_statement_transactions(
    bank_statement_id: Optional[UUID] = None,
    reconciliation_id: Optional[UUID] = None,
    status: Optional[StatementTransactionStatus] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """List bank statement transactions"""
    query = select(BankStatementTransaction)

    if bank_statement_id:
        query = query.where(BankStatementTransaction.bank_statement_id == bank_statement_id)

    if reconciliation_id:
        query = query.where(BankStatementTransaction.reconciliation_id == reconciliation_id)

    if status:
        query = query.where(BankStatementTransaction.status == status)

    query = query.offset(skip).limit(limit).order_by(desc(BankStatementTransaction.transaction_date))

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/statement-transactions/match", response_model=BankStatementTransactionResponse)
async def match_transaction(
    match_request: BankStatementTransactionMatch,
    db: AsyncSession = Depends(get_db)
):
    """Manually match a statement transaction with a book transaction"""
    matcher = TransactionMatcher(db)

    matched_txn = await matcher.manual_match(
        match_request.statement_transaction_id,
        match_request.book_transaction_id,
        matched_by="system",  # TODO: Get from auth
        notes=match_request.notes
    )

    return matched_txn


@router.post("/statement-transactions/{transaction_id}/unmatch", response_model=BankStatementTransactionResponse)
async def unmatch_transaction(
    transaction_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Remove matching from a statement transaction"""
    matcher = TransactionMatcher(db)
    unmatched_txn = await matcher.unmatch_transaction(transaction_id)
    return unmatched_txn


@router.post("/statement-transactions/auto-match", response_model=AutoMatchResponse)
async def auto_match(
    auto_match_request: AutoMatchRequest,
    db: AsyncSession = Depends(get_db)
):
    """Automatically match statement transactions with book transactions"""
    # Get bank account ID from reconciliation
    recon_result = await db.execute(
        select(BankReconciliation).where(BankReconciliation.id == auto_match_request.reconciliation_id)
    )
    reconciliation = recon_result.scalar_one_or_none()

    if not reconciliation:
        raise HTTPException(status_code=404, detail="Reconciliation not found")

    matcher = TransactionMatcher(db)
    matches = await matcher.auto_match_transactions(
        reconciliation.bank_account_id,
        auto_match_request.bank_statement_id,
        min_confidence=auto_match_request.min_confidence
    )

    # Get total statement transactions
    total_result = await db.execute(
        select(func.count(BankStatementTransaction.id))
        .where(BankStatementTransaction.bank_statement_id == auto_match_request.bank_statement_id)
    )
    total_count = total_result.scalar()

    return AutoMatchResponse(
        total_statement_transactions=total_count,
        auto_matched_count=len(matches),
        matches=matches
    )


# ===== Reconciliation Items =====

@router.post("/reconciliation-items", response_model=ReconciliationItemResponse)
async def create_reconciliation_item(
    item: ReconciliationItemCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add an outstanding item to reconciliation"""
    db_item = ReconciliationItem(**item.model_dump())
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item


@router.get("/reconciliation-items", response_model=List[ReconciliationItemResponse])
async def list_reconciliation_items(
    reconciliation_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """List reconciliation items"""
    result = await db.execute(
        select(ReconciliationItem)
        .where(ReconciliationItem.reconciliation_id == reconciliation_id)
    )
    return result.scalars().all()


@router.put("/reconciliation-items/{item_id}", response_model=ReconciliationItemResponse)
async def update_reconciliation_item(
    item_id: UUID,
    item_update: ReconciliationItemUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a reconciliation item"""
    result = await db.execute(
        select(ReconciliationItem).where(ReconciliationItem.id == item_id)
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Reconciliation item not found")

    update_data = item_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    item.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(item)

    return item


@router.delete("/reconciliation-items/{item_id}")
async def delete_reconciliation_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete a reconciliation item"""
    result = await db.execute(
        select(ReconciliationItem).where(ReconciliationItem.id == item_id)
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Reconciliation item not found")

    await db.delete(item)
    await db.commit()

    return {"message": "Reconciliation item deleted successfully"}
