
import type { Comment } from './comments';

export interface Match {
  id: number;
  winner: string;
  loser:string;
  score: string;
  date: string;
  media?: string[];
  comments?: Comment[];
  pending_score?: {
    score1: number;
    score2: number;
    proposed_by: string;
  };
  tournament_id?: number;
}

export interface UpcomingMatch {
  id: number;
  player1: string;
  player2: string;
  date: string;
  time: string;
  tournament_id?: number;
}

export interface LiveMatch {
  id: number;
  tournament_id: number;
  tournament_name: string;
  player1: string;
  player2: string;
  score1: number;
  score2: number;
}
