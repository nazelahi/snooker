--
-- Enforce RLS
--
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'super-secret-jwt-token-with-at-least-32-characters-long';
NOTIFY pgrst, 'reload schema';

--
-- Setup Storage
--
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', TRUE, 5242880, '{"image/jpeg","image/png","image/gif"}');

--
-- Setup Auth
--

--
-- Custom Claims
--
CREATE OR REPLACE FUNCTION public.custom_claims()
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT
    jsonb_build_object(
      'has_subscribed',
      EXISTS (
        SELECT 1
        FROM public.subscriptions
        WHERE user_id = auth.uid()
      )
    )
$$;

--
-- Handle New User
--
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.players (id, name, email, initials, skill_level, matches_played, win_rate, highest_break, wins, losses, average_break)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    (SELECT string_agg(SUBSTR(s, 1, 1), '') FROM unnest(string_to_array(NEW.raw_user_meta_data->>'full_name', ' ')) s),
    'Beginner',
    0,
    '0%',
    0,
    0,
    0,
    0
  );
  RETURN NEW;
END;
$$;

--
-- Create Trigger to Handle New User
--
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


--
-- Tables
--

CREATE TABLE public.players (
    id uuid NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    skill_level text DEFAULT 'Beginner'::text NOT NULL,
    matches_played integer DEFAULT 0 NOT NULL,
    win_rate text DEFAULT '0%'::text NOT NULL,
    highest_break integer DEFAULT 0 NOT NULL,
    avatar text,
    initials text,
    email text,
    wins integer,
    losses integer,
    average_break integer,
    CONSTRAINT players_skill_level_check CHECK ((skill_level = ANY (ARRAY['Beginner'::text, 'Intermediate'::text, 'Pro'::text])))
);
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;


CREATE TABLE public.matches (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    winner text NOT NULL,
    loser text NOT NULL,
    score text NOT NULL,
    date date NOT NULL,
    media text[],
    comments jsonb,
    pending_score jsonb,
    tournament_id bigint
);

CREATE SEQUENCE public.matches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.matches_id_seq OWNED BY public.matches.id;
ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_id_seq'::regclass);
ALTER TABLE ONLY public.matches ADD CONSTRAINT matches_pkey PRIMARY KEY (id);
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;


CREATE TABLE public.live_matches (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    player1 text NOT NULL,
    player2 text NOT NULL,
    score1 integer DEFAULT 0 NOT NULL,
    score2 integer DEFAULT 0 NOT NULL,
    tournament_id bigint NOT NULL,
    tournament_name text
);
CREATE SEQUENCE public.live_matches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.live_matches_id_seq OWNED BY public.live_matches.id;
ALTER TABLE ONLY public.live_matches ALTER COLUMN id SET DEFAULT nextval('public.live_matches_id_seq'::regclass);
ALTER TABLE ONLY public.live_matches ADD CONSTRAINT live_matches_pkey PRIMARY KEY (id);
ALTER TABLE public.live_matches ENABLE ROW LEVEL SECURITY;


CREATE TABLE public.upcoming_matches (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    player1 text NOT NULL,
    player2 text NOT NULL,
    date date NOT NULL,
    time character varying NOT NULL,
    tournament_id bigint
);
CREATE SEQUENCE public.upcoming_matches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.upcoming_matches_id_seq OWNED BY public.upcoming_matches.id;
ALTER TABLE ONLY public.upcoming_matches ALTER COLUMN id SET DEFAULT nextval('public.upcoming_matches_id_seq'::regclass);
ALTER TABLE ONLY public.upcoming_matches ADD CONSTRAINT upcoming_matches_pkey PRIMARY KEY (id);
ALTER TABLE public.upcoming_matches ENABLE ROW LEVEL SECURITY;


CREATE TABLE public.tournaments (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    format text NOT NULL,
    players integer NOT NULL,
    status text NOT NULL,
    rules text[],
    image text,
    "pendingPlayers" text[],
    "registeredPlayers" text[],
    location text,
    winner text,
    bracket jsonb,
    CONSTRAINT tournaments_format_check CHECK ((format = ANY (ARRAY['Knockout'::text, 'League'::text, 'Round Robin'::text]))),
    CONSTRAINT tournaments_status_check CHECK ((status = ANY (ARRAY['Upcoming'::text, 'In Progress'::text, 'Finished'::text])))
);
CREATE SEQUENCE public.tournaments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.tournaments_id_seq OWNED BY public.tournaments.id;
ALTER TABLE ONLY public.tournaments ALTER COLUMN id SET DEFAULT nextval('public.tournaments_id_seq'::regclass);
ALTER TABLE ONLY public.tournaments ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;


