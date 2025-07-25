
export interface Comment {
    id: string;
    authorName: string;
    authorEmail: string;
    content: string;
    date: string;
    mentions: string[]; // array of emails
    likes?: string[]; // array of user emails
    dislikes?: string[]; // array of user emails
    image?: string;
    replies?: Comment[];
}
