
"use client";

import { useState } from "react";
import {
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Player } from "@/types/players";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ResponsiveDialog } from "@/components/ui/dialog";

interface AddPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPlayer: (player: Omit<Player, 'id' | 'initials' | 'win_rate' | 'matches_played' | 'wins' | 'losses' | 'average_break' | 'created_at' | 'user_id' | 'email'>) => void;
}

export function AddPlayerDialog({ open, onOpenChange, onAddPlayer }: AddPlayerDialogProps) {
  const [name, setName] = useState("");
  const [skillLevel, setSkillLevel] = useState<"Beginner" | "Intermediate" | "Pro">("Beginner");
  const [highestBreak, setHighestBreak] = useState(0);
  const [avatar, setAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatar(result);
        setAvatarPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!name) return;
    // @ts-ignore
    onAddPlayer({ name, skill_level: skillLevel, highest_break: highestBreak, avatar });
    onOpenChange(false);
    setName("");
    setSkillLevel("Beginner");
    setHighestBreak(0);
    setAvatar("");
    setAvatarPreview("");
  };

  return (
    <ResponsiveDialog 
        open={open} 
        onOpenChange={onOpenChange}
        title="Add New Player"
        description="Enter the details of the new player below."
        className="sm:max-w-[425px]"
    >
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="avatar" className="text-right">
            Avatar
          </Label>
          <div className="col-span-3 flex items-center gap-4">
            <Avatar>
              <AvatarImage src={avatarPreview || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" />
              <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="col-span-3"
            />
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="skillLevel" className="text-right">
            Skill Level
          </Label>
          <Select
            onValueChange={(value: "Beginner" | "Intermediate" | "Pro") => setSkillLevel(value)}
            defaultValue={skillLevel}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select skill level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Pro">Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="highestBreak" className="text-right">
            Highest Break
          </Label>
          <Input
            id="highestBreak"
            type="number"
            value={highestBreak}
            onChange={(e) => setHighestBreak(parseInt(e.target.value, 10))}
            className="col-span-3"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button type="submit" onClick={handleSubmit} disabled={!name}>Add Player</Button>
      </DialogFooter>
    </ResponsiveDialog>
  );
}