CREATE TABLE public.notifications (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_name text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    date timestamp with time zone NOT NULL,
    link text
);
CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;
ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


CREATE TABLE public.notices (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    date timestamp with time zone NOT NULL
);
CREATE SEQUENCE public.notices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.notices_id_seq OWNED BY public.notices.id;
ALTER TABLE ONLY public.notices ALTER COLUMN id SET DEFAULT nextval('public.notices_id_seq'::regclass);
ALTER TABLE ONLY public.notices ADD CONSTRAINT notices_pkey PRIMARY KEY (id);
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;


CREATE TABLE public.settings (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    key text NOT NULL,
    value jsonb
);
CREATE SEQUENCE public.settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;
ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);
ALTER TABLE ONLY public.settings ADD CONSTRAINT settings_pkey PRIMARY KEY (id);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

--
-- RLS
--

CREATE POLICY "Allow ALL for admin" ON public.notices FOR ALL TO aNonymous, authenticated USING (((auth.jwt() ->> 'email'::text) = 'admin@gmail.com'::text)) WITH CHECK (((auth.jwt() ->> 'email'::text) = 'admin@gmail.com'::text));
CREATE POLICY "Allow ALL for admin" ON public.settings FOR ALL TO aNonymous, authenticated USING (((auth.jwt() ->> 'email'::text) = 'admin@gmail.com'::text)) WITH CHECK (((auth.jwt() ->> 'email'::text) = 'admin@gmail.com'::text));
CREATE POLICY "Allow authenticated user to manage own player data" ON public.players FOR ALL TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));
CREATE POLICY "Allow user to manage own notifications" ON public.notifications FOR ALL TO authenticated USING (((auth.jwt() ->> 'email'::text) = user_name)) WITH CHECK (((auth.jwt() ->> 'email'::text) = user_name));
CREATE POLICY "Enable ALL for admin" ON public.live_matches FOR ALL TO aNonymous, authenticated USING (((auth.jwt() ->> 'email'::text) = 'admin@gmail.com'::text)) WITH CHECK (((auth.jwt() ->> 'email'::text) = 'admin@gmail.com'::text));
CREATE POLICY "Enable ALL for admin" ON public.matches FOR ALL TO aNonymous, authenticated USING (((auth.jwt() ->> 'email'::text) = 'admin@gmail.com'::text)) WITH CHECK (((auth.jwt() ->> 'email'::text) = 'admin@gmail.com'::text));
CREATE POLICY "Enable ALL for admin" ON public.players FOR ALL TO aNonymous, authenticated USING (((auth.jwt() ->> 'email'::text) = 'admin@gmail.com'::text)) WITH CHECK (((auth.jwt() ->> 'email'::text) = 'admin@gmail.com'::text));
CREATE POLICY "Enable ALL for admin" ON public.tournaments FOR ALL TO aNonymous, authenticated USING (((auth.jwt() ->> 'email'::text) = 'admin@gmail.com'::text)) WITH CHECK (((auth.jwt() ->> 'email'::text) = 'admin@gmail.com'::text));
CREATE POLICY "Enable ALL for admin" ON public.upcoming_matches FOR ALL TO aNonymous, authenticated USING (((auth.jwt() ->> 'email'::text) = 'admin@gmail.com'::text)) WITH CHECK (((auth.jwt() ->> 'email'::text) = 'admin@gmail.com'::text));
CREATE POLICY "Enable read access for all users" ON public.live_matches FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.players FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.upcoming_matches FOR SELECT USING (true);
CREATE POLICY "Enable users to manage their own notifications" ON public.notifications FOR ALL USING ((user_name = (auth.jwt() ->> 'email'::text)));
CREATE POLICY "Give users access to own folder" ON storage.objects FOR SELECT USING ((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]));
CREATE POLICY "User can insert their own avatar" ON storage.objects FOR INSERT WITH CHECK ((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]));

