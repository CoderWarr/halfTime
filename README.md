# CampusPulse — Task Iterations

> Each stage is broken into atomic subtasks with a clear definition of done.
> Check off each item as you go. Stages are designed to be parallelised across the team.

---

## Stage 1 — Project Setup (Hour 0–1) · All

### 1.1 Repository
- [ ] One person creates a new GitHub repo: `campuspulse`
- [ ] Add a `.gitignore` for Node / Vite
- [ ] Everyone clones it locally
- [ ] Agree on branch strategy: `main` = stable, each person works on a feature branch, PR to merge

**Done when:** Everyone has the repo cloned and can push a branch.

---

### 1.2 Vite + React App
- [ ] `npm create vite@latest . -- --template react`
- [ ] `npm install`
- [ ] `npm run dev` — confirm it runs on localhost

**Done when:** Default Vite React page renders in browser.

---

### 1.3 Tailwind CSS
- [ ] `npm install -D tailwindcss postcss autoprefixer`
- [ ] `npx tailwindcss init -p`
- [ ] Configure `tailwind.config.js` content paths
- [ ] Add Tailwind directives to `index.css`
- [ ] Test with a quick `className="text-blue-500"` in `App.jsx`

**Done when:** Tailwind utility classes apply correctly in the browser.

---

### 1.4 Supabase Project
- [ ] One person creates a new project at supabase.com
- [ ] Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY` from Project Settings → API
- [ ] Create `.env` file in root:
  ```
  VITE_SUPABASE_URL=your_url
  VITE_SUPABASE_ANON_KEY=your_key
  ```
- [ ] Add `.env` to `.gitignore`
- [ ] Share credentials with team via a secure channel (not the repo)

**Done when:** Supabase project exists and credentials are distributed to all team members.

---

### 1.5 Supabase JS Client
- [ ] `npm install @supabase/supabase-js`
- [ ] Create `src/lib/supabase.js`:
  ```js
  import { createClient } from '@supabase/supabase-js'
  export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )
  ```
- [ ] Import and `console.log(supabase)` in `App.jsx` to confirm it works

**Done when:** Client initialises without errors.

---

### 1.6 Folder Structure
- [ ] Create the following folders inside `src/`:
  ```
  src/components/
  src/pages/
  src/hooks/
  src/lib/
  ```
- [ ] Create placeholder files for every component agreed in the plan (empty exports are fine)

**Done when:** Folder structure matches the architecture doc, no import errors.

---

## Stage 2 — Auth + Database (Hour 1–3) · Person A

### 2.1 Database Schema — Activities Table
- [ ] Open Supabase → SQL Editor
- [ ] Run the following SQL:
  ```sql
  create type activity_tag as enum ('study', 'sports', 'food', 'social', 'chill');

  create table activities (
    id uuid primary key default gen_random_uuid(),
    created_by uuid references auth.users not null,
    title text not null,
    tag activity_tag not null,
    location_label text not null,
    spots_total int not null check (spots_total > 0),
    spots_joined int not null default 0,
    expires_at timestamptz not null,
    created_at timestamptz default now(),
    is_cancelled boolean default false
  );
  ```
- [ ] Confirm table appears in Table Editor

**Done when:** `activities` table exists with all columns and constraints.

---

### 2.2 Database Schema — Joins Table
- [ ] Run the following SQL:
  ```sql
  create table joins (
    id uuid primary key default gen_random_uuid(),
    activity_id uuid references activities on delete cascade not null,
    user_id uuid references auth.users not null,
    joined_at timestamptz default now(),
    unique(activity_id, user_id)
  );
  ```
- [ ] The `unique` constraint prevents a user from joining the same activity twice

**Done when:** `joins` table exists with unique constraint on `(activity_id, user_id)`.

---

### 2.3 Atomic Spot Counter — Postgres Function
- [ ] Run the following SQL to create a trigger that increments `spots_joined` safely:
  ```sql
  create or replace function increment_spots_joined()
  returns trigger as $$
  begin
    update activities
    set spots_joined = spots_joined + 1
    where id = NEW.activity_id
      and spots_joined < spots_total;

    if not found then
      raise exception 'Activity is full';
    end if;

    return NEW;
  end;
  $$ language plpgsql;

  create trigger on_join_increment
  after insert on joins
  for each row execute procedure increment_spots_joined();
  ```
- [ ] Test by manually inserting a join row and confirming `spots_joined` updates

**Done when:** Inserting into `joins` automatically increments `spots_joined` on the parent activity.

---

### 2.4 Row Level Security (RLS)
- [ ] Enable RLS on both tables (Supabase Dashboard → Table → RLS → Enable)
- [ ] Run RLS policies:
  ```sql
  -- Anyone authenticated can read active activities
  create policy "Read active activities" on activities
    for select using (
      auth.role() = 'authenticated'
      and expires_at > now()
      and is_cancelled = false
    );

  -- Only the creator can insert
  create policy "Create own activity" on activities
    for insert with check (auth.uid() = created_by);

  -- Only the creator can cancel (update is_cancelled)
  create policy "Cancel own activity" on activities
    for update using (auth.uid() = created_by);

  -- Anyone authenticated can join (insert to joins)
  create policy "Join activity" on joins
    for insert with check (auth.role() = 'authenticated');

  -- Users can read joins for activities
  create policy "Read joins" on joins
    for select using (auth.role() = 'authenticated');
  ```

**Done when:** RLS is enabled on both tables and all policies are saved.

---

### 2.5 Enable Realtime
- [ ] In Supabase Dashboard → Database → Replication
- [ ] Enable Realtime for the `activities` table
- [ ] Enable Realtime for the `joins` table

**Done when:** Both tables are listed as replicated in the Supabase Replication dashboard.

---

### 2.6 Auth — Supabase Email Config
- [ ] In Supabase Dashboard → Authentication → Settings
- [ ] Confirm "Enable Email Signup" is ON
- [ ] Set Site URL to `http://localhost:5173` for dev
- [ ] Note: UNSW domain restriction (`@student.unsw.edu.au`) will be enforced in the frontend form validation for speed — backend can add a hook later if time permits

