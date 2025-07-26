-- Create Players Table
CREATE TABLE public.players (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id),
    name text NOT NULL,
    email text,
    skill_level text,
    matches_played integer DEFAULT 0 NOT NULL,
    win_rate text,
    highest_break integer DEFAULT 0 NOT NULL,
    avatar text,
    initials text,
    wins integer DEFAULT 0,
    losses integer DEFAULT 0,
    average_break integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Create Tournaments Table
CREATE TABLE public.tournaments (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
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
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Create Matches Table
CREATE TABLE public.matches (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    winner text NOT NULL,
    loser text NOT NULL,
    score text NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    media text[],
    comments jsonb,
    pending_score jsonb,
    tournament_id integer REFERENCES public.tournaments(id)
);
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create Upcoming Matches Table
CREATE TABLE public.upcoming_matches (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    player1 text NOT NULL,
    player2 text NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    tournament_id integer REFERENCES public.tournaments(id)
);
ALTER TABLE public.upcoming_matches ENABLE ROW LEVEL SECURITY;

-- Create Notices Table
CREATE TABLE public.notices (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title text NOT NULL,
    content text NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Create Notifications Table
CREATE TABLE public.notifications (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_name text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    link text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create Settings Table
CREATE TABLE public.settings (
    key text PRIMARY KEY,
    value jsonb
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create Live Matches View
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

-- Helper function to check for admin role
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select auth.jwt()->>'email' = 'admin@gmail.com';
$$;

-- Function to create a player profile on new user signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  user_id uuid := new.id;
  full_name text := new.raw_user_meta_data->>'full_name';
  display_name text := COALESCE(full_name, new.email);
  initials text := COALESCE(
    (LEFT(SPLIT_PART(full_name, ' ', 1), 1) || LEFT(SPLIT_PART(full_name, ' ', -1), 1)),
    UPPER(LEFT(new.email, 2))
  );
begin
  insert into public.players (id, name, email, initials, skill_level, matches_played, win_rate, highest_break, wins, losses, average_break)
  values (
    user_id,
    display_name,
    new.email,
    initials,
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

-- Trigger to call handle_new_user on new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- RLS Policies

-- Players Table
CREATE POLICY "Admins can manage all players" ON public.players FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Players can view all profiles" ON public.players FOR SELECT USING (true);
CREATE POLICY "Users can insert their own player profile" ON public.players FOR INSERT WITH CHECK ((auth.uid() = id) or (current_user = 'postgres'));
CREATE POLICY "Users can update their own profile" ON public.players FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Tournaments Table
CREATE POLICY "Admins can manage tournaments" ON public.tournaments FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "All users can view tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Logged in users can update tournaments (for registration)" ON public.tournaments FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Matches Table
CREATE POLICY "Admins can manage matches" ON public.matches FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "All users can view matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Logged in users can manage matches" ON public.matches FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Upcoming Matches Table
CREATE POLICY "Admins can manage upcoming matches" ON public.upcoming_matches FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "All users can view upcoming matches" ON public.upcoming_matches FOR SELECT USING (true);

-- Notices Table
CREATE POLICY "Admins can manage notices" ON public.notices FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "All users can view notices" ON public.notices FOR SELECT USING (true);

-- Notifications Table
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users can manage their own notifications" ON public.notifications FOR ALL USING (EXISTS (
    SELECT 1 FROM public.players WHERE players.email = auth.jwt()->>'email' AND players.name = notifications.user_name
)) WITH CHECK (EXISTS (
    SELECT 1 FROM public.players WHERE players.email = auth.jwt()->>'email' AND players.name = notifications.user_name
));

-- Settings Table
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "All users can view settings" ON public.settings FOR SELECT USING (true);
