from __future__ import annotations

import logging
from typing import Any, Optional

from agents import Agent, ModelSettings, Runner
from pydantic import BaseModel, Field

from app.config import get_settings
from app.schemas import SteeringProfileRead
from app.services.enrichment import EnrichmentResult

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Return types (structured output)
# ---------------------------------------------------------------------------


class Insight(BaseModel):
    text: str = Field(description="One prioritized insight for the founder")
    why: str = Field(description="Why this matters for this meeting")
    priority: int = Field(ge=1, le=5, description="1 = highest priority, 5 = lowest")


class Hook(BaseModel):
    hook: str = Field(description="A specific personalization hook grounded in enrichment")
    source: str = Field(description="Short reference to the source (e.g., URL or 'You.com news')")


class Competitor(BaseModel):
    name: str
    positioning: str = Field(description="1–2 lines on positioning / relevance")


class EmailDraft(BaseModel):
    subject: str
    body: str = Field(description="Plaintext email body")


class SynthesisResult(BaseModel):
    insights: list[Insight] = Field(default_factory=list)
    hooks: list[Hook] = Field(default_factory=list)
    competitors: list[Competitor] = Field(default_factory=list)
    pre_meeting_draft: EmailDraft
    follow_up_draft: EmailDraft
    error: Optional[str] = Field(default=None, description="Set only when synthesis failed")


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


def _build_system_instructions(steering: SteeringProfileRead) -> str:
    """Build a steering-aware instruction block for synthesis."""
    return "\n".join(
        [
            "You are an always-on meeting prep agent for founder-led sales.",
            "Your job is to turn real-time enrichment data into:",
            "1) prioritized insights, 2) personalization hooks, 3) competitor notes,",
            "4) a pre-meeting email draft, and 5) a follow-up template draft.",
            "",
            "Hard requirements:",
            "- Be specific and grounded in the enrichment; avoid generic claims.",
            "- Prefer concrete facts and cite sources in hooks.sources when possible.",
            "- Email Draft 1 (pre-meeting): 80–150 words, 2–3 specific hooks, 2 discovery questions.",
            "- Email Draft 2 (follow-up): a good template with placeholders for post-meeting details.",
            "",
            "Steering profile (how to frame everything):",
            f"- Product focus: {steering.product_focus}",
            f"- ICP: {steering.icp}",
            f"- Key pains: {', '.join(steering.key_pains) or '(none)'}",
            f"- Disallowed claims: {', '.join(steering.disallowed_claims) or '(none)'}",
            f"- Competitor list: {', '.join(steering.competitor_list) or '(none)'}",
            f"- Weights: news={steering.weight_news:.2f}, role_pains={steering.weight_role_pains:.2f}, competitors={steering.weight_competitors:.2f}",
            f"- Specificity rules: {', '.join(steering.specificity_rules) or '(none)'}",
        ]
    ).strip()


def _build_input_payload(
    *,
    enrichment: EnrichmentResult,
    meeting_title: str,
    company: str,
    role: str,
    attendees: list[dict[str, Any]],
) -> str:
    """Build a compact text payload the agent can reliably ground on."""
    data = {
        "meeting": {
            "title": meeting_title,
            "company": company,
            "role": role,
            "attendees": attendees,
        },
        "enrichment": enrichment.model_dump(),
    }
    # Keep it simple: the Agents SDK will handle structured output via output_type.
    return (
        "Use the following meeting context + enrichment to produce the structured output.\n\n"
        f"{data}"
    )


def _fallback_result(error: str) -> SynthesisResult:
    """Return a minimal, UI-safe object when synthesis cannot run."""
    return SynthesisResult(
        insights=[],
        hooks=[],
        competitors=[],
        pre_meeting_draft=EmailDraft(
            subject="(placeholder) Pre-meeting note",
            body="(placeholder) Synthesis is not configured yet.",
        ),
        follow_up_draft=EmailDraft(
            subject="(placeholder) Follow-up",
            body="(placeholder) Synthesis is not configured yet.",
        ),
        error=error,
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def synthesize_meeting_prep(
    *,
    enrichment: EnrichmentResult,
    meeting_title: str,
    company: str,
    role: str,
    attendees: list[dict[str, Any]],
    steering: SteeringProfileRead,
) -> SynthesisResult:
    """Synthesize meeting prep artifacts using the OpenAI Agents SDK (single-agent).

    Returns a structured `SynthesisResult`. This function is "soft-fail": it returns
    a placeholder result with `.error` set if OpenAI isn't configured or if the run fails.
    """
    settings = get_settings()
    if not settings.OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not configured")
        return _fallback_result("OPENAI_API_KEY not configured")

    instructions = _build_system_instructions(steering)
    payload = _build_input_payload(
        enrichment=enrichment,
        meeting_title=meeting_title,
        company=company,
        role=role,
        attendees=attendees,
    )

    agent = Agent(
        name="Meeting Prep Synthesizer",
        instructions=instructions,
        model="gpt-4o",
        model_settings=ModelSettings(temperature=0.2),
        output_type=SynthesisResult,
    )

    try:
        result = await Runner.run(agent, payload)
        final = result.final_output_as(SynthesisResult)
        return final
    except Exception as exc:
        msg = f"Unexpected error: {exc}"
        logger.error(msg)
        return _fallback_result(msg)

