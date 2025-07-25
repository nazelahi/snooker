--
-- RLS (Row Level Security)
--
-- Supabase automatically enables RLS on all tables. In this schema, we first
-- disable it on all tables, and then selectively re-enable it on the ones that
-- need to be protected.
--
-- Every table that has RLS enabled also has a "policy," which is a rule that
-- states which users are allowed to access which rows. In this schema, all
-- policies are defined as "permissive," which means that if multiple policies
-- exist for a single table, a user only needs to satisfy one of them to be
-- granted access.
--
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
--

--
-- HELPER FUNCTIONS
--
-- These functions are used in the RLS policies to simplify the logic.
-- See the definitions of the policies below to see how they are used.
--

-- Returns the user's ID from the `auth.users` table.
create or replace function auth.uid() returns uuid as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
$$ language sql stable;

-- Returns the user's email from the `auth.users` table.
create or replace function get_user_email() returns text as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'email', '')::text;
$$ language sql stable;

--
-- TABLES
--

-- Holds all of the site settings.
--
-- RLS is disabled for this table.
--
create table settings (
  key text primary key,
  value jsonb
);
alter table settings enable row level security;
create policy "Allow public read-only access" on settings for select using (true);
create policy "Allow admin write access" on settings for insert with check (get_user_email() = 'imnazelahi@gmail.com');
create policy "Allow admin update access" on settings for update using (get_user_email() = 'imnazelahi@gmail.com');


-- Holds all of the club's players.
--
-- RLS is disabled for this table.
--
create table players (
  id serial primary key,
  name text not null,
  skill_level text not null,
  matches_played integer not null,
  win_rate text not null,
  highest_break integer not null,
  avatar text,
  initials text,
  wins integer,
  losses integer,
  average_break integer,
  achievements jsonb,
  created_at timestamptz default now(),
  user_id uuid references auth.users(id)
);
alter table players enable row level security;
create policy "Allow public read-only access" on players for select using (true);
create policy "Allow admin write access" on players for insert with check (true);
create policy "Allow admin update access" on players for update using (true);
create policy "Allow admin delete access" on players for delete using (true);

-- Holds all of the club's tournaments.
--
-- RLS is disabled for this table.
--
create table tournaments (
  id serial primary key,
  name text not null,
  format text not null,
  players integer not null,
  status text not null,
  rules text[],
  image text,
  "pendingPlayers" text[],
  "registeredPlayers" text[],
  location text,
  winner text,
  bracket jsonb
);
alter table tournaments enable row level security;
create policy "Allow public read-only access" on tournaments for select using (true);
create policy "Allow admin write access" on tournaments for insert with check (true);
create policy "Allow admin update access" on tournaments for update using (true);
create policy "Allow admin delete access" on tournaments for delete using (true);


-- Holds all of the club's matches.
--
-- RLS is disabled for this table.
--
create table matches (
  id serial primary key,
  winner text not null,
  loser text not null,
  score text not null,
  date timestamptz not null,
  media text[],
  comments jsonb,
  pending_score jsonb,
  tournament_id integer references tournaments(id)
);
alter table matches enable row level security;
create policy "Allow public read-only access" on matches for select using (true);
create policy "Allow admin write access" on matches for insert with check (true);
create policy "Allow admin update access" on matches for update using (true);
create policy "Allow admin delete access" on matches for delete using (true);

-- Holds all of the club's upcoming matches.
--
-- RLS is disabled for this table.
--
create table upcoming_matches (
  id serial primary key,
  player1 text not null,
  player2 text not null,
  date date not null,
  time time not null,
  tournament_id integer references tournaments(id)
);
alter table upcoming_matches enable row level security;
create policy "Allow public read-only access" on upcoming_matches for select using (true);
create policy "Allow admin write access" on upcoming_matches for insert with check (true);
create policy "Allow admin update access" on upcoming_matches for update using (true);
create policy "Allow admin delete access" on upcoming_matches for delete using (true);

-- Holds all of the club's live matches.
--
-- RLS is disabled for this table.
--
create table live_matches (
  id serial primary key,
  tournament_id integer references tournaments(id),
  tournament_name text,
  player1 text not null,
  player2 text not null,
  score1 integer not null,
  score2 integer not null
);
alter table live_matches enable row level security;
create policy "Allow public read-only access" on live_matches for select using (true);
create policy "Allow admin write access" on live_matches for insert with check (true);
create policy "Allow admin update access" on live_matches for update using (true);
create policy "Allow admin delete access" on live_matches for delete using (true);

-- Holds all of the club's notices.
--
-- RLS is disabled for this table.
--
create table notices (
  id serial primary key,
  title text not null,
  content text not null,
  date timestamptz not null
);
alter table notices enable row level security;
create policy "Allow public read-only access" on notices for select using (true);
create policy "Allow admin write access" on notices for insert with check (true);
create policy "Allow admin update access" on notices for update using (true);
create policy "Allow admin delete access" on notices for delete using (true);

-- Holds all of the user profiles.
--
-- RLS is enabled for this table.
--
create table users (
  id uuid primary key references auth.users(id),
  name text not null,
  email text not null,
  role text not null
);
alter table users enable row level security;
create policy "Allow users to view their own profile" on users for select using (auth.uid() = id);
create policy "Allow users to update their own profile" on users for update using (auth.uid() = id);

--
-- NOTIFICATIONS
--
-- RLS is enabled for this table, and is defined below.
--
create table notifications (
    id serial primary key,
    user_id uuid not null references users(id),
    title text not null,
    description text not null,
    read boolean not null default false,
    date timestamptz not null default now(),
    link text,
    created_at timestamptz default now()
);
alter table notifications enable row level security;
create policy "Allow users to access their own notifications" on notifications for all using (auth.uid() = user_id);

-- This trigger automatically creates a user profile when a new user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    case
      when new.email = 'imnazelahi@gmail.com' then 'admin'
      else 'user'
    end
  );

  insert into public.players (user_id, name, initials, skill_level, matches_played, win_rate, highest_break)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    (select string_agg(substr(name, 1, 1), '') from unnest(string_to_array(new.raw_user_meta_data->>'full_name', ' ')) as name),
    'Beginner',
    0,
    '0%',
    0
  );

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


--
-- BUCKETS
--
-- The "avatars" bucket holds the profile pictures for each user.
--
-- RLS is enabled on this bucket.
--
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
create policy "Allow users to view their own avatar" on storage.objects for select using (bucket_id = 'avatars' and owner = auth.uid());
create policy "Allow users to upload their own avatar" on storage.objects for insert with check (bucket_id = 'avatars' and owner = auth.uid());
create policy "Allow users to update their own avatar" on storage.objects for update with check (bucket_id = 'avatars' and owner = auth.uid());
