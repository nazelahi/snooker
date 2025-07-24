
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

interface AddMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMatch: (opponentId: number, myScore: number, opponentScore: number) => void;
  players: Player[];
  currentUser: { name: string; email: string };
}

export function AddMatchDialog({ open, onOpenChange, onAddMatch, players, currentUser }: AddMatchDialogProps) {
  const [opponentId, setOpponentId] = useState<number | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  
  const handleSubmit = () => {
    if (opponentId !== null && myScore >= 0 && opponentScore >= 0) {
      onAddMatch(opponentId, myScore, opponentScore);
      onOpenChange(false);
      setOpponentId(null);
      setMyScore(0);
      setOpponentScore(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report a New Match</DialogTitle>
          <DialogDescription>
            Select your opponent and enter the final score. Your opponent will be notified to approve the result.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="opponent" className="text-right">
              Opponent
            </Label>
            <Select
              onValueChange={(value: string) => setOpponentId(parseInt(value))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a player" />
              </SelectTrigger>
              <SelectContent>
                {players.map(player => (
                    <SelectItem key={player.id} value={player.id.toString()}>
                        {player.name}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="my-score">{currentUser.name} (You)</Label>
                <Input
                    id="my-score"
                    type="number"
                    value={myScore}
                    onChange={(e) => setMyScore(parseInt(e.target.value, 10) || 0)}
                    className="w-full"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="opponent-score">Opponent&apos;s Score</Label>
                <Input
                    id="opponent-score"
                    type="number"
                    value={opponentScore}
                    onChange={(e) => setOpponentScore(parseInt(e.target.value, 10) || 0)}
                    className="w-full"
                />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit}>Report Match</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

