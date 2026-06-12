from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from datetime import datetime, timedelta, date
from typing import List, Dict, Tuple, Optional
from uuid import UUID

from app.models.bank_reconciliation import BankStatementTransaction, StatementTransactionStatus
from app.models.transaction import Transaction, TransactionStatus
from app.models.account import Account


class TransactionMatcher:
    """Automatic matching of bank statement transactions with book transactions"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def auto_match_transactions(
        self,
        bank_account_id: UUID,
        bank_statement_id: UUID,
        min_confidence: float = 0.8,
        date_tolerance_days: int = 3
    ) -> List[Dict]:
        """
        Automatically match bank statement transactions with book transactions

        Matching criteria (in order of priority):
        1. Exact match: Same amount, reference, and date
        2. Amount + date match: Same amount within date tolerance
        3. Amount + description match: Same amount with similar description
        4. Fuzzy match: Similar amount and description

        Returns list of matches with confidence scores
        """
        matches = []

        # Get unmatched bank statement transactions
        stmt_result = await self.db.execute(
            select(BankStatementTransaction)
            .where(
                and_(
                    BankStatementTransaction.bank_statement_id == bank_statement_id,
                    BankStatementTransaction.status == StatementTransactionStatus.UNMATCHED
                )
            )
        )
        stmt_transactions = stmt_result.scalars().all()

        # Get book transactions from the bank account (unreconciled)
        # First, get the account_id from bank_account
        from app.models.bank_reconciliation import BankAccount
        bank_acc_result = await self.db.execute(
            select(BankAccount).where(BankAccount.id == bank_account_id)
        )
        bank_account = bank_acc_result.scalar_one_or_none()

        if not bank_account:
            return matches

        # Get book transactions
        # For now, we'll get all posted transactions
        # In production, filter by account and reconciliation status
        book_result = await self.db.execute(
            select(Transaction)
            .where(Transaction.status == TransactionStatus.POSTED)
            .order_by(Transaction.date.desc())
            .limit(1000)  # Reasonable limit
        )
        book_transactions = book_result.scalars().all()

        # Match each statement transaction
        for stmt_txn in stmt_transactions:
            best_match = await self._find_best_match(
                stmt_txn,
                book_transactions,
                date_tolerance_days
            )

            if best_match and best_match["confidence"] >= min_confidence:
                matches.append({
                    "statement_transaction_id": stmt_txn.id,
                    "matched_transaction_id": best_match["transaction_id"],
                    "confidence": best_match["confidence"],
                    "reason": best_match["reason"]
                })

        return matches

    async def _find_best_match(
        self,
        stmt_txn: BankStatementTransaction,
        book_transactions: List[Transaction],
        date_tolerance_days: int
    ) -> Optional[Dict]:
        """Find the best matching book transaction for a statement transaction"""

        # Determine the amount to match (debit or credit)
        stmt_amount = stmt_txn.debit_amount if stmt_txn.debit_amount > 0 else stmt_txn.credit_amount
        is_debit = stmt_txn.debit_amount > 0

        best_match = None
        highest_confidence = 0.0

        for book_txn in book_transactions:
            confidence, reason = self._calculate_match_score(
                stmt_txn,
                book_txn,
                stmt_amount,
                date_tolerance_days
            )

            if confidence > highest_confidence:
                highest_confidence = confidence
                best_match = {
                    "transaction_id": book_txn.id,
                    "confidence": confidence,
                    "reason": reason
                }

        return best_match if highest_confidence > 0 else None

    def _calculate_match_score(
        self,
        stmt_txn: BankStatementTransaction,
        book_txn: Transaction,
        stmt_amount: float,
        date_tolerance_days: int
    ) -> Tuple[float, str]:
        """
        Calculate match confidence score between 0.0 and 1.0

        Returns (confidence, reason)
        """
        confidence = 0.0
        reasons = []

        # 1. Amount match (most important - 40 points)
        if abs(stmt_amount - book_txn.amount) < 0.01:
            confidence += 0.40
            reasons.append("exact amount match")
        elif abs(stmt_amount - book_txn.amount) < 1.00:
            confidence += 0.30
            reasons.append("amount match within $1")
        elif abs(stmt_amount - book_txn.amount) / max(stmt_amount, book_txn.amount) < 0.05:
            confidence += 0.20
            reasons.append("amount within 5%")
        else:
            # Amount doesn't match closely enough
            return 0.0, "amount mismatch"

        # 2. Date match (30 points)
        date_diff = abs((stmt_txn.transaction_date - book_txn.date.date()).days)
        if date_diff == 0:
            confidence += 0.30
            reasons.append("same date")
        elif date_diff <= date_tolerance_days:
            # Sliding scale based on days difference
            confidence += 0.30 * (1 - date_diff / (date_tolerance_days + 1))
            reasons.append(f"date within {date_diff} days")
        else:
            # Date too far apart, reduce confidence
            confidence *= 0.5

        # 3. Reference match (20 points)
        if stmt_txn.reference and book_txn.reference:
            if self._normalize_reference(stmt_txn.reference) == self._normalize_reference(book_txn.reference):
                confidence += 0.20
                reasons.append("reference match")
            elif self._normalize_reference(stmt_txn.reference) in self._normalize_reference(book_txn.reference) or \
                 self._normalize_reference(book_txn.reference) in self._normalize_reference(stmt_txn.reference):
                confidence += 0.10
                reasons.append("partial reference match")

        # 4. Description similarity (10 points)
        desc_similarity = self._calculate_description_similarity(
            stmt_txn.description,
            book_txn.description
        )
        confidence += 0.10 * desc_similarity
        if desc_similarity > 0.5:
            reasons.append(f"description similarity {desc_similarity:.0%}")

        # Ensure confidence doesn't exceed 1.0
        confidence = min(confidence, 1.0)

        reason = ", ".join(reasons) if reasons else "no match"

        return confidence, reason

    @staticmethod
    def _normalize_reference(reference: str) -> str:
        """Normalize reference string for comparison"""
        if not reference:
            return ""
        # Remove spaces, convert to uppercase, remove special characters
        return "".join(c for c in reference.upper() if c.isalnum())

    @staticmethod
    def _calculate_description_similarity(desc1: str, desc2: str) -> float:
        """
        Calculate similarity between two descriptions using simple word matching

        In production, use more sophisticated algorithms like:
        - Levenshtein distance
        - Cosine similarity with TF-IDF
        - Semantic similarity with embeddings
        """
        if not desc1 or not desc2:
            return 0.0

        # Normalize descriptions
        words1 = set(desc1.lower().split())
        words2 = set(desc2.lower().split())

        # Calculate Jaccard similarity
        intersection = words1.intersection(words2)
        union = words1.union(words2)

        if not union:
            return 0.0

        return len(intersection) / len(union)

    async def manual_match(
        self,
        statement_transaction_id: UUID,
        book_transaction_id: UUID,
        matched_by: str,
        notes: Optional[str] = None
    ) -> BankStatementTransaction:
        """Manually match a statement transaction with a book transaction"""

        # Get statement transaction
        stmt_result = await self.db.execute(
            select(BankStatementTransaction)
            .where(BankStatementTransaction.id == statement_transaction_id)
        )
        stmt_txn = stmt_result.scalar_one()

        # Update matching information
        stmt_txn.matched_transaction_id = book_transaction_id
        stmt_txn.status = StatementTransactionStatus.MATCHED
        stmt_txn.is_manual_match = True
        stmt_txn.matched_by = matched_by
        stmt_txn.matched_at = datetime.utcnow()
        stmt_txn.match_confidence = 1.0
        stmt_txn.match_reason = "Manual match"
        if notes:
            stmt_txn.notes = notes

        await self.db.commit()
        await self.db.refresh(stmt_txn)

        return stmt_txn

    async def unmatch_transaction(
        self,
        statement_transaction_id: UUID
    ) -> BankStatementTransaction:
        """Remove matching from a statement transaction"""

        stmt_result = await self.db.execute(
            select(BankStatementTransaction)
            .where(BankStatementTransaction.id == statement_transaction_id)
        )
        stmt_txn = stmt_result.scalar_one()

        stmt_txn.matched_transaction_id = None
        stmt_txn.status = StatementTransactionStatus.UNMATCHED
        stmt_txn.is_manual_match = False
        stmt_txn.matched_by = None
        stmt_txn.matched_at = None
        stmt_txn.match_confidence = None
        stmt_txn.match_reason = None

        await self.db.commit()
        await self.db.refresh(stmt_txn)

        return stmt_txn
