
export interface Notification {
  id: number;
  user_name: string;
  title: string;
  description: string;
  read: boolean;
  date: string;
  link?: string;
  created_at: string;
}
