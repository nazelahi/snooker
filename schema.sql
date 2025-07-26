--
-- PostgreSQL database dump
--

-- Dumped from database version 15.1
-- Dumped by pg_dump version 15.1 (Debian 15.1-1.pgdg110+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Create is_admin function
--
create or replace function public.is_admin()
returns boolean as $$
  select auth.jwt()->>'email' = 'admin@gmail.com';
$$ language sql security definer;


--
-- Create players table
--
CREATE TABLE public.players (
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    email text,
    skill_level text DEFAULT 'Beginner'::text,
    matches_played integer DEFAULT 0 NOT NULL,
    win_rate text DEFAULT '0%'::text,
    highest_break integer DEFAULT 0 NOT NULL,
    avatar text,
    initials text,
    wins integer DEFAULT 0,
    losses integer DEFAULT 0,
    average_break integer DEFAULT 0,
    role text DEFAULT 'player'::text
);
ALTER TABLE public.players OWNER TO postgres;
ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_pkey PRIMARY KEY (id);

--
-- Create matches table
--
CREATE TABLE public.matches (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    winner text,
    loser text,
    score text,
    date timestamp with time zone,
    media text[],
    "comments" jsonb,
    pending_score jsonb,
    tournament_id bigint
);
ALTER TABLE public.matches OWNER TO postgres;
CREATE SEQUENCE public.matches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.matches_id_seq OWNER TO postgres;
ALTER SEQUENCE public.matches_id_seq OWNED BY public.matches.id;
ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_id_seq'::regclass);
ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);

--
-- Create tournaments table
--
CREATE TABLE public.tournaments (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text,
    format text,
    players integer,
    status text,
    rules text[],
    image text,
    "pendingPlayers" text[],
    "registeredPlayers" text[],
    location text,
    winner text,
    bracket jsonb
);
ALTER TABLE public.tournaments OWNER TO postgres;
CREATE SEQUENCE public.tournaments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.tournaments_id_seq OWNER TO postgres;
ALTER SEQUENCE public.tournaments_id_seq OWNED BY public.tournaments.id;
ALTER TABLE ONLY public.tournaments ALTER COLUMN id SET DEFAULT nextval('public.tournaments_id_seq'::regclass);
ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);

--
-- Create notices table
--
CREATE TABLE public.notices (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    title text,
    content text,
    date timestamp with time zone
);
ALTER TABLE public.notices OWNER TO postgres;
CREATE SEQUENCE public.notices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.notices_id_seq OWNER TO postgres;
ALTER SEQUENCE public.notices_id_seq OWNED BY public.notices.id;
ALTER TABLE ONLY public.notices ALTER COLUMN id SET DEFAULT nextval('public.notices_id_seq'::regclass);
ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_pkey PRIMARY KEY (id);

--
-- Create live_matches view
--
CREATE VIEW public.live_matches AS
 SELECT upcoming_matches.id,
    upcoming_matches.tournament_id,
    tournaments.name AS tournament_name,
    upcoming_matches.player1,
    upcoming_matches.player2,
    (upcoming_matches.id % 5) AS score1,
    (upcoming_matches.id % 3) AS score2
   FROM (public.upcoming_matches
     LEFT JOIN public.tournaments ON ((upcoming_matches.tournament_id = tournaments.id)))
  WHERE ((upcoming_matches.date = CURRENT_DATE) AND (tournaments.status = 'In Progress'::text));
ALTER TABLE public.live_matches OWNER TO postgres;

--
-- Create notifications table
--
CREATE TABLE public.notifications (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_name text,
    title text,
    description text,
    read boolean DEFAULT false,
    date timestamp with time zone,
    link text
);
ALTER TABLE public.notifications OWNER TO postgres;
CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.notifications_id_seq OWNER TO postgres;
ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;
ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);
ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);

--
-- Create settings table
--
CREATE TABLE public.settings (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    key text,
    value jsonb
);
ALTER TABLE public.settings OWNER TO postgres;
CREATE SEQUENCE public.settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.settings_id_seq OWNER TO postgres;
ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;
ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);
ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_key UNIQUE (key);

--
-- Create upcoming_matches table
--
CREATE TABLE public.upcoming_matches (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    player1 text,
    player2 text,
    date date,
    "time" time without time zone,
    tournament_id bigint
);
ALTER TABLE public.upcoming_matches OWNER TO postgres;
CREATE SEQUENCE public.upcoming_matches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.upcoming_matches_id_seq OWNER TO postgres;
ALTER SEQUENCE public.upcoming_matches_id_seq OWNED BY public.upcoming_matches.id;
ALTER TABLE ONLY public.upcoming_matches ALTER COLUMN id SET DEFAULT nextval('public.upcoming_matches_id_seq'::regclass);
ALTER TABLE ONLY public.upcoming_matches
    ADD CONSTRAINT upcoming_matches_pkey PRIMARY KEY (id);

--
-- RLS Policies
--

-- Players Table
alter table public.players enable row level security;
create policy "Players are viewable by everyone." on public.players for select using (true);
create policy "Users can insert their own player profile." on public.players for insert with check (auth.uid() = id);
create policy "Users can update their own player profile." on public.players for update using (auth.uid() = id);
create policy "Admins can manage all players" on public.players for all using (public.is_admin());

-- Matches Table
alter table public.matches enable row level security;
create policy "Matches are viewable by everyone." on public.matches for select using (true);
create policy "Authenticated users can create matches." on public.matches for insert with check (auth.role() = 'authenticated');
create policy "Users can update their own matches." on public.matches for update using (auth.jwt()->>'email' = (pending_score->>'proposed_by'));
create policy "Admins can manage all matches" on public.matches for all using (public.is_admin());

-- Tournaments Table
alter table public.tournaments enable row level security;
create policy "Tournaments are viewable by everyone." on public.tournaments for select using (true);
create policy "Admins can manage all tournaments." on public.tournaments for all using (public.is_admin());
create policy "Authenticated users can apply for tournaments" on public.tournaments for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Notifications Table
alter table public.notifications enable row level security;
create policy "Users can view their own notifications." on public.notifications for select using (auth.jwt()->>'full_name' = user_name or auth.jwt()->>'email' = user_name);
create policy "Users can update their own notifications." on public.notifications for update using (auth.jwt()->>'full_name' = user_name or auth.jwt()->>'email' = user_name);
create policy "Users can delete their own notifications." on public.notifications for delete using (auth.jwt()->>'full_name' = user_name or auth.jwt()->>'email' = user_name);
create policy "System can insert notifications." on public.notifications for insert with check (true); -- Simplified for now

-- Settings Table
alter table public.settings enable row level security;
create policy "Settings are viewable by everyone." on public.settings for select using (true);
create policy "Admins can manage all settings." on public.settings for all using (public.is_admin());

-- Upcoming Matches
alter table public.upcoming_matches enable row level security;
create policy "Upcoming matches are viewable by everyone." on public.upcoming_matches for select using (true);
create policy "Admins can manage upcoming matches." on public.upcoming_matches for all using (public.is_admin());


--
-- Storage Policies for 'avatars' bucket
--
-- Note: These policies need to be applied in the Supabase Dashboard under Storage -> Policies

-- 1. Allow public read access to all avatars
-- This can be done by making the bucket public in the dashboard, or with this policy:
-- create policy "Public read access for avatars" on storage.objects for select using ( bucket_id = 'avatars' );

-- 2. Allow users to upload their own avatar
-- create policy "Users can upload their own avatar." on storage.objects for insert with check ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

-- 3. Allow users to update their own avatar
-- create policy "Users can update their own avatar." on storage.objects for update with check ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );
