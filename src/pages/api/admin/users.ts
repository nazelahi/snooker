import type { NextApiRequest, NextApiResponse } from 'next';
import { withJWT } from '@/lib/jwtMiddleware';
import { supabase } from '@/lib/supabase';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // @ts-ignore
  const user = req.user;
  
  // Check if user is admin
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { page = 1, limit = 10, search = '' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    let query = supabase
      .from('app_users')
      .select('id, email, username, full_name, role, created_at', { count: 'exact' });

    // Add search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Add pagination
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    res.status(200).json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withJWT(handler); 