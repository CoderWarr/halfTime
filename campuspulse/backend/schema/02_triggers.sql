-- CampusPulse triggers: atomic spot counter increment
-- Run this second.

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
