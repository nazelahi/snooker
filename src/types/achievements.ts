
export type AchievementId =
  | 'first_win'
  | 'five_wins'
  | 'ten_wins'
  | 'streak_3'
  | 'streak_5'
  | 'century_break'
  | 'tournament_winner';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  date: string; // ISO date string
  icon: string; // Lucide icon name
}
