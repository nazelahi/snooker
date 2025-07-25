-- Create a table for public user profiles
create table users (
  id uuid references auth.users not null primary key,
  name text,
  email text unique,
  avatar text,
  role text default 'user'
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table users
  enable row level security;

create policy "Public profiles are viewable by everyone." on users
  for select using (true);

create policy "Users can insert their own profile." on users
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on users
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile for new users.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
-- Create a trigger function
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

-- Drop the trigger if it already exists to avoid errors on re-running the script
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create players table
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    skill_level TEXT CHECK(skill_level IN ('Beginner', 'Intermediate', 'Pro')),
    matches_played INTEGER DEFAULT 0,
    win_rate TEXT DEFAULT '0%',
    highest_break INTEGER DEFAULT 0,
    avatar TEXT,
    initials TEXT,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    average_break INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON players FOR SELECT USING (true);
CREATE POLICY "Allow all access to admin" ON players FOR ALL USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Allow users to update their own player data" ON players FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- Create tournaments table
CREATE TABLE tournaments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    format TEXT CHECK(format IN ('Knockout', 'League', 'Round Robin')),
    players INTEGER,
    status TEXT CHECK(status IN ('Upcoming', 'In Progress', 'Finished')),
    rules TEXT[],
    image TEXT,
    pendingPlayers TEXT[],
    registeredPlayers TEXT[],
    location TEXT,
    winner TEXT,
    bracket JSONB
);
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Allow all access to admin" ON tournaments FOR ALL USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Create matches table
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    winner TEXT NOT NULL,
    loser TEXT NOT NULL,
    score TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE,
    media TEXT[],
    comments JSONB,
    pending_score JSONB,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL
);
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow logged-in users to manage matches" ON matches FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow admin full access" ON matches FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');


-- Create upcoming_matches table
CREATE TABLE upcoming_matches (
    id SERIAL PRIMARY KEY,
    player1 TEXT NOT NULL,
    player2 TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL
);
ALTER TABLE upcoming_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON upcoming_matches FOR SELECT USING (true);
CREATE POLICY "Allow admin full access" ON upcoming_matches FOR ALL USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Create live_matches table
CREATE TABLE live_matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL,
    tournament_name TEXT,
    player1 TEXT NOT NULL,
    player2 TEXT NOT NULL,
    score1 INTEGER DEFAULT 0,
    score2 INTEGER DEFAULT 0
);
ALTER TABLE live_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON live_matches FOR SELECT USING (true);
CREATE POLICY "Allow admin full access" ON live_matches FOR ALL USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Create notices table
CREATE TABLE notices (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON notices FOR SELECT USING (true);
CREATE POLICY "Allow admin full access" ON notices FOR ALL USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);


-- Create notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    read BOOLEAN DEFAULT false,
    date TIMESTAMP WITH TIME ZONE,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to access their own notifications" ON notifications FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- Create settings table
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE,
    value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access for site settings" ON settings
  FOR SELECT USING (key = 'siteSettings');
CREATE POLICY "Allow admin full access" ON settings FOR ALL USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Set up Storage!
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, '{"image/jpeg","image/png","video/mp4"}');

CREATE POLICY "Allow public read access to media" ON storage.objects
  FOR SELECT USING ( bucket_id = 'media' );

CREATE POLICY "Allow logged-in users to upload media" ON storage.objects
  FOR INSERT WITH CHECK ( bucket_id = 'media' AND auth.role() = 'authenticated' );

-- Seed some initial data
INSERT INTO settings (key, value) VALUES ('siteSettings', '{"name": "CueScore", "description": "The ultimate snooker club management app.", "logo": null}');
INSERT INTO settings (key, value) VALUES ('tournamentRules', '["Standard WBSA rules apply", "Best of 5 frames", "Re-spotted black in case of a tie", "Players must be on time", "Respect the referee''s decision", "All players must mark for the next match"]');
