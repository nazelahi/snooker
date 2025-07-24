
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
import { Textarea } from "./ui/textarea";
import Image from "next/image";

interface AddTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTournament: (tournament: Omit<Tournament, 'id'>) => void;
}

export function AddTournamentDialog({ open, onOpenChange, onAddTournament }: AddTournamentDialogProps) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<"Knockout" | "League" | "Round Robin">("Knockout");
  const [players, setPlayers] = useState(8);
  const [status, setStatus] = useState<"Upcoming" | "In Progress" | "Finished">("Upcoming");
  const [rules, setRules] = useState("");
  const [image, setImage] = useState("");
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

  const handleSubmit = () => {
    onAddTournament({ name, format, players, status, rules, image });
    onOpenChange(false);
    setName("");
    setFormat("Knockout");
    setPlayers(8);
    setStatus("Upcoming");
    setRules("");
    setImage("");
    setImagePreview("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Tournament</DialogTitle>
          <DialogDescription>
            Enter the details of the new tournament below.
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
            <Textarea
              id="rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="col-span-3"
              placeholder="Enter tournament rules here..."
            />
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit}>Create Tournament</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
