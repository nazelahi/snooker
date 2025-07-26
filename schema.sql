-- Enable necessary extensions
create extension if not exists "pg_graphql" with schema "graphql";
create extension if not exists "pgsodium" with schema "pgsodium";
create extension if not exists "pg_stat_statements" with schema "extensions";
create extension if not exists "pgcrypto" with schema "extensions";
create extension if not exists "pgjwt" with schema "extensions";
create extension if not exists "supabase_vault" with schema "vault";
create extension if not exists "uuid-ossp" with schema "extensions";

-- Create the players table
CREATE TABLE public.players (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    name TEXT NOT NULL,
    email TEXT,
    skill_level TEXT,
    matches_played INTEGER DEFAULT 0,
    win_rate TEXT,
    highest_break INTEGER DEFAULT 0,
    avatar TEXT,
    initials TEXT,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    average_break INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the tournaments table
CREATE TABLE public.tournaments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    format TEXT,
    players INTEGER,
    status TEXT,
    rules TEXT[],
    image TEXT,
    pendingPlayers TEXT[],
    registeredPlayers TEXT[],
    location TEXT,
    winner TEXT,
    bracket JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the matches table
CREATE TABLE public.matches (
    id SERIAL PRIMARY KEY,
    winner TEXT NOT NULL,
    loser TEXT NOT NULL,
    score TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    media TEXT[],
    comments JSONB,
    pending_score JSONB,
    tournament_id INTEGER REFERENCES public.tournaments(id)
);

-- Create the upcoming_matches table
CREATE TABLE public.upcoming_matches (
    id SERIAL PRIMARY KEY,
    player1 TEXT NOT NULL,
    player2 TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    tournament_id INTEGER REFERENCES public.tournaments(id)
);

-- Create the notices table
CREATE TABLE public.notices (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the notifications table
CREATE TABLE public.notifications (
    id SERIAL PRIMARY KEY,
    user_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    read BOOLEAN DEFAULT false,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the settings table
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value JSONB
);

-- Create a view for live matches
CREATE OR REPLACE VIEW public.live_matches AS
SELECT
    m.id,
    m.player1,
    m.player2,
    -- In a real scenario, scores would come from a different source
    -- For now, we'll generate random scores as placeholders
    floor(random() * 5)::int AS score1,
    floor(random() * 5)::int AS score2,
    m.tournament_id,
    t.name as tournament_name
FROM public.upcoming_matches m
JOIN public.tournaments t ON m.tournament_id = t.id
WHERE t.status = 'In Progress'
-- This is a placeholder for a real-time scoring system
AND random() > 0.5;

-- is_admin function
create or replace function public.is_admin()
returns boolean as $$
declare
  user_email text;
begin
  select auth.jwt()->>'email' into user_email;
  return user_email = 'admin@gmail.com';
end;
$$ language plpgsql security definer;

-- RLS Policies for players table
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage all players" ON public.players FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users can view all players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Users can insert their own player profile" ON public.players FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own player profile" ON public.players FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for tournaments table
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage all tournaments" ON public.tournaments FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users can view all tournaments" ON public.tournaments FOR SELECT USING (true);

-- RLS Policies for matches table
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage all matches" ON public.matches FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users can view all matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Users can insert matches" ON public.matches FOR INSERT WITH CHECK (auth.role = 'authenticated');
CREATE POLICY "Users can update their own matches" ON public.matches FOR UPDATE USING (auth.role = 'authenticated');

-- RLS Policies for upcoming_matches table
ALTER TABLE public.upcoming_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage all upcoming matches" ON public.upcoming_matches FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users can view all upcoming matches" ON public.upcoming_matches FOR SELECT USING (true);

-- RLS Policies for notices table
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage all notices" ON public.notices FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users can view all notices" ON public.notices FOR SELECT USING (true);

-- RLS Policies for notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING ((SELECT auth.jwt() ->> 'email' AS "email") = user_name);

-- RLS Policies for settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage all settings" ON public.settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users can view all settings" ON public.settings FOR SELECT USING (true);


-- Storage Avatar Policy
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can update their own avatar." ON storage.objects FOR UPDATE USING (auth.uid() = owner) WITH CHECK (bucket_id = 'avatars');

-- Function to call edge function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Here you can add logic that should run for every new user
  -- For example, creating a profile, sending a welcome email, etc.
  -- This example calls a Supabase Edge Function.
  PERFORM net.http_post(
    url := 'https://jkyhfdvvswhmoqwmgnbf.supabase.co/functions/v1/create-player-profile',
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := jsonb_build_object('record', new)
  );
  return new;
end;
$$;


-- Trigger to call handle_new_user on new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
