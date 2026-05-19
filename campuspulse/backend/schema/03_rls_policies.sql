-- CampusPulse Row Level Security policies
-- Run this third.

-- Enable RLS
alter table activities enable row level security;
alter table joins enable row level security;

-- Activities policies
create policy "Read active activities" on activities
  for select using (
    auth.role() = 'authenticated'
    and expires_at > now()
    and is_cancelled = false
  );

create policy "Create own activity" on activities
  for insert with check (auth.uid() = created_by);

create policy "Cancel own activity" on activities
  for update using (auth.uid() = created_by);

-- Joins policies
create policy "Join activity" on joins
  for insert with check (auth.role() = 'authenticated');

create policy "Read joins" on joins
  for select using (auth.role() = 'authenticated');
