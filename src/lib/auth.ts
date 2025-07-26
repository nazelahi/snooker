import { supabase } from './supabase';
import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  username: string;
  fullName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  // Sign up with trigger-based profile creation
  async signUp(data: SignUpData) {
    try {
      console.log('Starting user registration...');
      // Step 1: Create user in Supabase Auth (trigger will create profile)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.fullName,
            name: data.fullName,
          },
        },
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(authError.message);
      }
      if (!authData.user) {
        throw new Error('Failed to create user account');
      }
      console.log('User created in Auth:', authData.user.id);

      // Step 2: Wait for the trigger to create the profile
      let profile = null;
      for (let i = 0; i < 5; i++) {
        const { data: p, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        if (p) {
          profile = p;
          break;
        }
        await new Promise(res => setTimeout(res, 500)); // wait 0.5s
      }
      if (!profile) {
        throw new Error('Profile was not created by trigger. Please check your trigger setup.');
      }

      // Step 3: Create player profile
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          profile_id: authData.user.id,
          nickname: data.fullName,
          skill_level: 5,
          preferred_hand: 'right',
          experience_years: 0,
        });
      if (playerError) {
        console.warn('Player profile creation failed:', playerError.message);
      }

      return {
        user: authData.user,
        profile,
        session: authData.session,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  // Sign in
  async signIn(data: SignInData) {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      throw new Error(error.message);
    }
    return authData;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      throw new Error(error.message);
    }
    return user;
  },

  // Get current session
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(error.message);
    }
    return session;
  },
};

// Auth state management
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const session = await authService.getCurrentSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error('Get initial session error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    getInitialSession();
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, []);
  return { user, loading };
}; 