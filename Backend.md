# Backend Implementation Plan: Autonomous Trigger Monitor

## Context
The project is a hackathon build for an "always-on agent" that reacts to new calendar bookings, enriches them with real-time signals (via You.com), generates prioritized insights and email drafts (via GPT-4o), and syncs artifacts to Notion and Gmail (via Composio). The backend is greenfield — no code exists yet.

**Stack decisions:** FastAPI (async), OpenAI GPT-4o, SQLite (via aiosqlite + SQLAlchemy), Composio SDK, You.com REST API, deployed on Render.

---

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, lifespan (DB init), CORS
│   ├── config.py             # pydantic-settings, loads .env
│   ├── database.py           # async SQLAlchemy engine + session factory
│   ├── models.py             # Meeting + SteeringProfile ORM models
│   ├── schemas.py            # Pydantic request/response models
│   ├── steering.py           # Feedback-to-weight-adjustment logic
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── meetings.py       # GET /meetings, GET /meetings/{id}, POST /run, POST /feedback
│   │   ├── steering.py       # GET /steering, PUT /steering
│   │   └── health.py         # GET /health
│   └── services/
│       ├── __init__.py
│       ├── calendar_poller.py  # Composio GOOGLECALENDAR_FIND_EVENT → parse → upsert
│       ├── enrichment.py       # 3x parallel You.com searches (company, role pains, competitors)
│       ├── synthesis.py        # GPT-4o structured output (insights, hooks, drafts)
│       ├── notion_sync.py      # Composio NOTION_INSERT/UPDATE_ROW_DATABASE
│       ├── gmail_drafter.py    # Composio GMAIL_CREATE_EMAIL_DRAFT (x2)
│       └── pipeline.py        # Orchestrates: poll → enrich → synthesize → notion → gmail
├── requirements.txt
├── .env.example
└── render.yaml
```

---

## Dependencies

```
fastapi==0.115.6
uvicorn[standard]==0.34.0
sqlalchemy[asyncio]==2.0.36
aiosqlite==0.20.0
pydantic-settings==2.7.1
composio-openai==0.7.3
openai==1.59.9
httpx==0.28.1
python-dotenv==1.0.1
```

---

## Step-by-step Implementation Order

### Step 1: Scaffolding — config, database, models, schemas
- **`config.py`**: `pydantic_settings.BaseSettings` loading `OPENAI_API_KEY`, `COMPOSIO_API_KEY`, `COMPOSIO_USER_ID`, `YOUCOM_API_KEY`, `NOTION_DATABASE_ID`, `DATABASE_URL`, `CORS_ORIGINS` from `.env`
- **`database.py`**: `create_async_engine` with `sqlite+aiosqlite`, `async_sessionmaker`, `init_db()` calling `Base.metadata.create_all`, `get_db()` FastAPI dependency
- **`models.py`**: Two tables:
  - `Meeting`: id, calendar_event_id (unique, indexed), title, datetime_utc, attendees (JSON), company, role, status (enum: New/Enriching/Enriched/Drafted/FeedbackGiven/Error), insights (JSON), hooks (JSON), competitors (JSON), draft_ids (JSON), notion_page_id, feedback_score, feedback_notes, steering_version, error_message, created_at, updated_at
  - `SteeringProfile`: id, product_focus, icp, key_pains (JSON), disallowed_claims (JSON), competitor_list (JSON), weight_news, weight_role_pains, weight_competitors (floats), specificity_rules (JSON), version (int), updated_at
- **`schemas.py`**: Pydantic models for all request/response shapes (MeetingListItem, MeetingDetail, FeedbackRequest, SteeringProfileRead, SteeringProfileUpdate, TriggerPollResponse, HealthResponse)
- **`.env.example`**: Template with all required env vars
- **`requirements.txt`**: All dependencies pinned

### Step 2: FastAPI app skeleton + health endpoint
- **`main.py`**: FastAPI app with lifespan context manager (calls `init_db()` on startup), CORS middleware, includes routers. No background tasks — polling is handled externally by Render Cron Job.
- **`routers/health.py`**: `GET /health` → `{"status": "ok", "version": "0.1.0"}`
- Verify: `uvicorn app.main:app --reload` starts and `/health` responds

### Step 3: Steering profile endpoints
- **`routers/steering.py`**:
  - `GET /steering` → returns latest SteeringProfile (creates default if none exists)
  - `PUT /steering` → creates a new version with updated fields (immutable versioning for auditability)
- **`pipeline.get_current_steering()`**: helper to fetch latest profile or create default

### Step 4: Calendar poller service
- **`services/calendar_poller.py`**:
  - `fetch_upcoming_events(days_ahead=7)` → calls Composio `GOOGLECALENDAR_FIND_EVENT` with timeMin/timeMax
  - `parse_event(event)` → extracts calendar_event_id, title, datetime, attendees, infers company from attendee email domain
  - `poll_and_upsert(db)` → fetches events, inserts new ones as `status=NEW`, returns count of new meetings

### Step 5: Enrichment service (You.com)
- **`services/enrichment.py`**:
  - `_search_youcom(query, count, freshness)` → async httpx GET to `https://api.ydc-index.io/v1/search`
  - `enrich_meeting(company, role, attendees, steering)` → runs 3 searches in parallel via `asyncio.gather`:
    1. Company news/info query (freshness="month")
    2. Role pain points query (freshness="year")
    3. Competitor landscape query (freshness="month")
  - Queries incorporate steering profile fields (product_focus, icp, competitor_list)

