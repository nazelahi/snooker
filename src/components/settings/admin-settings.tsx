

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
import { Trash2, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Settings, ListChecks } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface SiteSettings {
  name: string;
  description: string;
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

export default function AdminSettings() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ name: "", description: ""});
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState("");
  const { toast } = useToast();
  
  useEffect(() => {
    setPlayers(getFromStorage<Player[]>("players", []));
    setTournaments(getFromStorage<Tournament[]>("tournaments", []));
    setLiveMatches(getFromStorage<LiveMatch[]>("liveMatches", []));
    setSiteSettings(getFromStorage<SiteSettings>("siteSettings", { name: "CueScore", description: "The ultimate snooker club management app."}));
    
    const storedRules = getFromStorage<string[]>("tournamentRules", PREDEFINED_RULES);
    setRules(storedRules);
    if(localStorage.getItem('tournamentRules') === null) {
      saveToStorage('tournamentRules', PREDEFINED_RULES);
    }
  }, []);

  const handlePlayerChange = (id: number, field: keyof Player, value: any) => {
    setPlayers(prevPlayers => {
        const updatedPlayers = prevPlayers.map(p => {
            if (p.id === id) {
                const updatedPlayer = { ...p, [field]: value };
                
                if (field === 'wins' || field === 'losses') {
                    const wins = field === 'wins' ? value : updatedPlayer.wins ?? 0;
                    const losses = field === 'losses' ? value : updatedPlayer.losses ?? 0;
                    const matchesPlayed = wins + losses;
                    updatedPlayer.matchesPlayed = matchesPlayed;
                    updatedPlayer.winRate = matchesPlayed > 0 ? ((wins / matchesPlayed) * 100).toFixed(1) + '%' : '0%';
                }
                
                return updatedPlayer;
            }
            return p;
        });
        return updatedPlayers;
    });
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

  const handleRuleChange = (index: number, value: string) => {
    const updatedRules = [...rules];
    updatedRules[index] = value;
    setRules(updatedRules);
  };
  
  const handleAddRule = () => {
    if (newRule.trim()) {
      setRules([...rules, newRule.trim()]);
      setNewRule("");
    }
  };
  
  const handleDeleteRule = (index: number) => {
    const updatedRules = rules.filter((_, i) => i !== index);
    setRules(updatedRules);
  };


  const handleSaveChanges = () => {
    saveToStorage("players", players);
    saveToStorage("tournaments", tournaments);
    saveToStorage("liveMatches", liveMatches);
    saveToStorage("siteSettings", siteSettings);
    saveToStorage("tournamentRules", rules);
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="players">Manage Players</TabsTrigger>
          <TabsTrigger value="tournaments">Manage Tournaments</TabsTrigger>
          <TabsTrigger value="liveMatches">Manage Live Matches</TabsTrigger>
          <TabsTrigger value="rules">Manage Rules</TabsTrigger>
          <TabsTrigger value="siteSettings">Site Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="players">
           <Card className="mt-4">
                <CardHeader>
                <CardTitle>Player Data</CardTitle>
                <CardDescription>Edit player details below. Changes are saved when you click the "Save All Changes" button.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center font-semibold text-sm text-muted-foreground px-2">
                    <span className="col-span-2">Name</span>
                    <span>Highest Break</span>
                    <span>Wins</span>
                    <span>Losses</span>
                    <span>Actions</span>
                  </div>
                {players.map(player => (
                    <div key={player.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center p-2 rounded-lg bg-muted/50">
                    <Input className="col-span-2" value={player.name} onChange={e => handlePlayerChange(player.id, 'name', e.target.value)} />
                    <Input value={player.highestBreak} type="number" onChange={e => handlePlayerChange(player.id, 'highestBreak', parseInt(e.target.value))} />
                    <Input value={player.wins ?? 0} type="number" onChange={e => handlePlayerChange(player.id, 'wins', parseInt(e.target.value))} />
                    <Input value={player.losses ?? 0} type="number" onChange={e => handlePlayerChange(player.id, 'losses', parseInt(e.target.value))} />
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
         <TabsContent value="rules">
           <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Manage Tournament Rules</CardTitle>
                  <CardDescription>Add, edit, or delete the predefined rules for tournaments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rules.map((rule, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input value={rule} onChange={e => handleRuleChange(index, e.target.value)} />
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteRule(index)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  ))}
                   <div className="flex items-center gap-2 pt-4 border-t">
                        <Input 
                          placeholder="Add new rule..." 
                          value={newRule} 
                          onChange={e => setNewRule(e.target.value)} 
                          onKeyDown={e => e.key === 'Enter' && handleAddRule()}
                        />
                        <Button onClick={handleAddRule}><PlusCircle className="h-4 w-4 mr-2"/> Add Rule</Button>
                    </div>
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
