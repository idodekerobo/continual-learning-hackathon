from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class MeetingStatus(str, Enum):
    New = "New"
    Enriching = "Enriching"
    Enriched = "Enriched"
    Drafted = "Drafted"
    FeedbackGiven = "FeedbackGiven"
    Error = "Error"


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"


class MeetingListItem(BaseModel):
    id: int
    title: str
    datetime_utc: datetime
    company: Optional[str] = None
    role: Optional[str] = None
    status: MeetingStatus = MeetingStatus.New


class MeetingDetail(MeetingListItem):
    attendees: List[Dict[str, Any]] = Field(default_factory=list)
    insights: List[Dict[str, Any]] = Field(default_factory=list)
    hooks: List[Dict[str, Any]] = Field(default_factory=list)
    competitors: List[Dict[str, Any]] = Field(default_factory=list)
    draft_ids: List[str] = Field(default_factory=list)
    notion_page_id: Optional[str] = None
    feedback_score: Optional[int] = None
    feedback_notes: Optional[str] = None
    steering_version: Optional[int] = None
    error_message: Optional[str] = None


class FeedbackRequest(BaseModel):
    score: int = Field(ge=0, le=1, description="0 = thumbs down, 1 = thumbs up")
    notes: Optional[str] = None


class SteeringProfileRead(BaseModel):
    id: int
    product_focus: str = ""
    icp: str = ""
    key_pains: List[str] = Field(default_factory=list)
    disallowed_claims: List[str] = Field(default_factory=list)
    competitor_list: List[str] = Field(default_factory=list)
    weight_news: float = 0.34
    weight_role_pains: float = 0.33
    weight_competitors: float = 0.33
    specificity_rules: List[str] = Field(default_factory=list)
    version: int = 1
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SteeringProfileUpdate(BaseModel):
    product_focus: Optional[str] = None
    icp: Optional[str] = None
    key_pains: Optional[List[str]] = None
    disallowed_claims: Optional[List[str]] = None
    competitor_list: Optional[List[str]] = None
    weight_news: Optional[float] = None
    weight_role_pains: Optional[float] = None
    weight_competitors: Optional[float] = None
    specificity_rules: Optional[List[str]] = None


class TriggerPollResponse(BaseModel):
    new_meetings: int = 0
    processed_meetings: int = 0

