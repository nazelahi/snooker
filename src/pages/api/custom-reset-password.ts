import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// Rate limiting: store in memory (use Redis in production)
const resetPasswordAttempts = new Map<string, { count: number; lastAttempt: number }>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password required' });
  }

  // Rate limiting: max 5 attempts per hour per IP
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const ipAttempts = resetPasswordAttempts.get(clientIP as string) || { count: 0, lastAttempt: 0 };
  
  if (now - ipAttempts.lastAttempt < 3600000) { // 1 hour
    if (ipAttempts.count >= 5) {
      return res.status(429).json({ error: 'Too many password reset attempts. Try again later.' });
    }
    ipAttempts.count++;
  } else {
    ipAttempts.count = 1;
  }
  ipAttempts.lastAttempt = now;
  resetPasswordAttempts.set(clientIP as string, ipAttempts);

  try {
    // Find user with this reset token
    const { data: user, error: fetchError } = await supabase
      .from('app_users')
      .select('*')
      .eq('reset_token', token)
      .single();

    if (fetchError || !user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check if token is expired
    if (new Date() > new Date(user.reset_token_expiry)) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user with new password and clear reset token
    const { error: updateError } = await supabase
      .from('app_users')
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expiry: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return res.status(500).json({ error: 'Failed to update password' });
    }

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
} 