**Done when:** Auth settings are configured and email signup is enabled.

---

### 2.7 Auth — Frontend Pages
- [ ] Create `src/pages/Auth.jsx` with:
  - Sign up form (email, password)
  - Log in form (email, password)
  - Toggle between sign up / log in
  - On sign up: validate email ends with `@student.unsw.edu.au` or `@unsw.edu.au` before calling Supabase
  - On success: redirect to `/feed`
- [ ] Create `src/hooks/useAuth.js`:
  - Export `user` (current session)
  - Export `signIn`, `signUp`, `signOut` helpers
  - Subscribe to `supabase.auth.onAuthStateChange`

**Done when:** A user can sign up with a UNSW email, log in, and be redirected to the feed.

---

### 2.8 Route Guard
- [ ] Install React Router: `npm install react-router-dom`
- [ ] Set up routes in `App.jsx`:
  - `/` → redirect to `/auth` if not logged in, else `/feed`
  - `/auth` → `<Auth />`
  - `/feed` → `<Feed />` (protected)
- [ ] Create a simple `ProtectedRoute` wrapper component

**Done when:** Unauthenticated users are redirected to `/auth`. Authenticated users go to `/feed`.

---

## Stage 3 — Create Activity Flow (Hour 3–6) · Person B

### 3.1 CreateActivityModal — Shell
- [ ] Create `src/components/CreateActivityModal.jsx`
- [ ] Modal opens as an overlay (fixed position, dark backdrop)
- [ ] Close button in top right
- [ ] Accepts `onClose` and `onSuccess` props
- [ ] Style with Tailwind: centered card, rounded corners, shadow

**Done when:** Modal opens and closes correctly. Styling looks clean on mobile.

---

### 3.2 CreateActivityModal — Form Fields
- [ ] **Title** — text input, max 60 chars, placeholder: "e.g. Need 2 more for basketball"
- [ ] **Tag** — pill/button selector: `study | sports | food | social | chill` (one selection only)
- [ ] **Location** — dropdown OR text input with preset suggestions:
  - Village Green, Library, Quad, Roundhouse, Science Block, Gym, Central Lecture Block, Online
  - Allow free text as fallback
- [ ] **Spots needed** — number stepper (1–20)
- [ ] **Expires in** — button group: `Now (15 min) | 30 min | 1 hour | 2 hours`
- [ ] All fields required, show inline validation errors

**Done when:** All fields render, are selectable, and validate correctly before submission.

---

### 3.3 CreateActivityModal — Supabase Insert
- [ ] On submit, call:
  ```js
  const { error } = await supabase.from('activities').insert({
    title,
    tag,
    location_label,
    spots_total: spotsNeeded,
    expires_at: new Date(Date.now() + expiryMs).toISOString(),
    created_by: user.id
  })
  ```
- [ ] Show loading spinner on submit button while inserting
- [ ] On success: call `onSuccess()` to close modal (feed will update via realtime)
- [ ] On error: show error message inline

**Done when:** Submitting the form creates a real row in Supabase and the modal closes cleanly.

---

### 3.4 CreateActivityModal — RoomSuggestion Integration (stub)
- [ ] If tag is `study`, render a `<RoomSuggestion />` component below the location field
- [ ] For now, render a placeholder: "Fetching available rooms..." — wire up the real data in Stage 7
- [ ] This keeps the component slot reserved without blocking Stage 3

**Done when:** `<RoomSuggestion />` placeholder renders when study tag is selected.

---

### 3.5 Trigger Modal from Feed
- [ ] Add a floating "+ Post Activity" button (FAB) to `src/pages/Feed.jsx`
- [ ] Bottom-right corner, fixed position, prominent colour
- [ ] Clicking opens `<CreateActivityModal />`

**Done when:** FAB is visible on the feed and tapping it opens the create modal.

---

## Stage 4 — Live Activity Feed (Hour 3–7) · Person B/C

### 4.1 useActivities Hook — Initial Fetch
- [ ] Create `src/hooks/useActivities.js`
- [ ] On mount, query:
  ```js
  supabase
    .from('activities')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .eq('is_cancelled', false)
    .order('created_at', { ascending: false })
  ```
- [ ] Store results in state, expose `activities`, `loading`, `error`

**Done when:** Hook returns an array of active activities from Supabase on first load.

---

### 4.2 useActivities Hook — Realtime Subscription
- [ ] After initial fetch, subscribe to realtime changes:
  ```js
  supabase
    .channel('activities')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, payload => {
      // Handle INSERT, UPDATE, DELETE
    })
    .subscribe()
  ```
- [ ] On `INSERT`: prepend new activity to state
- [ ] On `UPDATE`: update matching activity in state (handles `spots_joined` and `is_cancelled` changes)
- [ ] On `DELETE`: remove from state
- [ ] Unsubscribe on component unmount

**Done when:** A new activity created in one browser tab appears instantly in another tab without refresh.

---

### 4.3 ActivityCard — Layout
- [ ] Create `src/components/ActivityCard.jsx`
- [ ] Display:
  - Tag pill (colour-coded: study=blue, sports=green, food=orange, social=purple, chill=grey)
  - Title (large, bold)
  - Location label with a pin icon
  - Spots: "X / Y joined" with a visual fill bar or dot indicators
  - Time remaining countdown (e.g. "Expires in 23 min")
  - Join button (right side)
- [ ] Card is full-width on mobile, comfortable padding

**Done when:** ActivityCard renders all data correctly from a mock activity object.

---

### 4.4 ActivityCard — Countdown Timer
- [ ] Use `setInterval` (every 30 seconds) to recalculate time remaining from `expires_at`
- [ ] Display formats:
  - `> 60 min` → "Expires in Xh Ym"
  - `10–60 min` → "Expires in X min"
  - `< 10 min` → "Expires in X min" (show in red/amber)
  - `0 or past` → remove card from feed locally
- [ ] Clear interval on unmount

**Done when:** Cards show a live countdown. Expired cards disappear from the feed automatically.

---

### 4.5 ActivityFeed — Render Cards
- [ ] Create `src/components/ActivityFeed.jsx`
- [ ] Consume `useActivities()` hook
- [ ] While `loading`: show skeleton cards (3 grey placeholder cards)
- [ ] If `error`: show error banner
- [ ] If `activities.length === 0`: show empty state — "Nothing happening right now. Be the first to post something 👋"
- [ ] Render one `<ActivityCard />` per activity

**Done when:** Feed shows real activities from the database with loading and empty states handled.

---

## Stage 5 — Join System (Hour 7–10) · Person A

### 5.1 Join Button — State Logic
- [ ] In `ActivityCard`, determine button state:
  - `spots_joined >= spots_total` → show "Full 🔒" (disabled, grey)
  - User has already joined this activity → show "Joined ✓" (disabled, green)
  - Otherwise → show "Join" (active, brand colour)
- [ ] To check if current user has joined: query `joins` table for `(activity_id, user_id)` match on initial load

**Done when:** Join button shows correct state for full, joined, and open activities.

---

### 5.2 Join Button — Insert Action
- [ ] On "Join" click:
  ```js
  const { error } = await supabase.from('joins').insert({
    activity_id: activity.id,
    user_id: user.id
  })
  ```
- [ ] Show loading state on button during insert
- [ ] On success: button transitions to "Joined ✓" — `spots_joined` updates via realtime from the Postgres trigger
- [ ] On error `'Activity is full'`: show toast "Sorry, this activity just filled up"
- [ ] On error `unique violation`: show toast "You've already joined this one"

**Done when:** Joining an activity updates the spot counter live across all open browsers.

---

### 5.3 Leave / Unjoin (nice to have)
- [ ] If user has already joined, show "Leave" option on tap of "Joined ✓"
- [ ] On confirm: delete from `joins` table
- [ ] Add a decrement trigger in Postgres to mirror the increment trigger
- [ ] If time is short, skip this — it's not critical for the demo

**Done when:** User can leave an activity they joined and the spot counter decrements correctly.

---

### 5.4 Cancel Activity (host only)
- [ ] In `ActivityCard`, if `activity.created_by === user.id`, show a "Cancel" option (three-dot menu or small button)
- [ ] On confirm: `update activities set is_cancelled = true where id = activity.id`
- [ ] The realtime subscription will propagate the cancellation and remove the card from all feeds

**Done when:** A host can cancel their own activity and it disappears from all feeds in real time.

---

## Stage 6 — Tag Filters + UX Polish (Hour 10–14) · All

### 6.1 TagFilter Component
- [ ] Create `src/components/TagFilter.jsx`
- [ ] Render a horizontal scrollable row of pills: `All | Study | Sports | Food | Social | Chill`
- [ ] Selected pill is highlighted (filled background)
- [ ] `All` is selected by default
- [ ] Accepts `activeTag` and `onTagChange` props
- [ ] Place at top of Feed page, below header

**Done when:** Tag pills render and the selected tag highlights correctly on tap.

---

### 6.2 Filtered Feed
- [ ] In `Feed.jsx`, hold `activeTag` in state (default `null` = All)
- [ ] Pass `activeTag` to `useActivities` hook OR filter the returned activities array client-side
- [ ] Client-side filtering is fine for MVP: `activities.filter(a => !activeTag || a.tag === activeTag)`
- [ ] Feed re-renders immediately on tag change

**Done when:** Selecting "Sports" shows only sports activities. Selecting "All" shows everything.

---

### 6.3 Header Bar
- [ ] Create a top header in `Feed.jsx`:
  - App name/logo left ("CampusPulse" or chosen name)
  - Logout button right (icon or text)
- [ ] Logout calls `supabase.auth.signOut()` and redirects to `/auth`
- [ ] Header is sticky (stays at top on scroll)

**Done when:** Header is visible, sticky, and logout works.

---

### 6.4 Mobile Layout
- [ ] Test entire app at 390px width (iPhone viewport)
- [ ] Cards should be full width with comfortable tap targets
- [ ] Tag filter should scroll horizontally without clipping
- [ ] Create modal should fill most of the screen on mobile
- [ ] FAB should not overlap the bottom of last card — add bottom padding to feed

**Done when:** App is fully usable on a phone screen without horizontal overflow or clipping.

---

### 6.5 Loading Skeletons
- [ ] Replace blank loading state with 3 skeleton cards (grey animated pulse blocks)
- [ ] Use Tailwind `animate-pulse` on placeholder divs matching the card layout
- [ ] Show skeletons only on the initial fetch — not on realtime updates

**Done when:** Feed shows skeleton cards while loading instead of a blank screen.

---

### 6.6 Toast Notifications
- [ ] Install `react-hot-toast` or build a simple toast component
- [ ] Show toasts for:
  - "Activity posted! 🎉" on successful create
  - "Joined! See you there 👋" on successful join
  - "Activity is full" on failed join
  - "Activity cancelled" when host cancels
- [ ] Toasts appear bottom-centre, auto-dismiss after 3 seconds

**Done when:** All key user actions provide instant feedback via toast.

---

## Stage 7 — DevSoc API Integration (Hour 14–17) · Person C

### 7.1 DevSoc API — Research
- [ ] Read the DevSoc GraphQL API documentation
- [ ] Identify the correct query for: available rooms at a given time
- [ ] Identify the correct query for: building names / campus locations
- [ ] Note any auth requirements
- [ ] Create `src/lib/devsoc.js` with a `fetchAvailableRooms(tag)` function stub

**Done when:** You have confirmed working GraphQL queries (test in GraphQL playground or Postman).

---

### 7.2 RoomSuggestion Component — Data
- [ ] In `src/components/RoomSuggestion.jsx`, on mount call `fetchAvailableRooms()`
- [ ] Query available rooms for "now" and "next hour"
- [ ] Store results in local state
- [ ] Show loading state while fetching: "Finding free rooms..."

**Done when:** Component fetches real room data from DevSoc API without errors.

---

