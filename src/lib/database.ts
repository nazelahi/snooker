import { supabase } from './supabase';
import type { Database } from '@/types/database';

// Type aliases for easier use
type Tables = Database['public']['Tables'];
type Enums = Database['public']['Enums'];

// Profile Services
export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  async updateProfile(userId: string, updates: Tables['profiles']['Update']) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  },

  async getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('username');
    
    return { data, error };
  }
};

// Player Services
export const playerService = {
  async getPlayer(profileId: string) {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('profile_id', profileId)
      .single();
    
    return { data, error };
  },

  async createPlayer(player: Tables['players']['Insert']) {
    const { data, error } = await supabase
      .from('players')
      .insert(player)
      .select()
      .single();
    
    return { data, error };
  },

  async updatePlayer(playerId: string, updates: Tables['players']['Update']) {
    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', playerId)
      .select()
      .single();
    
    return { data, error };
  },

  async getAllPlayers() {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        profiles (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async getPlayerWithProfile(playerId: string) {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        profiles (
          id,
          username,
          full_name,
          avatar_url,
          email
        )
      `)
      .eq('id', playerId)
      .single();
    
    return { data, error };
  }
};

// Tournament Services
export const tournamentService = {
  async getTournament(tournamentId: string) {
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        profiles!created_by (
          id,
          username,
          full_name
        )
      `)
      .eq('id', tournamentId)
      .single();
    
    return { data, error };
  },

  async createTournament(tournament: Tables['tournaments']['Insert']) {
    const { data, error } = await supabase
      .from('tournaments')
      .insert(tournament)
      .select()
      .single();
    
    return { data, error };
  },

  async updateTournament(tournamentId: string, updates: Tables['tournaments']['Update']) {
    const { data, error } = await supabase
      .from('tournaments')
      .update(updates)
      .eq('id', tournamentId)
      .select()
      .single();
    
    return { data, error };
  },

  async getAllTournaments() {
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        profiles!created_by (
          id,
          username,
          full_name
        )
      `)
      .order('start_date', { ascending: false });
    
    return { data, error };
  },

  async getTournamentsByStatus(status: Enums['tournament_status']) {
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        profiles!created_by (
          id,
          username,
          full_name
        )
      `)
      .eq('status', status)
      .order('start_date', { ascending: false });
    
    return { data, error };
  }
};

// Match Services
export const matchService = {
  async getMatch(matchId: string) {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        tournaments (
          id,
          name,
          status
        ),
        profiles!created_by (
          id,
          username,
          full_name
        ),
        match_players (
          *,
          players (
            *,
            profiles (
              id,
              username,
              full_name,
              avatar_url
            )
          )
        ),
        match_frames (
          *
        )
      `)
      .eq('id', matchId)
      .single();
    
    return { data, error };
  },

  async createMatch(match: Tables['matches']['Insert']) {
    const { data, error } = await supabase
      .from('matches')
      .insert(match)
      .select()
      .single();
    
    return { data, error };
  },

  async updateMatch(matchId: string, updates: Tables['matches']['Update']) {
    const { data, error } = await supabase
      .from('matches')
      .update(updates)
      .eq('id', matchId)
      .select()
      .single();
    
    return { data, error };
  },

  async getAllMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        tournaments (
          id,
          name
        ),
        profiles!created_by (
          id,
          username,
          full_name
        ),
        match_players (
          players (
            profiles (
              id,
              username,
              full_name
            )
          )
        )
      `)
      .order('scheduled_at', { ascending: false });
    
    return { data, error };
  },

  async getMatchesByStatus(status: Enums['match_status']) {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        tournaments (
          id,
          name
        ),
        profiles!created_by (
          id,
          username,
          full_name
        ),
        match_players (
          players (
            profiles (
              id,
              username,
              full_name
            )
          )
        )
      `)
      .eq('status', status)
      .order('scheduled_at', { ascending: false });
    
    return { data, error };
  },

  async addPlayerToMatch(matchPlayer: Tables['match_players']['Insert']) {
    const { data, error } = await supabase
      .from('match_players')
      .insert(matchPlayer)
      .select()
      .single();
    
    return { data, error };
  },

  async updateMatchPlayer(matchPlayerId: string, updates: Tables['match_players']['Update']) {
    const { data, error } = await supabase
      .from('match_players')
      .update(updates)
      .eq('id', matchPlayerId)
      .select()
      .single();
    
    return { data, error };
  }
};

// Frame Services
export const frameService = {
  async getFrame(frameId: string) {
    const { data, error } = await supabase
      .from('match_frames')
      .select('*')
      .eq('id', frameId)
      .single();
    
    return { data, error };
  },

  async createFrame(frame: Tables['match_frames']['Insert']) {
    const { data, error } = await supabase
      .from('match_frames')
      .insert(frame)
      .select()
      .single();
    
    return { data, error };
  },

  async updateFrame(frameId: string, updates: Tables['match_frames']['Update']) {
    const { data, error } = await supabase
      .from('match_frames')
      .update(updates)
      .eq('id', frameId)
      .select()
      .single();
    
    return { data, error };
  },

  async getMatchFrames(matchId: string) {
    const { data, error } = await supabase
      .from('match_frames')
      .select('*')
      .eq('match_id', matchId)
      .order('frame_number');
    
    return { data, error };
  }
};

// Comment Services
export const commentService = {
  async getComment(commentId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!author_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('id', commentId)
      .single();
    
    return { data, error };
  },

  async createComment(comment: Tables['comments']['Insert']) {
    const { data, error } = await supabase
      .from('comments')
      .insert(comment)
      .select(`
        *,
        profiles!author_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();
    
    return { data, error };
  },

  async updateComment(commentId: string, updates: Tables['comments']['Update']) {
    const { data, error } = await supabase
      .from('comments')
      .update(updates)
      .eq('id', commentId)
      .select()
      .single();
    
    return { data, error };
  },

  async getMatchComments(matchId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!author_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('match_id', matchId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async getTournamentComments(tournamentId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!author_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('tournament_id', tournamentId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });
    
    return { data, error };
  }
};

