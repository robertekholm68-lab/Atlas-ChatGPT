-- ASKR Cloud 1.0 normalized PostgreSQL schema for Supabase.
create type atlas_role as enum ('user','coach','admin','team_owner');
create type sync_operation as enum ('insert','update','delete');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  username citext unique,
  email citext not null unique,
  profile_image_path text,
  birth_year int check (birth_year between 1900 and extract(year from now())::int),
  height_cm numeric(5,2),
  weight_kg numeric(5,2),
  units jsonb not null default '{"weight":"kg","height":"cm","distance":"km"}',
  language text not null default 'en',
  time_zone text not null default 'UTC',
  preferences jsonb not null default '{}',
  coach_personality text not null default 'balanced',
  privacy_settings jsonb not null default '{}',
  role atlas_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.goals (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, category text not null, title text not null, target_value numeric, unit text, target_date date, status text not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.programs (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, goal_id uuid references public.goals(id) on delete set null, title text not null, description text, starts_on date, ends_on date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.workouts (id uuid primary key default gen_random_uuid(), program_id uuid references public.programs(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, title text not null, scheduled_on date, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.exercises (id uuid primary key default gen_random_uuid(), name text not null, primary_muscle text not null, secondary_muscles text[] not null default '{}', asset_path text, instructions text, created_at timestamptz not null default now());
create table public.workout_exercises (workout_id uuid references public.workouts(id) on delete cascade, exercise_id uuid references public.exercises(id), position int not null, prescription jsonb not null default '{}', primary key (workout_id, exercise_id, position));
create table public.workout_sessions (id uuid primary key default gen_random_uuid(), workout_id uuid references public.workouts(id) on delete set null, user_id uuid not null references public.profiles(id) on delete cascade, started_at timestamptz not null, ended_at timestamptz, perceived_effort int check (perceived_effort between 1 and 10), notes text, client_updated_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.workout_sets (id uuid primary key default gen_random_uuid(), session_id uuid not null references public.workout_sessions(id) on delete cascade, exercise_id uuid not null references public.exercises(id), set_index int not null, weight numeric, reps int, duration_seconds int, distance_meters numeric, rpe numeric(3,1), completed_at timestamptz, updated_at timestamptz not null default now());

create table public.recipes (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, name text not null, servings numeric not null default 1, nutrition jsonb not null default '{}', instructions text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.meals (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, recipe_id uuid references public.recipes(id) on delete set null, logged_at timestamptz not null, meal_type text not null, name text not null, nutrition jsonb not null default '{}', updated_at timestamptz not null default now());
create table public.nutrition_entries (id uuid primary key default gen_random_uuid(), meal_id uuid not null references public.meals(id) on delete cascade, food_name text not null, quantity numeric, unit text, calories numeric, protein_g numeric, carbs_g numeric, fat_g numeric);

create table public.recovery_entries (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, logged_on date not null, sleep_minutes int, resting_heart_rate int, hrv numeric, soreness_score int, stress_score int, notes text, updated_at timestamptz not null default now(), unique(user_id, logged_on));
create table public.muscle_status (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, muscle_key text not null, readiness_score int not null, load_score int not null, recovery_at timestamptz, updated_at timestamptz not null default now(), unique(user_id, muscle_key));
create table public.progress_entries (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, goal_id uuid references public.goals(id) on delete set null, metric text not null, value numeric not null, unit text, recorded_at timestamptz not null default now());
create table public.achievements (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, code text not null, title text not null, awarded_at timestamptz not null default now(), metadata jsonb not null default '{}', unique(user_id, code));
create table public.coach_memory (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, memory_type text not null, content jsonb not null, importance numeric not null default 0.5, updated_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, channel text not null, category text not null, title text not null, body text, scheduled_at timestamptz, read_at timestamptz, created_at timestamptz not null default now());
create table public.settings (user_id uuid primary key references public.profiles(id) on delete cascade, notification_settings jsonb not null default '{}', analytics_consent boolean not null default false, export_preferences jsonb not null default '{}', updated_at timestamptz not null default now());
create table public.sync_changes (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, entity_table text not null, entity_id uuid not null, operation sync_operation not null, client_updated_at timestamptz not null, server_updated_at timestamptz not null default now(), conflict jsonb);

alter table public.profiles enable row level security;
-- Repeat RLS enablement for all user-owned tables and use auth.uid() = user_id policies.
