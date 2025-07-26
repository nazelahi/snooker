
-- Create players table
CREATE TABLE players (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name character varying NOT NULL,
    email character varying,
    skill_level character varying DEFAULT 'Beginner'::character varying NOT NULL,
    matches_played integer DEFAULT 0 NOT NULL,
    win_rate character varying DEFAULT '0%'::character varying NOT NULL,
    highest_break integer DEFAULT 0 NOT NULL,
    avatar character varying,
    initials character varying,
    wins integer DEFAULT 0,
    losses integer DEFAULT 0,
    average_break integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated user to view players" ON players FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow user to insert their own player profile" ON players FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow user to update their own player profile" ON players FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow admins to manage player profiles" ON players FOR ALL USING (auth.role() = 'service_role');


-- Create tournaments table
CREATE TABLE tournaments (
    id bigint NOT NULL,
    name character varying NOT NULL,
    format character varying,
    players integer,
    status character varying,
    rules jsonb,
    image text,
    "pendingPlayers" text[],
    "registeredPlayers" text[],
    location text,
    winner text,
    bracket jsonb
);
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY tournaments
    ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);
CREATE SEQUENCE tournaments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE tournaments_id_seq OWNED BY tournaments.id;
ALTER TABLE ONLY tournaments ALTER COLUMN id SET DEFAULT nextval('tournaments_id_seq'::regclass);
CREATE POLICY "Allow all users to view tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Allow admins to create tournaments" ON tournaments FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Allow admins to update tournaments" ON tournaments FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Allow users to apply to tournaments" ON tournaments FOR UPDATE
  USING (true)
  WITH CHECK (
    -- This CHECK expression is complex, let's break it down.
    -- The goal is to allow a user to add their name to the pendingPlayers array.
    (
      -- The user must be authenticated.
      auth.role() = 'authenticated'
      AND
      -- The array being updated must be the pendingPlayers array.
      "pendingPlayers" = (
        SELECT "pendingPlayers" FROM tournaments WHERE tournaments.id = id
      ) || ARRAY[(select u.raw_user_meta_data->>'full_name' from auth.users u where u.id = auth.uid())]
    )
  );


-- Create matches table
CREATE TABLE matches (
    id bigint NOT NULL,
    winner text NOT NULL,
    loser text NOT NULL,
    score text NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    media jsonb,
    comments jsonb,
    pending_score jsonb,
    tournament_id bigint
);
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);
CREATE SEQUENCE matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE matches_id_seq OWNED BY matches.id;
ALTER TABLE ONLY matches ALTER COLUMN id SET DEFAULT nextval('matches_id_seq'::regclass);
ALTER TABLE ONLY matches
    ADD CONSTRAINT matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id);
CREATE POLICY "Allow all users to view matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to create matches" ON matches FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update matches" ON matches FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admins to delete matches" ON matches FOR DELETE USING (auth.role() = 'service_role');


-- Create upcoming_matches table
CREATE TABLE upcoming_matches (
    id bigint NOT NULL,
    player1 text NOT NULL,
    player2 text NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    tournament_id bigint
);
ALTER TABLE upcoming_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY upcoming_matches
    ADD CONSTRAINT upcoming_matches_pkey PRIMARY KEY (id);
CREATE SEQUENCE upcoming_matches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE upcoming_matches_id_seq OWNED BY upcoming_matches.id;
ALTER TABLE ONLY upcoming_matches ALTER COLUMN id SET DEFAULT nextval('upcoming_matches_id_seq'::regclass);
ALTER TABLE ONLY upcoming_matches
    ADD CONSTRAINT upcoming_matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id);
CREATE POLICY "Allow all users to view upcoming matches" ON upcoming_matches FOR SELECT USING (true);
CREATE POLICY "Allow admins to manage upcoming matches" ON upcoming_matches FOR ALL USING (auth.role() = 'service_role');


