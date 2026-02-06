# PRD: Autonomous Trigger Monitor for Founder-Led Sales

## 1) Summary
Founders doing their own sales get booked into meetings with minimal context and generic follow-ups. This product is an **always-on agent** that reacts to **new calendar bookings** and continuously pulls **real-time signals** (news, role pain points, competitors) to generate **high-specificity, prioritized outreach + follow-ups**, and it **adapts after feedback/pivots** across all future meetings.

## 2) Goals (mapped to judging criteria)
- **Autonomy**: When a new meeting is booked, the agent automatically runs enrichment + creates artifacts (brief + email drafts) without manual steps.
- **Idea / Value**: Reduce founder time spent researching and writing while improving relevance and specificity.
- **Technical Implementation**: Multi-step workflow + state + feedback loop + visible “learning” behavior.
- **Tool Use (3+)**: **Composio Agent SDK** (Calendar/Gmail/Notion), **You.com** (real-time search), **Render** (deployment/hosting).
- **Presentation (3 min)**: Show “new booking → agent runs → Notion updated + Gmail drafts created → pivot/feedback improves all future outputs.”

## 3) Non-goals (hackathon scope)
- Full CRM (use Notion database as a lightweight CRM).
- Real note-taker integrations (use seeded/mock meeting notes).
- Fully automatic sending of emails (default to **drafts** for safety).

## 4) Target user
- **Founder** (solo/early team) doing customer discovery + outbound.

## 5) Hero flow (C): Always-on trigger monitor
### Trigger
**New meeting booking detected** (event-driven). In the hackathon build, short-interval polling is acceptable if needed, but we present the user experience as “reacts to new bookings.”

### Agent workflow (end-to-end)
1. **Parse meeting**
   - title, time, attendees, domains; infer company if possible.
2. **Enrich via You.com**
   - company: “what do they do + latest company news”
   - role: “what pain points the role likely has”
   - competitors: “most relevant competing products”
3. **Synthesize**
   - prioritized insights (what matters most for this specific meeting)
   - high-specificity “hooks” (facts from research tied to founder’s product focus)
4. **Create artifacts**
   - **Notion**: upsert a row in a database for the meeting/contact
   - **Gmail**: create 1–2 **draft** emails
5. **Optional refresh**
   - re-run enrichment X hours before meeting, update Notion + optionally refresh drafts.

## 6) Product surfaces (web app)
### Main screen: Today / Upcoming
- List meetings + status chips (New → Enriched → Drafted → Feedback Given)
- Click into a meeting to see detail

### Meeting detail view
- Prioritized insights (with a brief “why it matters”)
- Personalization hooks
- Competitors + positioning notes
- Email draft previews
- Last run time + “Run now” (manual override)

### Sidebar tab: Feedback & Steering (continual learning)
- Thumbs up/down feedback + optional unstructured text feedback
- Product focus pivot controls (updates apply to all future meetings)

## 7) Continual learning loop (what improves over time)
### Feedback collected
- Thumbs **up/down**
- Optional free-text feedback

### Learning axes
- **Prioritization**: adjust weights across (company news vs role pains vs competitors vs product focus).
- **Specificity**: enforce more concrete facts and fewer generic statements; increase tie-back to founder’s product focus.

### “Pivot” as the visible learning moment (demo)
Founder updates product focus (ICP / positioning / what to emphasize). The agent immediately:
- changes You.com queries
- changes which insights rise to the top
- changes email framing + discovery questions

### Simple implementation concept
Maintain a **Steering Profile** (stored in Notion or backend DB) containing:
- product focus (ICP, key pains, disallowed generic claims, competitor list)
- weights (news vs role pains vs competitors)
- specificity rules (e.g., require 2–3 concrete facts)
Feedback updates the profile for future runs.

## 8) Notion workspace (database table)
Single Notion database: `Meetings / Leads`

Suggested properties:
- **Meeting ID** (calendar event id)
- **Date/Time**
- **Contact name**
- **Contact email**
- **Company**
- **Role**
- **Status** (New, Enriched, Drafted, Feedback Given)
- **Top Insights** (text)
- **Personalization Hooks** (text / bullets)
- **Competitors** (multi-select)
- **Draft Links / Draft IDs** (text)
- **Feedback score** (up/down)
- **Feedback notes** (text)
- **Steering Profile version** (text)

## 9) Gmail outputs (drafts)
- **Draft 1 (pre-meeting)**: 80–150 words, 2–3 specific hooks, 2 discovery questions.
- **Draft 2 (follow-up template)**: pre-filled; in demo, seeded notes can be inserted to show the flow.

## 10) Tech stack + architecture
- **Backend**: Python
  - calendar event ingestion (event-driven or polling)
  - agent orchestrator (Composio tool calls + You.com enrichment + synthesis)
  - persistence for meetings + steering profile (SQLite/Postgres acceptable)
- **Frontend**: TypeScript
  - dashboard + meeting detail + feedback/steering UI
- **Hosting**: Render
- **Integrations**:
  - Composio: Calendar, Gmail, Notion
  - You.com: real-time search/news enrichment

## 11) Demo plan (3 minutes) — outline
1. Show dashboard: upcoming meetings.
2. Simulate/trigger a “new booking.”
3. Show the agent runs automatically: status flips to Enriched/Drafted.
4. Open Notion record: prioritized insights + hooks + competitors.
5. Open Gmail drafts: specific, non-generic outreach.
6. Apply a **product focus pivot** in steering.
7. Trigger another booking: show reprioritized outputs + higher specificity.

## 12) Success criteria (hackathon)
- Booking → Notion + Gmail drafts in < 30–60 seconds (demo target).
- Each output contains:
  - 2–3 concrete facts
  - 1 role-specific pain hypothesis
  - 1 competitor mention (when relevant)
- “Learning” is visible: pivot/feedback changes future outputs reliably.

## 13) Risks / mitigations
- **Calendar ingestion**: if webhooks are hard, use polling but keep the UX “event-driven.”
- **Search relevance**: constrain You.com queries and apply simple ranking rules.
- **Safety**: create drafts (not auto-send).

