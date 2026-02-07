from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)


async def create_drafts(
    *, recipient_email: str, pre_meeting: dict[str, Any], follow_up: dict[str, Any]
) -> list[str]:
    settings = get_settings()
    if not settings.COMPOSIO_API_KEY:
        logger.warning("COMPOSIO_API_KEY not configured")
        return []
    if not settings.COMPOSIO_USER_ID:
        logger.warning("COMPOSIO_USER_ID not configured")
        return []

    try:
        from composio import Composio  # type: ignore[import-not-found]
        from composio.client.enums import Action  # type: ignore[import-not-found]
    except Exception as exc:
        logger.error("Composio SDK import failed: %s", exc)
        return []

    composio = Composio(api_key=settings.COMPOSIO_API_KEY)
    entity = composio.get_entity(settings.COMPOSIO_USER_ID)

    def _execute(payload: dict[str, Any]) -> dict[str, Any]:
        return entity.execute(
            action=Action.GMAIL_CREATE_EMAIL_DRAFT,
            params=payload,
        )

    async def _draft(subject: str, body: str) -> str | None:
        raw = await asyncio.to_thread(
            _execute,
            {
                "to": recipient_email,
                "subject": subject,
                "body": body,
            },
        )
        if not raw.get("successful"):
            logger.warning("gmail draft failed: %s", raw.get("error") or raw)
            return None
        data = raw.get("data") or {}
        return data.get("id")

    draft_ids: list[str] = []
    pre_id = await _draft(pre_meeting.get("subject", ""), pre_meeting.get("body", ""))
    if pre_id:
        draft_ids.append(pre_id)

    follow_id = await _draft(
        follow_up.get("subject", ""), follow_up.get("body", "")
    )
    if follow_id:
        draft_ids.append(follow_id)

    return draft_ids
