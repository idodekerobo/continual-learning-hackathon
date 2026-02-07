from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from sqlalchemy import DateTime, Enum as SqlEnum, Float, Integer, String, Text
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MeetingStatus(str, Enum):
    New = "New"
    Enriching = "Enriching"
    Enriched = "Enriched"
    Drafted = "Drafted"
    FeedbackGiven = "FeedbackGiven"
    Error = "Error"


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    calendar_event_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(500), default="")
    datetime_utc: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    attendees: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[MeetingStatus] = mapped_column(SqlEnum(MeetingStatus), default=MeetingStatus.New)
    insights: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    hooks: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    competitors: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    draft_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    notion_page_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    feedback_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    feedback_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    steering_version: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class SteeringProfile(Base):
    __tablename__ = "steering_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_focus: Mapped[str] = mapped_column(String(500), default="")
    icp: Mapped[str] = mapped_column(String(500), default="")
    key_pains: Mapped[list[str]] = mapped_column(JSON, default=list)
    disallowed_claims: Mapped[list[str]] = mapped_column(JSON, default=list)
    competitor_list: Mapped[list[str]] = mapped_column(JSON, default=list)
    weight_news: Mapped[float] = mapped_column(Float, default=0.34)
    weight_role_pains: Mapped[float] = mapped_column(Float, default=0.33)
    weight_competitors: Mapped[float] = mapped_column(Float, default=0.33)
    specificity_rules: Mapped[list[str]] = mapped_column(JSON, default=list)
    version: Mapped[int] = mapped_column(Integer, default=1)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
