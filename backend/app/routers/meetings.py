from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter

from app.schemas import FeedbackRequest, MeetingDetail, MeetingListItem, MeetingStatus

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("", response_model=List[MeetingListItem])
async def list_meetings() -> List[MeetingListItem]:
    print("hitting meetings list endpoint")
    # Placeholder response so frontend can wire up quickly.
    now = datetime.now(tz=timezone.utc)
    return [
        MeetingListItem(
            id=1,
            title="(placeholder) Intro call",
            datetime_utc=now,
            company="ExampleCo",
            role="CEO",
            status=MeetingStatus.New,
        )
    ]


@router.get("/{meeting_id}", response_model=MeetingDetail)
async def get_meeting(meeting_id: int) -> MeetingDetail:
    print(f"hitting meeting detail endpoint: meeting_id={meeting_id}")
    now = datetime.now(tz=timezone.utc)
    return MeetingDetail(
        id=meeting_id,
        title=f"(placeholder) Meeting {meeting_id}",
        datetime_utc=now,
        company="ExampleCo",
        role="CEO",
        status=MeetingStatus.New,
        attendees=[{"email": "prospect@example.com", "name": "Prospect"}],
        insights=[{"text": "Placeholder insight", "why": "demo", "priority": 1}],
        hooks=[{"hook": "Placeholder hook", "source": "demo"}],
        competitors=[{"name": "CompetitorX", "positioning": "placeholder"}],
        draft_ids=[],
        notion_page_id=None,
        steering_version=1,
    )


@router.post("/{meeting_id}/run", response_model=MeetingDetail)
async def run_pipeline(meeting_id: int) -> MeetingDetail:
    print(f"hitting meeting run endpoint: meeting_id={meeting_id}")
    now = datetime.now(tz=timezone.utc)
    return MeetingDetail(
        id=meeting_id,
        title=f"(placeholder) Meeting {meeting_id}",
        datetime_utc=now,
        company="ExampleCo",
        role="CEO",
        status=MeetingStatus.Drafted,
        attendees=[{"email": "prospect@example.com"}],
        insights=[{"text": "Ran placeholder pipeline", "why": "demo", "priority": 1}],
        hooks=[{"hook": "Pipeline-generated placeholder hook", "source": "demo"}],
        competitors=[],
        draft_ids=["draft_1", "draft_2"],
        notion_page_id="notion_page_placeholder",
        steering_version=1,
    )


@router.post("/{meeting_id}/feedback", response_model=MeetingDetail)
async def submit_feedback(meeting_id: int, body: FeedbackRequest) -> MeetingDetail:
    print(
        f"hitting meeting feedback endpoint: meeting_id={meeting_id}, score={body.score}, notes={body.notes!r}"
    )
    now = datetime.now(tz=timezone.utc)
    status = MeetingStatus.FeedbackGiven if body.score in (0, 1) else MeetingStatus.Error
    return MeetingDetail(
        id=meeting_id,
        title=f"(placeholder) Meeting {meeting_id}",
        datetime_utc=now,
        company="ExampleCo",
        role="CEO",
        status=status,
        attendees=[],
        insights=[],
        hooks=[],
        competitors=[],
        draft_ids=[],
        feedback_score=body.score,
        feedback_notes=body.notes,
        steering_version=1,
    )

