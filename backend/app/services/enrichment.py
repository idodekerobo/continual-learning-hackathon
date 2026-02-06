from __future__ import annotations

import asyncio
import logging
from typing import Optional

import httpx
from pydantic import BaseModel

from app.config import get_settings
from app.schemas import SteeringProfileRead

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Return types
# ---------------------------------------------------------------------------


class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    age: Optional[str] = None


class SearchQueryOutcome(BaseModel):
    query: str
    results: list[SearchResult] = []
    error: Optional[str] = None


class EnrichmentResult(BaseModel):
    company_news: SearchQueryOutcome
    role_pains: SearchQueryOutcome
    competitor_landscape: SearchQueryOutcome


# ---------------------------------------------------------------------------
# Private helpers — query builders
# ---------------------------------------------------------------------------


def _build_company_query(company: str, product_focus: str) -> str:
    return f"{company} latest news announcements {product_focus}".strip()


def _build_role_pains_query(
    role: str, company: str, icp: str, key_pains: list[str]
) -> str:
    pains_fragment = " ".join(key_pains[:2])
    return f"{role} pain points challenges {company} {icp} {pains_fragment}".strip()


def _build_competitor_query(
    company: str, product_focus: str, competitor_list: list[str]
) -> str:
    if competitor_list:
        competitors = " ".join(competitor_list[:3])
        return f"{competitors} comparison {product_focus}".strip()
    return f"{company} competitors"


# ---------------------------------------------------------------------------
# Private helpers — You.com interaction
# ---------------------------------------------------------------------------

_YOUCOM_SEARCH_URL = "https://ydc-index.io/v1/search"


def _parse_response(raw: dict, max_results: int) -> list[SearchResult]:
    """Merge web + news hits from a You.com response into SearchResult list."""
    items: list[SearchResult] = []

    results_wrapper = raw.get("results", raw)
    for section in ("web", "news"):
        for hit in results_wrapper.get(section, []):
            if len(items) >= max_results:
                break
            snippet = (hit.get("description") or hit.get("snippet") or "")[:500]
            items.append(
                SearchResult(
                    title=hit.get("title", ""),
                    url=hit.get("url", ""),
                    snippet=snippet,
                    age=hit.get("page_age") or hit.get("age"),
                )
            )

    return items[:max_results]


async def _search_youcom(
    query: str, count: int = 5, freshness: str = "month"
) -> SearchQueryOutcome:
    """Execute a single You.com search. Never raises — errors go into .error."""
    settings = get_settings()

    if not settings.YOUCOM_API_KEY:
        logger.warning("YOUCOM_API_KEY not configured")
        return SearchQueryOutcome(query=query, error="YOUCOM_API_KEY not configured")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                _YOUCOM_SEARCH_URL,
                params={"query": query, "count": count, "freshness": freshness},
                headers={"X-API-Key": settings.YOUCOM_API_KEY},
            )

        if resp.status_code in (401, 403):
            msg = f"Authentication error ({resp.status_code})"
            logger.error(msg)
            return SearchQueryOutcome(query=query, error=msg)

        if resp.status_code == 429:
            logger.warning("Rate limited by You.com API")
            return SearchQueryOutcome(query=query, error="Rate limited by You.com API")

        resp.raise_for_status()
        results = _parse_response(resp.json(), max_results=count)
        return SearchQueryOutcome(query=query, results=results)

    except httpx.TimeoutException:
        logger.error("Search request timed out for query: %s", query)
        return SearchQueryOutcome(query=query, error="Search request timed out")
    except httpx.RequestError as exc:
        msg = f"Connection error: {exc}"
        logger.error(msg)
        return SearchQueryOutcome(query=query, error=msg)
    except Exception as exc:
        msg = f"Unexpected error: {exc}"
        logger.error(msg)
        return SearchQueryOutcome(query=query, error=msg)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def enrich_meeting(
    company: str,
    role: str,
    attendees: list[dict],
    steering: SteeringProfileRead,
) -> EnrichmentResult:
    """Run three parallel You.com searches and return enrichment data.

    ``attendees`` is accepted for forward-compatibility but not consumed yet.
    """
    company_q = _build_company_query(company, steering.product_focus)
    role_q = _build_role_pains_query(
        role, company, steering.icp, steering.key_pains
    )
    competitor_q = _build_competitor_query(
        company, steering.product_focus, steering.competitor_list
    )

    company_news, role_pains, competitor_landscape = await asyncio.gather(
        _search_youcom(company_q, count=5, freshness="month"),
        _search_youcom(role_q, count=5, freshness="year"),
        _search_youcom(competitor_q, count=5, freshness="month"),
    )

    return EnrichmentResult(
        company_news=company_news,
        role_pains=role_pains,
        competitor_landscape=competitor_landscape,
    )
