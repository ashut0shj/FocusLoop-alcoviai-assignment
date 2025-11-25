# FocusLoop Server (Student Progress API)

Node.js + Express backend that powers the FocusLoop assignment. It tracks daily student performance, keeps a small state machine in sync with Supabase tables, and surfaces actionable interventions for mentors. The code ships as a single Vercel serverless function (`api/index.js`) but can also run as a traditional Express server during local development.

## Key Capabilities

- **Student lifecycle** – create and list students, fetch rich progress summaries.
- **Daily check-ins** – persist quiz scores and focus minutes, then evaluate state.
- **State machine** – move students between `normal`, `locked`, and `remedial`.
- **Intervention workflow** – assign/complete tasks and unblock locked learners.
- **Automation hooks** – fire optional n8n webhook when an intervention is needed.
- **Serverless ready** – zero-config deploy on Vercel using `serverless-http`.

## Runtime Architecture

| Layer | Responsibilities | Relevant Files |
| --- | --- | --- |
| HTTP Edge | Express app + middleware, exported as Vercel handler | `api/index.js` |
| Feature Routes | REST endpoints mounted under `/students`, `/daily-checkin`, etc. | `api/*.js` |
| Domain Utilities | State transition helpers | `utils/stateMachine.js` |
| Data Access | Supabase JS client with connection test | `lib/supabase.js` |

> Request flow: HTTP → Express router → Supabase (Postgres) → optional n8n webhook → response.

## Prerequisites

- Node.js 18+
- npm 9+ (or pnpm/yarn)
- Supabase project (Postgres database + service role key)
- Optional: n8n webhook URL for mentor escalation
- Vercel CLI (`npm i -g vercel`) if you want to emulate production locally

## Environment Variables

Create `/server/.env` (not committed) with:

```
SUPABASE_URL=...
SUPABASE_KEY=...            # service role or full access key (needed for writes)
N8N_WEBHOOK_URL=...         # optional, skip if you do not want outbound calls
NODE_ENV=development
PORT=3001                   # local express port
```

`lib/supabase.js` runs a connectivity test on startup and exits early if credentials are missing or invalid, so make sure the values are correct before running the server.

## Database Schema (Supabase)

You can create the tables through the Supabase UI or the SQL editor using the definitions below.

```sql
create table students (
  id uuid primary key,
  name text not null,
  state text not null default 'normal',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  quiz_score int not null,
  focus_minutes int not null,
  created_at timestamptz default now()
);

create table interventions (
  id uuid primary key,
  student_id uuid references students(id) on delete cascade,
  task text not null,
  status text not null default 'pending',
  created_at timestamptz default now(),
  completed_at timestamptz
);
```

Indexes you may want: `(student_id, created_at desc)` on `daily_logs` and `interventions`.

## Installation & Local Development

```bash
git clone <repo>
cd FocusLoop-alcoviai-assignment/server
npm install

# Start the express server (PORT defaults to 3001)
npm run dev

# In another terminal, verify the health endpoint
curl http://localhost:3001/api/health
```

What happens locally:
- `api/index.js` bootstraps Express, logging each request + latency.
- All routes live under `/api/...` so local and production URLs match.
- CORS is permissive (`origin: *`) so the local Vite client can talk to it.

## Deploying to Vercel

1. Authenticate once: `vercel login`
2. From `/server`, run `vercel` (preview) or `vercel --prod`
3. Set the same environment variables (`SUPABASE_URL`, etc.) inside the Vercel dashboard
4. Production base URL becomes `https://<your-app>.vercel.app/api`

## API Overview

Base URL:
- Local: `http://localhost:3001/api`
- Vercel: `https://<app>.vercel.app/api`

| Method | Path (relative to base) | Description |
| --- | --- | --- |
| GET | `/health` | Returns service metadata and known routes. |
| GET | `/students` | List all students (latest first). |
| POST | `/students` | Create a student (`name` required). |
| GET | `/student/:id` | Fetch student profile, running averages, recent logs, pending task. |
| POST | `/daily-checkin` | Persist quiz score + focus minutes, update state, optionally trigger webhook. |
| POST | `/assign-intervention` | Create intervention + switch student to `remedial`. |
| POST | `/complete-task` | Mark intervention as completed + return student to `normal`. |

### Sample Requests

```bash
# Create student
curl -X POST http://localhost:3001/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace"}'

# Submit daily check-in
curl -X POST http://localhost:3001/api/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{"student_id":"<uuid>","quiz_score":6,"focus_minutes":40}'

# Assign intervention
curl -X POST http://localhost:3001/api/assign-intervention \
  -H "Content-Type: application/json" \
  -d '{"student_id":"<uuid>","task":"Watch mentor feedback video"}'

# Complete task
curl -X POST http://localhost:3001/api/complete-task \
  -H "Content-Type: application/json" \
  -d '{"intervention_id":"<uuid>"}'

# Inspect student dashboard data
curl http://localhost:3001/api/student/<uuid>
```

Responses are JSON and include informative error payloads when `NODE_ENV=development`.

## State Machine

`utils/stateMachine.js` centralizes transitions:

- `normal → locked`: triggered automatically when `quiz_score <= 7` **or** `focus_minutes <= 60`.
- `locked → normal`: quiz score > 7 **and** focus minutes > 60 on the next check-in.
- `locked → remedial`: mentor assigns an intervention.
- `remedial → normal`: intervention marked complete.

Every transition is persisted to the `students.state` column so the frontend stays in sync.

## Webhook Automation (Optional)

When a check-in indicates the student is **not** on track, `api/dailyCheckin.js` posts a payload to `process.env.N8N_WEBHOOK_URL`. Include fields like `student_id`, `quiz_score`, `focus_minutes`, and the resolved `state`. Failures are logged but do not block API responses.

## Operational Notes

- **Logging**: Each request logs method, route, status, and latency in ms; useful on Vercel logs or locally.
- **Error handling**: Central error middleware hides stack traces unless `NODE_ENV=development`.
- **CORS**: Wide open in code; restrict `origin` before production if necessary.
- **Timeout safety**: Supabase client re-use keeps connections under control inside serverless functions.
- **Testing**: `npm test` is a placeholder. Add integration tests if you continue evolving the backend.

## Troubleshooting

- *App exits immediately*: Check the Supabase connection logs printed by `lib/supabase.js`.
- *Webhook failures*: Confirm `N8N_WEBHOOK_URL` accepts POST JSON from the backend.
- *CORS complaints*: Change the `origin` field inside `api/index.js` to your deployed frontend.
- *404 on Vercel*: Remember to prefix requests with `/api` in production.

---

This backend pairs with the `client/` Vite app in the root of the repository. Point the client’s API base URL to the correct environment and you are ready to demo the full FocusLoop experience.
