-- CampusPulse schema: tables and enum
-- Run this first in the Supabase SQL Editor.

create type activity_tag as enum ('study', 'sports', 'food', 'social', 'chill');

create table activities (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users not null,
  title text not null,
  tag activity_tag not null,
  location_label text not null,
  latitude double precision,
  longitude double precision,
  map_url text,
  is_dynamic_location boolean not null default false,
  spots_total int not null check (spots_total > 0),
  spots_joined int not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  is_cancelled boolean default false
);

create table joins (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid references activities on delete cascade not null,
  user_id uuid references auth.users not null,
  joined_at timestamptz default now(),
  unique(activity_id, user_id)
);
