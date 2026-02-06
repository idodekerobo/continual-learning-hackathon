from __future__ import annotations

from datetime import datetime
from typing import Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SteeringProfile
from app.schemas import SteeringProfileRead, SteeringProfileUpdate


def _model_to_schema(model: SteeringProfile) -> SteeringProfileRead:
    return SteeringProfileRead(
        id=model.id,
        product_focus=model.product_focus,
        icp=model.icp,
        key_pains=model.key_pains,
        disallowed_claims=model.disallowed_claims,
        competitor_list=model.competitor_list,
        weight_news=model.weight_news,
        weight_role_pains=model.weight_role_pains,
        weight_competitors=model.weight_competitors,
        specificity_rules=model.specificity_rules,
        version=model.version,
        updated_at=model.updated_at,
    )


async def get_current_steering(db: AsyncSession) -> SteeringProfileRead:
    result = await db.execute(
        select(SteeringProfile).order_by(SteeringProfile.version.desc()).limit(1)
    )
    current = result.scalar_one_or_none()
    if current:
        return _model_to_schema(current)

    default = SteeringProfile(
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
        updated_at=datetime.utcnow(),
    )
    db.add(default)
    await db.commit()
    await db.refresh(default)
    return _model_to_schema(default)


async def create_updated_profile(
    db: AsyncSession, update: SteeringProfileUpdate
) -> SteeringProfileRead:
    current = await get_current_steering(db)
    data = current.model_dump()
    patch = update.model_dump(exclude_none=True)
    data.update(patch)
    data["version"] = current.version + 1
    data["updated_at"] = datetime.utcnow()

    new_profile = SteeringProfile(**data)
    db.add(new_profile)
    await db.commit()
    await db.refresh(new_profile)
    return _model_to_schema(new_profile)


def _normalize(weights: Iterable[float]) -> tuple[float, float, float]:
    values = [max(0.0, w) for w in weights]
    total = sum(values) or 1.0
    return (values[0] / total, values[1] / total, values[2] / total)


async def apply_feedback(
    db: AsyncSession, *, score: int, notes: str | None
) -> SteeringProfileRead:
    current = await get_current_steering(db)
    if score == 1:
        return current

    text = (notes or "").lower()
    weight_news = current.weight_news
    weight_role_pains = current.weight_role_pains
    weight_competitors = current.weight_competitors
    specificity_rules = list(current.specificity_rules or [])

    if "generic" in text or "specific" in text:
        if "Be more specific" not in specificity_rules:
            specificity_rules.append("Be more specific")
    if "news" in text:
        weight_news += 0.1
    if "role" in text or "pain" in text:
        weight_role_pains += 0.1
    if "competitor" in text:
        weight_competitors += 0.1

    weight_news, weight_role_pains, weight_competitors = _normalize(
        [weight_news, weight_role_pains, weight_competitors]
    )

    new_profile = SteeringProfile(
        product_focus=current.product_focus,
        icp=current.icp,
        key_pains=current.key_pains,
        disallowed_claims=current.disallowed_claims,
        competitor_list=current.competitor_list,
        weight_news=weight_news,
        weight_role_pains=weight_role_pains,
        weight_competitors=weight_competitors,
        specificity_rules=specificity_rules,
        version=current.version + 1,
        updated_at=datetime.utcnow(),
    )
    db.add(new_profile)
    await db.commit()
    await db.refresh(new_profile)
    return _model_to_schema(new_profile)
