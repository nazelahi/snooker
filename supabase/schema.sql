
-- Enable HTTP extension
create extension if not exists http with schema extensions;

-- Create a table for public profiles
create table players (
  id uuid references auth.users(id) not null primary key,
  name text,
  email text,
  skill_level text,
  matches_played integer,
  win_rate text,
  highest_break integer,
  avatar text,
  initials text,
  wins integer,
  losses integer,
  average_break integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for tournaments
create table tournaments (
  id serial primary key,
  name text,
  format text,
  players integer,
  status text,
  rules text[],
  image text,
  pendingPlayers text[],
  registeredPlayers text[],
  location text,
  winner text,
  bracket jsonb
);

-- Create a table for matches
create table matches (
    id serial primary key,
    winner text,
    loser text,
    score text,
    date timestamp with time zone,
    media text[],
    comments jsonb,
    pending_score jsonb,
    tournament_id integer references tournaments(id)
);

-- Create table for upcoming matches
create table upcoming_matches (
    id serial primary key,
    player1 text,
    player2 text,
    date date,
    time time,
    tournament_id integer references tournaments(id)
);

-- Create a view for live matches
create or replace view public.live_matches as
select
    um.id,
    um.tournament_id,
    t.name as tournament_name,
    um.player1,
    um.player2,
    (random() * 5)::int as score1,
    (random() * 5)::int as score2
from
    public.upcoming_matches um
join
    public.tournaments t on um.tournament_id = t.id
where
    t.status = 'In Progress'
    and um.date = current_date
limit 5;


-- Create a table for notices
create table notices (
  id serial primary key,
  title text,
  content text,
  date timestamp with time zone default now()
);

-- Create a table for notifications
create table notifications (
    id serial primary key,
    user_name text,
    title text,
    description text,
    read boolean default false,
    date timestamp with time zone default now(),
    link text,
    created_at timestamp with time zone default now()
);


-- Create a table for settings
create table settings (
  key text primary key,
  value jsonb
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security
alter table players
  enable row level security;

create policy "Public profiles are viewable by everyone." on players
  for select using (true);

create policy "Users can insert their own profile." on players
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on players
  for update using (auth.uid() = id);

-- Function to check if a user is an admin
create or replace function is_admin()
returns boolean as $$
begin
  return (select auth.jwt()->>'email') = 'admin@gmail.com';
end;
$$ language plpgsql security definer;


-- RLS for tournaments
alter table tournaments enable row level security;
create policy "Tournaments are viewable by everyone." on tournaments for select using (true);
create policy "Admins can insert tournaments." on tournaments for insert with check (is_admin());
create policy "Admins can update tournaments." on tournaments for update with check (is_admin());
create policy "Admins can delete tournaments." on tournaments for delete using (is_admin());

-- RLS for matches
alter table matches enable row level security;
create policy "Matches are viewable by everyone." on matches for select using (true);
create policy "Users can insert matches." on matches for insert with check (auth.role() = 'authenticated');
create policy "Users can update their own matches." on matches for update with check (auth.role() = 'authenticated');
create policy "Admins can delete matches." on matches for delete using (is_admin());

-- RLS for upcoming_matches
alter table upcoming_matches enable row level security;
create policy "Upcoming matches are viewable by everyone." on upcoming_matches for select using (true);
create policy "Admins can manage upcoming matches." on upcoming_matches for all using (is_admin());

-- RLS for notices
alter table notices enable row level security;
create policy "Notices are viewable by everyone." on notices for select using (true);
create policy "Admins can manage notices." on notices for all using (is_admin());

-- RLS for notifications
alter table notifications enable row level security;
create policy "Users can view their own notifications." on notifications for select using ((select auth.jwt()->>'email') = user_name or is_admin());
create policy "Users can update their own notifications." on notifications for update using ((select auth.jwt()->>'email') = user_name or is_admin());
create policy "Users can delete their own notifications." on notifications for delete using ((select auth.jwt()->>'email') = user_name or is_admin());
create policy "System can insert notifications." on notifications for insert with check (true);

-- RLS for settings
alter table settings enable row level security;
create policy "Settings are viewable by everyone." on settings for select using (true);
create policy "Admins can manage settings." on settings for all using (is_admin());


-- Set up Storage!
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true);

create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'avatars');

create policy "Anyone can update their own avatar." on storage.objects
  for update using (auth.uid() = owner) with check (bucket_id = 'avatars');
