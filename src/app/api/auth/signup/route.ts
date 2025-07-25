
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, password, name } = await req.json();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase URL or Key is not configured.' }, { status: 500 });
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password,
      data: {
        full_name: name
      }
    })
  });
  
  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json({ error: data.msg || 'An unknown error occurred.' }, { status: response.status });
  }

  // The on_auth_user_created trigger in the database will handle
  // creating the user profile in the public.users table.
  
  return NextResponse.json({ message: 'User created successfully. Please check your email to verify your account.', user: data });
}
