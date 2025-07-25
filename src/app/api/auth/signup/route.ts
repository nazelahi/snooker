
import { createRouteHandlerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, password, name } = await req.json();
  
  // Create a Supabase client for the server-side request
  const supabase = createRouteHandlerClient({ cookies });

  // Sign up the user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // The on_auth_user_created trigger in the database will handle
  // creating the user profile in the public.users table.
  
  return NextResponse.json({ message: 'User created successfully. Please check your email to verify your account.', user: data.user });
}
