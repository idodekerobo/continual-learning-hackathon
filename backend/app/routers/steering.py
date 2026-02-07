from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import SteeringProfileRead, SteeringProfileUpdate
from app.steering import create_updated_profile, get_current_steering

router = APIRouter(tags=["steering"])


@router.get("/steering", response_model=SteeringProfileRead)
async def get_steering(db: AsyncSession = Depends(get_db)) -> SteeringProfileRead:
    return await get_current_steering(db)


@router.put("/steering", response_model=SteeringProfileRead)
async def update_steering(
    body: SteeringProfileUpdate, db: AsyncSession = Depends(get_db)
) -> SteeringProfileRead:
    return await create_updated_profile(db, body)

