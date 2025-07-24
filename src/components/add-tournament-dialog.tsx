
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
import type { Tournament } from "@/app/tournaments/page";
import Image from "next/image";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";

interface AddTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTournament: (tournament: Omit<Tournament, 'id' | 'pendingPlayers' | 'registeredPlayers'>) => void;
}

const PREDEFINED_RULES = [
  "Standard knockout rules",
  "Best of 11 frames",
  "Round-robin league format",
  "Each player plays each other once",
  "2 points for a win, 1 for a draw",
  "9-ball rules. Race to 7",
  "Pro-Am knockout tournament",
  "Amateurs get a handicap",
  "Final match is best of 19 frames",
  "All matches must be completed by the specified date",
];

export function AddTournamentDialog({ open, onOpenChange, onAddTournament }: AddTournamentDialogProps) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<"Knockout" | "League" | "Round Robin">("Knockout");
  const [players, setPlayers] = useState(8);
  const [status, setStatus] = useState<"Upcoming" | "In Progress" | "Finished">("Upcoming");
  const [rules, setRules] = useState<string[]>([]);
  const [image, setImage] = useState("");
  const [location, setLocation] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImage(result);
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRuleChange = (rule: string, checked: boolean) => {
    setRules(prevRules => {
        if (checked) {
            return [...prevRules, rule];
        } else {
            return prevRules.filter(r => r !== rule);
        }
    });
  };

  const handleSubmit = () => {
    onAddTournament({ name, format, players, status, rules, image, location });
    onOpenChange(false);
    setName("");
    setFormat("Knockout");
    setPlayers(8);
    setStatus("Upcoming");
    setRules([]);
    setImage("");
    setLocation("");
    setImagePreview("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Tournament</DialogTitle>
          <DialogDescription>
            Enter the details of the new tournament below.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
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
            <Label htmlFor="format" className="text-right">
              Format
            </Label>
            <Select
              onValueChange={(value: "Knockout" | "League" | "Round Robin") => setFormat(value)}
              defaultValue={format}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Knockout">Knockout</SelectItem>
                <SelectItem value="League">League</SelectItem>
                <SelectItem value="Round Robin">Round Robin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="players" className="text-right">
              Players
            </Label>
            <Input
              id="players"
              type="number"
              value={players}
              onChange={(e) => setPlayers(parseInt(e.target.value, 10))}
              className="col-span-3"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="col-span-3"
              placeholder="e.g. Main Hall"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select
              onValueChange={(value: "Upcoming" | "In Progress" | "Finished") => setStatus(value)}
              defaultValue={status}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Upcoming">Upcoming</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Finished">Finished</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="rules" className="text-right pt-2">
              Rules
            </Label>
            <div className="col-span-3 space-y-2 border rounded-md p-4">
                {PREDEFINED_RULES.map(rule => (
                    <div key={rule} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`rule-new-${rule}`}
                            onCheckedChange={(checked) => handleRuleChange(rule, !!checked)}
                        />
                        <Label htmlFor={`rule-new-${rule}`} className="font-normal">{rule}</Label>
                    </div>
                ))}
            </div>
          </div>
           <div className="grid grid-cols-4 items-start gap-4">
             <Label htmlFor="image" className="text-right pt-2">
                Image
             </Label>
             <div className="col-span-3 space-y-2">
                {imagePreview && <Image src={imagePreview} alt="Tournament preview" width={200} height={100} className="rounded-md object-cover" />}
                <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                />
             </div>
           </div>
        </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit}>Create Tournament</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
