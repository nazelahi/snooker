
export interface Comment {
    id: string;
    authorName: string;
    author_id: string; // user id
    content: string;
    date: string;
    mentions: string[]; // array of user ids
    likes?: string[]; // array of user ids
    dislikes?: string[]; // array of user ids
    image?: string;
    replies?: Comment[];
}
