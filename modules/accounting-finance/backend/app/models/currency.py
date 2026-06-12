from sqlalchemy import Column, String, Float, DateTime, Boolean, ForeignKey, Date, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class Currency(Base):
    """Currency definitions and base rates"""
    __tablename__ = "currencies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Currency Information
    code = Column(String(3), unique=True, nullable=False, index=True)  # USD, EUR, GBP, etc.
    name = Column(String(100), nullable=False)  # US Dollar, Euro, British Pound
    symbol = Column(String(10))  # $, €, £

    # Exchange Rate Information
    exchange_rate = Column(Float, nullable=False, default=1.0)  # Rate relative to base currency
    is_base_currency = Column(Boolean, default=False)  # Only one currency should be base

    # Decimal Places
    decimal_places = Column(Integer, default=2)  # Number of decimal places for this currency

    # Status
    is_active = Column(Boolean, default=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Currency {self.code} - {self.name}>"


class ExchangeRate(Base):
    """Historical exchange rates for currency conversion"""
    __tablename__ = "exchange_rates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Currency Pair
    from_currency_code = Column(String(3), ForeignKey("currencies.code"), nullable=False)
    to_currency_code = Column(String(3), ForeignKey("currencies.code"), nullable=False)

    # Rate Information
    rate = Column(Float, nullable=False)
    inverse_rate = Column(Float, nullable=False)  # Automatically calculated inverse

    # Date and Source
    effective_date = Column(Date, nullable=False, index=True)
    source = Column(String(100))  # API, Manual, Bank, etc.

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))

    def __repr__(self):
        return f"<ExchangeRate {self.from_currency_code}/{self.to_currency_code} = {self.rate} on {self.effective_date}>"


class CurrencyExchangeTransaction(Base):
    """Record of currency exchange transactions"""
    __tablename__ = "currency_exchange_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Transaction Information
    transaction_number = Column(String(100), unique=True, nullable=False, index=True)
    transaction_date = Column(Date, nullable=False)

    # Currency Exchange Details
    from_currency_code = Column(String(3), ForeignKey("currencies.code"), nullable=False)
    to_currency_code = Column(String(3), ForeignKey("currencies.code"), nullable=False)

    from_amount = Column(Float, nullable=False)
    to_amount = Column(Float, nullable=False)
    exchange_rate = Column(Float, nullable=False)

    # Accounts (from chart of accounts)
    from_account_id = Column(UUID(as_uuid=True))  # Account being debited
    to_account_id = Column(UUID(as_uuid=True))  # Account being credited

    # Gain/Loss Tracking
    realized_gain_loss = Column(Float, default=0.0)
    gain_loss_account_id = Column(UUID(as_uuid=True))  # Account for recording gain/loss

    # Reference
    reference = Column(String(200))
    notes = Column(String(500))

    # Metadata
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<CurrencyExchange {self.transaction_number}: {self.from_amount} {self.from_currency_code} -> {self.to_amount} {self.to_currency_code}>"


class UnrealizedGainLoss(Base):
    """Track unrealized foreign exchange gains/losses"""
    __tablename__ = "unrealized_gain_loss"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Account and Currency
    account_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    currency_code = Column(String(3), ForeignKey("currencies.code"), nullable=False)

    # Calculation Period
    calculation_date = Column(Date, nullable=False, index=True)

    # Balance Information
    foreign_currency_balance = Column(Float, nullable=False)
    original_exchange_rate = Column(Float, nullable=False)
    current_exchange_rate = Column(Float, nullable=False)

    # Gain/Loss
    base_currency_balance_original = Column(Float, nullable=False)
    base_currency_balance_current = Column(Float, nullable=False)
    unrealized_gain_loss = Column(Float, nullable=False)  # Difference between current and original

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<UnrealizedGainLoss Account:{self.account_id} {self.currency_code} on {self.calculation_date}: {self.unrealized_gain_loss}>"
