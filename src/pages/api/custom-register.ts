import type { NextApiRequest, NextApiResponse } from 'next';
import { customAuthService } from '@/lib/customAuth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { email, password, username, fullName } = req.body;
  if (!email || !password || !username || !fullName) {
    return res.status(400).json({ error: 'All fields required' });
  }
  try {
    const user = await customAuthService.registerUser({ email, password, username, fullName });
    
    // Create JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    // Also create a player entry for the new user
    await customAuthService.createPlayerForUser(user);
    
    res.status(201).json({ token, user: { id: user.id, email: user.email, username: user.username, full_name: user.full_name } });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
  }
} 