import type { NextApiRequest, NextApiResponse } from 'next';
import { withJWT } from '@/lib/jwtMiddleware';
import { supabase } from '@/lib/supabase';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // @ts-ignore
  const adminUser = req.user;
  
  // Check if user is admin
  if (adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { userId, updates } = req.body;

  if (!userId || !updates) {
    return res.status(400).json({ error: 'User ID and updates required' });
  }

  // Validate allowed fields
  const allowedFields = ['role', 'username', 'full_name', 'email'];
  const validUpdates: any = {};
  
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      validUpdates[key] = value;
    }
  }

  // Prevent admin from changing their own role
  if (validUpdates.role && userId === adminUser.id) {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }

  try {
    const { data: user, error } = await supabase
      .from('app_users')
      .update(validUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }

    res.status(200).json({ 
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withJWT(handler); 