from __future__ import annotations

from unittest.mock import patch

import httpx
import pytest
import respx

from app.services.enrichment import (
    EnrichmentResult,
    SearchQueryOutcome,
    _build_company_query,
    _build_competitor_query,
    _build_role_pains_query,
    _parse_response,
    _search_youcom,
    enrich_meeting,
)

from tests.conftest import youcom_success_response, youcom_web_hit, youcom_news_hit

# ---------------------------------------------------------------------------
# Query builders
# ---------------------------------------------------------------------------


class TestBuildCompanyQuery:
    def test_build_company_query(self):
        q = _build_company_query("Acme Corp", "AI Sales Copilot")
        assert "Acme Corp" in q
        assert "AI Sales Copilot" in q
        assert "news" in q.lower() or "announcements" in q.lower()

    def test_build_company_query_strips(self):
        q = _build_company_query("Acme", "")
        assert not q.endswith(" ")


class TestBuildRolePainsQuery:
    def test_build_role_pains_query(self):
        q = _build_role_pains_query(
            "VP of Sales", "Acme", "enterprise B2B SaaS", ["long sales cycles", "low win rates", "extra"]
        )
        assert "VP of Sales" in q
        assert "Acme" in q
        assert "enterprise B2B SaaS" in q
        assert "long sales cycles" in q
        assert "low win rates" in q
        # Only first 2 pains included
        assert "extra" not in q

    def test_build_role_pains_query_empty_pains(self):
        q = _build_role_pains_query("CTO", "Acme", "mid-market", [])
        assert "CTO" in q
        assert "Acme" in q
        assert not q.endswith(" ")


class TestBuildCompetitorQuery:
    def test_build_competitor_query_with_competitors(self):
        q = _build_competitor_query("Acme", "AI Copilot", ["Gong", "Clari", "Chorus", "Extra"])
        assert "Gong" in q
        assert "Clari" in q
        assert "Chorus" in q
        assert "Extra" not in q
        assert "AI Copilot" in q

    def test_build_competitor_query_fallback(self):
        q = _build_competitor_query("Acme", "AI Copilot", [])
        assert q == "Acme competitors"


# ---------------------------------------------------------------------------
# Response parsing
# ---------------------------------------------------------------------------


class TestParseResponse:
    def test_parse_response_merges_web_and_news(self):
        raw = youcom_success_response(web_hits=2, news_hits=2)
        results = _parse_response(raw, max_results=10)
        assert len(results) == 4
        # First 2 are web, next 2 are news
        assert results[0].title == "Web Result 0"
        assert results[2].title == "News Result 0"

    def test_parse_response_respects_max_results(self):
        raw = youcom_success_response(web_hits=5, news_hits=5)
        results = _parse_response(raw, max_results=3)
        assert len(results) == 3

    def test_parse_response_truncates_long_snippets(self):
        long_desc = "x" * 800
        raw = {"results": {"web": [youcom_web_hit(description=long_desc)]}}
        results = _parse_response(raw, max_results=5)
        assert len(results) == 1
        assert len(results[0].snippet) == 500

    def test_parse_response_empty_response(self):
        results = _parse_response({}, max_results=5)
        assert results == []


# ---------------------------------------------------------------------------
# _search_youcom — error paths (async, uses respx)
# ---------------------------------------------------------------------------

_SEARCH_URL = "https://ydc-index.io/v1/search"


def _fake_settings(api_key: str | None = "test-key"):
    """Return a mock Settings object with the given API key."""

    class _FakeSettings:
        YOUCOM_API_KEY = api_key

    return _FakeSettings()


class TestSearchYoucom:
    @pytest.mark.asyncio
    async def test_search_missing_api_key(self):
        with patch("app.services.enrichment.get_settings", return_value=_fake_settings(api_key=None)):
            outcome = await _search_youcom("test query")
        assert outcome.error == "YOUCOM_API_KEY not configured"
        assert outcome.results == []

    @pytest.mark.asyncio
    @respx.mock
    async def test_search_success(self):
        respx.get(_SEARCH_URL).mock(
            return_value=httpx.Response(200, json=youcom_success_response(web_hits=2, news_hits=1))
        )
        with patch("app.services.enrichment.get_settings", return_value=_fake_settings()):
            outcome = await _search_youcom("test query", count=5)
        assert outcome.error is None
        assert len(outcome.results) == 3

    @pytest.mark.asyncio
    @respx.mock
    async def test_search_auth_error_401(self):
        respx.get(_SEARCH_URL).mock(return_value=httpx.Response(401))
        with patch("app.services.enrichment.get_settings", return_value=_fake_settings()):
            outcome = await _search_youcom("test query")
        assert outcome.error == "Authentication error (401)"

    @pytest.mark.asyncio
    @respx.mock
    async def test_search_rate_limited(self):
        respx.get(_SEARCH_URL).mock(return_value=httpx.Response(429))
        with patch("app.services.enrichment.get_settings", return_value=_fake_settings()):
            outcome = await _search_youcom("test query")
        assert outcome.error == "Rate limited by You.com API"

    @pytest.mark.asyncio
    @respx.mock
    async def test_search_timeout(self):
        respx.get(_SEARCH_URL).mock(side_effect=httpx.TimeoutException("timed out"))
        with patch("app.services.enrichment.get_settings", return_value=_fake_settings()):
            outcome = await _search_youcom("test query")
        assert outcome.error == "Search request timed out"

    @pytest.mark.asyncio
    @respx.mock
    async def test_search_connection_error(self):
        respx.get(_SEARCH_URL).mock(side_effect=httpx.ConnectError("connection refused"))
        with patch("app.services.enrichment.get_settings", return_value=_fake_settings()):
            outcome = await _search_youcom("test query")
        assert "Connection error" in outcome.error


# ---------------------------------------------------------------------------
# enrich_meeting orchestrator
# ---------------------------------------------------------------------------


class TestEnrichMeeting:
    @pytest.mark.asyncio
    @respx.mock
    async def test_enrich_meeting_success(self, sample_steering):
        respx.get(_SEARCH_URL).mock(
            return_value=httpx.Response(200, json=youcom_success_response(web_hits=2, news_hits=1))
        )
        with patch("app.services.enrichment.get_settings", return_value=_fake_settings()):
            result = await enrich_meeting(
                company="Salesforce",
                role="VP of Sales",
                attendees=[],
                steering=sample_steering,
            )
        assert isinstance(result, EnrichmentResult)
        assert result.company_news.error is None
        assert result.role_pains.error is None
        assert result.competitor_landscape.error is None
        assert len(result.company_news.results) > 0
        assert len(result.role_pains.results) > 0
        assert len(result.competitor_landscape.results) > 0

    @pytest.mark.asyncio
    async def test_enrich_meeting_partial_failure(self, sample_steering):
        """One search fails (missing key), the others succeed via respx."""
        call_count = 0

        def _alternating_settings():
            nonlocal call_count
            call_count += 1
            # First call returns no key, subsequent calls return a key
            if call_count == 1:
                return _fake_settings(api_key=None)
            return _fake_settings(api_key="test-key")

        with respx.mock:
            respx.get(_SEARCH_URL).mock(
                return_value=httpx.Response(200, json=youcom_success_response(web_hits=2, news_hits=1))
            )
            with patch("app.services.enrichment.get_settings", side_effect=_alternating_settings):
                result = await enrich_meeting(
                    company="Salesforce",
                    role="VP of Sales",
                    attendees=[],
                    steering=sample_steering,
                )

        # At least one should have errored, at least one should have succeeded
        errors = [
            result.company_news.error,
            result.role_pains.error,
            result.competitor_landscape.error,
        ]
        assert any(e is not None for e in errors), "Expected at least one error"
        assert any(e is None for e in errors), "Expected at least one success"

    @pytest.mark.asyncio
    @respx.mock
    async def test_enrich_meeting_query_construction(self, sample_steering):
        """Verify the correct queries are built from the steering profile."""
        captured_queries: list[str] = []

        def _capture_route(request: httpx.Request) -> httpx.Response:
            captured_queries.append(str(request.url.params.get("query", "")))
            return httpx.Response(200, json=youcom_success_response())

        respx.get(_SEARCH_URL).mock(side_effect=_capture_route)

        with patch("app.services.enrichment.get_settings", return_value=_fake_settings()):
            await enrich_meeting(
                company="Salesforce",
                role="VP of Sales",
                attendees=[],
                steering=sample_steering,
            )

        assert len(captured_queries) == 3

        # Company query should contain company name and product focus
        company_q = _build_company_query("Salesforce", sample_steering.product_focus)
        assert company_q in captured_queries

        # Role pains query
        role_q = _build_role_pains_query(
            "VP of Sales", "Salesforce", sample_steering.icp, sample_steering.key_pains
        )
        assert role_q in captured_queries

        # Competitor query
        competitor_q = _build_competitor_query(
            "Salesforce", sample_steering.product_focus, sample_steering.competitor_list
        )
        assert competitor_q in captured_queries
