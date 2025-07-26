import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Add logging to help debug environment variables
if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

console.log('✅ Supabase environment variables loaded');
console.log('📡 Supabase URL:', supabaseUrl);
console.log('🔑 Supabase Anon Key:', supabaseAnonKey ? '***' + supabaseAnonKey.slice(-4) : 'NOT SET');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Test connection function
export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase
      .from('app_users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Supabase connection successful');
    return { success: true };
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
} 