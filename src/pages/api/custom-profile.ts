import type { NextApiRequest, NextApiResponse } from 'next';
import { withJWT } from '@/lib/jwtMiddleware';
import { supabase } from '@/lib/supabase';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // @ts-ignore
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { data: user, error } = await supabase
    .from('app_users')
    .select('id, email, username, full_name, created_at')
    .eq('id', userId)
    .single();
  if (error || !user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.status(200).json({ user });
}

export default withJWT(handler); 