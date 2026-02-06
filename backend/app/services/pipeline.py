from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from app.schemas import SteeringProfileRead
from app.services.calendar_poller import fetch_upcoming_events, parse_event
from app.services.enrichment import enrich_meeting
from app.services.synthesis import synthesize_meeting_prep

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def run_pipeline_for_new_meetings() -> int:
    """Orchestrate the end-to-end agent workflow for any NEW meetings.

    In the full implementation (per `Backend.md`), this will:
    - Load NEW meetings from the DB (or insert them from calendar polling)
    - Enrich (You.com) in parallel
    - Synthesize (OpenAI GPT-4o structured output)
    - Persist artifacts + status updates
    - Sync to Notion + create Gmail drafts (via Composio)

    For now, this is a stub so we can wire the trigger endpoint end-to-end.
    """
    logger.info("run_pipeline_for_new_meetings: starting (stub)")

    # Poll Google Calendar
    #  no persistence yet - this means repeated runs will re-process the same events.
    events = await fetch_upcoming_events(days_ahead=7, calendar_id="primary", max_results=25)
    logger.info("polled %s calendar events", len(events))

    meetings: list[dict] = []
    for raw in events:
        parsed = parse_event(raw)
        company = _infer_company_from_attendees(parsed.get("attendees") or [])
        meetings.append(
            {
                "calendar_event_id": parsed.get("calendar_event_id"),
                "title": parsed.get("title") or "",
                "start_time": parsed.get("start_time"),
                "company": company,
                "role": "Unknown",
                "attendees": parsed.get("attendees") or [],
            }
        )

    # TODO: Load current steering profile from DB (versioned).
    steering = _default_steering()

    processed_meetings = 0
    for m in meetings:
        logger.info("processing meeting (stub): %s", m.get("title") or m.get("id") or "unknown")

        # TODO: set status=Enriching in DB
        enrichment = await enrich_meeting(
            company=m["company"],
            role=m["role"],
            attendees=m.get("attendees", []),
            steering=steering,
        )

        synthesis = await synthesize_meeting_prep(
            enrichment=enrichment,
            meeting_title=m.get("title", ""),
            company=m["company"],
            role=m["role"],
            attendees=m.get("attendees", []),
            steering=steering,
        )

        if synthesis.error:
            logger.warning("synthesis returned error: %s", synthesis.error)
            # TODO: set status=Error + error_message in DB
            continue

        logger.info(
            "synthesis complete (insights=%s hooks=%s)",
            len(synthesis.insights),
            len(synthesis.hooks),
        )
        # TODO: persist synthesis outputs to DB
        # TODO: notion upsert -> gmail drafts -> set status=Drafted

        processed_meetings += 1

    logger.info("run_pipeline_for_new_meetings: done (processed=%s)", processed_meetings)
    return processed_meetings


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


def _default_steering() -> SteeringProfileRead:
    """Temporary steering profile until persistence is implemented."""
    return SteeringProfileRead(
        id=1,
        product_focus="(placeholder) Always-on meeting prep agent",
        icp="(placeholder) B2B SaaS founders",
        key_pains=["Generic outreach", "Low reply rates"],
        disallowed_claims=["We guarantee outcomes"],
        competitor_list=["CompetitorX", "CompetitorY"],
        weight_news=0.34,
        weight_role_pains=0.33,
        weight_competitors=0.33,
        specificity_rules=["Reference recent news", "Avoid vague claims"],
        version=1,
        updated_at=datetime.now(tz=timezone.utc),
    )


def _infer_company_from_attendees(attendees: list[dict]) -> str:
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


def _main() -> None:
    """
    Local/dev convenience entrypoint.

    Usage (from `backend/` directory):
      python -m app.services.pipeline
    """
    logging.basicConfig(level=logging.INFO)
    processed = asyncio.run(run_pipeline_for_new_meetings())
    logger.info("processed_meetings=%s", processed)


# ---------------------------------------------------------------------------
# Module execution
# ---------------------------------------------------------------------------


if __name__ == "__main__":
    _main()

