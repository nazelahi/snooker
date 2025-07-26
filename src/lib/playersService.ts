import { supabase } from './supabase';

export interface Player {
  id: number;
  name: string;
  email: string;
  username: string;
  initials: string;
  avatar: string;
  skill_level: string;
  matches_played: number;
  wins: number;
  losses: number;
  win_rate: string;
  highest_break: number;
  average_break: number;
  created_at: string;
  updated_at: string;
}

export const playersService = {
  // Get all players
  async getAllPlayers(): Promise<Player[]> {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching players:', error);
      throw error;
    }
    
    return data || [];
  },

  // Get player by ID
  async getPlayerById(id: number): Promise<Player | null> {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching player:', error);
      return null;
    }
    
    return data;
  },

  // Get player by email
  async getPlayerByEmail(email: string): Promise<Player | null> {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('Error fetching player by email:', error);
      return null;
    }
    
    return data;
  },

  // Create new player
  async createPlayer(playerData: Omit<Player, 'id' | 'created_at' | 'updated_at'>): Promise<Player> {
    const { data, error } = await supabase
      .from('players')
      .insert({
        ...playerData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating player:', error);
      throw error;
    }
    
    return data;
  },

  // Update player
  async updatePlayer(id: number, updates: Partial<Player>): Promise<Player> {
    const { data, error } = await supabase
      .from('players')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating player:', error);
      throw error;
    }
    
    return data;
  },

  // Delete player
  async deletePlayer(id: number): Promise<void> {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting player:', error);
      throw error;
    }
  },

  // Update player stats after match
  async updatePlayerStats(playerId: number, isWinner: boolean, breakScore: number = 0): Promise<void> {
    const player = await this.getPlayerById(playerId);
    if (!player) return;

    const newWins = player.wins + (isWinner ? 1 : 0);
    const newLosses = player.losses + (isWinner ? 0 : 1);
    const newMatchesPlayed = player.matches_played + 1;
    const newWinRate = newMatchesPlayed > 0 ? ((newWins / newMatchesPlayed) * 100).toFixed(1) + '%' : '0%';
    const newHighestBreak = Math.max(player.highest_break, breakScore);
    const newAverageBreak = player.average_break > 0 
      ? Math.round((player.average_break + breakScore) / 2)
      : breakScore;

    await this.updatePlayer(playerId, {
      wins: newWins,
      losses: newLosses,
      matches_played: newMatchesPlayed,
      win_rate: newWinRate,
      highest_break: newHighestBreak,
      average_break: newAverageBreak
    });
  }
}; 