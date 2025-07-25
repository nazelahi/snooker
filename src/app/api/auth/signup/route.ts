
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, password, name } = await req.json();
  const supabase = createRouteHandlerClient({ cookies });

  // First, sign up the user in Supabase Auth to get a user ID
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
      // By setting email_confirm to true, we are skipping the email confirmation step
      email_confirm: true,
    }
  });

  if (signUpError) {
    return NextResponse.json({ error: signUpError.message }, { status: 400 });
  }

  if (!user) {
    return NextResponse.json({ error: 'Sign up failed, please try again.' }, { status: 500 });
  }

  // Next, insert the user profile into the public.users table
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id: user.id,
      email: user.email,
      name: name,
      role: 'user' // default role
    });

  if (insertError) {
    // If profile insert fails, we should probably delete the auth user
    // to keep things clean. This is an important step for production apps.
    const { data: adminUser, error: adminError } = await supabase.auth.admin.deleteUser(user.id);
    if(adminError) {
        // If we can't delete the auth user, we should probably log this somewhere
        console.error("Failed to delete orphaned auth user:", adminError);
    }
    return NextResponse.json({ error: 'Failed to create user profile.' }, { status: 500 });
  }
  
  // Also insert the user into the players table
   const { error: playerInsertError } = await supabase
        .from('players')
        .insert([{ 
            name,
            initials: name.split(' ').map((n: string) => n[0]).join(''),
            skill_level: 'Beginner',
            highest_break: 0,
            matches_played: 0,
            win_rate: "0%",
            wins: 0,
            losses: 0,
            average_break: 0,
            user_id: user.id,
        }]);
        
    if (playerInsertError) {
        // Handle error, maybe roll back user creation
        const { data: adminUser, error: adminError } = await supabase.auth.admin.deleteUser(user.id);
         if(adminError) {
            console.error("Failed to delete orphaned auth user:", adminError);
        }
        return NextResponse.json({ error: 'Failed to create player profile.' }, { status: 500 });
    }


  return NextResponse.json({ message: 'User created successfully' });
}
