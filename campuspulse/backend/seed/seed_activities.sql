-- CampusPulse seed data: 6 realistic activities spanning all 5 tags.
-- Run AFTER the schema files and AFTER at least one auth user exists.
--
-- IMPORTANT: before running, find-and-replace every occurrence of
--   '00000000-0000-0000-0000-000000000000'
-- with a real auth.users.id (Supabase Dashboard → Authentication → Users).
-- The same user is reused as the creator of every seed row for simplicity.

insert into activities (created_by, title, tag, location_label, spots_total, expires_at)
values
  -- TODO: replace UUID with a real auth.users.id
  ('00000000-0000-0000-0000-000000000000', 'Need 1 more for badminton',      'sports', 'Gym',               4,  now() + interval '30 minutes'),
  ('00000000-0000-0000-0000-000000000000', 'Study group for COMP1511',       'study',  'Library (Level 2)', 6,  now() + interval '90 minutes'),
  ('00000000-0000-0000-0000-000000000000', 'Lunch at Roundhouse after 12pm', 'food',   'Roundhouse',        5,  now() + interval '45 minutes'),
  ('00000000-0000-0000-0000-000000000000', 'Board games and a chat',         'social', 'Quad Lawn',         8,  now() + interval '2 hours'),
  ('00000000-0000-0000-0000-000000000000', 'Chill on Village Green',         'chill',  'Village Green',     10, now() + interval '75 minutes'),
  ('00000000-0000-0000-0000-000000000000', 'Pickup basketball',              'sports', 'Village Green',     6,  now() + interval '15 minutes');
