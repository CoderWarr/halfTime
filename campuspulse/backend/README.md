# Backend (Supabase)

SQL files for the CampusPulse Postgres schema. Run them in the Supabase Dashboard → SQL Editor in this order:

1. `schema/01_tables.sql` — enum, `activities`, and `joins` tables
2. `schema/02_triggers.sql` — atomic `spots_joined` increment on join
3. `schema/03_rls_policies.sql` — RLS policies for both tables
4. `seed/seed_activities.sql` — *(optional)* 6 demo activities. Before running, find-and-replace the placeholder UUID `00000000-0000-0000-0000-000000000000` with a real `auth.users.id` (Authentication → Users)

## After running

In Supabase Dashboard → Database → Replication, enable Realtime for both `activities` and `joins`.

Verify in the Table Editor that both tables exist with their constraints and policies before connecting the frontend.
