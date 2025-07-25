
export interface Challenge {
  id: string;
  challengerEmail: string;
  challengedEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  date: string; // ISO date string of when challenge was made
}
