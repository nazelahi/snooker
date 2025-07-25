
"use client";

import { useState, useEffect } from "react";
import { getFromStorage, saveToStorage } from "@/lib/storage";
import type { Player } from "@/app/players/page";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Megaphone, MessageSquare } from "lucide-react";
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { CommentInput, CommentThread } from "@/components/comment-thread";
import type { Comment } from "@/types/comments";
import { useToast } from "@/hooks/use-toast";

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  comments?: Comment[];
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [currentUser, setCurrentUser] = useState<{name: string, email: string, isAdmin?: boolean} | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const userData = getFromStorage<{name: string, email: string, isAdmin?: boolean} | null>('userData', null);
    setCurrentUser(userData);

    const storedNotices = getFromStorage<Notice[]>('notices', []);
    setNotices(storedNotices.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    const storedPlayers = getFromStorage<Player[]>('players', []);
    setPlayers(storedPlayers);
  }, []);

  const handlePostNoticeComment = (noticeId: string, content: string, image: string | null, parentId: string | null) => {
    if ((!content.trim() && !image) || !currentUser) return;

    const newCommentObject: Comment = {
        id: Date.now().toString(),
        authorName: currentUser.name,
        authorEmail: currentUser.email,
        content: content,
        date: new Date().toISOString(),
        mentions: [],
        likes: [],
        dislikes: [],
        image: image || undefined,
        replies: []
    };
    
    setNotices(prevNotices => {
        const updatedNotices = prevNotices.map(notice => {
            if (notice.id === noticeId) {
                let updatedComments = [...(notice.comments || [])];
                
                if (parentId) {
                    const findAndAddReply = (comments: Comment[]): Comment[] => {
                        return comments.map(comment => {
                            if (comment.id === parentId) {
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
                return { ...notice, comments: updatedComments };
            }
            return notice;
        });

        saveToStorage('notices', updatedNotices);
        return updatedNotices;
    });

    toast({ title: parentId ? "Reply Posted" : "Comment Posted" });
    setTimeout(() => window.dispatchEvent(new Event('storage')), 0);
  };
  
  const handleNoticeCommentReaction = (noticeId: string, commentId: string, reaction: 'like' | 'dislike') => {
    if (!currentUser) return;

    setNotices(prevNotices => {
      const updatedNotices = prevNotices.map(notice => {
        if (notice.id === noticeId) {
          const updateReactionsRecursive = (comments: Comment[]): Comment[] => {
            return comments.map(comment => {
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
              if (comment.replies) {
                return { ...comment, replies: updateReactionsRecursive(comment.replies) };
              }
              return comment;
            });
          };
          const updatedComments = updateReactionsRecursive(notice.comments || []);
          return { ...notice, comments: updatedComments };
        }
        return notice;
      });

      saveToStorage('notices', updatedNotices);
      return updatedNotices;
    });
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Megaphone className="h-10 w-10 text-primary" />
                <div className="hidden md:block">
                    <h1 className="text-3xl font-bold">Notice Board</h1>
                    <p className="text-muted-foreground">All club announcements and updates.</p>
                </div>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
        </div>

        {notices.length > 0 ? (
            <div className="space-y-6">
                {notices.map((notice) => (
                    <Card key={notice.id}>
                        <CardHeader>
                            <CardTitle>{notice.title}</CardTitle>
                            <CardDescription>{format(new Date(notice.date), "PPP")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground whitespace-pre-wrap">{notice.content}</p>
                            
                            <div className="border-t pt-4">
                                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5"/>
                                    Comments ({notice.comments?.length || 0})
                                </h4>
                                <div className="space-y-4">
                                    {currentUser && (
                                        <CommentInput
                                            onSubmit={(content, image) => handlePostNoticeComment(notice.id, content, image, null)}
                                            players={players}
                                            currentUser={currentUser}
                                        />
                                    )}
                                    {(notice.comments || []).length > 0 ? (
                                        <CommentThread
                                            comments={(notice.comments || []).slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
                                            onPostComment={(content, image, parentId) => handlePostNoticeComment(notice.id, content, image, parentId)}
                                            onReaction={(commentId, reaction) => handleNoticeCommentReaction(notice.id, commentId, reaction)}
                                            allPlayers={players}
                                            currentUser={currentUser}
                                        />
                                    ) : (
                                        <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to start the conversation!</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
             <div className="text-center py-16">
                <h3 className="text-xl font-semibold">No Notices Found</h3>
                <p className="text-muted-foreground mt-2">There are no club notices at the moment.</p>
            </div>
        )}
    </div>
  );
}
