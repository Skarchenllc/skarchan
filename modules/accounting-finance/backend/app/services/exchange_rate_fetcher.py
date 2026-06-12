"""
Exchange Rate Fetcher Service
Fetches live exchange rates from external APIs
"""

import httpx
from typing import Dict, Optional, List
from datetime import date, datetime
import logging

logger = logging.getLogger(__name__)


class ExchangeRateFetcher:
    """Fetch live exchange rates from various sources"""

    def __init__(self):
        self.timeout = 10.0
        # Using exchangerate-api.com (free tier - 1500 requests/month)
        self.api_url = "https://api.exchangerate-api.com/v4/latest/{base}"
        # Alternative: "https://open.er-api.com/v6/latest/{base}" (no limits)
        self.fallback_url = "https://open.er-api.com/v6/latest/{base}"

    async def fetch_rates(
        self,
        base_currency: str,
        target_currencies: Optional[List[str]] = None
    ) -> Dict[str, float]:
        """
        Fetch exchange rates for a base currency

        Args:
            base_currency: The base currency code (e.g., 'USD')
            target_currencies: Optional list of target currency codes to filter

        Returns:
            Dictionary of currency_code: exchange_rate
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Try primary API first
                try:
                    response = await client.get(
                        self.api_url.format(base=base_currency.upper())
                    )
                    response.raise_for_status()
                    data = response.json()
                except Exception as e:
                    logger.warning(f"Primary API failed, trying fallback: {e}")
                    # Try fallback API
                    response = await client.get(
                        self.fallback_url.format(base=base_currency.upper())
                    )
                    response.raise_for_status()
                    data = response.json()

                # Extract rates
                rates = data.get("rates", {})

                # Filter to target currencies if specified
                if target_currencies:
                    rates = {
                        code: rate
                        for code, rate in rates.items()
                        if code.upper() in [c.upper() for c in target_currencies]
                    }

                logger.info(
                    f"Fetched {len(rates)} exchange rates for {base_currency}"
                )
                return rates

        except httpx.TimeoutException:
            logger.error("Exchange rate API request timed out")
            raise Exception("Exchange rate API request timed out")
        except httpx.HTTPStatusError as e:
            logger.error(f"Exchange rate API HTTP error: {e}")
            raise Exception(f"Exchange rate API error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Error fetching exchange rates: {e}")
            raise Exception(f"Failed to fetch exchange rates: {str(e)}")

    async def fetch_single_rate(
        self,
        from_currency: str,
        to_currency: str
    ) -> float:
        """
        Fetch a single exchange rate between two currencies

        Args:
            from_currency: Source currency code
            to_currency: Target currency code

        Returns:
            Exchange rate as float
        """
        rates = await self.fetch_rates(
            base_currency=from_currency,
            target_currencies=[to_currency]
        )

        rate = rates.get(to_currency.upper())
        if rate is None:
            raise Exception(
                f"Exchange rate not found for {from_currency}/{to_currency}"
            )

        return rate

    async def fetch_multiple_bases(
        self,
        base_currencies: List[str]
    ) -> Dict[str, Dict[str, float]]:
        """
        Fetch exchange rates for multiple base currencies

        Args:
            base_currencies: List of base currency codes

        Returns:
            Dictionary of {base_currency: {target_currency: rate}}
        """
        result = {}

        for base in base_currencies:
            try:
                rates = await self.fetch_rates(base_currency=base)
                result[base.upper()] = rates
            except Exception as e:
                logger.error(f"Failed to fetch rates for {base}: {e}")
                continue

        return result

    def get_supported_sources(self) -> List[Dict[str, str]]:
        """
        Get list of supported exchange rate sources

        Returns:
            List of source information dictionaries
        """
        return [
            {
                "name": "ExchangeRate-API",
                "url": "https://www.exchangerate-api.com",
                "free_tier": "1500 requests/month",
                "update_frequency": "Daily"
            },
            {
                "name": "Open Exchange Rates API",
                "url": "https://open.er-api.com",
                "free_tier": "Unlimited",
                "update_frequency": "Daily"
            }
        ]


# Helper function to create fetcher instance
def get_exchange_rate_fetcher() -> ExchangeRateFetcher:
    """Get an instance of the exchange rate fetcher"""
    return ExchangeRateFetcher()
