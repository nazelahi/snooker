import type { NextApiRequest, NextApiResponse } from 'next';
import { testSupabaseConnection } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await testSupabaseConnection();
    
    if (result.success) {
      res.status(200).json({ success: true, message: 'Database connection successful' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    });
  }
} 