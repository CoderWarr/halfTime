# CampusPulse

The real-time social layer for UNSW campus. See `../README.md` and `../planning.md` at the repo root for the full product spec and 24-hour execution plan.

## Structure

```
campuspulse/
├── frontend/    React + Vite + Tailwind app
├── backend/     Supabase SQL (schema, triggers, RLS, seed)
└── README.md    (this file)
```

## Running the frontend

```bash
cd frontend
cp .env.example .env   # then paste your Supabase URL + anon key
npm install
npm run dev
```

The app boots at `http://localhost:5173`. Without real Supabase credentials, the Auth page still renders but sign-up / log-in network calls will fail — that's expected until Stage 1.4 from the root README is finished.

## Applying the backend

In the Supabase Dashboard → SQL Editor, run the files under `backend/` in order. See `backend/README.md` for details.
