-- Create Players Table
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL UNIQUE,
    skill_level TEXT,
    matches_played INTEGER DEFAULT 0,
    win_rate TEXT,
    highest_break INTEGER DEFAULT 0,
    avatar TEXT,
    initials TEXT,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    average_break INTEGER DEFAULT 0,
    achievements JSONB
);

-- Create Tournaments Table
CREATE TABLE tournaments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    format TEXT NOT NULL,
    players INTEGER,
    status TEXT NOT NULL,
    rules TEXT[],
    image TEXT,
    pendingPlayers TEXT[],
    registeredPlayers TEXT[],
    location TEXT,
    winner TEXT,
    bracket JSONB
);

-- Create Matches Table
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    winner TEXT NOT NULL,
    loser TEXT NOT NULL,
    score TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    media TEXT[],
    comments JSONB,
    pending_score JSONB,
    tournament_id INTEGER REFERENCES tournaments(id)
);

-- Create Upcoming Matches Table
CREATE TABLE upcoming_matches (
    id SERIAL PRIMARY KEY,
    player1 TEXT NOT NULL,
    player2 TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    tournament_id INTEGER REFERENCES tournaments(id)
);

-- Create Live Matches Table
CREATE TABLE live_matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id),
    tournament_name TEXT,
    player1 TEXT NOT NULL,
    player2 TEXT NOT NULL,
    score1 INTEGER,
    score2 INTEGER
);

-- Create Notices Table
CREATE TABLE notices (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW()
);

-- Create Notifications Table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    date TIMESTAMPTZ,
    link TEXT
);

-- Create Settings Table
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value JSONB
);

-- Create Storage Bucket for Avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Players Table
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to players" ON "public"."players" FOR SELECT USING (true);
CREATE POLICY "Allow users to update their own player data" ON "public"."players" FOR UPDATE USING ((auth.uid() = (SELECT id FROM auth.users WHERE raw_user_meta_data->>'full_name' = name)));
CREATE POLICY "Allow admin to manage all players" ON "public"."players" FOR ALL USING ((get_user_email() = 'imnazelahi@gmail.com')) WITH CHECK ((get_user_email() = 'imnazelahi@gmail.com'));

-- RLS Policies for Matches Table
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to matches" ON "public"."matches" FOR SELECT USING (true);
CREATE POLICY "Allow users to update their own matches" ON "public"."matches" FOR UPDATE USING ((auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'full_name' = winner OR raw_user_meta_data->>'full_name' = loser)));
CREATE POLICY "Allow admin to manage all matches" ON "public"."matches" FOR ALL USING ((get_user_email() = 'imnazelahi@gmail.com')) WITH CHECK ((get_user_email() = 'imnazelahi@gmail.com'));

-- RLS Policies for Upcoming Matches Table
ALTER TABLE upcoming_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to upcoming matches" ON "public"."upcoming_matches" FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage all upcoming matches" ON "public"."upcoming_matches" FOR ALL USING ((get_user_email() = 'imnazelahi@gmail.com')) WITH CHECK ((get_user_email() = 'imnazelahi@gmail.com'));

-- RLS Policies for Live Matches Table
ALTER TABLE live_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to live matches" ON "public"."live_matches" FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage all live matches" ON "public"."live_matches" FOR ALL USING ((get_user_email() = 'imnazelahi@gmail.com')) WITH CHECK ((get_user_email() = 'imnazelahi@gmail.com'));

-- RLS Policies for Tournaments Table
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to tournaments" ON "public"."tournaments" FOR SELECT USING (true);
CREATE POLICY "Allow users to apply to tournaments" ON "public"."tournaments" FOR UPDATE WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow admin to manage all tournaments" ON "public"."tournaments" FOR ALL USING ((get_user_email() = 'imnazelahi@gmail.com')) WITH CHECK ((get_user_email() = 'imnazelahi@gmail.com'));


-- RLS Policies for Notices Table
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to notices" ON "public"."notices" FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage notices" ON "public"."notices" FOR ALL USING ((get_user_email() = 'imnazelahi@gmail.com')) WITH CHECK ((get_user_email() = 'imnazelahi@gmail.com'));

-- RLS Policies for Notifications Table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to access their own notifications" ON "public"."notifications" FOR ALL USING ((get_user_name() = user_name)) WITH CHECK ((get_user_name() = user_name));

-- RLS Policies for Settings Table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to settings" ON "public"."settings" FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage settings" ON "public"."settings" FOR ALL USING ((get_user_email() = 'imnazelahi@gmail.com')) WITH CHECK ((get_user_email() = 'imnazelahi@gmail.com'));

-- Helper Functions
CREATE OR REPLACE FUNCTION get_user_email()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.jwt()->>'email';
$$;

CREATE OR REPLACE FUNCTION get_user_name()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid());
END;
$$;
