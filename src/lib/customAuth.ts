import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  fullName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const customAuthService = {
  // Register a new user (hash password and insert into app_users)
  async registerUser(data: RegisterData) {
    // Hash the password before saving
    const password_hash = await bcrypt.hash(data.password, 10);
    const { data: user, error } = await supabase
      .from('app_users')
      .insert({
        email: data.email,
        password_hash,
        username: data.username,
        full_name: data.fullName,
      })
      .select()
      .single();
    if (error) throw error;
    return user;
  },

  // Create a player entry for a newly registered user
  async createPlayerForUser(user: any) {
    try {
      // Get the next available player ID
      const { data: existingPlayers, error: fetchError } = await supabase
        .from('players')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);
      
      if (fetchError) throw fetchError;
      
      const nextId = existingPlayers && existingPlayers.length > 0 
        ? Math.max(...existingPlayers.map(p => p.id)) + 1 
        : 1;
      
      // Create initials from full name
      const initials = user.full_name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase();
      
      // Create player entry
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          id: nextId,
          name: user.full_name,
          email: user.email,
          username: user.username,
          initials: initials,
          avatar: '',
          skill_level: 'Beginner',
          matches_played: 0,
          wins: 0,
          losses: 0,
          win_rate: '0%',
          highest_break: 0,
          average_break: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (playerError) {
        console.error('Error creating player:', playerError);
        // Don't throw error here as user registration was successful
        // Just log the error
      }
    } catch (error) {
      console.error('Error creating player for user:', error);
      // Don't throw error here as user registration was successful
      // Just log the error
    }
  },

  // Login a user (check password manually)
  async loginUser(data: LoginData) {
    console.log('Login attempt for email:', data.email);
    
    // Fetch user by email
    const { data: user, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', data.email)
      .single();
    
    console.log('Database query result:', { user, error });
    
    if (error || !user) {
      console.log('User not found or error:', error);
      throw new Error('User not found');
    }
    
    console.log('User found, checking password...');
    
    // Compare password
    const valid = await bcrypt.compare(data.password, user.password_hash);
    console.log('Password comparison result:', valid);
    
    if (!valid) throw new Error('Invalid password');
    
    console.log('Login successful for user:', user.id);
    return user;
  },
};

// NOTE: You must implement your own session/token system (JWT, cookies, etc.)
// for login persistence and protected routes. This is only the core logic for registration and login. 