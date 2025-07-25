
export interface UserProfile {
    id: string; // Corresponds to Supabase Auth user's ID
    name: string;
    email: string;
    avatar?: string;
    role: 'user' | 'admin';
}
