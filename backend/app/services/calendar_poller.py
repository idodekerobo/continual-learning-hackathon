from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import Meeting, MeetingStatus

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def fetch_upcoming_events(
    *,
    days_ahead: int = 7,
    calendar_id: str = "primary",
    max_results: int = 25,
) -> list[dict[str, Any]]:
    """Fetch upcoming Google Calendar events using Composio.

    This is the Option B "foundation": fetch + parse + log. It does not persist
    results yet (no DB), so it cannot reliably detect "new" events across runs.
    """
    settings = get_settings()
    if not settings.COMPOSIO_API_KEY:
        logger.warning("COMPOSIO_API_KEY not configured")
        return []
    if not settings.COMPOSIO_USER_ID:
        logger.warning("COMPOSIO_USER_ID not configured")
        return []

    try:
        from composio import Composio  # type: ignore[import-not-found]
    except Exception as exc:
        logger.error("Composio SDK import failed: %s", exc)
        return []

    now = datetime.now(tz=timezone.utc)
    time_min = now.isoformat().replace("+00:00", "Z")
    time_max = (now + timedelta(days=days_ahead)).isoformat().replace("+00:00", "Z")

    logger.info(
        "fetching calendar events (calendarId=%s timeMin=%s timeMax=%s)",
        calendar_id,
        time_min,
        time_max,
    )

    composio = Composio(api_key=settings.COMPOSIO_API_KEY)

    # Composio SDK is sync; run it off the event loop.
    def _execute() -> dict[str, Any]:
        return composio.tools.execute(
            "GOOGLECALENDAR_EVENTS_LIST",
            user_id=settings.COMPOSIO_USER_ID,
            arguments={
                "calendarId": calendar_id,
                "timeMin": time_min,
                "timeMax": time_max,
                "singleEvents": True,
                "orderBy": "startTime",
                "maxResults": max_results,
            },
        )

    raw = await asyncio.to_thread(_execute)

    if not raw.get("successful"):
        logger.warning("calendar list failed: %s", raw.get("error") or raw)
        return []

    data = raw.get("data") or {}
    items = data.get("items") or []
    if not isinstance(items, list):
        logger.warning("unexpected calendar list response shape: %s", type(items))
        return []

    logger.info("calendar list returned %s items", len(items))
    return items


def parse_event(raw: dict[str, Any]) -> dict[str, Any]:
    """Parse a Google Calendar event into a minimal, stable shape."""
    start = (raw.get("start") or {}).get("dateTime") or (raw.get("start") or {}).get("date")
    attendees = raw.get("attendees") or []
    parsed_attendees: list[dict[str, Any]] = []
    if isinstance(attendees, list):
        for a in attendees:
            if isinstance(a, dict):
                parsed_attendees.append(
                    {"email": a.get("email"), "name": a.get("displayName"), "responseStatus": a.get("responseStatus")}
                )

    return {
        "calendar_event_id": raw.get("id"),
        "title": raw.get("summary") or "",
        "start_time": start,
        "html_link": raw.get("htmlLink"),
        "attendees": parsed_attendees,
        "organizer_email": (raw.get("organizer") or {}).get("email"),
        "status": raw.get("status"),
    }


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        iso = value.replace("Z", "+00:00")
        if "T" not in iso:
            iso = f"{iso}T00:00:00+00:00"
        dt = datetime.fromisoformat(iso)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def _infer_company_from_attendees(attendees: list[dict[str, Any]]) -> str:
    """Best-effort company inference from attendee email domain."""
    for a in attendees:
        if not isinstance(a, dict):
            continue
        email = a.get("email")
        if not email or "@" not in str(email):
            continue
        domain = str(email).split("@", 1)[1].lower().strip()
        if domain:
            return domain
    return "Unknown"


async def poll_and_log(
    *,
    days_ahead: int = 7,
    calendar_id: str = "primary",
) -> int:
    """Poll calendar and log parsed event summaries. Returns count of events."""
    events = await fetch_upcoming_events(days_ahead=days_ahead, calendar_id=calendar_id)
    for e in events[:10]:
        parsed = parse_event(e)
        logger.info(
            "event: %s | %s | %s",
            parsed.get("start_time"),
            parsed.get("title"),
            parsed.get("calendar_event_id"),
        )
    return len(events)


async def poll_and_upsert(
    db: AsyncSession, *, days_ahead: int = 7, calendar_id: str = "primary"
) -> int:
    events = await fetch_upcoming_events(days_ahead=days_ahead, calendar_id=calendar_id)
    new_meetings = 0
    for raw in events:
        parsed = parse_event(raw)
        calendar_event_id = parsed.get("calendar_event_id")
        if not calendar_event_id:
            continue

        existing = await db.execute(
            select(Meeting).where(Meeting.calendar_event_id == calendar_event_id)
        )
        if existing.scalar_one_or_none():
            continue

        attendees = parsed.get("attendees") or []
        meeting = Meeting(
            calendar_event_id=calendar_event_id,
            title=parsed.get("title") or "",
            datetime_utc=_parse_datetime(parsed.get("start_time")),
            attendees=attendees,
            company=_infer_company_from_attendees(attendees),
            role="Unknown",
            status=MeetingStatus.New,
        )
        db.add(meeting)
        new_meetings += 1

    if new_meetings:
        await db.commit()
    return new_meetings

