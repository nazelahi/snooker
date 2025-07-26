// Database Schema Types for Snooker Application
// This defines the complete database structure

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      players: {
        Row: Player;
        Insert: PlayerInsert;
        Update: PlayerUpdate;
      };
      tournaments: {
        Row: Tournament;
        Insert: TournamentInsert;
        Update: TournamentUpdate;
      };
      matches: {
        Row: Match;
        Insert: MatchInsert;
        Update: MatchUpdate;
      };
      match_players: {
        Row: MatchPlayer;
        Insert: MatchPlayerInsert;
        Update: MatchPlayerUpdate;
      };
      match_frames: {
        Row: MatchFrame;
        Insert: MatchFrameInsert;
        Update: MatchFrameUpdate;
      };
      comments: {
        Row: Comment;
        Insert: CommentInsert;
        Update: CommentUpdate;
      };
      notifications: {
        Row: Notification;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
      };
      achievements: {
        Row: Achievement;
        Insert: AchievementInsert;
        Update: AchievementUpdate;
      };
      player_achievements: {
        Row: PlayerAchievement;
        Insert: PlayerAchievementInsert;
        Update: PlayerAchievementUpdate;
      };
      challenges: {
        Row: Challenge;
        Insert: ChallengeInsert;
        Update: ChallengeUpdate;
      };
      player_challenges: {
        Row: PlayerChallenge;
        Insert: PlayerChallengeInsert;
        Update: PlayerChallengeUpdate;
      };
      statistics: {
        Row: Statistic;
        Insert: StatisticInsert;
        Update: StatisticUpdate;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      match_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
      tournament_status: 'upcoming' | 'active' | 'completed' | 'cancelled';
      achievement_type: 'match_wins' | 'tournament_wins' | 'perfect_frames' | 'longest_break' | 'century_breaks';
      notification_type: 'match_invite' | 'tournament_reminder' | 'achievement_unlocked' | 'challenge_received';
    };
  };
}

// Core Types
export interface Profile {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_admin: boolean;
  is_verified: boolean;
}

export interface ProfileInsert {
  id: string;
  email: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  is_admin?: boolean;
  is_verified?: boolean;
}

export interface ProfileUpdate {
  email?: string;
  username?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  last_login?: string | null;
  is_admin?: boolean;
  is_verified?: boolean;
}

// Player Types
export interface Player {
  id: string;
  profile_id: string;
  nickname: string | null;
  skill_level: number; // 1-10 scale
  preferred_hand: 'left' | 'right' | 'ambidextrous';
  experience_years: number;
  total_matches: number;
  wins: number;
  losses: number;
  highest_break: number;
  century_breaks: number;
  created_at: string;
  updated_at: string;
}

export interface PlayerInsert {
  profile_id: string;
  nickname?: string | null;
  skill_level?: number;
  preferred_hand?: 'left' | 'right' | 'ambidextrous';
  experience_years?: number;
  total_matches?: number;
  wins?: number;
  losses?: number;
  highest_break?: number;
  century_breaks?: number;
}

export interface PlayerUpdate {
  nickname?: string | null;
  skill_level?: number;
  preferred_hand?: 'left' | 'right' | 'ambidextrous';
  experience_years?: number;
  total_matches?: number;
  wins?: number;
  losses?: number;
  highest_break?: number;
  century_breaks?: number;
}

// Tournament Types
export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  max_players: number;
  current_players: number;
  entry_fee: number | null;
  prize_pool: number | null;
  status: Database['public']['Enums']['tournament_status'];
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TournamentInsert {
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  location?: string | null;
  max_players: number;
  entry_fee?: number | null;
  prize_pool?: number | null;
  status?: Database['public']['Enums']['tournament_status'];
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  created_by: string;
}

export interface TournamentUpdate {
  name?: string;
  description?: string | null;
  start_date?: string;
  end_date?: string;
  location?: string | null;
  max_players?: number;
  current_players?: number;
  entry_fee?: number | null;
  prize_pool?: number | null;
  status?: Database['public']['Enums']['tournament_status'];
  format?: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
}

