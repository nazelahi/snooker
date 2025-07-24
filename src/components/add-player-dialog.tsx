"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import type { Player } from "@/app/players/page";

interface AddPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPlayer: (player: Omit<Player, 'id' | 'avatar' | 'initials' | 'winRate' | 'matchesPlayed'>) => void;
}

export function AddPlayerDialog({ open, onOpenChange, onAddPlayer }: AddPlayerDialogProps) {
  const [name, setName] = useState("");
  const [skillLevel, setSkillLevel] = useState<"Beginner" | "Intermediate" | "Pro">("Beginner");
  const [highestBreak, setHighestBreak] = useState(0);

  const handleSubmit = () => {
    onAddPlayer({ name, skillLevel, highestBreak });
    onOpenChange(false);
    setName("");
    setSkillLevel("Beginner");
    setHighestBreak(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
          <DialogDescription>
            Enter the details of the new player below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
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
          <Button type="submit" onClick={handleSubmit}>Add Player</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
