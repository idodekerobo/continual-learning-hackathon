from __future__ import annotations

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Meeting, MeetingStatus
from app.schemas import FeedbackRequest, MeetingDetail, MeetingListItem
from app.services.pipeline import run_pipeline_for_new_meetings
from app.steering import apply_feedback

router = APIRouter(prefix="/meetings", tags=["meetings"])


def _meeting_to_list_item(meeting: Meeting) -> MeetingListItem:
    return MeetingListItem(
        id=meeting.id,
        title=meeting.title,
        datetime_utc=meeting.datetime_utc or datetime.utcnow(),
        company=meeting.company,
        role=meeting.role,
        status=MeetingStatus(meeting.status),
    )


def _meeting_to_detail(meeting: Meeting) -> MeetingDetail:
    return MeetingDetail(
        id=meeting.id,
        title=meeting.title,
        datetime_utc=meeting.datetime_utc or datetime.utcnow(),
        company=meeting.company,
        role=meeting.role,
        status=MeetingStatus(meeting.status),
        attendees=meeting.attendees or [],
        insights=meeting.insights or [],
        hooks=meeting.hooks or [],
        competitors=meeting.competitors or [],
        draft_ids=meeting.draft_ids or [],
        notion_page_id=meeting.notion_page_id,
        feedback_score=meeting.feedback_score,
        feedback_notes=meeting.feedback_notes,
        steering_version=meeting.steering_version,
        error_message=meeting.error_message,
    )


@router.get("", response_model=List[MeetingListItem])
async def list_meetings(db: AsyncSession = Depends(get_db)) -> List[MeetingListItem]:
    result = await db.execute(select(Meeting).order_by(Meeting.datetime_utc.desc()))
    meetings = result.scalars().all()
    return [_meeting_to_list_item(m) for m in meetings]


@router.get("/{meeting_id}", response_model=MeetingDetail)
async def get_meeting(
    meeting_id: int, db: AsyncSession = Depends(get_db)
) -> MeetingDetail:
    meeting = await db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return _meeting_to_detail(meeting)


@router.post("/{meeting_id}/run", response_model=MeetingDetail)
async def run_pipeline(
    meeting_id: int, db: AsyncSession = Depends(get_db)
) -> MeetingDetail:
    meeting = await db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    meeting.status = MeetingStatus.New
    await db.commit()

    await run_pipeline_for_new_meetings(db, poll=False)
    await db.refresh(meeting)
    return _meeting_to_detail(meeting)


@router.post("/{meeting_id}/feedback", response_model=MeetingDetail)
async def submit_feedback(
    meeting_id: int, body: FeedbackRequest, db: AsyncSession = Depends(get_db)
) -> MeetingDetail:
    meeting = await db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    meeting.feedback_score = body.score
    meeting.feedback_notes = body.notes
    meeting.status = MeetingStatus.FeedbackGiven
    await apply_feedback(db, score=body.score, notes=body.notes)
    await db.commit()
    await db.refresh(meeting)
    return _meeting_to_detail(meeting)

