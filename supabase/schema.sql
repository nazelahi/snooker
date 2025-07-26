
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT 'admin@gmail.com'
  ) = auth.jwt()->>'email';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--
-- Create the players table
--
CREATE TABLE
  public.players (
    id uuid NOT NULL DEFAULT uuid_generate_v4 (),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    skill_level text NOT NULL,
    matches_played integer NOT NULL,
    win_rate text NOT NULL,
    highest_break integer NOT NULL,
    avatar text NULL,
    initials text NULL,
    wins integer NULL,
    losses integer NULL,
    average_break integer NULL,
    email text NULL,
    CONSTRAINT players_pkey PRIMARY KEY (id),
    CONSTRAINT players_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
  );

-- RLS policies for players table
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all players" ON public.players;
CREATE POLICY "Users can view all players" ON public.players FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own player profile" ON public.players;
CREATE POLICY "Users can insert their own player profile" ON public.players FOR INSERT WITH CHECK (auth.uid() = id OR is_admin());
DROP POLICY IF EXISTS "Users can update their own player profile" ON public.players;
CREATE POLICY "Users can update their own player profile" ON public.players FOR UPDATE USING (auth.uid() = id OR is_admin()) WITH CHECK (auth.uid() = id OR is_admin());
DROP POLICY IF EXISTS "Admins can manage player profiles" ON public.players;
CREATE POLICY "Admins can manage player profiles" ON public.players FOR ALL USING (is_admin()) WITH CHECK (is_admin());


--
-- Create the tournaments table
--
CREATE TABLE public.tournaments (
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

-- RLS policies for tournaments table
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all tournaments" ON public.tournaments;
CREATE POLICY "Users can view all tournaments" ON public.tournaments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage tournaments" ON public.tournaments;
CREATE POLICY "Admins can manage tournaments" ON public.tournaments FOR ALL USING (is_admin()) WITH CHECK (is_admin());

--
-- Create the matches table
--
CREATE TABLE public.matches (
    id SERIAL PRIMARY KEY,
    winner TEXT NOT NULL,
    loser TEXT NOT NULL,
    score TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    media TEXT[],
    comments JSONB,
    pending_score JSONB,
    tournament_id INTEGER REFERENCES public.tournaments(id)
);

-- RLS policies for matches table
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all matches" ON public.matches;
CREATE POLICY "Users can view all matches" ON public.matches FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage matches" ON public.matches;
CREATE POLICY "Admins can manage matches" ON public.matches FOR ALL USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Users can manage their own matches" ON public.matches;
CREATE POLICY "Users can manage their own matches" ON public.matches FOR ALL USING (
  (SELECT name FROM public.players WHERE id = auth.uid()) IN (winner, loser)
) WITH CHECK (
  (SELECT name FROM public.players WHERE id = auth.uid()) IN (winner, loser)
);


--
-- Create the upcoming_matches table
--
CREATE TABLE public.upcoming_matches (
    id SERIAL PRIMARY KEY,
    player1 TEXT NOT NULL,
    player2 TEXT NOT NULL,
    date DATE NOT NULL,
    "time" TIME WITHOUT TIME ZONE NOT NULL,
    tournament_id INTEGER REFERENCES public.tournaments(id)
);

-- RLS policies for upcoming_matches table
ALTER TABLE public.upcoming_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all upcoming matches" ON public.upcoming_matches;
CREATE POLICY "Users can view all upcoming matches" ON public.upcoming_matches FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage upcoming matches" ON public.upcoming_matches;
CREATE POLICY "Admins can manage upcoming matches" ON public.upcoming_matches FOR ALL USING (is_admin()) WITH CHECK (is_admin());

--
-- Create the live_matches table
--
CREATE TABLE public.live_matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES public.tournaments(id),
    tournament_name TEXT,
    player1 TEXT NOT NULL,
    player2 TEXT NOT NULL,
    score1 INTEGER NOT NULL,
    score2 INTEGER NOT NULL
);

-- RLS policies for live_matches table
ALTER TABLE public.live_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all live matches" ON public.live_matches;
CREATE POLICY "Users can view all live matches" ON public.live_matches FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage live matches" ON public.live_matches;
CREATE POLICY "Admins can manage live matches" ON public.live_matches FOR ALL USING (is_admin()) WITH CHECK (is_admin());


--
-- Create the settings table
--
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value JSONB
);

-- RLS policies for settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all settings" ON public.settings;
CREATE POLICY "Users can view all settings" ON public.settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());


--
-- Create the notices table
--
CREATE TABLE public.notices (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS policies for notices table
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all notices" ON public.notices;
CREATE POLICY "Users can view all notices" ON public.notices FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage notices" ON public.notices;
CREATE POLICY "Admins can manage notices" ON public.notices FOR ALL USING (is_admin()) WITH CHECK (is_admin());

--
-- Create the notifications table
--
CREATE TABLE public.notifications (
    id SERIAL PRIMARY KEY,
    user_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS policies for notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only see their own notifications" ON public.notifications;
CREATE POLICY "Users can only see their own notifications" ON public.notifications FOR ALL
USING ((SELECT name FROM public.players WHERE id = auth.uid()) = user_name)
WITH CHECK ((SELECT name FROM public.players WHERE id = auth.uid()) = user_name);


--
-- Function and Trigger to create a player profile when a new user signs up
--
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.players (id, name, email, initials, skill_level, matches_played, win_rate, highest_break, wins, losses, average_break)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    LEFT(new.raw_user_meta_data->>'full_name', 1) || LEFT(SPLIT_PART(new.raw_user_meta_data->>'full_name', ' ', -1), 1),
    'Beginner', 0, '0%', 0, 0, 0, 0
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed initial data
INSERT INTO public.settings (key, value)
VALUES
  ('siteSettings', '{"name": "CueScore", "description": "The ultimate snooker club management app."}'),
  ('tournamentRules', '["Standard WBSA rules apply", "Best of 3 frames for early rounds", "Best of 5 frames for semi-finals", "Best of 7 frames for the final", "Players must be present 15 minutes before match time", "Foul and a miss rule is in effect"]')
ON CONFLICT (key) DO NOTHING;
