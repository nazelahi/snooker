-- Create a table for public players
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL UNIQUE,
  skill_level TEXT NOT NULL,
  matches_played INTEGER DEFAULT 0,
  win_rate TEXT DEFAULT '0%',
  highest_break INTEGER DEFAULT 0,
  avatar TEXT,
  initials TEXT,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  average_break INTEGER DEFAULT 0,
  achievements JSONB
);

-- TOURNAMENTS
CREATE TABLE tournaments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    format TEXT NOT NULL,
    players INTEGER NOT NULL,
    status TEXT NOT NULL,
    rules TEXT[],
    image TEXT,
    pendingPlayers TEXT[],
    registeredPlayers TEXT[],
    location TEXT,
    winner TEXT,
    bracket JSONB
);

-- MATCHES
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    winner TEXT NOT NULL,
    loser TEXT NOT NULL,
    score TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    media TEXT[],
    comments JSONB,
    pending_score JSONB,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL
);

-- UPCOMING MATCHES
CREATE TABLE upcoming_matches (
    id SERIAL PRIMARY KEY,
    player1 TEXT NOT NULL,
    player2 TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL
);

-- LIVE MATCHES
CREATE TABLE live_matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL,
    tournament_name TEXT,
    player1 TEXT NOT NULL,
    player2 TEXT NOT NULL,
    score1 INTEGER NOT NULL DEFAULT 0,
    score2 INTEGER NOT NULL DEFAULT 0
);

-- NOTICES
CREATE TABLE notices (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    date TIMESTAMPTZ NOT NULL,
    link TEXT
);

-- SETTINGS
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- Set up Storage!
INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

-- RLS POLICIES --

-- Enable RLS for all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies for 'players'
CREATE POLICY "Players are viewable by everyone." ON players
  FOR SELECT USING (TRUE);
CREATE POLICY "Admin can insert players." ON players
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = 'admin@gmail.com');
CREATE POLICY "Admin can update players." ON players
  FOR UPDATE USING (auth.jwt() ->> 'email' = 'admin@gmail.com');
CREATE POLICY "Admin can delete players." ON players
  FOR DELETE USING (auth.jwt() ->> 'email' = 'admin@gmail.com');

-- Policies for 'tournaments'
CREATE POLICY "Tournaments are viewable by everyone." ON tournaments
  FOR SELECT USING (TRUE);
CREATE POLICY "Admin can insert tournaments." ON tournaments
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = 'admin@gmail.com');
CREATE POLICY "Authenticated users can update tournaments (for registration)." ON tournaments
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can delete tournaments." ON tournaments
  FOR DELETE USING (auth.jwt() ->> 'email' = 'admin@gmail.com');

-- Policies for 'matches'
CREATE POLICY "Matches are viewable by everyone." ON matches
  FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can insert matches." ON matches
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update matches." ON matches
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can delete matches." ON matches
  FOR DELETE USING (auth.jwt() ->> 'email' = 'admin@gmail.com');

-- Policies for 'upcoming_matches'
CREATE POLICY "Upcoming matches are viewable by everyone." ON upcoming_matches
  FOR SELECT USING (TRUE);
CREATE POLICY "Admin can insert upcoming matches." ON upcoming_matches
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = 'admin@gmail.com');
CREATE POLICY "Admin can update upcoming matches." ON upcoming_matches
  FOR UPDATE USING (auth.jwt() ->> 'email' = 'admin@gmail.com');
CREATE POLICY "Admin can delete upcoming matches." ON upcoming_matches
  FOR DELETE USING (auth.jwt() ->> 'email' = 'admin@gmail.com');

-- Policies for 'live_matches'
CREATE POLICY "Live matches are viewable by everyone." ON live_matches
  FOR SELECT USING (TRUE);
CREATE POLICY "Admin can insert live matches." ON live_matches
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = 'admin@gmail.com');
CREATE POLICY "Admin can update live matches." ON live_matches
  FOR UPDATE USING (auth.jwt() ->> 'email' = 'admin@gmail.com');
CREATE POLICY "Admin can delete live matches." ON live_matches
  FOR DELETE USING (auth.jwt() ->> 'email' = 'admin@gmail.com');

-- Policies for 'notices'
CREATE POLICY "Notices are viewable by everyone." ON notices
  FOR SELECT USING (TRUE);
CREATE POLICY "Admin can insert notices." ON notices
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = 'admin@gmail.com');
CREATE POLICY "Admin can delete notices." ON notices
  FOR DELETE USING (auth.jwt() ->> 'email' = 'admin@gmail.com');
  
-- Helper function to get user's full name
CREATE OR REPLACE FUNCTION get_user_name()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data->>'full_name'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Policies for 'notifications'
CREATE POLICY "Users can view their own notifications." ON notifications
  FOR SELECT USING (user_name = get_user_name());
CREATE POLICY "Users can insert their own notifications." ON notifications
  FOR INSERT WITH CHECK (user_name = get_user_name() OR auth.jwt() ->> 'email' = 'admin@gmail.com');
CREATE POLICY "Users can update their own notifications (e.g. mark as read)." ON notifications
  FOR UPDATE USING (user_name = get_user_name());
CREATE POLICY "Users can delete their own notifications." ON notifications
  FOR DELETE USING (user_name = get_user_name());

-- Policies for 'settings'
CREATE POLICY "Settings are viewable by everyone." ON settings
  FOR SELECT USING (TRUE);
CREATE POLICY "Admin can update settings." ON settings
  FOR UPDATE USING (auth.jwt() ->> 'email' = 'admin@gmail.com');
CREATE POLICY "Admin can insert settings." ON settings
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = 'admin@gmail.com');


-- Policies for 'avatars' storage bucket
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar." ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can update their own avatar." ON storage.objects
  FOR UPDATE USING (auth.uid() = owner) WITH CHECK (bucket_id = 'avatars');