// Match Types
export interface Match {
  id: string;
  tournament_id: string | null;
  title: string;
  description: string | null;
  scheduled_at: string;
  started_at: string | null;
  ended_at: string | null;
  status: Database['public']['Enums']['match_status'];
  best_of_frames: number;
  frames_to_win: number;
  venue: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MatchInsert {
  tournament_id?: string | null;
  title: string;
  description?: string | null;
  scheduled_at: string;
  best_of_frames: number;
  frames_to_win: number;
  venue?: string | null;
  created_by: string;
}

export interface MatchUpdate {
  title?: string;
  description?: string | null;
  scheduled_at?: string;
  started_at?: string | null;
  ended_at?: string | null;
  status?: Database['public']['Enums']['match_status'];
  best_of_frames?: number;
  frames_to_win?: number;
  venue?: string | null;
}

// Match Player Types
export interface MatchPlayer {
  id: string;
  match_id: string;
  player_id: string;
  player_number: number; // 1 or 2
  frames_won: number;
  highest_break: number;
  total_points: number;
  created_at: string;
}

export interface MatchPlayerInsert {
  match_id: string;
  player_id: string;
  player_number: number;
  frames_won?: number;
  highest_break?: number;
  total_points?: number;
}

export interface MatchPlayerUpdate {
  frames_won?: number;
  highest_break?: number;
  total_points?: number;
}

// Match Frame Types
export interface MatchFrame {
  id: string;
  match_id: string;
  frame_number: number;
  winner_id: string | null;
  player1_score: number;
  player2_score: number;
  player1_break: number;
  player2_break: number;
  duration_minutes: number | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface MatchFrameInsert {
  match_id: string;
  frame_number: number;
  winner_id?: string | null;
  player1_score?: number;
  player2_score?: number;
  player1_break?: number;
  player2_break?: number;
  duration_minutes?: number | null;
  started_at?: string | null;
  ended_at?: string | null;
}

export interface MatchFrameUpdate {
  winner_id?: string | null;
  player1_score?: number;
  player2_score?: number;
  player1_break?: number;
  player2_break?: number;
  duration_minutes?: number | null;
  started_at?: string | null;
  ended_at?: string | null;
}

// Comment Types
export interface Comment {
  id: string;
  match_id: string | null;
  tournament_id: string | null;
  player_id: string | null;
  author_id: string;
  content: string;
  parent_id: string | null;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommentInsert {
  match_id?: string | null;
  tournament_id?: string | null;
  player_id?: string | null;
  author_id: string;
  content: string;
  parent_id?: string | null;
  likes_count?: number;
}

export interface CommentUpdate {
  content?: string;
  likes_count?: number;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  type: Database['public']['Enums']['notification_type'];
  title: string;
  message: string;
  data: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationInsert {
  user_id: string;
  type: Database['public']['Enums']['notification_type'];
  title: string;
  message: string;
  data?: Record<string, any> | null;
  is_read?: boolean;
}

export interface NotificationUpdate {
  title?: string;
  message?: string;
  data?: Record<string, any> | null;
  is_read?: boolean;
}

// Achievement Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: Database['public']['Enums']['achievement_type'];
  icon_url: string | null;
  points: number;
  criteria: Record<string, any>;
  created_at: string;
}

export interface AchievementInsert {
  name: string;
  description: string;
  type: Database['public']['Enums']['achievement_type'];
  icon_url?: string | null;
  points: number;
  criteria: Record<string, any>;
}

export interface AchievementUpdate {
  name?: string;
  description?: string;
  type?: Database['public']['Enums']['achievement_type'];
  icon_url?: string | null;
  points?: number;
  criteria?: Record<string, any>;
}

// Player Achievement Types
export interface PlayerAchievement {
  id: string;
  player_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: number; // 0-100
  created_at: string;
}

export interface PlayerAchievementInsert {
  player_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress?: number;
}

export interface PlayerAchievementUpdate {
  unlocked_at?: string;
  progress?: number;
}

// Challenge Types
export interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  match_id: string | null;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface ChallengeInsert {
  challenger_id: string;
  challenged_id: string;
  match_id?: string | null;
  message?: string | null;
  status?: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
}

export interface ChallengeUpdate {
  message?: string | null;
  status?: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at?: string;
}

// Player Challenge Types
export interface PlayerChallenge {
  id: string;
  challenge_id: string;
  player_id: string;
  response: 'pending' | 'accepted' | 'declined';
  responded_at: string | null;
  created_at: string;
}

export interface PlayerChallengeInsert {
  challenge_id: string;
  player_id: string;
  response?: 'pending' | 'accepted' | 'declined';
  responded_at?: string | null;
}

export interface PlayerChallengeUpdate {
  response?: 'pending' | 'accepted' | 'declined';
  responded_at?: string | null;
}

// Statistics Types
export interface Statistic {
  id: string;
  player_id: string;
  stat_type: 'matches_played' | 'matches_won' | 'win_percentage' | 'highest_break' | 'century_breaks' | 'average_break' | 'frames_won' | 'frames_lost';
  value: number;
  period: 'all_time' | 'this_year' | 'this_month' | 'this_week';
  updated_at: string;
}

export interface StatisticInsert {
  player_id: string;
  stat_type: 'matches_played' | 'matches_won' | 'win_percentage' | 'highest_break' | 'century_breaks' | 'average_break' | 'frames_won' | 'frames_lost';
  value: number;
  period: 'all_time' | 'this_year' | 'this_month' | 'this_week';
}

export interface StatisticUpdate {
  value?: number;
  period?: 'all_time' | 'this_year' | 'this_month' | 'this_week';
}

// Helper Types
export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums']; 