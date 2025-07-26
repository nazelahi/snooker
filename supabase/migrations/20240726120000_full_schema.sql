
-- Drop existing policies and functions if they exist, in the correct order.
DROP POLICY IF EXISTS "Enable all access for admins" ON public.settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.players;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.players;
DROP POLICY IF EXISTS "Allow user to update their own profile" ON public.players;
DROP POLICY IF EXISTS "Allow admin to update any profile" ON public.players;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tournaments;
DROP POLICY IF EXISTS "Enable all access for admins" ON public.tournaments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.matches;
DROP POLICY IF EXISTS "Enable all access for admins" ON public.matches;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.matches;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.matches;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.upcoming_matches;
DROP POLICY IF EXISTS "Enable all access for admins" ON public.upcoming_matches;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.live_matches;
DROP POLICY IF EXISTS "Enable all access for admins" ON public.live_matches;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notifications;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.notifications;
DROP POLICY IF EXISTS "Enable update for users to read their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Enable delete for users to clear their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Enable all access for admins" ON public.notifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notices;
DROP POLICY IF EXISTS "Enable all access for admins" ON public.notices;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin(user_email text);
DROP FUNCTION IF EXISTS public.get_user_role(user_id uuid);

-- Create custom types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('user', 'admin');
    END IF;
END$$;


-- Create helper functions
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS public.user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM admins WHERE admins.user_id = get_user_role.user_id) THEN
    RETURN 'admin';
  ELSE
    RETURN 'user';
  END IF;
END;
$$;


CREATE OR REPLACE FUNCTION public.is_admin(user_id_check uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM admins WHERE user_id = user_id_check);
END;
$$;


CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.players (id, name, email, initials, avatar, skill_level, matches_played, win_rate, highest_break, wins, losses, average_break)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    substring(new.raw_user_meta_data->>'full_name' from 1 for 1) || substring(split_part(new.raw_user_meta_data->>'full_name', ' ', 2) from 1 for 1),
    new.raw_user_meta_data->>'avatar_url',
    'Beginner', 0, '0%', 0, 0, 0, 0
  );
  -- If the new user is admin@gmail.com, add them to the admins table
  IF new.email = 'admin@gmail.com' THEN
    INSERT INTO public.admins (user_id) VALUES (new.id);
  END IF;
  RETURN new;
END;
$$;


-- Tables
CREATE TABLE IF NOT EXISTS public.players (
    id uuid NOT NULL PRIMARY KEY,
    name text,
    email text UNIQUE,
    skill_level text,
    matches_played integer,
    win_rate text,
    highest_break integer,
    avatar text,
    initials text,
    wins integer,
    losses integer,
    average_break integer,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admins (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.matches (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    winner text,
    loser text,
    score text,
    date timestamp with time zone,
    media jsonb,
    comments jsonb,
    pending_score jsonb,
    tournament_id bigint
);

CREATE TABLE IF NOT EXISTS public.upcoming_matches (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    player1 text,
    player2 text,
    date date,
    time time,
    tournament_id bigint
);

CREATE TABLE IF NOT EXISTS public.live_matches (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tournament_id bigint,
    tournament_name text,
    player1 text,
    player2 text,
    score1 integer,
    score2 integer
);

CREATE TABLE IF NOT EXISTS public.tournaments (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text,
    format text,
    players integer,
    status text,
    rules jsonb,
    image text,
    pendingPlayers text[],
    registeredPlayers text[],
    location text,
    winner text,
    bracket jsonb
);

CREATE TABLE IF NOT EXISTS public.notices (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title text,
    content text,
    date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_name text,
    title text,
    description text,
    read boolean DEFAULT false,
    date timestamp with time zone,
    link text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settings (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    key text UNIQUE,
    value jsonb
);

-- Policies
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.players FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow user to update their own profile" ON public.players FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow admin to update any profile" ON public.players FOR UPDATE USING (is_admin(auth.uid()));

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for admins" ON public.admins FOR SELECT USING (is_admin(auth.uid()));

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.matches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.matches FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for admins" ON public.matches FOR ALL USING (is_admin(auth.uid()));

ALTER TABLE public.upcoming_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.upcoming_matches FOR SELECT USING (true);
CREATE POLICY "Enable all access for admins" ON public.upcoming_matches FOR ALL USING (is_admin(auth.uid()));

ALTER TABLE public.live_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.live_matches FOR SELECT USING (true);
CREATE POLICY "Enable all access for admins" ON public.live_matches FOR ALL USING (is_admin(auth.uid()));

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Enable all access for admins" ON public.tournaments FOR ALL USING (is_admin(auth.uid()));

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Enable all access for admins" ON public.notices FOR ALL USING (is_admin(auth.uid()));

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for own notifications" ON public.notifications FOR SELECT USING (auth.uid() = (SELECT id FROM public.players WHERE name = user_name LIMIT 1));
CREATE POLICY "Enable insert for authenticated users" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for users to read their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = (SELECT id FROM public.players WHERE name = user_name LIMIT 1));
CREATE POLICY "Enable delete for users to clear their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = (SELECT id FROM public.players WHERE name = user_name LIMIT 1));
CREATE POLICY "Enable all access for admins" ON public.notifications FOR ALL USING (is_admin(auth.uid()));

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Enable all access for admins" ON public.settings FOR ALL USING (is_admin(auth.uid()));


-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible."
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

CREATE POLICY "Anyone can upload an avatar."
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

CREATE POLICY "Anyone can update their own avatar."
ON storage.objects FOR UPDATE
TO authenticated
USING ( auth.uid() = owner )
WITH CHECK ( bucket_id = 'avatars' );
