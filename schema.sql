-- Supabase SQL Schema for Cuescore

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: postgres
--
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT (auth.jwt()->>'email') = 'admin@gmail.com';
$$;

ALTER FUNCTION public.is_admin() OWNER TO postgres;

--
-- T-shirts table
--
CREATE TABLE public.players (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    email text,
    skill_level text,
    matches_played integer DEFAULT 0 NOT NULL,
    win_rate text,
    highest_break integer,
    avatar text,
    initials text,
    wins integer,
    losses integer,
    average_break integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.players OWNER TO postgres;
ALTER TABLE ONLY public.players ADD CONSTRAINT players_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);

--
-- tournaments table
--
CREATE TABLE public.tournaments (
    id integer NOT NULL,
    name text NOT NULL,
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
    AS integer
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
-- matches table
--
CREATE TABLE public.matches (
    id integer NOT NULL,
    winner text,
    loser text,
    score text,
    date timestamp with time zone,
    media text[],
    comments jsonb,
    pending_score jsonb,
    tournament_id integer
);

ALTER TABLE public.matches OWNER TO postgres;
CREATE SEQUENCE public.matches_id_seq
    AS integer
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
ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id);

--
-- upcoming_matches table
--
CREATE TABLE public.upcoming_matches (
    id integer NOT NULL,
    player1 text,
    player2 text,
    date date,
    "time" time without time zone,
    tournament_id integer
);

ALTER TABLE public.upcoming_matches OWNER TO postgres;
CREATE SEQUENCE public.upcoming_matches_id_seq
    AS integer
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
ALTER TABLE ONLY public.upcoming_matches
    ADD CONSTRAINT upcoming_matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id);
--
-- Name: live_matches; Type: VIEW; Schema: public; Owner: postgres
--
CREATE VIEW public.live_matches AS
 SELECT um.id,
    t.id AS tournament_id,
    t.name AS tournament_name,
    um.player1,
    um.player2,
    0 AS score1,
    0 AS score2
   FROM (public.upcoming_matches um
     JOIN public.tournaments t ON ((um.tournament_id = t.id)))
  WHERE ((um.date = CURRENT_DATE) AND (um.time <= CURRENT_TIME));


ALTER VIEW public.live_matches OWNER TO postgres;

--
-- Name: notices; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE public.notices (
    id integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    date timestamp with time zone DEFAULT now()
);
ALTER TABLE public.notices OWNER TO postgres;
CREATE SEQUENCE public.notices_id_seq
    AS integer
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
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_name text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    read boolean DEFAULT false,
    date timestamp with time zone DEFAULT now(),
    link text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.notifications OWNER TO postgres;
CREATE SEQUENCE public.notifications_id_seq
    AS integer
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
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE public.settings (
    id integer NOT NULL,
    key text NOT NULL,
    value jsonb
);

ALTER TABLE public.settings OWNER TO postgres;
CREATE SEQUENCE public.settings_id_seq
    AS integer
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
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.players (id, name, email, initials, skill_level, matches_played, win_rate, highest_break, wins, losses, average_break)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    LEFT(SPLIT_PART(new.raw_user_meta_data->>'full_name', ' ', 1), 1) || LEFT(SPLIT_PART(new.raw_user_meta_data->>'full_name', ' ', -1), 1),
    'Beginner',
    0,
    '0%',
    0,
    0,
    0,
    0
  );
  return new;
end;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- Name: auth_users_after_insert; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


--
-- RLS POLICIES
--

-- RLS on players
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can do anything" ON public.players FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users can view all players" ON public.players FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert their own player profile" ON public.players FOR INSERT WITH CHECK (((auth.uid() = id) OR (is_admin())));
CREATE POLICY "Users can update their own player profile" ON public.players FOR UPDATE USING ((auth.uid() = id) OR (is_admin())) WITH CHECK ((auth.uid() = id) OR (is_admin()));


-- RLS on notices
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to admins" ON public.notices FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Allow read access to all users" ON public.notices FOR SELECT USING (true);


-- RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to admins" ON public.notifications FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (((auth.jwt() ->> 'email'::text) = user_name));
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (((auth.jwt() ->> 'email'::text) = user_name));
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (((auth.jwt() ->> 'email'::text) = user_name));

-- RLS on settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to admins" ON public.settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Allow read access to all users for siteSettings" ON public.settings FOR SELECT USING ((key = 'siteSettings'::text));

-- RLS on tournaments
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to admins" ON public.tournaments FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Allow read access to all users" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to update" ON public.tournaments FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- RLS on matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to admins" ON public.matches FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Allow read access to all users" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert" ON public.matches FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update" ON public.matches FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- RLS on upcoming_matches
ALTER TABLE public.upcoming_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to admins" ON public.upcoming_matches FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Allow read access to all users" ON public.upcoming_matches FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert" ON public.upcoming_matches FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- RLS on live_matches (VIEW) - Note: RLS on views can be tricky. This allows admins full control.
-- For regular users, access is controlled by their access to the underlying tables.
CREATE POLICY "Allow all access to admins" ON public.live_matches FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Allow read access to all users" ON public.live_matches FOR SELECT USING (true);

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;


-- Grant permissions on tables
GRANT ALL ON TABLE public.players TO postgres;
GRANT ALL ON TABLE public.players TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.players TO authenticated;
GRANT SELECT ON TABLE public.players TO anon;

GRANT ALL ON TABLE public.tournaments TO postgres;
GRANT ALL ON TABLE public.tournaments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tournaments TO authenticated;
GRANT SELECT ON TABLE public.tournaments TO anon;


GRANT ALL ON TABLE public.matches TO postgres;
GRANT ALL ON TABLE public.matches TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.matches TO authenticated;
GRANT SELECT ON TABLE public.matches TO anon;


GRANT ALL ON TABLE public.upcoming_matches TO postgres;
GRANT ALL ON TABLE public.upcoming_matches TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.upcoming_matches TO authenticated;
GRANT SELECT ON TABLE public.upcoming_matches TO anon;


GRANT ALL ON TABLE public.notices TO postgres;
GRANT ALL ON TABLE public.notices TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notices TO authenticated;
GRANT SELECT ON TABLE public.notices TO anon;


GRANT ALL ON TABLE public.notifications TO postgres;
GRANT ALL ON TABLE public.notifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO authenticated;
GRANT SELECT ON TABLE public.notifications TO anon;


GRANT ALL ON TABLE public.settings TO postgres;
GRANT ALL ON TABLE public.settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.settings TO authenticated;
GRANT SELECT ON TABLE public.settings TO anon;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON SEQUENCE public.tournaments_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.tournaments_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.matches_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.matches_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.upcoming_matches_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.upcoming_matches_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.notices_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.notices_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.notifications_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.notifications_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.settings_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.settings_id_seq TO authenticated;

    