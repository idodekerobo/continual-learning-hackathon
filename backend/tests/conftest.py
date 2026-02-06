from __future__ import annotations

from datetime import datetime

import pytest

from app.schemas import SteeringProfileRead


@pytest.fixture
def sample_steering() -> SteeringProfileRead:
    return SteeringProfileRead(
        id=1,
        product_focus="AI Sales Copilot",
        icp="enterprise B2B SaaS",
        key_pains=["long sales cycles", "low win rates", "poor CRM adoption"],
        disallowed_claims=["guaranteed ROI"],
        competitor_list=["Gong", "Clari", "Chorus"],
        weight_news=0.34,
        weight_role_pains=0.33,
        weight_competitors=0.33,
        specificity_rules=[],
        version=1,
        updated_at=datetime(2025, 1, 1),
    )


def youcom_web_hit(
    title: str = "Test Article",
    url: str = "https://example.com/article",
    description: str = "A short snippet about the topic.",
    page_age: str | None = "2025-01-15T10:00:00",
) -> dict:
    return {"title": title, "url": url, "description": description, "page_age": page_age}


def youcom_news_hit(
    title: str = "Breaking News",
    url: str = "https://example.com/news",
    description: str = "News snippet text.",
    page_age: str | None = "2025-01-16T08:00:00",
) -> dict:
    return {"title": title, "url": url, "description": description, "page_age": page_age}


def youcom_success_response(
    web_hits: int = 2, news_hits: int = 1
) -> dict:
    web_results = [
        youcom_web_hit(
            title=f"Web Result {i}",
            url=f"https://example.com/web/{i}",
            description=f"Web description {i}",
        )
        for i in range(web_hits)
    ]
    news_results = [
        youcom_news_hit(
            title=f"News Result {i}",
            url=f"https://example.com/news/{i}",
            description=f"News snippet {i}",
        )
        for i in range(news_hits)
    ]
    return {
        "results": {
            "web": web_results,
            "news": news_results,
        }
    }
