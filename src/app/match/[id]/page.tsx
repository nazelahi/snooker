
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from 'next/navigation';
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
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { Match } from "@/types/matches";
import type { User } from "@supabase/supabase-js";


export default function MatchDetailsPage() {
  const [match, setMatch] = useState<Match | null>(null);
  const [winnerPlayer, setWinnerPlayer] = useState<Player | null>(null);
  const [loserPlayer, setLoserPlayer] = useState<Player | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [commentsToShow, setCommentsToShow] = useState(10);
  
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const fetchMatchData = useCallback(async (matchId: string) => {
    const { data: matchData, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', parseInt(matchId))
      .single();

    if (error || !matchData) {
      toast({ variant: 'destructive', title: 'Error', description: 'Match not found.' });
      setMatch(null);
      return;
    }
    
    setMatch(matchData as Match);

    const { data: playersData } = await supabase.from('players').select('*');
    if (playersData) {
      setAllPlayers(playersData);
      setWinnerPlayer(playersData.find(p => p.name === matchData.winner) || null);
      setLoserPlayer(playersData.find(p => p.name === matchData.loser) || null);
    }
  }, [toast, supabase]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        const { data: player } = await supabase.from('players').select('*').eq('user_id', session.user.id).single();
        setCurrentPlayer(player);
      } else {
        setCurrentPlayer(null);
      }

      if (id) {
        await fetchMatchData(id);
      }
    });

    // Initial fetch
    async function initialize() {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        const { data: player } = await supabase.from('players').select('*').eq('user_id', session.user.id).single();
        setCurrentPlayer(player);
      }
      if (id) {
        await fetchMatchData(id);
      }
    }
    initialize();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [id, fetchMatchData, supabase]);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && match) {
      const files = Array.from(e.target.files);
      const newMediaUrls: string[] = [];
      
      for (const file of files) {
          const reader = new FileReader();
          const readAsDataURL = new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
          });
          newMediaUrls.push(await readAsDataURL);
      }
      
      const updatedMedia = [...(match.media || []), ...newMediaUrls];

      const { data, error } = await supabase
        .from('matches')
        .update({ media: updatedMedia })
        .eq('id', match.id)
        .select()
        .single();
      
      if (error) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
      } else if(data) {
        setMatch(data as Match);
        toast({ title: "Media Uploaded", description: "Your photo/video has been added to the match."});
      }
    }
  };
  
  const handlePostComment = async (content: string, image: string | null, parentId: string | null) => {
    if ((!content.trim() && !image) || !currentUser || !match || !currentPlayer) return;

    const mentionRegex = /@(\w+\s\w+)/g;
    let matchResult;
    const mentionedNames: string[] = [];
    while ((matchResult = mentionRegex.exec(content)) !== null) {
        mentionedNames.push(matchResult[1]);
    }
    const mentionedPlayers = allPlayers.filter(p => mentionedNames.includes(p.name));


    const newCommentObject: Comment = {
        id: Date.now().toString(),
        authorName: currentPlayer.name,
        author_id: currentUser.id,
        content: content,
        date: new Date().toISOString(),
        mentions: mentionedPlayers.map(p => p.user_id).filter(id => !!id) as string[],
        likes: [],
        dislikes: [],
        image: image || undefined,
        replies: []
    };
    
    let updatedComments = [...(match.comments || [])];
    let replyAuthorId: string | null = null;
    
    if (parentId) {
        const findAndAddReply = (comments: Comment[]): Comment[] => {
            return comments.map(comment => {
                if (comment.id === parentId) {
                    replyAuthorId = comment.author_id;
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
        updatedComments.push(newCommentObject);
    }

    const { data, error } = await supabase
      .from('matches')
      .update({ comments: updatedComments })
      .eq('id', match.id)
      .select()
      .single();

    if(error) {
      toast({ variant: 'destructive', title: 'Error', description: "Could not post comment." });
      return;
    }
    
    if (data) {
        setMatch(data as Match);
        // --- Send Notifications via Supabase ---
        let notificationsToInsert: Omit<Notification, 'id' | 'created_at'>[] = [];

        const createNotification = (userId: string | undefined, title: string, description: string) => {
          if (userId && userId !== currentUser.id) {
            notificationsToInsert.push({
              user_id: userId,
              title,
              description,
              read: false,
              date: new Date().toISOString(),
              link: `/match/${match.id}`
            });
          }
        };

        if (parentId && replyAuthorId) {
             createNotification(
                replyAuthorId,
                "Someone replied to your comment",
                `${currentPlayer.name} replied to you on the match between ${winnerPlayer?.name} and ${loserPlayer?.name}.`
             );
        } else if (!parentId) {
            if (winnerPlayer) createNotification(winnerPlayer.user_id, "New comment on your match", `${currentPlayer.name} commented on your match against ${loserPlayer?.name}.`);
            if (loserPlayer) createNotification(loserPlayer.user_id, "New comment on your match", `${currentPlayer.name} commented on your match against ${winnerPlayer?.name}.`);
        }
        
        mentionedPlayers.forEach(p => {
            createNotification(
                p.user_id,
                "You were mentioned in a comment",
                `${currentPlayer.name} mentioned you on the match between ${winnerPlayer?.name} and ${loserPlayer?.name}.`
            );
        });

        if (notificationsToInsert.length > 0) {
            await supabase.from('notifications').insert(notificationsToInsert);
        }
        
        toast({ title: parentId ? "Reply Posted" : "Comment Posted" });
    }
  };
  
  const handleCommentReaction = async (commentId: string, reaction: 'like' | 'dislike') => {
    if (!currentUser || !match || !currentPlayer) return;

    let commentAuthorId: string | null = null;
    
    const updateReactionsRecursive = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
            if (comment.id === commentId) {
                commentAuthorId = comment.author_id;
                const likes = comment.likes || [];
                const dislikes = comment.dislikes || [];
                const userId = currentUser.id;

                const hasLiked = likes.includes(userId);
                const hasDisliked = dislikes.includes(userId);

                let newLikes = [...likes];
                let newDislikes = [...dislikes];

                if (reaction === 'like') {
                    if (hasLiked) {
                        newLikes = newLikes.filter(id => id !== userId);
                    } else {
                        newLikes.push(userId);
                        newDislikes = newDislikes.filter(id => id !== userId);
                    }
                } else { // dislike
                    if (hasDisliked) {
                        newDislikes = newDislikes.filter(id => id !== userId);
                    } else {
                        newDislikes.push(userId);
                        newLikes = newLikes.filter(id => id !== userId);
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
    
    const updatedComments = updateReactionsRecursive(match.comments || []);
    const { data, error } = await supabase
      .from('matches')
      .update({ comments: updatedComments })
      .eq('id', match.id)
      .select()
      .single();
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: "Could not update reaction." });
      return;
    }
    
    if(data) {
        setMatch(data as Match);
        if (commentAuthorId && commentAuthorId !== currentUser.id) {
          await supabase.from('notifications').insert([{
            user_id: commentAuthorId,
            title: `Someone reacted to your comment`,
            description: `${currentPlayer.name} ${reaction}d your comment on the match between ${winnerPlayer?.name} and ${loserPlayer?.name}.`,
            read: false,
            date: new Date().toISOString(),
            link: `/match/${match.id}`
          }]);
        }
    }
  };


  if (!match || !winnerPlayer || !loserPlayer) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-lg mb-4">Loading match data...</p>
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
                 {currentUser && currentPlayer && (
                    <CommentInput
                        onSubmit={(content, image) => handlePostComment(content, image, null)}
                        players={allPlayers}
                        currentUser={currentPlayer}
                    />
                )}

                 {(!match.comments || match.comments.length === 0) ? (
                    <p className="text-muted-foreground text-center py-8">No comments yet. Be the first to start the conversation!</p>
                ) : (
                    <CommentThread
                        comments={sortedComments}
                        onPostComment={handlePostComment}
                        onReaction={handleCommentReaction}
                        allPlayers={allPlayers}
                        currentUser={currentUser}
                        currentPlayer={currentPlayer}
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
