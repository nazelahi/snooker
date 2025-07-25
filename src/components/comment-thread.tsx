
"use client";

import { useState, useEffect, useRef } from "react";
import { getFromStorage } from "@/lib/storage";
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
import Link from "next/link";
import { ArrowLeft, Swords, Calendar, Upload, MessageSquare, ThumbsUp, ThumbsDown, Paperclip, X, CornerDownRight } from "lucide-react";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import type { Notification } from "@/types/notifications";
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Comment } from "@/types/comments";

export const CommentInput = ({
  onSubmit,
  players,
  currentUser,
  buttonLabel = "Post Comment",
  placeholder = "Add a comment... Type @ to mention a player.",
  autofocus = false,
}: {
  onSubmit: (commentText: string, image: string | null) => void;
  players: Player[];
  currentUser: { name: string; email: string };
  buttonLabel?: string;
  placeholder?: string;
  autofocus?: boolean;
}) => {
  const [commentText, setCommentText] = useState("");
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<Player[]>([]);
  const [isMentionPopoverOpen, setIsMentionPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autofocus) {
      inputRef.current?.focus();
    }
  }, [autofocus]);

  const handleCommentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setCommentImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setCommentText(text);

    const mentionMatch = text.match(/@(\w*)$/);
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      const suggestions = players.filter(
        (p) =>
          p.name.toLowerCase().includes(query) && p.name !== currentUser?.name
      );
      setMentionSuggestions(suggestions);
      setIsMentionPopoverOpen(suggestions.length > 0);
    } else {
      setIsMentionPopoverOpen(false);
    }
  };

  const handleMentionSelect = (playerName: string) => {
    const currentText = commentText;
    const updatedText = currentText.replace(/@(\w*)$/, `@${playerName} `);
    setCommentText(updatedText);
    setIsMentionPopoverOpen(false);
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    if (!commentText.trim() && !commentImage) return;
    onSubmit(commentText, commentImage);
    setCommentText("");
    setCommentImage(null);
  };

  return (
    <Popover open={isMentionPopoverOpen} onOpenChange={setIsMentionPopoverOpen}>
        <div className="flex items-start gap-2 w-full">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={
                players.find((p) => p.name === currentUser.name)?.avatar ||
                `https://placehold.co/40x40.png`
              }
              data-ai-hint="player portrait"
              alt={currentUser.name}
            />
            <AvatarFallback>
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <PopoverAnchor asChild>
                <Input
                ref={inputRef}
                value={commentText}
                onChange={handleCommentChange}
                placeholder={placeholder}
                className="w-full"
                />
            </PopoverAnchor>
            {commentImage && (
              <div className="relative w-32 h-32">
                <Image
                  src={commentImage}
                  alt="Comment image preview"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-md"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/75"
                  onClick={() => setCommentImage(null)}
                >
                  <X className="h-4 w-4 text-white" />
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Input
                  id="comment-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCommentImageUpload}
                  className="hidden"
                />
                <Label htmlFor="comment-image-upload">
                  <Button variant="ghost" size="icon" asChild>
                    <div className="cursor-pointer">
                      <Paperclip className="h-4 w-4" />
                    </div>
                  </Button>
                </Label>
                <Button
                  onClick={handleSubmit}
                  disabled={!commentText.trim() && !commentImage}
                  size="sm"
                >
                  {buttonLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      <PopoverContent className="w-64 p-2">
        <ul className="space-y-1">
          {mentionSuggestions.map((player) => (
            <li
              key={player.id}
              onClick={() => handleMentionSelect(player.name)}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={player.avatar || `https://placehold.co/24x24.png`}
                  data-ai-hint="player portrait"
                  alt={player.name}
                />
                <AvatarFallback>{player.initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{player.name}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
};


export const CommentThread = ({
  comments,
  onPostComment,
  onReaction,
  allPlayers,
  currentUser,
}: {
  comments: Comment[];
  onPostComment: (
    content: string,
    image: string | null,
    parentId: string | null
  ) => void;
  onReaction: (commentId: string, reaction: "like" | "dislike") => void;
  allPlayers: Player[];
  currentUser: { name: string; email: string; isAdmin?: boolean } | null;
}) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const CommentCard = ({ comment }: { comment: Comment }) => {
    const author = allPlayers.find((p) => p.name === comment.authorName);
    const hasLiked =
      currentUser && (comment.likes || []).includes(currentUser.email);
    const hasDisliked =
      currentUser && (comment.dislikes || []).includes(currentUser.email);
    const isReplying = replyingTo === comment.id;

    return (
      <div className="flex items-start gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={author?.avatar || `https://placehold.co/40x40.png`}
            data-ai-hint="player portrait"
            alt={comment.authorName}
          />
          <AvatarFallback>{author?.initials || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{comment.authorName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.date), { addSuffix: true })}
            </span>
          </div>
          {comment.content && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
              {comment.content}
            </p>
          )}
          {comment.image && (
             <Dialog>
                <DialogTrigger asChild>
                    <div className="mt-2 relative w-48 h-28 rounded-lg overflow-hidden cursor-pointer">
                        <Image
                            src={comment.image}
                            alt="Comment image"
                            layout="fill"
                            objectFit="cover"
                        />
                    </div>
                </DialogTrigger>
                <DialogContent className="max-w-3xl p-0">
                    <DialogHeader>
                        <DialogTitle className="sr-only">Comment Image</DialogTitle>
                    </DialogHeader>
                   <Image
                        src={comment.image}
                        alt="Comment image full view"
                        width={1200}
                        height={800}
                        className="rounded-lg object-contain"
                    />
                </DialogContent>
            </Dialog>
          )}
          {currentUser && (
            <div className="flex items-center gap-1 mt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReaction(comment.id, "like")}
                className={cn(
                  "flex items-center gap-1 text-muted-foreground px-1 h-auto py-1",
                  { "text-primary": hasLiked }
                )}
              >
                <ThumbsUp className="h-3 w-3" />
                <span className="text-xs">{(comment.likes || []).length}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReaction(comment.id, "dislike")}
                className={cn(
                  "flex items-center gap-1 text-muted-foreground px-1 h-auto py-1",
                  { "text-destructive": hasDisliked }
                )}
              >
                <ThumbsDown className="h-3 w-3" />
                <span className="text-xs">{(comment.dislikes || []).length}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                className="flex items-center gap-1 text-muted-foreground px-1 h-auto py-1 text-xs"
              >
                <CornerDownRight className="h-3 w-3" />
                Reply
              </Button>
            </div>
          )}

          {isReplying && currentUser && (
            <div className="mt-2">
              <CommentInput
                onSubmit={(content, image) => {
                  onPostComment(content, image, comment.id);
                  setReplyingTo(null);
                }}
                players={allPlayers}
                currentUser={currentUser}
                buttonLabel="Post Reply"
                placeholder={`Replying to ${comment.authorName}...`}
                autofocus
              />
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 pl-4 border-l-2">
              <CommentThread
                comments={comment.replies}
                onPostComment={onPostComment}
                onReaction={onReaction}
                allPlayers={allPlayers}
                currentUser={currentUser}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {comments
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((comment) => (
          <CommentCard key={comment.id} comment={comment} />
        ))}
    </div>
  );
};
