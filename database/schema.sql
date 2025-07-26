-- Snooker Application Database Schema
-- Run this in your Supabase SQL editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE match_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE tournament_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');
CREATE TYPE achievement_type AS ENUM ('match_wins', 'tournament_wins', 'perfect_frames', 'longest_break', 'century_breaks');
CREATE TYPE notification_type AS ENUM ('match_invite', 'tournament_reminder', 'achievement_unlocked', 'challenge_received');
CREATE TYPE preferred_hand AS ENUM ('left', 'right', 'ambidextrous');
CREATE TYPE tournament_format AS ENUM ('single_elimination', 'double_elimination', 'round_robin', 'swiss');
CREATE TYPE challenge_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE challenge_response AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE stat_period AS ENUM ('all_time', 'this_year', 'this_month', 'this_week');
CREATE TYPE stat_type AS ENUM ('matches_played', 'matches_won', 'win_percentage', 'highest_break', 'century_breaks', 'average_break', 'frames_won', 'frames_lost');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_admin BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE
);

-- Players table
CREATE TABLE players (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    nickname TEXT,
    skill_level INTEGER CHECK (skill_level >= 1 AND skill_level <= 10) DEFAULT 5,
    preferred_hand preferred_hand DEFAULT 'right',
    experience_years INTEGER DEFAULT 0,
    total_matches INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    highest_break INTEGER DEFAULT 0,
    century_breaks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournaments table
CREATE TABLE tournaments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    max_players INTEGER NOT NULL,
    current_players INTEGER DEFAULT 0,
    entry_fee DECIMAL(10,2),
    prize_pool DECIMAL(10,2),
    status tournament_status DEFAULT 'upcoming',
    format tournament_format NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    status match_status DEFAULT 'scheduled',
    best_of_frames INTEGER NOT NULL,
    frames_to_win INTEGER NOT NULL,
    venue TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match Players table (junction table for matches and players)
CREATE TABLE match_players (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
    player_number INTEGER CHECK (player_number IN (1, 2)) NOT NULL,
    frames_won INTEGER DEFAULT 0,
    highest_break INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, player_id),
    UNIQUE(match_id, player_number)
);

-- Match Frames table
CREATE TABLE match_frames (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
    frame_number INTEGER NOT NULL,
    winner_id UUID REFERENCES players(id) ON DELETE SET NULL,
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    player1_break INTEGER DEFAULT 0,
    player2_break INTEGER DEFAULT 0,
    duration_minutes INTEGER,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, frame_number)
);

-- Comments table
CREATE TABLE comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    type achievement_type NOT NULL,
    icon_url TEXT,
    points INTEGER DEFAULT 0,
    criteria JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player Achievements table (junction table)
CREATE TABLE player_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress INTEGER CHECK (progress >= 0 AND progress <= 100) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, achievement_id)
);

-- Challenges table
CREATE TABLE challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    challenger_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
    challenged_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
    match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
    message TEXT,
    status challenge_status DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player Challenges table (junction table)
CREATE TABLE player_challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
    response challenge_response DEFAULT 'pending',
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(challenge_id, player_id)
);

-- Statistics table
CREATE TABLE statistics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
    stat_type stat_type NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    period stat_period NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, stat_type, period)
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_players_profile_id ON players(profile_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_scheduled_at ON matches(scheduled_at);
CREATE INDEX idx_match_players_match_id ON match_players(match_id);
CREATE INDEX idx_match_players_player_id ON match_players(player_id);
CREATE INDEX idx_match_frames_match_id ON match_frames(match_id);
CREATE INDEX idx_comments_match_id ON comments(match_id);
CREATE INDEX idx_comments_tournament_id ON comments(tournament_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_player_achievements_player_id ON player_achievements(player_id);
CREATE INDEX idx_challenges_challenger_id ON challenges(challenger_id);
CREATE INDEX idx_challenges_challenged_id ON challenges(challenged_id);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_statistics_player_id ON statistics(player_id);
CREATE INDEX idx_statistics_type_period ON statistics(stat_type, period);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, username, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles: Users can read all profiles, update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Players: Users can read all players, update their own
CREATE POLICY "Players are viewable by everyone" ON players FOR SELECT USING (true);
CREATE POLICY "Users can insert own player profile" ON players FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own player profile" ON players FOR UPDATE USING (auth.uid() = profile_id);

-- Tournaments: Users can read all tournaments, create and update if admin
CREATE POLICY "Tournaments are viewable by everyone" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Admins can create tournaments" ON tournaments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update tournaments" ON tournaments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Matches: Users can read all matches, create and update if admin
CREATE POLICY "Matches are viewable by everyone" ON matches FOR SELECT USING (true);
CREATE POLICY "Admins can create matches" ON matches FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update matches" ON matches FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Match Players: Users can read all, update if admin
CREATE POLICY "Match players are viewable by everyone" ON match_players FOR SELECT USING (true);
CREATE POLICY "Admins can manage match players" ON match_players FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Match Frames: Users can read all, update if admin
CREATE POLICY "Match frames are viewable by everyone" ON match_frames FOR SELECT USING (true);
CREATE POLICY "Admins can manage match frames" ON match_frames FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Comments: Users can read all comments, create and update their own
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = author_id);

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Achievements: Everyone can read achievements
CREATE POLICY "Achievements are viewable by everyone" ON achievements FOR SELECT USING (true);

-- Player Achievements: Users can read all, update their own
CREATE POLICY "Player achievements are viewable by everyone" ON player_achievements FOR SELECT USING (true);
CREATE POLICY "Users can manage own achievements" ON player_achievements FOR ALL USING (
    player_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
);

-- Challenges: Users can read challenges they're involved in
CREATE POLICY "Users can view related challenges" ON challenges FOR SELECT USING (
    challenger_id IN (SELECT id FROM players WHERE profile_id = auth.uid()) OR
    challenged_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
);
CREATE POLICY "Users can create challenges" ON challenges FOR INSERT WITH CHECK (
    challenger_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
);
CREATE POLICY "Users can update own challenges" ON challenges FOR UPDATE USING (
    challenger_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
);

-- Player Challenges: Users can manage their own challenge responses
CREATE POLICY "Users can view own challenge responses" ON player_challenges FOR SELECT USING (
    player_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
);
CREATE POLICY "Users can update own challenge responses" ON player_challenges FOR UPDATE USING (
    player_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
);

-- Statistics: Users can read all statistics
CREATE POLICY "Statistics are viewable by everyone" ON statistics FOR SELECT USING (true);
CREATE POLICY "Users can update own statistics" ON statistics FOR UPDATE USING (
    player_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
);

-- Insert some default achievements
INSERT INTO achievements (name, description, type, points, criteria) VALUES
('First Win', 'Win your first match', 'match_wins', 10, '{"required_wins": 1}'),
('Tournament Champion', 'Win a tournament', 'tournament_wins', 50, '{"required_tournaments": 1}'),
('Century Break', 'Score a break of 100 or more', 'century_breaks', 25, '{"required_breaks": 1}'),
('Perfect Frame', 'Win a frame without your opponent scoring', 'perfect_frames', 15, '{"required_frames": 1}'),
('Long Break', 'Score a break of 50 or more', 'longest_break', 20, '{"required_break": 50}'); 