import csv
import io
import base64
from datetime import datetime
from typing import List, Dict, Any, Optional
from decimal import Decimal


class BankStatementParser:
    """Parse bank statements from various formats"""

    @staticmethod
    def parse_csv(
        csv_data: str,
        column_mapping: Dict[str, str],
        date_format: str = "%Y-%m-%d",
        skip_header: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Parse CSV bank statement data

        Args:
            csv_data: Base64 encoded CSV content or plain CSV string
            column_mapping: Map of field names to CSV column names
            date_format: Date format string for parsing dates
            skip_header: Whether to skip the first row

        Returns:
            List of transaction dictionaries
        """
        try:
            # Decode if base64
            if BankStatementParser._is_base64(csv_data):
                csv_content = base64.b64decode(csv_data).decode('utf-8')
            else:
                csv_content = csv_data

            # Parse CSV
            csv_file = io.StringIO(csv_content)
            reader = csv.DictReader(csv_file)

            transactions = []

            for row in reader:
                try:
                    transaction = BankStatementParser._parse_row(
                        row, column_mapping, date_format
                    )
                    if transaction:
                        transactions.append(transaction)
                except Exception as e:
                    print(f"Error parsing row {row}: {e}")
                    continue

            return transactions

        except Exception as e:
            raise ValueError(f"Failed to parse CSV: {str(e)}")

    @staticmethod
    def _parse_row(
        row: Dict[str, str],
        column_mapping: Dict[str, str],
        date_format: str
    ) -> Optional[Dict[str, Any]]:
        """Parse a single CSV row into a transaction dictionary"""

        try:
            # Extract values based on column mapping
            date_col = column_mapping.get("date", "Date")
            desc_col = column_mapping.get("description", "Description")
            debit_col = column_mapping.get("debit", "Debit")
            credit_col = column_mapping.get("credit", "Credit")
            balance_col = column_mapping.get("balance", "Balance")
            ref_col = column_mapping.get("reference", "Reference")

            # Parse date
            date_str = row.get(date_col, "").strip()
            if not date_str:
                return None

            transaction_date = datetime.strptime(date_str, date_format).date()

            # Parse amounts
            debit_str = row.get(debit_col, "0").strip()
            credit_str = row.get(credit_col, "0").strip()
            balance_str = row.get(balance_col, "").strip()

            debit_amount = BankStatementParser._parse_amount(debit_str)
            credit_amount = BankStatementParser._parse_amount(credit_str)
            balance = BankStatementParser._parse_amount(balance_str) if balance_str else None

            # Get description and reference
            description = row.get(desc_col, "").strip()
            reference = row.get(ref_col, "").strip()

            if not description:
                return None

            return {
                "transaction_date": transaction_date,
                "description": description,
                "reference": reference or None,
                "debit_amount": float(debit_amount),
                "credit_amount": float(credit_amount),
                "balance": float(balance) if balance is not None else None,
                "value_date": transaction_date  # Default to transaction date
            }

        except Exception as e:
            print(f"Error parsing row: {e}")
            return None

    @staticmethod
    def _parse_amount(amount_str: str) -> Decimal:
        """Parse amount string to Decimal, handling various formats"""
        if not amount_str or amount_str.strip() == "":
            return Decimal("0")

        # Remove currency symbols, commas, and spaces
        cleaned = amount_str.replace("$", "").replace(",", "").replace(" ", "").strip()

        # Handle parentheses for negative numbers
        if cleaned.startswith("(") and cleaned.endswith(")"):
            cleaned = "-" + cleaned[1:-1]

        try:
            return Decimal(cleaned)
        except:
            return Decimal("0")

    @staticmethod
    def _is_base64(s: str) -> bool:
        """Check if string is base64 encoded"""
        try:
            if len(s) % 4 != 0:
                return False
            base64.b64decode(s, validate=True)
            return True
        except:
            return False

    @staticmethod
    def detect_date_format(sample_dates: List[str]) -> str:
        """
        Attempt to detect date format from sample dates

        Common formats:
        - %Y-%m-%d (2024-01-15)
        - %d/%m/%Y (15/01/2024)
        - %m/%d/%Y (01/15/2024)
        - %d-%m-%Y (15-01-2024)
        """
        common_formats = [
            "%Y-%m-%d",
            "%d/%m/%Y",
            "%m/%d/%Y",
            "%d-%m-%Y",
            "%m-%d-%Y",
            "%Y/%m/%d",
            "%d.%m.%Y",
            "%b %d, %Y",
            "%B %d, %Y",
        ]

        for date_format in common_formats:
            try:
                for date_str in sample_dates[:3]:  # Test first 3 dates
                    datetime.strptime(date_str.strip(), date_format)
                return date_format
            except:
                continue

        # Default to ISO format
        return "%Y-%m-%d"

    @staticmethod
    def validate_statement_data(
        transactions: List[Dict[str, Any]],
        opening_balance: float,
        closing_balance: float
    ) -> Dict[str, Any]:
        """
        Validate that statement transactions reconcile with opening/closing balances

        Returns validation result with any discrepancies
        """
        if not transactions:
            return {
                "is_valid": False,
                "error": "No transactions found"
            }

        # Calculate running balance
        calculated_balance = opening_balance

        for txn in transactions:
            calculated_balance += txn["credit_amount"]
            calculated_balance -= txn["debit_amount"]

        # Check if final balance matches
        difference = abs(calculated_balance - closing_balance)
        is_valid = difference < 0.01  # Allow for rounding errors

        return {
            "is_valid": is_valid,
            "opening_balance": opening_balance,
            "closing_balance": closing_balance,
            "calculated_closing_balance": calculated_balance,
            "difference": difference,
            "transaction_count": len(transactions),
            "total_debits": sum(t["debit_amount"] for t in transactions),
            "total_credits": sum(t["credit_amount"] for t in transactions)
        }
