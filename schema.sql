-- Create the players table
CREATE TABLE public.players (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id),
    name text NOT NULL,
    email text,
    skill_level text CHECK (skill_level IN ('Beginner', 'Intermediate', 'Pro')),
    matches_played integer DEFAULT 0,
    win_rate text DEFAULT '0%',
    highest_break integer DEFAULT 0,
    avatar text,
    initials text,
    wins integer DEFAULT 0,
    losses integer DEFAULT 0,
    average_break integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create the tournaments table
CREATE TABLE public.tournaments (
    id SERIAL PRIMARY KEY,
    name text NOT NULL,
    format text CHECK (format IN ('Knockout', 'League', 'Round Robin')),
    players integer,
    status text CHECK (status IN ('Upcoming', 'In Progress', 'Finished')),
    rules text[],
    image text,
    pendingPlayers text[],
    registeredPlayers text[],
    location text,
    winner text,
    bracket jsonb
);


-- Create the matches table
CREATE TABLE public.matches (
    id SERIAL PRIMARY KEY,
    winner text,
    loser text,
    score text,
    date timestamp with time zone,
    media text[],
    comments jsonb,
    pending_score jsonb,
    tournament_id integer REFERENCES public.tournaments(id)
);


-- Create the upcoming_matches table
CREATE TABLE public.upcoming_matches (
    id SERIAL PRIMARY KEY,
    player1 text,
    player2 text,
    date date,
    time time,
    tournament_id integer REFERENCES public.tournaments(id)
);

-- Create notices table
CREATE TABLE public.notices (
    id SERIAL PRIMARY KEY,
    title text NOT NULL,
    content text NOT NULL,
    date timestamp with time zone DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
    id SERIAL PRIMARY KEY,
    user_name text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    read boolean DEFAULT false,
    date timestamp with time zone DEFAULT now(),
    link text,
    created_at timestamp with time zone DEFAULT now()
);

-- Create settings table
CREATE TABLE public.settings (
    key text PRIMARY KEY,
    value jsonb
);

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (SELECT auth.jwt()->>'email') = 'admin@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Create live_matches view
CREATE OR REPLACE VIEW public.live_matches AS
 SELECT um.id,
    um.tournament_id,
    t.name AS tournament_name,
    um.player1,
    um.player2,
    0 AS score1,
    0 AS score2
   FROM (public.upcoming_matches um
     LEFT JOIN public.tournaments t ON ((um.tournament_id = t.id)))
  WHERE ((um.date = CURRENT_DATE) AND (um.time <= CURRENT_TIME));

-- RLS Policies for players
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players are viewable by everyone" ON public.players FOR SELECT USING (true);
CREATE POLICY "Users can insert their own player profile" ON public.players FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own player profile" ON public.players FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can do anything" ON public.players FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for tournaments
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tournaments are viewable by everyone" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Admins can manage tournaments" ON public.tournaments FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Authenticated users can update tournament applications" ON public.tournaments FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create matches" ON public.matches FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own match details" ON public.matches FOR UPDATE USING (
    is_admin() OR
    EXISTS (
        SELECT 1 FROM public.players p
        WHERE p.name IN (winner, loser) AND p.email = (auth.jwt() ->> 'email')
    )
);
CREATE POLICY "Admins can delete matches" ON public.matches FOR DELETE USING (is_admin());


-- RLS Policies for upcoming_matches
ALTER TABLE public.upcoming_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Upcoming matches are viewable by everyone" ON public.upcoming_matches FOR SELECT USING (true);
CREATE POLICY "Admins can manage upcoming matches" ON public.upcoming_matches FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS policies for notices
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notices are viewable by everyone" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Admins can manage notices" ON public.notices FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.name = user_name AND p.email = (auth.jwt() ->> 'email')
));
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.name = user_name AND p.email = (auth.jwt() ->> 'email')
));
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.name = user_name AND p.email = (auth.jwt() ->> 'email')
));
CREATE POLICY "Server can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);


-- RLS policies for settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are viewable by everyone" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Function to be called by trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.players (id, name, email, initials, skill_level, matches_played, win_rate, highest_break, avatar, wins, losses, average_break)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    (new.raw_user_meta_data->>'full_name')_left(1) || (new.raw_user_meta_data->>'full_name')_right(1),
    'Beginner',
    0,
    '0%',
    0,
    new.raw_user_meta_data->>'avatar_url',
    0,
    0,
    0
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Storage Rules for Avatars
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Anyone can upload an avatar."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' );

CREATE POLICY "Anyone can update their own avatar."
  ON storage.objects FOR UPDATE
  USING ( auth.uid() = owner )
  WITH CHECK ( bucket_id = 'avatars' );