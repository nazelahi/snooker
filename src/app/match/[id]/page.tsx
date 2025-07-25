

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from 'next/navigation';
import { getFromStorage, saveToStorage } from "@/lib/storage";
import type { Player } from "@/app/players/page";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ArrowLeft, Swords, Calendar, Upload, MessageSquare, ThumbsUp, ThumbsDown, Paperclip, X, CornerDownRight } from "lucide-react";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import type { Notification } from "@/types/notifications";
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { CommentInput, CommentThread } from "@/components/comment-thread";
import type { Comment } from "@/types/comments";

interface Match {
  id: number;
  winner: string;
  loser:string;
  score: string;
  date: string;
  media?: string[];
  comments?: Comment[];
  pendingScore?: {
    score1: number;
    score2: number;
    proposedBy: string;
  };
  tournamentId?: number;
}


export default function MatchDetailsPage() {
  const [match, setMatch] = useState<Match | null>(null);
  const [winnerPlayer, setWinnerPlayer] = useState<Player | null>(null);
  const [loserPlayer, setLoserPlayer] = useState<Player | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; isAdmin?: boolean } | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [commentsToShow, setCommentsToShow] = useState(10);
  
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const router = useRouter();

  const fetchMatchData = useCallback((matchId: string) => {
    const matches = getFromStorage<Match[]>('recentResults', []);
    const foundMatch = matches.find(m => m.id === parseInt(matchId));
    setMatch(foundMatch || null);

    if (foundMatch) {
        const players = getFromStorage<Player[]>('players', []);
        setWinnerPlayer(players.find(p => p.name === foundMatch.winner) || null);
        setLoserPlayer(players.find(p => p.name === foundMatch.loser) || null);
        setAllPlayers(players);
    }
  }, []);

  useEffect(() => {
    const userData = getFromStorage<{ name: string; email: string; isAdmin?: boolean } | null>('userData', null);
    setCurrentUser(userData);

    if (id) {
        fetchMatchData(id);
    }

    const handleStorageChange = () => {
        if(id) fetchMatchData(id);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);

  }, [id, fetchMatchData]);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && match) {
      const files = Array.from(e.target.files);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          
          setMatch(prevMatch => {
            if (!prevMatch) return null;
            const updatedMatch = {
              ...prevMatch,
              media: [...(prevMatch.media || []), result]
            };
            
            const allMatches = getFromStorage<Match[]>('recentResults', []);
            const matchIndex = allMatches.findIndex(m => m.id === updatedMatch.id);
            if (matchIndex > -1) {
              allMatches[matchIndex] = updatedMatch;
              saveToStorage('recentResults', allMatches);
              setTimeout(() => window.dispatchEvent(new Event('storage')), 0);
            }
            return updatedMatch;
          });
          toast({ title: "Media Uploaded", description: "Your photo/video has been added to the match."});
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const handlePostComment = (content: string, image: string | null, parentId: string | null) => {
    if ((!content.trim() && !image) || !currentUser || !match) return;

    const mentionRegex = /@(\w+\s\w+)/g;
    let matchResult;
    const mentionedNames: string[] = [];
    while ((matchResult = mentionRegex.exec(content)) !== null) {
        mentionedNames.push(matchResult[1]);
    }

    const allUsers = getFromStorage<{name:string, email:string}[]>('users', []);
    const mentionedEmails = mentionedNames
        .map(name => allUsers.find(u => u.name.toLowerCase() === name.toLowerCase())?.email)
        .filter((email): email is string => !!email);

    const newCommentObject: Comment = {
        id: Date.now().toString(),
        authorName: currentUser.name,
        authorEmail: currentUser.email,
        content: content,
        date: new Date().toISOString(),
        mentions: mentionedEmails,
        likes: [],
        dislikes: [],
        image: image || undefined,
        replies: []
    };
    
    // --- Update Match State and Storage ---
    setMatch(prevMatch => {
        if (!prevMatch) return null;

        let updatedComments = [...(prevMatch.comments || [])];
        let replyAuthorEmail: string | null = null;
        
        if (parentId) {
            // It's a reply
            const findAndAddReply = (comments: Comment[]): Comment[] => {
                return comments.map(comment => {
                    if (comment.id === parentId) {
                        replyAuthorEmail = comment.authorEmail;
                        return { ...comment, replies: [...(comment.replies || []), newCommentObject] };
                    }
                    if (comment.replies) {
                        return { ...comment, replies: findAndAddReply(comment.replies) };
                    }
                    return comment;
                });
            };
            updatedComments = findAndAddReply(updatedComments);
        } else {
            // It's a top-level comment
            updatedComments.push(newCommentObject);
        }

        const updatedMatch = { ...prevMatch, comments: updatedComments };

        const allMatches = getFromStorage<Match[]>('recentResults', []);
        const matchIndex = allMatches.findIndex(m => m.id === updatedMatch.id);
        if (matchIndex > -1) {
            allMatches[matchIndex] = updatedMatch;
            saveToStorage('recentResults', allMatches);
        }
        
         // --- Send Notifications ---
        if (parentId && replyAuthorEmail && replyAuthorEmail !== currentUser.email) {
            // Notify parent comment author
             const userNotifications = getFromStorage<Notification[]>(`notifications_${replyAuthorEmail}`, []);
             const newNotification: Notification = {
                id: Date.now().toString() + replyAuthorEmail,
                title: "Someone replied to your comment",
                description: `${currentUser.name} replied to you on the match between ${winnerPlayer?.name} and ${loserPlayer?.name}.`,
                read: false,
                date: new Date().toISOString(),
                link: `/match/${match.id}`
             };
             saveToStorage(`notifications_${replyAuthorEmail}`, [newNotification, ...userNotifications]);
        } else if (!parentId) {
            // It's a top-level comment, notify match players
            const winnerUser = allUsers.find(u => u.name === winnerPlayer?.name);
            const loserUser = allUsers.find(u => u.name === loserPlayer?.name);

            const notifyPlayer = (playerUser: {name: string, email: string} | undefined) => {
                if (playerUser && playerUser.email !== currentUser.email) {
                    const userNotifications = getFromStorage<Notification[]>(`notifications_${playerUser.email}`, []);
                    const newNotification: Notification = {
                        id: Date.now().toString() + playerUser.email,
                        title: "New comment on your match",
                        description: `${currentUser.name} commented on your match against ${playerUser.name === winnerPlayer?.name ? loserPlayer?.name : winnerPlayer?.name}.`,
                        read: false,
                        date: new Date().toISOString(),
                        link: `/match/${match.id}`
                    };
                    saveToStorage(`notifications_${playerUser.email}`, [newNotification, ...userNotifications]);
                }
            };
            notifyPlayer(winnerUser);
            notifyPlayer(loserUser);
        }
    
        mentionedEmails.forEach(email => {
            if(email === currentUser.email) return;
            const userNotifications = getFromStorage<Notification[]>(`notifications_${email}`, []);
            const newNotification: Notification = {
                id: Date.now().toString() + email,
                title: "You were mentioned in a comment",
                description: `${currentUser.name} mentioned you on the match between ${winnerPlayer?.name} and ${loserPlayer?.name}.`,
                read: false,
                date: new Date().toISOString(),
                link: `/match/${match.id}`
            };
            saveToStorage(`notifications_${email}`, [newNotification, ...userNotifications]);
        });
        
        setTimeout(() => window.dispatchEvent(new Event('storage')), 0);
        return updatedMatch;
    });

    toast({ title: parentId ? "Reply Posted" : "Comment Posted", description: `Your ${parentId ? 'reply' : 'comment'} has been added to the match.` });
  };
  
  const handleCommentReaction = (commentId: string, reaction: 'like' | 'dislike') => {
    if (!currentUser || !match) return;

    setMatch(prevMatch => {
        if (!prevMatch) return null;

        let commentAuthorEmail: string | null = null;
        
        const updateReactionsRecursive = (comments: Comment[]): Comment[] => {
            return comments.map(comment => {
                if (comment.id === commentId) {
                    commentAuthorEmail = comment.authorEmail;
                    const likes = comment.likes || [];
                    const dislikes = comment.dislikes || [];
                    const userEmail = currentUser.email;

                    const hasLiked = likes.includes(userEmail);
                    const hasDisliked = dislikes.includes(userEmail);

                    let newLikes = [...likes];
                    let newDislikes = [...dislikes];

                    if (reaction === 'like') {
                        if (hasLiked) {
                            newLikes = newLikes.filter(email => email !== userEmail);
                        } else {
                            newLikes.push(userEmail);
                            newDislikes = newDislikes.filter(email => email !== userEmail);
                        }
                    } else { // dislike
                        if (hasDisliked) {
                            newDislikes = newDislikes.filter(email => email !== userEmail);
                        } else {
                            newDislikes.push(userEmail);
                            newLikes = newLikes.filter(email => email !== userEmail);
                        }
                    }
                    return { ...comment, likes: newLikes, dislikes: newDislikes };
                }
                
                if (comment.replies) {
                    return { ...comment, replies: updateReactionsRecursive(comment.replies) };
                }

                return comment;
            });
        };
        
        const updatedComments = updateReactionsRecursive(prevMatch.comments || []);
        const updatedMatch = { ...prevMatch, comments: updatedComments };

        const allMatches = getFromStorage<Match[]>('recentResults', []);
        const matchIndex = allMatches.findIndex(m => m.id === updatedMatch.id);
        if (matchIndex > -1) {
            allMatches[matchIndex] = updatedMatch;
            saveToStorage('recentResults', allMatches);
        }
        
        if (commentAuthorEmail && commentAuthorEmail !== currentUser.email) {
          const userNotifications = getFromStorage<Notification[]>(`notifications_${commentAuthorEmail}`, []);
          const newNotification: Notification = {
            id: Date.now().toString() + commentAuthorEmail,
            title: `Someone reacted to your comment`,
            description: `${currentUser.name} ${reaction}d your comment on the match between ${winnerPlayer?.name} and ${loserPlayer?.name}.`,
            read: false,
            date: new Date().toISOString(),
            link: `/match/${match.id}`
          };
          saveToStorage(`notifications_${commentAuthorEmail}`, [newNotification, ...userNotifications]);
          setTimeout(() => window.dispatchEvent(new Event('storage')), 0);
        }

        return updatedMatch;
    });
  };


  if (!match || !winnerPlayer || !loserPlayer) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-lg mb-4">Match not found or data is incomplete.</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const sortedComments = (match.comments || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex justify-between items-start">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-3xl">
                    <Swords className="h-8 w-8 text-primary" />
                    Match Details
                </CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(match.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex justify-around items-center text-center p-8 bg-muted/50 rounded-lg">
                    <Link href={`/players/${winnerPlayer.id}`} className="flex flex-col items-center gap-2 group">
                        <Avatar className="h-24 w-24 border-2 border-green-500">
                            <AvatarImage src={winnerPlayer.avatar || `https://placehold.co/96x96.png`} data-ai-hint="player portrait" alt={winnerPlayer.name} />
                            <AvatarFallback>{winnerPlayer.initials}</AvatarFallback>
                        </Avatar>
                        <h3 className="text-xl font-bold group-hover:underline">{winnerPlayer.name}</h3>
                        <p className="text-sm text-muted-foreground">(Winner)</p>
                    </Link>

                    <div className="text-5xl font-bold text-primary">{match.score}</div>

                    <Link href={`/players/${loserPlayer.id}`} className="flex flex-col items-center gap-2 group">
                        <Avatar className="h-24 w-24 border-2 border-red-500">
                            <AvatarImage src={loserPlayer.avatar || `https://placehold.co/96x96.png`} data-ai-hint="player portrait" alt={loserPlayer.name} />
                            <AvatarFallback>{loserPlayer.initials}</AvatarFallback>
                        </Avatar>
                        <h3 className="text-xl font-bold group-hover:underline">{loserPlayer.name}</h3>
                        <p className="text-sm text-muted-foreground">(Loser)</p>
                    </Link>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Match Media</CardTitle>
                <CardDescription>Photos and videos from the match.</CardDescription>
            </CardHeader>
            <CardContent>
                {match.media && match.media.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {match.media.map((mediaUrl, index) => (
                            <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                {mediaUrl.startsWith('data:image') && (
                                    <Image src={mediaUrl} alt={`Match media ${index + 1}`} layout="fill" objectFit="cover" />
                                )}
                                {mediaUrl.startsWith('data:video') && (
                                    <video src={mediaUrl} controls className="w-full h-full object-cover" />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">No media has been uploaded for this match yet.</p>
                )}
            </CardContent>
             <CardFooter>
                <div className="w-full">
                    <Label htmlFor="media-upload" className="font-semibold">Add Media</Label>
                    <div className="flex items-center gap-2 mt-2">
                         <Input id="media-upload" type="file" accept="image/*,video/*" multiple onChange={handleMediaUpload} className="hidden" />
                         <Label htmlFor="media-upload" className="w-full">
                            <Button asChild className="w-full">
                                <div className="cursor-pointer">
                                 <Upload className="mr-2 h-4 w-4" />
                                 Upload Photos or Videos
                                </div>
                            </Button>
                         </Label>
                    </div>
                </div>
            </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquare />Comments</CardTitle>
                <CardDescription>Discuss the match with other members.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {currentUser && (
                    <CommentInput
                        onSubmit={(content, image) => handlePostComment(content, image, null)}
                        players={allPlayers}
                        currentUser={currentUser}
                    />
                )}

                 {(!match.comments || match.comments.length === 0) ? (
                    <p className="text-muted-foreground text-center py-8">No comments yet. Be the first to start the conversation!</p>
                ) : (
                    <CommentThread
                        comments={sortedComments.slice(0, commentsToShow)}
                        onPostComment={handlePostComment}
                        onReaction={handleCommentReaction}
                        allPlayers={allPlayers}
                        currentUser={currentUser}
                    />
                )}
            </CardContent>
             {sortedComments.length > commentsToShow && (
                <CardFooter>
                    <Button
                        onClick={() => setCommentsToShow(commentsToShow + 10)}
                        variant="secondary"
                        className="w-full"
                    >
                        View More Comments
                    </Button>
                </CardFooter>
            )}
        </Card>

    </div>
  );
}
