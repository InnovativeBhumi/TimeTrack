create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  work_date date not null,
  left_at timestamptz not null default now(),
  returned_at timestamptz,
  left_lat double precision, left_lng double precision,
  return_lat double precision, return_lng double precision,
  stops jsonb not null default '[]',
  created_at timestamptz default now()
);
create table tool_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  week_of date not null,
  items text not null,
  submitted_at timestamptz default now(),
  unique (user_id, week_of)
);
alter table trips enable row level security;
alter table tool_requests enable row level security;
create policy "own trips" on trips for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tools" on tool_requests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
