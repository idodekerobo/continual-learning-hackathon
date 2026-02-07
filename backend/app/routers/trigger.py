from __future__ import annotations

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import TriggerPollResponse
from app.services.calendar_poller import poll_and_upsert
from app.services.pipeline import run_pipeline_for_new_meetings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["trigger"])


@router.post("/trigger-poll", response_model=TriggerPollResponse)
async def trigger_poll(db: AsyncSession = Depends(get_db)) -> TriggerPollResponse:
    logger.info("hitting trigger-poll endpoint")
    # Render Cron hits this endpoint; the pipeline performs calendar polling.
    new_meetings = await poll_and_upsert(db, days_ahead=7, calendar_id="primary")
    processed_meetings = await run_pipeline_for_new_meetings(db, poll=False)
    logger.info(
        "trigger-poll: new_meetings=%s processed=%s",
        new_meetings,
        processed_meetings,
    )
    return TriggerPollResponse(new_meetings=new_meetings, processed_meetings=processed_meetings)