### 7.3 RoomSuggestion Component — Display
- [ ] Display up to 3 room suggestions as selectable pills below the location field in `CreateActivityModal`
- [ ] Each pill shows: room name + building
- [ ] Tapping a pill sets it as the `location_label` for the activity
- [ ] If no rooms available: hide the component silently (don't show an error to the user)
- [ ] Only show this component when tag is `study`

**Done when:** Creating a study activity shows real available room suggestions that are selectable as the location.

---

### 7.4 Building Labels on Activity Cards
- [ ] Use building data from DevSoc to map location labels to official UNSW building names if possible
- [ ] Alternatively, maintain a hardcoded lookup object in `devsoc.js`:
  ```js
  export const CAMPUS_LOCATIONS = [
    'Village Green', 'Scientia', 'Library (Level 2)', 'Library (Level 3)',
    'Quad Lawn', 'Roundhouse', 'Gym', 'Central Lecture Block', 'Colombo House', ...
  ]
  ```
- [ ] Use this list as the location dropdown options in `CreateActivityModal`

**Done when:** Activity cards show recognisable, real UNSW location names.

---

## Stage 8 — Polish + Bug Fixes (Hour 17–21) · All

### 8.1 Edge Cases
- [ ] What if user refreshes mid-session? → Auth session should persist via Supabase local storage
- [ ] What if an activity expires while the user is looking at it? → Countdown hits 0, card fades out
- [ ] What if the last spot fills while another user is about to join? → Postgres trigger rejects, toast shown
- [ ] What if host cancels an activity you've joined? → Card disappears from feed via realtime
- [ ] What if there are no activities at all? → Empty state renders correctly

**Done when:** All edge cases are manually tested and handled gracefully.

---

### 8.2 Error Boundaries
- [ ] Wrap `<ActivityFeed />` in a React Error Boundary
- [ ] If the feed crashes, show "Something went wrong — try refreshing" instead of a blank page
- [ ] All Supabase calls should have `error` checked and logged

**Done when:** No unhandled errors cause a blank screen.

---

### 8.3 Visual Consistency
- [ ] Pick a consistent colour palette (2–3 primary colours)
- [ ] Ensure tag colours are consistent everywhere (feed card, filter pill, create modal selector)
- [ ] Consistent border radius across cards, modals, buttons
- [ ] Consistent font sizes: heading, body, label, caption
- [ ] Check dark backgrounds don't make text unreadable

**Done when:** App looks designed, not hacked together. Tag colours match everywhere.

---

### 8.4 Performance Check
- [ ] Ensure realtime subscriptions are not duplicating on re-renders (check for double-subscribe)
- [ ] Ensure countdown interval is cleared on unmount (no memory leaks)
- [ ] Ensure the feed doesn't re-fetch on every keystroke or filter change — just filter client-side

**Done when:** No console warnings, no duplicate network calls, no memory leak warnings.

---

## Stage 9 — Demo Prep (Hour 21–24) · All

### 9.1 Seed Data
- [ ] Create 6–8 realistic seed activities directly in Supabase Table Editor (or via a seed script)
- [ ] Cover all tags: study, sports, food, social, chill
- [ ] Set varied expiry times: some expiring in 5 min, some in 45 min, some in 90 min
- [ ] Use real UNSW location names
- [ ] Examples:
  - "Need 1 more for badminton" — sports — Gym — expires 30 min
  - "Study group for COMP1511" — study — Library Level 2 — expires 90 min
  - "Lunch at Maccas after 12pm lecture" — food — Lower Campus — expires 45 min
  - "Board games at Roundhouse" — social — Roundhouse — expires 2 hours

**Done when:** The feed looks alive and realistic for the demo without needing real users.

---

### 9.2 Deploy to Vercel
- [ ] Push all code to `main` branch
- [ ] Go to vercel.com → New Project → Import from GitHub
- [ ] Add environment variables in Vercel dashboard:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [ ] Deploy
- [ ] Update Supabase Auth → Site URL to the Vercel production URL
- [ ] Test the live deployed URL end-to-end

**Done when:** App is live on a public Vercel URL and fully functional.

---

### 9.3 Demo Script
Write and rehearse a 3-minute demo flow:

1. **Open the app** on a phone (or phone-sized browser window)
2. **Show the feed** — "Here's what's happening on campus right now"
3. **Filter by Sports** — "I can filter to just find sports activities"
4. **Join an activity** — tap Join, show spot counter update live
5. **Open a second browser tab** — show the counter update in real-time across both
6. **Create an activity** — "Let's say I want to start a study group"
   - Select Study tag → room suggestions appear from DevSoc API
   - Fill in details, submit
   - Activity appears instantly in the feed on the other tab
7. **Show expiry** — "Posts expire automatically — no stale content"
8. **Pitch the vision** — "This is the missing real-time social layer for UNSW"

**Done when:** Every team member can narrate the demo confidently without hesitation.

---

### 9.4 Pitch Talking Points
- **Problem in one sentence:** Students are constantly on campus but spontaneous plans fail because there's no real-time discovery layer.
- **Solution in one sentence:** CampusPulse is a live feed of things happening on campus right now — post in 10 seconds, join in one tap.
- **Why it's different:** Not an event app. Not a chat app. A real-time social radar that self-destructs.
- **DevSoc integration:** When you create a study group, we surface available rooms from the DevSoc API automatically.
- **Future vision:** Timetable-aware suggestions ("Your COMP1511 lecture just ended — here's what's happening nearby"), push notifications, club integrations.

**Done when:** The pitch is tight, rehearsed, and under 3 minutes.

---

## Checklist Summary

| Stage | Owner | Status |
|---|---|---|
| 1.1–1.6 Setup | All | ⬜ |
| 2.1–2.2 Schema | Person A | ⬜ |
| 2.3 Trigger | Person A | ⬜ |
| 2.4 RLS | Person A | ⬜ |
| 2.5 Realtime | Person A | ⬜ |
| 2.6–2.8 Auth | Person A | ⬜ |
| 3.1–3.5 Create Modal | Person B | ⬜ |
| 4.1–4.2 useActivities Hook | Person B/C | ⬜ |
| 4.3–4.5 ActivityCard + Feed | Person B/C | ⬜ |
| 5.1–5.2 Join Button | Person A | ⬜ |
| 5.3–5.4 Leave + Cancel | Person A | ⬜ |
| 6.1–6.2 Tag Filter | All | ⬜ |
| 6.3–6.6 UX Polish | All | ⬜ |
| 7.1–7.4 DevSoc API | Person C | ⬜ |
| 8.1–8.4 Bug Fixes | All | ⬜ |
| 9.1 Seed Data | Person D | ⬜ |
| 9.2 Deploy | Person D | ⬜ |
| 9.3–9.4 Demo + Pitch | All | ⬜ |