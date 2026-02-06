from __future__ import annotations

import asyncio
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import SessionLocal

from app.models import Meeting, MeetingStatus
from app.services.calendar_poller import poll_and_upsert
from app.services.enrichment import enrich_meeting
from app.services.gmail_drafter import create_drafts
from app.services.notion_sync import upsert_notion_row
from app.services.synthesis import synthesize_meeting_prep
from app.steering import get_current_steering

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def run_pipeline_for_new_meetings(
    db: AsyncSession | None = None, *, poll: bool = True
) -> int:
    """Orchestrate the end-to-end agent workflow for any NEW meetings.

    In the full implementation (per `Backend.md`), this will:
    - Load NEW meetings from the DB (or insert them from calendar polling)
    - Enrich (You.com) in parallel
    - Synthesize (OpenAI GPT-4o structured output)
    - Persist artifacts + status updates
    - Sync to Notion + create Gmail drafts (via Composio)

    For now, this is a stub so we can wire the trigger endpoint end-to-end.
    """
    if db is None:
        async with SessionLocal() as session:
            return await _run_pipeline_for_new_meetings(session, poll=poll)

    return await _run_pipeline_for_new_meetings(db, poll=poll)


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


async def _run_pipeline_for_new_meetings(db: AsyncSession, *, poll: bool) -> int:
    logger.info("run_pipeline_for_new_meetings: starting (stub)")

    if poll:
        await poll_and_upsert(db, days_ahead=7, calendar_id="primary")

    result = await db.execute(
        select(Meeting).where(Meeting.status == MeetingStatus.New)
    )
    meetings = list(result.scalars().all())

    steering = await get_current_steering(db)

    processed_meetings = 0
    for m in meetings:
        logger.info(
            "processing meeting (stub): %s",
            m.title or m.calendar_event_id or m.id or "unknown",
        )

        m.status = MeetingStatus.Enriching
        m.steering_version = steering.version
        await db.commit()

        enrichment = await enrich_meeting(
            company=m.company or "Unknown",
            role=m.role or "Unknown",
            attendees=m.attendees or [],
            steering=steering,
        )

        synthesis = await synthesize_meeting_prep(
            enrichment=enrichment,
            meeting_title=m.title or "",
            company=m.company or "Unknown",
            role=m.role or "Unknown",
            attendees=m.attendees or [],
            steering=steering,
        )

        if synthesis.error:
            logger.warning("synthesis returned error: %s", synthesis.error)
            m.status = MeetingStatus.Error
            m.error_message = synthesis.error
            await db.commit()
            continue

        logger.info(
            "synthesis complete (insights=%s hooks=%s)",
            len(synthesis.insights),
            len(synthesis.hooks),
        )
        m.insights = [i.model_dump() for i in synthesis.insights]
        m.hooks = [h.model_dump() for h in synthesis.hooks]
        m.competitors = [c.model_dump() for c in synthesis.competitors]
        m.status = MeetingStatus.Enriched
        await db.commit()

        notion_page_id = await upsert_notion_row(
            meeting_data={
                "title": m.title,
                "company": m.company,
                "role": m.role,
                "status": m.status.value,
            },
            existing_page_id=m.notion_page_id,
        )
        if notion_page_id:
            m.notion_page_id = notion_page_id

        recipient = ""
        if m.attendees:
            email = m.attendees[0].get("email")
            if email:
                recipient = str(email)
        draft_ids = []
        if recipient:
            draft_ids = await create_drafts(
                recipient_email=recipient,
                pre_meeting=synthesis.pre_meeting_draft.model_dump(),
                follow_up=synthesis.follow_up_draft.model_dump(),
            )
        m.draft_ids = draft_ids

        m.status = MeetingStatus.Drafted
        await db.commit()

        processed_meetings += 1

    logger.info("run_pipeline_for_new_meetings: done (processed=%s)", processed_meetings)
    return processed_meetings


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

