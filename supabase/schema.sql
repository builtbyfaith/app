-- Built by Faith app database. Paste this whole file into Supabase: SQL Editor > New query > Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text default '',
  setup jsonb,
  settings jsonb default '{}'::jsonb,
  progression jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'none',            -- none | core | coach
  status text,                                  -- trialing | active | past_due | canceled
  stripe_customer_id text unique,
  current_period_end timestamptz,
  had_trial boolean default false
);

create table if not exists public.workout_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  name text, program text, energy text, effort text, minutes int,
  exercises jsonb,
  created_at timestamptz default now()
);
create index if not exists workout_logs_user_date on public.workout_logs(user_id, date);

create table if not exists public.daily_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  steps int,
  meals jsonb,
  primary key (user_id, date)
);

create table if not exists public.body_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight numeric,
  primary key (user_id, date)
);

create table if not exists public.coach_messages (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);
create index if not exists coach_messages_user_time on public.coach_messages(user_id, created_at);

-- If tables already existed from an older app, add any missing columns (safe to run again).
alter table public.profiles add column if not exists name text default '';
alter table public.profiles add column if not exists setup jsonb;
alter table public.profiles add column if not exists settings jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists progression jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.subscriptions add column if not exists plan text not null default 'none';
alter table public.subscriptions add column if not exists status text;
alter table public.subscriptions add column if not exists stripe_customer_id text;
alter table public.subscriptions add column if not exists current_period_end timestamptz;
alter table public.subscriptions add column if not exists had_trial boolean default false;
alter table public.subscriptions add column if not exists trial_started_at timestamptz default now();


-- If log tables already existed from an older app, add any missing columns (safe to run again).
alter table public.workout_logs add column if not exists date date;
alter table public.workout_logs add column if not exists name text;
alter table public.workout_logs add column if not exists program text;
alter table public.workout_logs add column if not exists energy text;
alter table public.workout_logs add column if not exists effort text;
alter table public.workout_logs add column if not exists minutes int;
alter table public.workout_logs add column if not exists exercises jsonb;
alter table public.daily_logs add column if not exists steps int;
alter table public.daily_logs add column if not exists meals jsonb;
alter table public.body_logs add column if not exists weight numeric;

-- Older columns this app doesn't use must not block new sign-ups.
do $$
declare c record;
begin
  for c in select table_name, column_name from information_schema.columns
    where table_schema = 'public' and table_name in ('profiles','subscriptions') and is_nullable = 'NO' and column_default is null
      and column_name not in ('id','user_id')
  loop
    execute format('alter table public.%I alter column %I drop not null', c.table_name, c.column_name);
  end loop;
end $$;

-- New sign-ups get a profile and an empty subscription row automatically
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
    on conflict (id) do nothing;
  insert into public.subscriptions (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row level security: members can only see and change their own data.
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.workout_logs enable row level security;
alter table public.daily_logs enable row level security;
alter table public.body_logs enable row level security;
alter table public.coach_messages enable row level security;

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Members can read their plan but only the server (Stripe webhook) can change it
drop policy if exists "own subscription read" on public.subscriptions;
create policy "own subscription read" on public.subscriptions for select using (auth.uid() = user_id);

drop policy if exists "own workouts" on public.workout_logs;
create policy "own workouts" on public.workout_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own daily" on public.daily_logs;
create policy "own daily" on public.daily_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own body" on public.body_logs;
create policy "own body" on public.body_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Members can read their coach chat; only the server writes it (so daily limits can't be skipped)
drop policy if exists "own coach read" on public.coach_messages;
create policy "own coach read" on public.coach_messages for select using (auth.uid() = user_id);

-- Size limits so no one can fill the database with junk (safe to run again).
alter table public.profiles drop constraint if exists profiles_size;
alter table public.profiles add constraint profiles_size check (
  char_length(coalesce(name,'')) <= 60
  and pg_column_size(setup) < 20000 and pg_column_size(settings) < 20000 and pg_column_size(progression) < 60000);
alter table public.workout_logs drop constraint if exists workout_logs_size;
alter table public.workout_logs add constraint workout_logs_size check (
  pg_column_size(exercises) < 20000 and char_length(coalesce(name,'')) <= 120 and char_length(coalesce(program,'')) <= 120
  and coalesce(minutes,0) between 0 and 600);
alter table public.daily_logs drop constraint if exists daily_logs_size;
alter table public.daily_logs add constraint daily_logs_size check (pg_column_size(meals) < 20000 and coalesce(steps,0) between 0 and 200000);
alter table public.body_logs drop constraint if exists body_logs_size;
alter table public.body_logs add constraint body_logs_size check (weight is null or weight between 40 and 1000);
alter table public.coach_messages drop constraint if exists coach_messages_size;
alter table public.coach_messages add constraint coach_messages_size check (char_length(content) <= 4000);

-- Coach Faith's notes (daily note, workout feedback, weekly review), written once and saved.
create table if not exists public.coach_insights (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('daily','workout','weekly')),
  key text not null,
  content text not null check (char_length(content) <= 2000),
  updated_at timestamptz default now(),
  unique (user_id, kind, key)
);
alter table public.coach_insights enable row level security;
drop policy if exists "own insights read" on public.coach_insights;
create policy "own insights read" on public.coach_insights for select using (auth.uid() = user_id);

-- Give anyone who signed up before this ran a profile and subscription row.
insert into public.profiles (id, name) select id, coalesce(raw_user_meta_data->>'name','') from auth.users on conflict (id) do nothing;
insert into public.subscriptions (user_id) select id from auth.users on conflict (user_id) do nothing;

-- Tell the API about the new tables right away.
notify pgrst, 'reload schema';
