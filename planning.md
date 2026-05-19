# CampusPulse — Hackathon Planning Document

---

## 1. Project Understanding

This is a **live social coordination layer for UNSW campus** — not an event platform, not a calendar, not a notice board. Think of it as a real-time "what's happening right now" radar that lives on campus. Posts are ephemeral by design. The moment an activity fills up or its time window passes, it vanishes. Students open the app during a free gap and instantly see what's alive around them at that exact moment.

> The closest mental model is: **a live campus bulletin board that self-destructs** — lightweight, instant, zero planning overhead.

---

## 2. Why It Solves a Real Student Problem

The core friction is an **invisible coordination failure**. Right now at UNSW:

- Someone at Village Green needs 2 more basketball players. Three people in the library 200m away would join instantly if they knew.
- A student has 90 minutes between lectures and eats alone — five people in the same building had the same gap and the same idea.
- A study group forms with 2 people when 4 wanted to join — they just had no signal to find each other.

The problem isn't that students don't want to connect. It's that **there's no real-time discovery layer**. Group chats are closed. Facebook events are planned days ahead. Word of mouth is limited to your immediate circle. This app is the missing signal.

**Value proposition:** Open the app when you're free → see what's happening → tap join → show up. Three steps, zero planning, zero commitment until you want it.

---

## 3. Best MVP for a Hackathon (24 hours)

The MVP needs to do exactly one thing extremely well: **show live activities and let you create or join them in under 30 seconds.** Everything else is secondary.

MVP scope:
- Auth (UNSW email via Supabase)
- Create an activity (title, tag, location, spots needed, expiry time)
- Live feed of active activities sorted by recency/expiry
- Join button with live spot counter
- Auto-expiry of posts
- Basic tag filter

That is a complete, demonstrable, impressive hackathon product.

---

## 4. Features to Prioritize First

### Hour 0–4 — Foundation
- Supabase project setup
- Auth with UNSW email domain restriction
- Database schema
- Real-time subscriptions enabled

### Hour 4–8 — Core Loop
- Create activity form (the most important screen in the app)
- Live feed with real-time updates
- Join system with spot counter
- Auto-expiry logic (database-level via expiry timestamp + filter)

### Hour 8–14 — Polish the Feed
- Tag filters
- Location labels (text-based, not GPS — "Village Green", "Library", "Quad")
- Activity cards with time-remaining countdown
- Empty state ("Nothing nearby — be the first to post something")

### Hour 14–18 — DevSoc Integration + Visual Polish
- Room availability suggestion when creating a study group
- Building names on activity cards
- UI polish, loading states, mobile responsiveness

### Hour 18–24 — Buffer + Demo Prep
- Bug fixing, edge cases (last person leaves, host cancels)
- Demo script, seed data for presentation
- Deploy to Vercel

---

## 5. DevSoc API — What's Worth Integrating

### ✅ Room Availability — HIGH VALUE, medium effort
When a user creates a "study" tagged activity, query the DevSoc API for available rooms nearby and surface 2–3 suggestions. Genuinely impressive integration that solves a real problem (where do we actually meet?) and will stand out in judging.

### ✅ Building Data — LOW EFFORT, high polish
Use building names and locations to attach real UNSW place names to activities. Makes the app feel native to campus rather than generic.

### ❌ Class Schedule — SKIP for MVP
Requires knowing individual timetables, involves auth complexity, and the payoff doesn't justify the hackathon time cost. Flag it as a "future enhancement" in the pitch.

---

## 6. What to Skip Entirely

- Maps/GPS — text location labels are enough ("near library" is clearer than a pin)
- Push notifications — out of scope for 24 hours
- User profiles, follower systems, social graphs
- Chat or messaging within activities
- Activity history or past posts
- Ratings or reviews
- Any admin panel
- Native mobile app — build a responsive web app (works on phones, 10x faster to ship)

---

## 7. Suggested Architecture

```
React (Vite) frontend
        ↕  real-time subscriptions + REST
    Supabase
    ├── Auth (email/password, restrict to @unsw.edu.au or @student.unsw.edu.au)
    ├── PostgreSQL database
    │   ├── activities table
    │   ├── joins table
    │   └── users table (auto-created by Supabase auth)
    ├── Realtime (websocket subscriptions on activities + joins)
    └── Row Level Security policies
        ↕  HTTP fetch calls
DevSoc GraphQL API
    ├── Room availability query
    └── Building data query
```