// Notification Services
export const notificationService = {
  async getUserNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async createNotification(notification: Tables['notifications']['Insert']) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    
    return { data, error };
  },

  async markAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();
    
    return { data, error };
  },

  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    return { count, error };
  }
};

// Achievement Services
export const achievementService = {
  async getAllAchievements() {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('points', { ascending: false });
    
    return { data, error };
  },

  async getPlayerAchievements(playerId: string) {
    const { data, error } = await supabase
      .from('player_achievements')
      .select(`
        *,
        achievements (
          *
        )
      `)
      .eq('player_id', playerId)
      .order('unlocked_at', { ascending: false });
    
    return { data, error };
  },

  async unlockAchievement(playerAchievement: Tables['player_achievements']['Insert']) {
    const { data, error } = await supabase
      .from('player_achievements')
      .insert(playerAchievement)
      .select(`
        *,
        achievements (
          *
        )
      `)
      .single();
    
    return { data, error };
  }
};

// Challenge Services
export const challengeService = {
  async getChallenge(challengeId: string) {
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        players!challenger_id (
          *,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        ),
        players!challenged_id (
          *,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('id', challengeId)
      .single();
    
    return { data, error };
  },

  async createChallenge(challenge: Tables['challenges']['Insert']) {
    const { data, error } = await supabase
      .from('challenges')
      .insert(challenge)
      .select()
      .single();
    
    return { data, error };
  },

  async updateChallenge(challengeId: string, updates: Tables['challenges']['Update']) {
    const { data, error } = await supabase
      .from('challenges')
      .update(updates)
      .eq('id', challengeId)
      .select()
      .single();
    
    return { data, error };
  },

  async getUserChallenges(userId: string) {
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        players!challenger_id (
          *,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        ),
        players!challenged_id (
          *,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        )
      `)
      .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    return { data, error };
  }
};

// Statistics Services
export const statisticsService = {
  async getPlayerStats(playerId: string) {
    const { data, error } = await supabase
      .from('statistics')
      .select('*')
      .eq('player_id', playerId)
      .order('stat_type');
    
    return { data, error };
  },

  async updateStatistic(statistic: Tables['statistics']['Insert']) {
    const { data, error } = await supabase
      .from('statistics')
      .upsert(statistic, { onConflict: 'player_id,stat_type,period' })
      .select()
      .single();
    
    return { data, error };
  },

  async getLeaderboard(statType: Tables['statistics']['Row']['stat_type'], period: Tables['statistics']['Row']['period'] = 'all_time') {
    const { data, error } = await supabase
      .from('statistics')
      .select(`
        *,
        players (
          *,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('stat_type', statType)
      .eq('period', period)
      .order('value', { ascending: false })
      .limit(10);
    
    return { data, error };
  }
};

// Utility function to get current user's profile
export const getCurrentUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };
  
  return await profileService.getProfile(user.id);
};

// Utility function to get current user's player profile
export const getCurrentUserPlayer = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };
  
  return await playerService.getPlayer(user.id);
}; 