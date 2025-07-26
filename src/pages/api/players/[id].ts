import type { NextApiRequest, NextApiResponse } from 'next';
import { playersService } from '@/lib/playersService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const playerId = parseInt(id as string);

  if (isNaN(playerId)) {
    return res.status(400).json({ error: 'Invalid player ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        const player = await playersService.getPlayerById(playerId);
        if (!player) {
          return res.status(404).json({ error: 'Player not found' });
        }
        res.status(200).json(player);
        break;
        
      case 'PUT':
        const updatedPlayer = await playersService.updatePlayer(playerId, req.body);
        res.status(200).json(updatedPlayer);
        break;
        
      case 'DELETE':
        await playersService.deletePlayer(playerId);
        res.status(204).end();
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Player API error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
} 