from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from app.schemas import SteeringProfileRead, SteeringProfileUpdate

router = APIRouter(tags=["steering"])


@router.get("/steering", response_model=SteeringProfileRead)
async def get_steering() -> SteeringProfileRead:
    print("hitting steering endpoint")
    # Placeholder profile so UI can render without DB.
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


@router.put("/steering", response_model=SteeringProfileRead)
async def update_steering(body: SteeringProfileUpdate) -> SteeringProfileRead:
    print(f"hitting steering update endpoint: body={body.model_dump(exclude_none=True)}")
    # Placeholder: echo an incremented version.
    current = await get_steering()
    data = current.model_dump()
    patch = body.model_dump(exclude_none=True)
    data.update(patch)
    data["version"] = current.version + 1
    data["updated_at"] = datetime.now(tz=timezone.utc)
    return SteeringProfileRead(**data)

