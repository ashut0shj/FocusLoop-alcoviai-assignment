# FocusLoop

Minimal full-stack system demonstrating a focus-tracking workflow for students. It pairs an Expo Web (Vite + React) frontend with a Node.js + Express backend, both deployable on Vercel, and persists data in Supabase. Automation hooks via n8n webhooks alert mentors when students fall behind.

## Stack

- **Frontend**: React 18, React Router, Tailwind CSS, Vite (Expo Web-compatible structure)
- **Backend**: Express 4, serverless-http, Supabase JS client
- **Database**: Supabase (Postgres)
- **Automation**: Optional n8n webhook
- **Hosting**: Vercel (client + server)

## Repository Layout

```
FocusLoop-alcoviai-assignment/
├── client/   # React web app (Expo Web friendly)
│   └── src/
│       ├── components/   # UI building blocks
│       ├── context/      # Student state machine provider
│       ├── hooks/        # Custom hooks
│       ├── pages/        # Router views (Login, Home)
│       └── utils/        # API helper
├── server/   # Express API (serverless-ready)
│   ├── api/            # Route handlers
│   ├── lib/supabase.js # Supabase client bootstrap
│   ├── utils/          # State machine logic
│   └── vercel.json     # Server deployment config
└── README.md  # (this file)
```

## Prerequisites

- Node.js 18+
- npm 9+
- Supabase project with `students`, `daily_logs`, `interventions` tables
- Vercel account/CLI (`npm i -g vercel`)

## Environment Variables

### Backend (`server/.env`)
```
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<service-role-or-full-access-key>
N8N_WEBHOOK_URL=<optional-webhook>
NODE_ENV=development
PORT=3001
```

### Frontend (`client/.env`)
```
VITE_API_BASE_URL=https://<your-server-domain>.vercel.app/api
VITE_DEFAULT_STUDENT_ID=<optional uuid for demo>
```

## Local Development

1. **Install deps**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
2. **Run backend**
   ```bash
   cd server
   npm run dev
   # API available at http://localhost:3001/api/health
   ```
3. **Run frontend**
   ```bash
   cd client
   npm run dev
   # Vite serves on http://localhost:3000 and proxies to http://localhost:3001/api
   ```

## Deployment

### Server
```bash
cd server
vercel --prod
```
Configure env vars in the Vercel dashboard. Final base URL: `https://<server>.vercel.app/api`.

### Client
```bash
cd client
vercel --prod
```
Set `VITE_API_BASE_URL` in that project’s environment before deploying.

## API Summary (relative to `/api`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Service metadata |
| GET | `/students` | List students |
| POST | `/students` | Create student |
| GET | `/student/:id` | Dashboard payload |
| POST | `/daily-checkin` | Submit quiz score + focus minutes |
| POST | `/assign-intervention` | Create mentor task |
| POST | `/complete-task` | Mark intervention complete |

## State Machine

- `normal → locked`: quiz score ≤ 7 **or** focus minutes ≤ 60 on last check-in.
- `locked → remedial`: mentor (or automation) assigns intervention.
- `remedial → normal`: intervention completed.
- `locked → normal`: next check-in has quiz > 7 **and** focus > 60.

If a student submits a daily check-in with **quiz score greater than 7** *and* **focus minutes above 60**, the state machine keeps (or returns) the student in `normal`—no intervention is triggered. If only one of those conditions passes (e.g., quiz > 7 but focus ≤ 60), the student still moves to `locked`.

## Frontend Flow

1. **Login page**: create/select student via `/students`.
2. **Home page**:
   - `normal`: focus timer + daily check-in form.
   - `locked`: polling card (“Waiting for mentor review…”).
   - `remedial`: assigned task card; “Mark Complete” calls `/complete-task`.
3. Student context persists ID in `localStorage` and polls `/student/:id` every 3s while locked.

## Troubleshooting

- **Health endpoint 404**: deploy backend or fix domain; every request must hit `/api/*`.
- **CORS errors**: ensure `VITE_API_BASE_URL` matches deployed server URL, including `/api`.
- **Supabase connect failure**: check `SUPABASE_URL`/`SUPABASE_KEY` logs emitted at startup.