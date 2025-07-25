-- Create users table
CREATE TABLE users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar TEXT,
    role TEXT DEFAULT 'user' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to get current user's email
CREATE OR REPLACE FUNCTION get_user_email()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT raw_user_meta_data->>'email' FROM auth.users WHERE id = auth.uid());
END;
$$;

-- Function to get current user's name
CREATE OR REPLACE FUNCTION get_user_name()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid());
END;
$$;


-- Create players table
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    skill_level TEXT,
    matches_played INTEGER,
    win_rate TEXT,
    highest_break INTEGER,
    avatar TEXT,
    initials TEXT,
    wins INTEGER,
    losses INTEGER,
    average_break INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create tournaments table first as other tables depend on it
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
    bracket JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create matches table
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    winner TEXT NOT NULL,
    loser TEXT NOT NULL,
    score TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    media TEXT[],
    comments JSONB,
    pending_score JSONB,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create upcoming_matches table
CREATE TABLE upcoming_matches (
    id SERIAL PRIMARY KEY,
    player1 TEXT NOT NULL,
    player2 TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create live_matches table
CREATE TABLE live_matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL,
    tournament_name TEXT,
    player1 TEXT NOT NULL,
    player2 TEXT NOT NULL,
    score1 INTEGER,
    score2 INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Create notices table
CREATE TABLE notices (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    date TIMESTAMPTZ NOT NULL,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create settings table
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for storage
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar." ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');
  
CREATE POLICY "Anyone can update their own avatar." ON storage.objects
  FOR UPDATE USING (auth.uid() = owner) WITH CHECK (bucket_id = 'avatars');

-- RLS Policies
-- Enable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view their own data." ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update their own data." ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can manage all users." ON users FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Policies for players table
CREATE POLICY "All users can view players." ON players FOR SELECT USING (true);
CREATE POLICY "Users can update their own player profile." ON players FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all players." ON players FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Policies for tournaments table
CREATE POLICY "All users can view tournaments." ON tournaments FOR SELECT USING (true);
CREATE POLICY "Admins can manage all tournaments." ON tournaments FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Policies for matches table
CREATE POLICY "All users can view matches." ON matches FOR SELECT USING (true);
CREATE POLICY "Users can create matches." ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update matches they are in." ON matches FOR UPDATE USING (
    (SELECT name FROM players WHERE user_id = auth.uid()) = winner OR 
    (SELECT name FROM players WHERE user_id = auth.uid()) = loser
);
CREATE POLICY "Admins can manage all matches." ON matches FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Policies for upcoming_matches
CREATE POLICY "All users can view upcoming matches." ON upcoming_matches FOR SELECT USING (true);
CREATE POLICY "Admins can manage all upcoming matches." ON upcoming_matches FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Policies for live_matches
CREATE POLICY "All users can view live matches." ON live_matches FOR SELECT USING (true);
CREATE POLICY "Admins can manage all live matches." ON live_matches FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Policies for notices
CREATE POLICY "All users can view notices." ON notices FOR SELECT USING (true);
CREATE POLICY "Admins can manage all notices." ON notices FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Policies for notifications
CREATE POLICY "Users can view their own notifications." ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications." ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own notifications." ON notifications FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins can view all notifications." ON notifications FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
-- A service role key would be needed to insert notifications for other users.

-- Policies for settings table
CREATE POLICY "All users can view settings." ON settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings." ON settings FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
