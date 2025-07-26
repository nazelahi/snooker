import type { NextApiRequest, NextApiResponse } from 'next';
import { playersService } from '@/lib/playersService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        const players = await playersService.getAllPlayers();
        res.status(200).json(players);
        break;
        
      case 'POST':
        const newPlayer = await playersService.createPlayer(req.body);
        res.status(201).json(newPlayer);
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Players API error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
} 