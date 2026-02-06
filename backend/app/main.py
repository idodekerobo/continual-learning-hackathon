from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers.health import router as health_router
from app.routers.meetings import router as meetings_router
from app.routers.steering import router as steering_router
from app.routers.trigger import router as trigger_router


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(title="continual_learning_hackathon backend", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(meetings_router)
    app.include_router(steering_router)
    app.include_router(trigger_router)

    return app


app = create_app()

