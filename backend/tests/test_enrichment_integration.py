from __future__ import annotations

import os

import pytest

from app.schemas import SteeringProfileRead
from app.services.enrichment import enrich_meeting

_HAS_KEY = os.getenv("YOUCOM_API_KEY") is not None


@pytest.mark.integration
@pytest.mark.asyncio
@pytest.mark.skipif(not _HAS_KEY, reason="YOUCOM_API_KEY env var not set")
async def test_enrich_meeting_live():
    """Live integration test — calls the real You.com API.

    Run with:
        YOUCOM_API_KEY=<key> python -m pytest tests/test_enrichment_integration.py -v -m integration
    """
    steering = SteeringProfileRead(
        id=1,
        product_focus="AI Sales Copilot",
        icp="enterprise B2B SaaS",
        key_pains=["long sales cycles", "low win rates"],
        competitor_list=["Gong", "Clari", "Chorus"],
    )

    result = await enrich_meeting(
        company="Salesforce",
        role="VP of Sales",
        attendees=[],
        steering=steering,
    )

    # All three searches should succeed with at least 1 result
    assert result.company_news.error is None, f"company_news error: {result.company_news.error}"
    assert len(result.company_news.results) >= 1
    print(f"\n--- Company News ({len(result.company_news.results)} results) ---")
    for r in result.company_news.results:
        print(f"  {r.title}: {r.url}")

    assert result.role_pains.error is None, f"role_pains error: {result.role_pains.error}"
    assert len(result.role_pains.results) >= 1
    print(f"\n--- Role Pains ({len(result.role_pains.results)} results) ---")
    for r in result.role_pains.results:
        print(f"  {r.title}: {r.url}")

    assert result.competitor_landscape.error is None, f"competitor_landscape error: {result.competitor_landscape.error}"
    assert len(result.competitor_landscape.results) >= 1
    print(f"\n--- Competitor Landscape ({len(result.competitor_landscape.results)} results) ---")
    for r in result.competitor_landscape.results:
        print(f"  {r.title}: {r.url}")
