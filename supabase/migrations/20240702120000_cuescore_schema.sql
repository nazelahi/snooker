
-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a table for public profiles
CREATE TABLE players (
  id uuid NOT NULL PRIMARY KEY,
  name text,
  email text,
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

-- Create a table for tournaments
CREATE TABLE tournaments (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text,
  format text,
  players integer,
  status text,
  rules text[],
  image text,
  pendingPlayers text[],
  registeredPlayers text[],
  location text,
  winner text,
  bracket jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create a table for recent matches
CREATE TABLE matches (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  winner text,
  loser text,
  score text,
  date text,
  media text[],
  comments jsonb,
  pending_score jsonb,
  tournament_id bigint,
  created_at timestamp with time zone DEFAULT now()
);

-- Create a table for upcoming matches
CREATE TABLE upcoming_matches (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  player1 text,
  player2 text,
  date text,
  time text,
  tournament_id bigint,
  created_at timestamp with time zone DEFAULT now()
);

-- Create a table for live matches
CREATE TABLE live_matches (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  tournament_id bigint,
  tournament_name text,
  player1 text,
  player2 text,
  score1 integer,
  score2 integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Create a table for site settings
CREATE TABLE settings (
  key text PRIMARY KEY,
  value jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create a table for notices
CREATE TABLE notices (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title text,
  content text,
  date text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create a table for notifications
CREATE TABLE notifications (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_name text,
  title text,
  description text,
  read boolean,
  date text,
  link text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create admins table
CREATE TABLE admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Set up Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;


-- Create policies for players
CREATE POLICY "Public profiles are viewable by everyone." ON players FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON players FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON players FOR UPDATE USING (auth.uid() = id);

-- Create policies for tournaments
CREATE POLICY "Tournaments are viewable by everyone." ON tournaments FOR SELECT USING (true);
CREATE POLICY "Admins can insert tournaments." ON tournaments FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update tournaments." ON tournaments FOR UPDATE USING (is_admin());

-- Create policies for matches
CREATE POLICY "Matches are viewable by everyone." ON matches FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert matches." ON matches FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update matches." ON matches FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policies for upcoming_matches
CREATE POLICY "Upcoming matches are viewable by everyone." ON upcoming_matches FOR SELECT USING (true);
CREATE POLICY "Admins can insert upcoming matches." ON upcoming_matches FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update upcoming matches." ON upcoming_matches FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete upcoming matches." ON upcoming_matches FOR DELETE USING (is_admin());

-- Create policies for live_matches
CREATE POLICY "Live matches are viewable by everyone." ON live_matches FOR SELECT USING (true);
CREATE POLICY "Admins can insert live matches." ON live_matches FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update live matches." ON live_matches FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete live matches." ON live_matches FOR DELETE USING (is_admin());

-- Create policies for settings
CREATE POLICY "Settings are viewable by everyone." ON settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert settings." ON settings FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update settings." ON settings FOR UPDATE USING (is_admin());

-- Create policies for notices
CREATE POLICY "Notices are viewable by everyone." ON notices FOR SELECT USING (true);
CREATE POLICY "Admins can insert notices." ON notices FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can delete notices." ON notices FOR DELETE USING (is_admin());


-- Create policies for notifications
CREATE POLICY "Notifications are viewable by the user." ON notifications FOR SELECT USING (auth.uid() = (SELECT id FROM players WHERE name = user_name LIMIT 1));
CREATE POLICY "Users can insert their own notifications." ON notifications FOR INSERT WITH CHECK (auth.uid() = (SELECT id FROM players WHERE name = user_name LIMIT 1));
CREATE POLICY "Users can update their own notifications." ON notifications FOR UPDATE USING (auth.uid() = (SELECT id FROM players WHERE name = user_name LIMIT 1));
CREATE POLICY "Users can delete their own notifications." ON notifications FOR DELETE USING (auth.uid() = (SELECT id FROM players WHERE name = user_name LIMIT 1));


-- Create policies for admins table
CREATE POLICY "Admins can view the admins list" ON admins FOR SELECT USING (is_admin());
CREATE POLICY "Admins can manage the admins list" ON admins FOR ALL USING (is_admin());


-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if any admin exists
CREATE OR REPLACE FUNCTION has_admins()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admins LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Set up Storage!
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can update their own avatar." ON storage.objects FOR UPDATE USING (auth.uid() = owner) WITH CHECK (bucket_id = 'avatars');


-- Trigger to create a player profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.players (id, name, email, initials, avatar, skill_level, matches_played, win_rate, highest_break, wins, losses, average_break)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    -- Extract initials from full_name
    (SELECT string_agg(substr(name, 1, 1), '') FROM unnest(string_to_array(NEW.raw_user_meta_data->>'full_name', ' ')) name),
    NEW.raw_user_meta_data->>'avatar_url',
    'Beginner', 0, '0%', 0, 0, 0, 0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
