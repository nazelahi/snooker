
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
import { ArrowLeft, Swords, Calendar, Upload, MessageSquare, ThumbsUp, ThumbsDown, Paperclip, X } from "lucide-react";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import type { Notification } from "@/types/notifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Comment {
    id: string;
    authorName: string;
    authorEmail: string;
    content: string;
    date: string;
    mentions: string[]; // array of emails
    likes?: string[]; // array of user emails
    dislikes?: string[]; // array of user emails
    image?: string;
}

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
  const [newComment, setNewComment] = useState("");
  const [newCommentImage, setNewCommentImage] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<Player[]>([]);
  const [isMentionPopoverOpen, setIsMentionPopoverOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);


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
  
  const handleCommentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCommentImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewComment(text);

    const mentionMatch = text.match(/@(\w+)$/);
    if (mentionMatch) {
        const query = mentionMatch[1].toLowerCase();
        const suggestions = allPlayers.filter(p => p.name.toLowerCase().includes(query) && p.name !== currentUser?.name);
        setMentionSuggestions(suggestions);
        setIsMentionPopoverOpen(suggestions.length > 0);
    } else {
        setIsMentionPopoverOpen(false);
    }
  };

  const handleMentionSelect = (playerName: string) => {
    const currentText = newComment;
    const updatedText = currentText.replace(/@(\w+)$/, `@${playerName} `);
    setNewComment(updatedText);
    setIsMentionPopoverOpen(false);
    textareaRef.current?.focus();
  };


  const handlePostComment = () => {
    if ((!newComment.trim() && !newCommentImage) || !currentUser || !match) return;

    const mentionRegex = /@(\w+\s\w+)/g;
    let matchResult;
    const mentionedNames: string[] = [];
    while ((matchResult = mentionRegex.exec(newComment)) !== null) {
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
        content: newComment,
        date: new Date().toISOString(),
        mentions: mentionedEmails,
        likes: [],
        dislikes: [],
        image: newCommentImage || undefined,
    };

    setMatch(prevMatch => {
        if(!prevMatch) return null;

        const updatedMatch = {
            ...prevMatch,
            comments: [...(prevMatch.comments || []), newCommentObject]
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

    // Send notifications
    mentionedEmails.forEach(email => {
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


    setNewComment("");
    setNewCommentImage(null);
    toast({ title: "Comment Posted", description: "Your comment has been added to the match." });
  };
  
  const handleCommentReaction = (commentId: string, reaction: 'like' | 'dislike') => {
    if (!currentUser || !match) return;
    
    let commentAuthorEmail: string | null = null;
    let originalComment: Comment | null = null;

    setMatch(prevMatch => {
        if (!prevMatch) return null;
        
        originalComment = prevMatch.comments?.find(c => c.id === commentId) || null;
        if(originalComment) {
          commentAuthorEmail = originalComment.authorEmail;
        }

        const updatedComments = (prevMatch.comments || []).map(comment => {
            if (comment.id === commentId) {
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
            return comment;
        });

        const updatedMatch = { ...prevMatch, comments: updatedComments };

        const allMatches = getFromStorage<Match[]>('recentResults', []);
        const matchIndex = allMatches.findIndex(m => m.id === updatedMatch.id);
        if (matchIndex > -1) {
            allMatches[matchIndex] = updatedMatch;
            saveToStorage('recentResults', allMatches);
        }

        return updatedMatch;
    });

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
  
  const getPlayerByEmail = (email: string) => allPlayers.find(p => p.name.toLowerCase() === allUsers.find(u => u.email === email)?.name.toLowerCase());


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
            <CardContent className="space-y-6">
                {currentUser && (
                    <Popover open={isMentionPopoverOpen} onOpenChange={setIsMentionPopoverOpen}>
                        <PopoverTrigger asChild>
                            <div className="flex items-start gap-4">
                                <Avatar>
                                    <AvatarImage src={allPlayers.find(p => p.name === currentUser.name)?.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={currentUser.name} />
                                    <AvatarFallback>{currentUser.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                    <Textarea
                                        ref={textareaRef}
                                        value={newComment}
                                        onChange={handleCommentChange}
                                        placeholder="Add a comment... Type @ to mention a player."
                                        className="w-full"
                                    />
                                    {newCommentImage && (
                                        <div className="relative w-32 h-32">
                                            <Image src={newCommentImage} alt="Comment image preview" layout="fill" objectFit="cover" className="rounded-md" />
                                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/75" onClick={() => setNewCommentImage(null)}>
                                                <X className="h-4 w-4 text-white" />
                                            </Button>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Input id="comment-image-upload" type="file" accept="image/*" onChange={handleCommentImageUpload} className="hidden" />
                                          <Label htmlFor="comment-image-upload">
                                            <Button variant="ghost" size="icon" asChild>
                                                <div className="cursor-pointer">
                                                  <Paperclip className="h-4 w-4" />
                                                </div>
                                            </Button>
                                          </Label>
                                          <Button onClick={handlePostComment} disabled={!newComment.trim() && !newCommentImage}>Post Comment</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2">
                            <ul className="space-y-1">
                                {mentionSuggestions.map(player => (
                                    <li key={player.id} onClick={() => handleMentionSelect(player.name)} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={player.avatar || `https://placehold.co/24x24.png`} data-ai-hint="player portrait" alt={player.name} />
                                            <AvatarFallback>{player.initials}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{player.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </PopoverContent>
                    </Popover>
                )}

                <div className="space-y-4">
                    {(match.comments || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(comment => {
                        const author = allPlayers.find(p => p.name === comment.authorName);
                        const hasLiked = currentUser && (comment.likes || []).includes(currentUser.email);
                        const hasDisliked = currentUser && (comment.dislikes || []).includes(currentUser.email);

                        return(
                            <div key={comment.id} className="flex items-start gap-4">
                                <Avatar>
                                     <AvatarImage src={author?.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={comment.authorName} />
                                     <AvatarFallback>{author?.initials || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{comment.authorName}</span>
                                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.date), { addSuffix: true })}</span>
                                    </div>
                                    {comment.content && <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{comment.content}</p>}
                                    {comment.image && (
                                        <div className="mt-2 relative aspect-video max-w-sm rounded-lg overflow-hidden">
                                            <Image src={comment.image} alt="Comment image" layout="fill" objectFit="cover" />
                                        </div>
                                    )}
                                    {currentUser && (
                                        <div className="flex items-center gap-4 mt-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCommentReaction(comment.id, 'like')}
                                                className={cn("flex items-center gap-1 text-muted-foreground px-2", { "text-primary": hasLiked })}
                                            >
                                                <ThumbsUp className="h-4 w-4" />
                                                <span>{(comment.likes || []).length}</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCommentReaction(comment.id, 'dislike')}
                                                className={cn("flex items-center gap-1 text-muted-foreground px-2", { "text-destructive": hasDisliked })}
                                            >
                                                <ThumbsDown className="h-4 w-4" />
                                                <span>{(comment.dislikes || []).length}</span>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
                 {(!match.comments || match.comments.length === 0) && (
                    <p className="text-muted-foreground text-center py-8">No comments yet. Be the first to start the conversation!</p>
                )}
            </CardContent>
        </Card>

    </div>
  );
}