### Step 6: Synthesis service (GPT-4o)
- **`services/synthesis.py`**:
  - `_build_system_prompt(steering)` → parameterized system prompt with product focus, ICP, pains, weights, specificity rules
  - `synthesize_insights(enrichment_data, meeting_title, company, role, attendees, steering)` → single GPT-4o call with `response_format={"type": "json_object"}`, returns:
    - `insights[]` (text, why, priority)
    - `hooks[]` (hook, source)
    - `competitors[]` (name, positioning)
    - `pre_meeting_draft` (subject, body — 80-150 words, 2-3 hooks, 2 discovery questions)
    - `follow_up_draft` (subject, body — with placeholders for post-meeting fill-in)

### Step 7: Pipeline orchestrator
- **`services/pipeline.py`**:
  - `run_pipeline_for_meeting(meeting_id, db)` → chains: load meeting → set ENRICHING → load steering → enrich → synthesize → store results (ENRICHED) → Notion upsert → Gmail drafts → set DRAFTED. On error: set ERROR + store error_message.
  - `run_pipeline_for_new_meetings(db)` → finds all status=NEW meetings, runs pipeline for each
  - Data flow: Calendar Event → Meeting(NEW) → enrich(3x You.com) → synthesize(GPT-4o) → Meeting(ENRICHED) → Notion + Gmail → Meeting(DRAFTED)

### Step 8: Notion sync + Gmail drafter
- **`services/notion_sync.py`**: `upsert_notion_row(meeting_data, existing_page_id)` → builds Notion properties dict, calls `NOTION_INSERT_ROW_DATABASE` or `NOTION_UPDATE_ROW_DATABASE` via Composio
- **`services/gmail_drafter.py`**: `create_drafts(recipient_email, pre_meeting_draft, follow_up_draft)` → calls `GMAIL_CREATE_EMAIL_DRAFT` via Composio for each draft, returns list of draft IDs

### Step 9: Meetings router (full API)
- **`routers/meetings.py`**:
  - `GET /meetings` → list all meetings ordered by datetime desc
  - `GET /meetings/{id}` → full detail with insights, hooks, competitors, drafts
  - `POST /meetings/{id}/run` → reset to NEW, re-run pipeline, return updated detail
  - `POST /meetings/{id}/feedback` → store score + notes, call `apply_feedback()`, set status=FeedbackGiven
- **`POST /trigger-poll`** (mounted in main.py) → calls `poll_and_upsert` + `run_pipeline_for_new_meetings`

### Step 10: Feedback/steering learning logic
- **`steering.py`**:
  - `apply_feedback(db, score, notes)`:
    - Thumbs up: no weight changes (current profile is working)
    - Thumbs down: parse notes for keywords ("generic"→add specificity rules, "news"→boost weight_news, "competitor"→boost weight_competitors, etc.), normalize weights to sum to 1.0, create new profile version

### Step 11: Render Cron Job for polling
- Instead of an in-process background loop, use a **Render Cron Job** that hits `POST /trigger-poll` on a schedule
- In **`render.yaml`**, define a cron job service:
  ```yaml
  services:
    - type: cron
      name: calendar-poller
      runtime: image
      schedule: "*/1 * * * *"   # every 1 minute
      buildCommand: "echo noop"
      startCommand: "curl -X POST https://<your-service>.onrender.com/trigger-poll"
  ```
- **Benefits**: no custom asyncio task management, Render handles scheduling/retries, the web service stays stateless and simple, cron job is visible and configurable in the Render dashboard
- The `POST /trigger-poll` endpoint already does everything needed: polls calendar → upserts new meetings → runs pipeline
- For local dev, just call `POST /trigger-poll` manually or use a simple watch command

---

## API Endpoints Summary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/meetings` | List meetings with status |
| GET | `/meetings/{id}` | Meeting detail (insights, hooks, drafts) |
| POST | `/meetings/{id}/run` | Manually trigger enrichment |
| POST | `/meetings/{id}/feedback` | Submit thumbs up/down + notes |
| GET | `/steering` | Get current steering profile |
| PUT | `/steering` | Update steering profile (pivot) |
| POST | `/trigger-poll` | Trigger calendar poll + pipeline |

---

## Continual Learning Mechanism

1. **Explicit pivot**: `PUT /steering` updates product_focus/ICP/weights → new SteeringProfile version → next pipeline run uses new queries + prompts
2. **Implicit feedback**: `POST /feedback` with thumbs-down + notes → keyword analysis adjusts weights and specificity rules → new profile version
3. **Traceability**: Each Meeting stores `steering_version` to show before/after comparison in demos

---

## Verification

1. Start server: `uvicorn app.main:app --reload --port 8000`
2. `GET /health` → 200 OK
3. `GET /steering` → default profile (v1)
4. `POST /trigger-poll` → fetches calendar events, processes them
5. `GET /meetings` → list with status=Drafted
6. `GET /meetings/1` → insights, hooks, competitors, draft_ids populated
7. Check Notion database → row created
8. Check Gmail → drafts exist
9. `PUT /steering` with new product_focus → v2
10. `POST /meetings/1/run` → re-enriched with new profile
11. `GET /meetings/1` → different insights reflecting the pivot

**Pre-requisite**: Composio connected accounts for Google Calendar, Gmail, Notion must be set up via the Composio dashboard before any integration calls work.