**Why Supabase over Firebase:**
Real-time subscriptions work out of the box with zero config. Auto-expiry is trivial with a Postgres `expires_at` timestamp. Row-level security means no manual auth guards. The dashboard gives a live view of the database during the demo.

---

## 8. Backend Design (Supabase)

### `activities` table
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `created_by` | uuid | references auth.users |
| `title` | text | |
| `tag` | enum | study, sports, food, social, chill |
| `location_label` | text | e.g. "Village Green", "Library Level 2" |
| `spots_total` | int | |
| `spots_joined` | int | default 0 |
| `expires_at` | timestamptz | |
| `created_at` | timestamptz | |
| `is_cancelled` | boolean | default false |

### `joins` table
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `activity_id` | uuid | references activities |
| `user_id` | uuid | references auth.users |
| `joined_at` | timestamptz | |

### Key Design Decisions
- `expires_at` is set by the creator (now, +10min, +30min, +1hr). Feed always filters `WHERE expires_at > now() AND is_cancelled = false`
- `spots_joined` updated via Postgres function/trigger on insert to joins — keeps count atomic, avoids race conditions
- Realtime enabled on both tables — feed updates live without polling
- RLS: anyone authenticated can read; only creator can cancel; only non-full activities can be joined

---

## 9. Frontend Structure

**Stack:** React + Vite + Tailwind CSS + Supabase JS client

```
src/
├── components/
│   ├── ActivityCard.jsx        ← core UI unit, countdown timer, join button
│   ├── ActivityFeed.jsx        ← subscribes to realtime, renders cards
│   ├── CreateActivityModal.jsx ← the most important screen
│   ├── TagFilter.jsx           ← filter bar at top of feed
│   └── RoomSuggestion.jsx      ← DevSoc integration, shown in create modal
├── pages/
│   ├── Feed.jsx                ← main page, almost everything lives here
│   └── Auth.jsx                ← login/signup
├── hooks/
│   ├── useActivities.js        ← realtime subscription logic
│   └── useAuth.js              ← session management
├── lib/
│   ├── supabase.js             ← client init
│   └── devsoc.js              ← GraphQL queries for rooms/buildings
└── App.jsx
```

> The entire app is essentially one screen — the Feed page. The create flow is a modal overlay. Keep it that way. Don't add pages you don't need.

---

## 10. Possible Project Names

| Name | Concept |
|---|---|
| **PingU** | You ping, others respond |
| **CampusPulse** | The live pulse of campus |
| **FreeSlot** | You have a free slot, so do others |
| **HappenNow** | Self-explanatory |
| **DropIn** | Drop in on what's happening |
| **Flockr** | People flocking to activities |
| **OpenSpot** | Spots open, come join |
| **Unplanned** | Leans into the spontaneous identity |

> **Recommendation: PingU or CampusPulse.** CampusPulse works especially well for a demo because "pulse" implies liveness.

---

## 24-Hour Execution Plan

| Stage | Hours | Who | What |
|---|---|---|---|
| **1. Setup** | 0–1 | All | Supabase project, repo, Vite app, Tailwind, agree on component names |
| **2. Auth + DB** | 1–3 | Person A | Schema, RLS, auth flow, email restriction |
| **3. Create flow** | 3–6 | Person B | CreateActivityModal, form validation, insert to Supabase |
| **4. Live feed** | 3–7 | Person B/C | ActivityFeed, ActivityCard, realtime subscription, expiry filter |
| **5. Join system** | 7–10 | Person A | Join button, spot counter, Postgres function for atomic update |
| **6. Filters + UX** | 10–14 | All | Tag filter, countdown timers, empty states, mobile layout |
| **7. DevSoc API** | 14–17 | Person C | Room suggestion in create modal, building labels on cards |
| **8. Polish + bugs** | 17–21 | All | Edge cases, loading states, error handling, visual refinement |
| **9. Demo prep** | 21–24 | All | Seed realistic data, write pitch, practice demo flow, deploy |

### Team Split
| Person | Responsibility |
|---|---|
| **Person A** | Backend — Supabase schema, RLS, realtime, Postgres functions |
| **Person B** | Core UI — Feed, ActivityCard, CreateModal |
| **Person C** | DevSoc integration + tag/filter system |
| **Person D** *(if 4)* | Auth flow + deployment + demo data + pitch deck |