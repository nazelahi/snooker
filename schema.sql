-- =================================================================
-- Players Table
-- Central table for user profiles and game statistics.
-- =================================================================
CREATE TABLE players (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text UNIQUE,
    skill_level text DEFAULT 'Beginner'::text,
    matches_played integer DEFAULT 0 NOT NULL,
    win_rate text DEFAULT '0%'::text,
    highest_break integer DEFAULT 0 NOT NULL,
    avatar text,
    initials text,
    wins integer DEFAULT 0,
    losses integer DEFAULT 0,
    average_break integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security for players
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to read all player profiles
CREATE POLICY "Allow read access to all users" ON public.players FOR SELECT USING (true);

-- Policy: Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile" ON public.players FOR UPDATE USING ((auth.uid() = id));

-- Policy: Allow new user signups to create a player profile
CREATE POLICY "Allow insert for new users" ON public.players FOR INSERT WITH CHECK (auth.uid() = id);

-- =================================================================
-- Tournaments Table
-- Stores information about all tournaments.
-- =================================================================
CREATE TABLE tournaments (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    format text NOT NULL,
    players integer NOT NULL,
    status text NOT NULL,
    rules jsonb,
    image text,
    pendingPlayers jsonb,
    registeredPlayers jsonb,
    location text,
    winner text,
    bracket jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS for tournaments
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
-- Policy: Allow all users to read tournaments
CREATE POLICY "Allow read access to all users" ON public.tournaments FOR SELECT USING (true);
-- Policy: Allow only admin to insert/update/delete tournaments
CREATE POLICY "Allow admin full access" ON public.tournaments FOR ALL USING (public.is_admin(auth.email())) WITH CHECK (public.is_admin(auth.email()));


-- =================================================================
-- Matches Table
-- Stores results of completed matches.
-- =================================================================
CREATE TABLE matches (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    winner text NOT NULL,
    loser text NOT NULL,
    score text NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    media jsonb,
    comments jsonb,
    pending_score jsonb,
    tournament_id bigint REFERENCES public.tournaments(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Enable RLS for matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
-- Policy: Allow read access to all
CREATE POLICY "Allow read access to all" ON public.matches FOR SELECT USING (true);
-- Policy: Allow logged-in users to insert
CREATE POLICY "Allow insert for authenticated users" ON public.matches FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Policy: Allow users to update their own matches
CREATE POLICY "Allow update for participants" ON public.matches FOR UPDATE USING (
  (auth.uid() IN (SELECT id FROM players WHERE name = winner OR name = loser))
  OR public.is_admin(auth.email())
);
-- Policy: Allow admin to delete
CREATE POLICY "Allow admin delete" ON public.matches FOR DELETE USING (public.is_admin(auth.email()));


-- =================================================================
-- Upcoming Matches Table
-- Stores scheduled matches that have not yet been played.
-- =================================================================
CREATE TABLE upcoming_matches (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    player1 text NOT NULL,
    player2 text NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    tournament_id bigint REFERENCES public.tournaments(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Enable RLS
ALTER TABLE public.upcoming_matches ENABLE ROW LEVEL SECURITY;
-- Policy: Allow read for all
CREATE POLICY "Allow read access to all" ON public.upcoming_matches FOR SELECT USING (true);
-- Policy: Allow only admin to manage
CREATE POLICY "Allow admin full access" ON public.upcoming_matches FOR ALL USING (public.is_admin(auth.email()));

-- =================================================================
-- Live Matches Table
-- Stores matches currently in progress.
-- =================================================================
CREATE TABLE live_matches (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tournament_id bigint NOT NULL REFERENCES public.tournaments(id),
    tournament_name text NOT NULL,
    player1 text NOT NULL,
    player2 text NOT NULL,
    score1 integer NOT NULL,
    score2 integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Enable RLS
ALTER TABLE public.live_matches ENABLE ROW LEVEL SECURITY;
-- Policy: Allow read for all
CREATE POLICY "Allow read access to all" ON public.live_matches FOR SELECT USING (true);
-- Policy: Allow only admin to manage
CREATE POLICY "Allow admin full access" ON public.live_matches FOR ALL USING (public.is_admin(auth.email()));


-- =================================================================
-- Notices Table
-- For club-wide announcements.
-- =================================================================
CREATE TABLE notices (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title text NOT NULL,
    content text NOT NULL,
    date timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Enable RLS
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
-- Policy: Allow read for all
CREATE POLICY "Allow read access to all" ON public.notices FOR SELECT USING (true);
-- Policy: Allow only admin to manage
CREATE POLICY "Allow admin full access" ON public.notices FOR ALL USING (public.is_admin(auth.email()));


-- =================================================================
-- Notifications Table
-- For user-specific alerts.
-- =================================================================
CREATE TABLE notifications (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_name text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    date timestamp with time zone NOT NULL,
    link text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- Policy: Allow users to read their own notifications
CREATE POLICY "Allow users to read their own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = (SELECT id FROM players WHERE name = user_name)));
-- Policy: Allow users to update their own notifications (e.g., mark as read)
CREATE POLICY "Allow users to update their own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = (SELECT id FROM players WHERE name = user_name)));
-- Policy: Allow users to delete their own notifications
CREATE POLICY "Allow users to delete their own notifications" ON public.notifications FOR DELETE USING ((auth.uid() = (SELECT id FROM players WHERE name = user_name)));
-- Note: Inserts should be handled by trusted functions or admin roles.


-- =================================================================
-- Settings Table
-- For key-value based application settings.
-- =================================================================
CREATE TABLE settings (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    key text UNIQUE NOT NULL,
    value jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
-- Policy: Allow read access for all users
CREATE POLICY "Allow read access to all users" ON public.settings FOR SELECT USING (true);
-- Policy: Allow admin full access
CREATE POLICY "Allow admin full access" ON public.settings FOR ALL USING (public.is_admin(auth.email()));


-- =================================================================
-- Helper Functions
-- =================================================================

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN user_email = 'admin@gmail.com';
END;
$$;


-- =================================================================
-- Storage Bucket for Avatars
-- =================================================================

-- Create a bucket for player avatars. Make it public for easy access.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
