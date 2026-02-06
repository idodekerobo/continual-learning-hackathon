from fastapi import APIRouter

from app.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    # Placeholder health check.
    print("hitting health endpoint")
    return HealthResponse(status="ok", version="0.1.0")

