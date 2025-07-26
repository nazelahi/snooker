
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { record: user } = await req.json()

    if (!user) {
      throw new Error('No user data provided');
    }

    const { error } = await supabase.from('players').insert({
      id: user.id, // Use the user's UUID as the primary key
      name: user.user_metadata?.full_name || user.email,
      email: user.email,
      initials: (user.user_metadata?.full_name || user.email).split(' ').map((n: string) => n[0]).join(''),
      // Set default values for a new player
      skill_level: 'Beginner',
      matches_played: 0,
      win_rate: '0%',
      highest_break: 0,
      wins: 0,
      losses: 0,
      average_break: 0,
      avatar: user.user_metadata?.avatar_url || '',
    });

    if (error) {
      console.error('Error creating player profile:', error);
      throw error;
    }

    return new Response(JSON.stringify({ message: 'Player profile created' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
