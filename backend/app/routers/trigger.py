from fastapi import APIRouter

from app.schemas import TriggerPollResponse

router = APIRouter(tags=["trigger"])


@router.post("/trigger-poll", response_model=TriggerPollResponse)
async def trigger_poll() -> TriggerPollResponse:
    print("hitting trigger-poll endpoint")
    # Placeholder counts until calendar poller + pipeline exist.
    return TriggerPollResponse(new_meetings=0, processed_meetings=0)

