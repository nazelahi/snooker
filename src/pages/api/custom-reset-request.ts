import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Rate limiting: store in memory (use Redis in production)
const resetAttempts = new Map<string, { count: number; lastAttempt: number }>();

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  // Rate limiting: max 3 attempts per hour per email
  const now = Date.now();
  const userAttempts = resetAttempts.get(email) || { count: 0, lastAttempt: 0 };
  
  if (now - userAttempts.lastAttempt < 3600000) { // 1 hour
    if (userAttempts.count >= 3) {
      return res.status(429).json({ error: 'Too many reset attempts. Try again later.' });
    }
    userAttempts.count++;
  } else {
    userAttempts.count = 1;
  }
  userAttempts.lastAttempt = now;
  resetAttempts.set(email, userAttempts);

  try {
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Update user with reset token
    const { error } = await supabase
      .from('app_users')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString(),
      })
      .eq('email', email);

    if (error) {
      console.error('Error updating reset token:', error);
      return res.status(500).json({ error: 'Failed to process reset request' });
    }

    // Send email
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    res.status(200).json({ message: 'Password reset email sent if user exists.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
} 