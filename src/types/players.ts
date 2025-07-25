
import type { Achievement } from './achievements';

export interface Player {
  id: number;
  name: string;
  skill_level: "Beginner" | "Intermediate" | "Pro";
  matches_played: number;
  win_rate: string;
  highest_break: number;
  avatar: string;
  initials: string;
  wins?: number;
  losses?: number;
  average_break?: number;
  achievements?: Achievement[];
  created_at: string;
  user_id?: string;
}
