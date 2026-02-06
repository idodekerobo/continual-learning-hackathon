from __future__ import annotations

import logging

from fastapi import APIRouter

from app.schemas import TriggerPollResponse
from app.services.pipeline import run_pipeline_for_new_meetings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["trigger"])


@router.post("/trigger-poll", response_model=TriggerPollResponse)
async def trigger_poll() -> TriggerPollResponse:
    logger.info("hitting trigger-poll endpoint")
    # Render Cron hits this endpoint; the pipeline performs calendar polling.
    new_meetings = 0
    processed_meetings = await run_pipeline_for_new_meetings()
    logger.info(
        "trigger-poll: new_meetings=%s processed=%s",
        new_meetings,
        processed_meetings,
    )
    return TriggerPollResponse(new_meetings=new_meetings, processed_meetings=processed_meetings)

