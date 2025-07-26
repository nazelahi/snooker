-- Create a helper function to check if the current user is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select auth.jwt()->>'email' = 'admin@gmail.com';
$$;

-- Players Table
CREATE TABLE public.players (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id),
    name text NOT NULL,
    email text,
    skill_level text DEFAULT 'Beginner'::text NOT NULL,
    matches_played integer DEFAULT 0 NOT NULL,
    win_rate text DEFAULT '0%'::text NOT NULL,
    highest_break integer DEFAULT 0 NOT NULL,
    avatar text,
    initials text,
    wins integer,
    losses integer,
    average_break integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.players FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.players FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Enable update for users based on email" ON public.players FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can do anything" ON public.players FOR ALL USING (is_admin()) WITH CHECK (is_admin());


-- Tournaments Table
CREATE TABLE public.tournaments (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    format text DEFAULT 'Knockout'::text NOT NULL,
    players integer DEFAULT 8 NOT NULL,
    status text DEFAULT 'Upcoming'::text NOT NULL,
    rules text[],
    image text,
    "pendingPlayers" text[],
    "registeredPlayers" text[],
    location text,
    winner text,
    bracket jsonb
);
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Admins can do anything" ON public.tournaments FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Authenticated users can apply" ON public.tournaments FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- Matches Table
CREATE TABLE public.matches (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    winner text,
    loser text,
    score text,
    date timestamp with time zone,
    media text[],
    comments jsonb,
    pending_score jsonb,
    tournament_id integer REFERENCES public.tournaments(id)
);
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Enable all access for admins" ON public.matches FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Players can interact with their own matches" ON public.matches FOR ALL USING (
  (is_admin() OR (winner = ( SELECT p.name FROM public.players p WHERE p.id = auth.uid())) OR (loser = ( SELECT p.name FROM public.players p WHERE p.id = auth.uid())))
) WITH CHECK (
  (is_admin() OR (winner = ( SELECT p.name FROM public.players p WHERE p.id = auth.uid())) OR (loser = ( SELECT p.name FROM public.players p WHERE p.id = auth.uid())))
);


-- Upcoming Matches Table
CREATE TABLE public.upcoming_matches (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    player1 text,
    player2 text,
    date date,
    "time" time without time zone,
    tournament_id integer REFERENCES public.tournaments(id)
);
ALTER TABLE public.upcoming_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.upcoming_matches FOR SELECT USING (true);
CREATE POLICY "Admins can do anything" ON public.upcoming_matches FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Live Matches View
CREATE VIEW public.live_matches AS
 SELECT
    um.id,
    um.tournament_id,
    t.name AS tournament_name,
    um.player1,
    um.player2,
    floor(random() * 5.0) AS score1,
    floor(random() * 5.0) AS score2
   FROM (public.upcoming_matches um
     LEFT JOIN public.tournaments t ON ((um.tournament_id = t.id)))
  WHERE ((um.date = CURRENT_DATE) AND (um.time <= now()));
  
-- Notices Table
CREATE TABLE public.notices (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title text,
    content text,
    date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Enable all for admins" ON public.notices FOR ALL USING (is_admin()) WITH CHECK (is_admin());


-- Notifications Table
CREATE TABLE public.notifications (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_name text,
    title text,
    description text,
    read boolean,
    date timestamp with time zone,
    link text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for users" ON public.notifications FOR SELECT USING ((( SELECT p.name FROM public.players p WHERE p.id = auth.uid()) = user_name));
CREATE POLICY "Enable update for users" ON public.notifications FOR UPDATE USING ((( SELECT p.name FROM public.players p WHERE p.id = auth.uid()) = user_name));
CREATE POLICY "Enable all for admins" ON public.notifications FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Settings Table
CREATE TABLE public.settings (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    key text UNIQUE,
    value jsonb,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for all users" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Enable all for admins" ON public.settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Edge function trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.players (id, name, email, initials, avatar)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    -- Generate initials from the full name or email
    (
        SELECT string_agg(upper(substring(part, 1, 1)), '')
        FROM unnest(string_to_array(coalesce(new.raw_user_meta_data->>'full_name', new.email), ' ')) as part
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();