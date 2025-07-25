-- Users table to store public profile information
create table users (
  id uuid references auth.users not null primary key,
  name text,
  email text unique,
  avatar text,
  role text default 'user'
);

-- Function to create a public user profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, name, email, avatar, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    case 
      when new.email = 'imnazelahi@gmail.com' then 'admin'
      else 'user'
    end
  );
  return new;
end;
$$;

-- Trigger to call the function on new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Players table
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
  created_at timestamptz default now(),
  user_id uuid references public.users(id)
);

-- Tournaments table
create table tournaments (
  id serial primary key,
  name text not null,
  format text not null,
  players integer not null,
  status text not null,
  rules text[],
  image text,
  pendingPlayers text[],
  registeredPlayers text[],
  location text,
  winner text,
  bracket jsonb
);

-- Matches table
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

-- Upcoming Matches table
create table upcoming_matches (
  id serial primary key,
  player1 text not null,
  player2 text not null,
  date date not null,
  time time not null,
  tournament_id integer references tournaments(id)
);

-- Live Matches table
create table live_matches (
  id serial primary key,
  tournament_id integer not null,
  tournament_name text not null,
  player1 text not null,
  player2 text not null,
  score1 integer not null,
  score2 integer not null
);

-- Notifications table
create table notifications (
  id serial primary key,
  user_id uuid references public.users(id) not null,
  title text not null,
  description text not null,
  read boolean default false,
  date timestamptz not null,
  link text,
  created_at timestamptz default now()
);

-- Notices table
create table notices (
  id serial primary key,
  title text not null,
  content text not null,
  date timestamptz not null
);

-- Settings table
create table settings (
  key text primary key,
  value jsonb
);

-- Enable Row Level Security for all tables
alter table users enable row level security;
alter table players enable row level security;
alter table tournaments enable row level security;
alter table matches enable row level security;
alter table upcoming_matches enable row level security;
alter table live_matches enable row level security;
alter table notifications enable row level security;
alter table notices enable row level security;
alter table settings enable row level security;

-- Policies for 'users' table
create policy "Users are viewable by everyone." on users for select using (true);
create policy "Users can update their own profile." on users for update using (auth.uid() = id);

-- Policies for 'players' table
create policy "Players are viewable by everyone." on players for select using (true);
create policy "Admin can insert players." on players for insert with check (
  (select role from public.users where id = auth.uid()) = 'admin'
);
create policy "Admin can update players." on players for update with check (
  (select role from public.users where id = auth.uid()) = 'admin'
);
create policy "Admin can delete players." on players for delete using (
  (select role from public.users where id = auth.uid()) = 'admin'
);
create policy "Users can update their own player data." on players for update using (
  user_id = auth.uid()
);


-- Policies for 'tournaments' table
create policy "Tournaments are viewable by everyone." on tournaments for select using (true);
create policy "Admin can insert tournaments." on tournaments for insert with check (
  (select role from public.users where id = auth.uid()) = 'admin'
);
create policy "Admin can update tournaments." on tournaments for update with check (
  (select role from public.users where id = auth.uid()) = 'admin'
);
create policy "Authenticated users can update tournament applications." on tournaments for update with check (
  auth.role() = 'authenticated'
);
create policy "Admin can delete tournaments." on tournaments for delete using (
  (select role from public.users where id = auth.uid()) = 'admin'
);


-- Policies for 'matches' table
create policy "Matches are viewable by everyone." on matches for select using (true);
create policy "Authenticated users can insert matches." on matches for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update matches." on matches for update with check (auth.role() = 'authenticated');
create policy "Admin can delete matches." on matches for delete using (
  (select role from public.users where id = auth.uid()) = 'admin'
);


-- Policies for 'upcoming_matches' table
create policy "Upcoming matches are viewable by everyone." on upcoming_matches for select using (true);
create policy "Admin can manage upcoming matches." on upcoming_matches for all with check (
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- Policies for 'live_matches' table
create policy "Live matches are viewable by everyone." on live_matches for select using (true);
create policy "Admin can manage live matches." on live_matches for all with check (
  (select role from public.users where id = auth.uid()) = 'admin'
);


-- Policies for 'notifications' table
create policy "Users can view their own notifications." on notifications for select using (auth.uid() = user_id);
create policy "Users can update their own notifications." on notifications for update using (auth.uid() = user_id);
create policy "Users can delete their own notifications." on notifications for delete using (auth.uid() = user_id);
create policy "System can insert notifications." on notifications for insert with check (true);


-- Policies for 'notices' table
create policy "Notices are viewable by everyone." on notices for select using (true);
create policy "Admin can manage notices." on notices for all with check (
  (select role from public.users where id = auth.uid()) = 'admin'
);


-- Policies for 'settings' table
create policy "Settings are viewable by everyone." on settings for select using (true);
create policy "Admin can manage settings." on settings for all with check (
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- Initial data for settings
insert into settings (key, value) values 
('siteSettings', '{"name": "CueScore", "description": "The ultimate snooker club management app.", "logo": null}'),
('tournamentRules', '["Standard WBSA rules apply.", "Best of 3 frames until semi-finals.", "Semi-finals are best of 5 frames.", "Final is best of 7 frames.", "All matches must have a referee.", "Players must be registered club members."]')
on conflict (key) do nothing;
