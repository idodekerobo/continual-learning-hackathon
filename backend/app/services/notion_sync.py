from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)


async def upsert_notion_row(
    *,
    meeting_data: dict[str, Any],
    existing_page_id: str | None = None,
) -> str | None:
    settings = get_settings()
    if not settings.COMPOSIO_API_KEY:
        logger.warning("COMPOSIO_API_KEY not configured")
        return None
    if not settings.COMPOSIO_USER_ID:
        logger.warning("COMPOSIO_USER_ID not configured")
        return None
    if not settings.NOTION_DATABASE_ID:
        logger.warning("NOTION_DATABASE_ID not configured")
        return None

    try:
        from composio import Composio  # type: ignore[import-not-found]
    except Exception as exc:
        logger.error("Composio SDK import failed: %s", exc)
        return None

    properties = {
        "Title": {"title": [{"text": {"content": meeting_data.get("title") or ""}}]},
        "Company": {"rich_text": [{"text": {"content": meeting_data.get("company") or ""}}]},
        "Role": {"rich_text": [{"text": {"content": meeting_data.get("role") or ""}}]},
        "Status": {"select": {"name": meeting_data.get("status") or "Drafted"}},
    }

    composio = Composio(api_key=settings.COMPOSIO_API_KEY)

    def _execute() -> dict[str, Any]:
        if existing_page_id:
            return composio.tools.execute(
                "NOTION_UPDATE_ROW_DATABASE",
                user_id=settings.COMPOSIO_USER_ID,
                arguments={
                    "database_id": settings.NOTION_DATABASE_ID,
                    "page_id": existing_page_id,
                    "properties": properties,
                },
            )
        return composio.tools.execute(
            "NOTION_INSERT_ROW_DATABASE",
            user_id=settings.COMPOSIO_USER_ID,
            arguments={
                "database_id": settings.NOTION_DATABASE_ID,
                "properties": properties,
            },
        )

    raw = await asyncio.to_thread(_execute)
    if not raw.get("successful"):
        logger.warning("notion upsert failed: %s", raw.get("error") or raw)
        return None

    data = raw.get("data") or {}
    return data.get("id") or existing_page_id