-- Create live_matches table
CREATE TABLE live_matches (
    id bigint NOT NULL,
    tournament_id bigint NOT NULL,
    tournament_name text NOT NULL,
    player1 text NOT NULL,
    player2 text NOT NULL,
    score1 integer DEFAULT 0,
    score2 integer DEFAULT 0
);
ALTER TABLE live_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY live_matches
    ADD CONSTRAINT live_matches_pkey PRIMARY KEY (id);
CREATE SEQUENCE live_matches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE live_matches_id_seq OWNED BY live_matches.id;
ALTER TABLE ONLY live_matches ALTER COLUMN id SET DEFAULT nextval('live_matches_id_seq'::regclass);
ALTER TABLE ONLY live_matches
    ADD CONSTRAINT live_matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id);
CREATE POLICY "Allow all users to view live matches" ON live_matches FOR SELECT USING (true);
CREATE POLICY "Allow admins to manage live matches" ON live_matches FOR ALL USING (auth.role() = 'service_role');


-- Create notifications table
CREATE TABLE notifications (
    id bigint NOT NULL,
    user_name text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    link text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
CREATE SEQUENCE notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE notifications_id_seq OWNED BY notifications.id;
ALTER TABLE ONLY notifications ALTER COLUMN id SET DEFAULT nextval('notifications_id_seq'::regclass);
CREATE POLICY "Allow user to view their own notifications" ON notifications FOR SELECT USING (auth.role() = 'authenticated' AND user_name = (select u.raw_user_meta_data->>'full_name' from auth.users u where u.id = auth.uid()));
CREATE POLICY "Allow authenticated users to create notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow user to update their own notifications" ON notifications FOR UPDATE USING (auth.role() = 'authenticated' AND user_name = (select u.raw_user_meta_data->>'full_name' from auth.users u where u.id = auth.uid()));
CREATE POLICY "Allow user to delete their own notifications" ON notifications FOR DELETE USING (auth.role() = 'authenticated' AND user_name = (select u.raw_user_meta_data->>'full_name' from auth.users u where u.id = auth.uid()));


-- Create notices table
CREATE TABLE notices (
    id bigint NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY notices
    ADD CONSTRAINT notices_pkey PRIMARY KEY (id);
CREATE SEQUENCE notices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE notices_id_seq OWNED BY notices.id;
ALTER TABLE ONLY notices ALTER COLUMN id SET DEFAULT nextval('notices_id_seq'::regclass);
CREATE POLICY "Allow all users to view notices" ON notices FOR SELECT USING (true);
CREATE POLICY "Allow admins to manage notices" ON notices FOR ALL USING (auth.role() = 'service_role');


-- Create settings table
CREATE TABLE settings (
    key text NOT NULL PRIMARY KEY,
    value jsonb,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow admins to manage settings" ON settings FOR ALL USING (auth.role() = 'service_role');
-- Insert default settings
INSERT INTO settings (key, value) VALUES
    ('siteSettings', '{"name": "CueScore", "description": "The ultimate snooker club management app.", "logo": null}'),
    ('tournamentRules', '["Standard snooker rules apply", "All matches are best of 5 frames", "Players must arrive 15 minutes before their scheduled match", "The tournament director''s decision is final"]')
ON CONFLICT (key) DO NOTHING;

-- Database function to create a player profile upon new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.players (id, name, email, initials)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    (SELECT string_agg(substr(part, 1, 1), '') FROM unnest(string_to_array(new.raw_user_meta_data->>'full_name', ' ')) part)
  );
  return new;
end;
$$;
-- Trigger to call the function
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Set up storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, '{"image/jpeg","image/png","image/gif"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 26214400, '{"image/jpeg","image/png","image/gif","video/mp4"}')
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage
CREATE POLICY "Allow public read access to avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow public read access to media" ON storage.objects FOR SELECT TO public USING (bucket_id = 'media');
CREATE POLICY "Allow authenticated users to upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');
