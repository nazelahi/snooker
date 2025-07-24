

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFromStorage, saveToStorage } from "@/lib/storage";
import type { Player } from "@/app/players/page";
import type { Tournament } from "@/app/tournaments/page";
import type { LiveMatch } from "@/app/tournaments/page";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface SiteSettings {
  name: string;
  description: string;
}

export default function AdminSettings() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ name: "", description: ""});
  const { toast } = useToast();
  
  useEffect(() => {
    setPlayers(getFromStorage<Player[]>("players", []));
    setTournaments(getFromStorage<Tournament[]>("tournaments", []));
    setLiveMatches(getFromStorage<LiveMatch[]>("liveMatches", []));
    setSiteSettings(getFromStorage<SiteSettings>("siteSettings", { name: "CueScore", description: "The ultimate snooker club management app."}));
  }, []);

  const handlePlayerChange = (id: number, field: keyof Player, value: any) => {
    const updatedPlayers = players.map(p => p.id === id ? { ...p, [field]: value } : p);
    setPlayers(updatedPlayers);
  };

  const handleTournamentChange = (id: number, field: keyof Tournament, value: any) => {
    const updatedTournaments = tournaments.map(t => t.id === id ? { ...t, [field]: value } : t);
    setTournaments(updatedTournaments);
  };
  
  const handleLiveMatchChange = (id: number, field: keyof LiveMatch, value: any) => {
    const updatedMatches = liveMatches.map(m => m.id === id ? { ...m, [field]: value } : m);
    setLiveMatches(updatedMatches);
  };

  const handleDelete = <T extends {id: number}>(id: number, type: 'players' | 'tournaments' | 'liveMatches', stateSetter: React.Dispatch<React.SetStateAction<T[]>>) => {
      stateSetter(prev => {
        const updated = prev.filter(item => item.id !== id);
        saveToStorage(type, updated);
        return updated;
      });
      toast({ title: "Success", description: `Item removed from ${type}.`});
  };

  const handleSaveChanges = () => {
    saveToStorage("players", players);
    saveToStorage("tournaments", tournaments);
    saveToStorage("liveMatches", liveMatches);
    saveToStorage("siteSettings", siteSettings);
    window.dispatchEvent(new Event('storage'));
    toast({
      title: "Saved!",
      description: "All changes have been saved to local storage.",
    });
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <ShieldCheck className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">Manage all application data from a centralized dashboard.</p>
        </div>
      </div>

      <Tabs defaultValue="players" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="players">Manage Players</TabsTrigger>
          <TabsTrigger value="tournaments">Manage Tournaments</TabsTrigger>
          <TabsTrigger value="liveMatches">Manage Live Matches</TabsTrigger>
          <TabsTrigger value="siteSettings">Site Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="players">
           <Card className="mt-4">
                <CardHeader>
                <CardTitle>Player Data</CardTitle>
                <CardDescription>Edit player details below. Changes are saved when you click the "Save All Changes" button.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center font-semibold text-sm text-muted-foreground px-2">
                    <span>Name</span>
                    <span>Highest Break</span>
                    <span>Matches Played</span>
                    <span>Actions</span>
                  </div>
                {players.map(player => (
                    <div key={player.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-2 rounded-lg bg-muted/50">
                    <Input value={player.name} onChange={e => handlePlayerChange(player.id, 'name', e.target.value)} />
                    <Input value={player.highestBreak} type="number" onChange={e => handlePlayerChange(player.id, 'highestBreak', parseInt(e.target.value))} />
                    <Input value={player.matchesPlayed} type="number" onChange={e => handlePlayerChange(player.id, 'matchesPlayed', parseInt(e.target.value))} />
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(player.id, 'players', setPlayers)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                ))}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="tournaments">
            <Card className="mt-4">
                <CardHeader>
                <CardTitle>Tournament Data</CardTitle>
                <CardDescription>Edit tournament details below. Changes are saved when you click the "Save All Changes" button.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center font-semibold text-sm text-muted-foreground px-2">
                      <span>Name</span>
                      <span>Players</span>
                      <span>Status</span>
                      <span>Actions</span>
                  </div>
                {tournaments.map(tournament => (
                    <div key={tournament.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-2 rounded-lg bg-muted/50">
                      <Input value={tournament.name} onChange={e => handleTournamentChange(tournament.id, 'name', e.target.value)} />
                      <Input value={tournament.players} type="number" onChange={e => handleTournamentChange(tournament.id, 'players', parseInt(e.target.value))} />
                      <Select value={tournament.status} onValueChange={(value: "Upcoming" | "In Progress" | "Finished") => handleTournamentChange(tournament.id, 'status', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Upcoming">Upcoming</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Finished">Finished</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(tournament.id, 'tournaments', setTournaments)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                ))}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="liveMatches">
           <Card className="mt-4">
                <CardHeader>
                <CardTitle>Live Match Data</CardTitle>
                <CardDescription>Edit live match details below. Changes are saved when you click the "Save All Changes" button.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center font-semibold text-sm text-muted-foreground px-2">
                        <span>Player 1</span>
                        <span>Player 2</span>
                        <span>Score (P1 - P2)</span>
                        <span>Actions</span>
                    </div>
                {liveMatches.map(match => (
                    <div key={match.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-2 rounded-lg bg-muted/50">
                    <Input value={match.player1} onChange={e => handleLiveMatchChange(match.id, 'player1', e.target.value)} />
                    <Input value={match.player2} onChange={e => handleLiveMatchChange(match.id, 'player2', e.target.value)} />
                    <div className="flex gap-2">
                        <Input value={match.score1} type="number" onChange={e => handleLiveMatchChange(match.id, 'score1', parseInt(e.target.value))} />
                        <Input value={match.score2} type="number" onChange={e => handleLiveMatchChange(match.id, 'score2', parseInt(e.target.value))} />
                    </div>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(match.id, 'liveMatches', setLiveMatches)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                ))}
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="siteSettings">
           <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Site Settings</CardTitle>
                  <CardDescription>Manage general site information. Click "Save All Changes" when you're done.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Club Name</Label>
                    <Input 
                      id="siteName" 
                      value={siteSettings.name} 
                      onChange={e => setSiteSettings({...siteSettings, name: e.target.value})} 
                      placeholder="Your Club Name"
                    />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="siteDescription">Site Description (Metadata)</Label>
                    <Textarea 
                      id="siteDescription" 
                      value={siteSettings.description} 
                      onChange={e => setSiteSettings({...siteSettings, description: e.target.value})}
                       placeholder="A short description for your site."
                    />
                  </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      
      <Button onClick={handleSaveChanges} className="w-full md:w-auto self-end mt-4">Save All Changes</Button>
    </div>
  );
}
