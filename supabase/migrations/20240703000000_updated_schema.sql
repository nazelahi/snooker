
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for admins only" ON "public"."settings";
DROP POLICY IF EXISTS "Enable update for admins only" ON "public"."settings";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."settings";
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a single policy for admins to manage settings
CREATE POLICY "Enable admin access to settings" ON "public"."settings"
AS PERMISSIVE FOR ALL
TO authenticated
USING ( (select auth.jwt() ->> 'email') = 'admin@gmail.com' )
WITH CHECK ( (select auth.jwt() ->> 'email') = 'admin@gmail.com' );

-- Re-create the read policy for all users
CREATE POLICY "Enable read access for all users" ON "public"."settings"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- Corrected function to handle new user profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.players (id, name, email, initials, skill_level, matches_played, win_rate, highest_break, wins, losses, average_break)
  values (
      new.id,
      new.raw_user_meta_data ->> 'full_name',
      new.email,
      (new.raw_user_meta_data ->> 'full_name')::text,
      'Beginner',
      0,
      '0%',
      0,
      0,
      0,
      0
  );
  return new;
end;
$$;

-- Re-create the trigger with the corrected function
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable RLS for the settings table if it's not already enabled
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
