
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
import { Trash2, PlusCircle, CheckCircle, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Settings, ListChecks } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import type { Notification } from "@/types/notifications";
import { cn } from "@/lib/utils";

interface SiteSettings {
  name: string;
  description: string;
}

interface UpcomingMatch {
    id: number;
    player1: string;
    player2: string;
    date: string;
    time: string;
    tournamentId?: number;
}

interface RecentResult {
    id: number;
    winner: string;
    loser: string;
    score: string;
    date: string;
    tournamentId?: number;
    media?: string[];
}

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
}

export default function AdminSettings() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ name: "", description: ""});
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState("");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeContent, setNewNoticeContent] = useState("");
  const { toast } = useToast();
  
  useEffect(() => {
    setPlayers(getFromStorage<Player[]>("players", []));
    setTournaments(getFromStorage<Tournament[]>("tournaments", []));
    setLiveMatches(getFromStorage<LiveMatch[]>("liveMatches", []));
    setUpcomingMatches(getFromStorage<UpcomingMatch[]>("upcomingMatches", []));
    setSiteSettings(getFromStorage<SiteSettings>("siteSettings", { name: "CueScore", description: "The ultimate snooker club management app."}));
    setNotices(getFromStorage<Notice[]>("notices", []));
    
    const storedRules = getFromStorage<string[]>("tournamentRules", []);
    setRules(storedRules);
    if(localStorage.getItem('tournamentRules') === null) {
      saveToStorage('tournamentRules', []);
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

  const handleUpcomingMatchChange = (id: number, field: keyof UpcomingMatch, value: any) => {
    const updatedMatches = upcomingMatches.map(m => m.id === id ? { ...m, [field]: value } : m);
    setUpcomingMatches(updatedMatches);
  };

  const handleAddUpcomingMatch = () => {
    let newMatch: UpcomingMatch;
    setUpcomingMatches(prev => {
        const newId = prev.length > 0 ? Math.max(...prev.map(m => m.id)) + 1 : 1;
        newMatch = {
            id: newId,
            player1: players[0]?.name || "Player 1",
            player2: players[1]?.name || "Player 2",
            date: new Date().toISOString().split('T')[0],
            time: "19:00",
            tournamentId: tournaments[0]?.id || undefined,
        };
        return [...prev, newMatch];
    });

    setTimeout(() => {
        const allUsers = getFromStorage<{name: string, email: string}[]>('users', []);
        
        const player1User = allUsers.find(u => u.name === newMatch.player1);
        const player2User = allUsers.find(u => u.name === newMatch.player2);

        const createNotification = (player: {name: string, email: string}, opponentName: string, date: string, time: string) => {
            const notifications = getFromStorage<Notification[]>(`notifications_${player.email}`, []);
            const newNotification: Notification = {
                id: Date.now().toString() + Math.random(),
                title: "New Match Scheduled",
                description: `A new match has been scheduled for you against ${opponentName} on ${new Date(date).toLocaleDateString()} at ${time}.`,
                read: false,
                date: new Date().toISOString()
            };
            saveToStorage(`notifications_${player.email}`, [newNotification, ...notifications]);
        };

        if (player1User) {
            createNotification(player1User, newMatch.player2, newMatch.date, newMatch.time);
        }
        if (player2User) {
            createNotification(player2User, newMatch.player1, newMatch.date, newMatch.time);
        }
        window.dispatchEvent(new Event('storage'));
    }, 0);
  };

  const handleAddLiveMatch = () => {
    setLiveMatches(prev => {
        const newId = prev.length > 0 ? Math.max(...prev.map(m => m.id)) + 1 : 1;
        const newMatch: LiveMatch = {
            id: newId,
            player1: players[0]?.name || "Player 1",
            player2: players[1]?.name || "Player 2",
            score1: 0,
            score2: 0,
            tournamentId: tournaments[0]?.id || 1,
            tournamentName: tournaments[0]?.name || "Tournament",
        };
        return [...prev, newMatch];
    });
    setTimeout(() => window.dispatchEvent(new Event('storage')), 0);
  };


  const handleDelete = <T extends {id: any}>(id: any, type: 'players' | 'tournaments' | 'liveMatches' | 'upcomingMatches' | 'notices', stateSetter: React.Dispatch<React.SetStateAction<T[]>>) => {
      stateSetter(prev => {
        const updated = prev.filter(item => item.id !== id);
        saveToStorage(type, updated);
        return updated;
      });
      toast({ title: "Success", description: `Item removed from ${type}.`});
  };

  const handleEndLiveMatch = (matchId: number) => {
    const match = liveMatches.find(m => m.id === matchId);
    if (!match) return;

    // 1. Create new recent result
    const recentResults = getFromStorage<RecentResult[]>("recentResults", []);
    const newResult: RecentResult = {
        id: recentResults.length > 0 ? Math.max(...recentResults.map(r => r.id)) + 1 : 1,
        winner: match.score1 > match.score2 ? match.player1 : match.player2,
        loser: match.score1 > match.score2 ? match.player2 : match.player1,
        score: `${match.score1}-${match.score2}`,
        date: new Date().toISOString(),
        tournamentId: match.tournamentId
    };
    const updatedRecentResults = [...recentResults, newResult];
    saveToStorage("recentResults", updatedRecentResults);

    // 2. Update player stats
    const winnerIndex = players.findIndex(p => p.name === newResult.winner);
    const loserIndex = players.findIndex(p => p.name === newResult.loser);
    const updatedPlayers = [...players];

    if (winnerIndex > -1) {
        const winner = updatedPlayers[winnerIndex];
        winner.wins = (winner.wins || 0) + 1;
        winner.matchesPlayed = (winner.matchesPlayed || 0) + 1;
        winner.winRate = ((winner.wins / winner.matchesPlayed) * 100).toFixed(1) + '%';
    }
    if (loserIndex > -1) {
        const loser = updatedPlayers[loserIndex];
        loser.losses = (loser.losses || 0) + 1;
        loser.matchesPlayed = (loser.matchesPlayed || 0) + 1;
        loser.winRate = ((loser.wins || 0) / loser.matchesPlayed * 100).toFixed(1) + '%';
    }
    setPlayers(updatedPlayers);
    saveToStorage("players", updatedPlayers);

    // 3. Remove from live matches
    handleDelete(matchId, 'liveMatches', setLiveMatches);

    toast({ title: "Match Ended", description: `${newResult.winner} won against ${newResult.loser}. Results saved.`});
    setTimeout(() => window.dispatchEvent(new Event('storage')), 0);
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

  const handleAddNotice = () => {
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill out both title and content for the notice.' });
        return;
    }

    const newNotice: Notice = {
        id: Date.now().toString(),
        title: newNoticeTitle,
        content: newNoticeContent,
        date: new Date().toISOString()
    };
    
    setNotices(prev => [newNotice, ...prev]);

    // Create notifications for all users
    const allUsers = getFromStorage<{name: string, email: string}[]>('users', []);
    allUsers.forEach(user => {
        const userNotifications = getFromStorage<Notification[]>(`notifications_${user.email}`, []);
        const newNotification: Notification = {
            id: Date.now().toString() + user.email,
            title: `New Club Notice: ${newNotice.title}`,
            description: newNotice.content.substring(0, 100) + (newNotice.content.length > 100 ? '...' : ''),
            read: false,
            date: new Date().toISOString()
        };
        saveToStorage(`notifications_${user.email}`, [newNotification, ...userNotifications]);
    });
    
    setTimeout(() => window.dispatchEvent(new Event('storage')), 0);

    setNewNoticeTitle("");
    setNewNoticeContent("");
    toast({ title: 'Notice Posted', description: 'All users have been notified.'});
  };

  const handleSaveChanges = () => {
    saveToStorage("players", players);
    saveToStorage("tournaments", tournaments);
    saveToStorage("liveMatches", liveMatches);
    saveToStorage("upcomingMatches", upcomingMatches);
    saveToStorage("siteSettings", siteSettings);
    saveToStorage("tournamentRules", rules);
    saveToStorage("notices", notices);
    setTimeout(() => window.dispatchEvent(new Event('storage')), 0);
    toast({
      title: "Saved!",
      description: "All changes have been saved to local storage.",
    });
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <ShieldCheck className="h-10 w-10 text-primary" />
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">Manage all application data from a centralized dashboard.</p>
        </div>
      </div>

      <Tabs defaultValue="players" className="w-full md:grid md:grid-cols-[200px_1fr] md:gap-6" orientation="vertical">
        <TabsList className="grid w-full grid-cols-2 md:flex md:flex-col md:items-stretch md:h-fit">
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="liveMatches">Live Matches</TabsTrigger>
          <TabsTrigger value="upcomingMatches">Upcoming</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="notices">Notices</TabsTrigger>
          <TabsTrigger value="siteSettings">Site</TabsTrigger>
        </TabsList>
        <div className="mt-4 md:mt-0">
            <TabsContent value="players">
            <Card>
                    <CardHeader>
                    <CardTitle>Player Data</CardTitle>
                    <CardDescription>Edit player details below. Changes are saved when you click the "Save All Changes" button.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="hidden md:grid grid-cols-5 gap-4 items-center font-semibold text-sm text-muted-foreground px-2">
                        <span className="col-span-2">Name</span>
                        <span>Highest Break</span>
                        <div className="col-span-2 grid grid-cols-3 gap-2">
                            <span>Wins</span>
                            <span>Losses</span>
                            <span className="text-right">Actions</span>
                        </div>
                    </div>
                    {players.map(player => (
                        <div key={player.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center p-2 rounded-lg bg-muted/50">
                             <div className="md:col-span-2 space-y-1">
                                <Label htmlFor={`player-name-${player.id}`} className="md:hidden">Name</Label>
                                <Input id={`player-name-${player.id}`} placeholder="Name" value={player.name} onChange={e => handlePlayerChange(player.id, 'name', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor={`player-break-${player.id}`} className="md:hidden">Highest Break</Label>
                                <Input id={`player-break-${player.id}`} placeholder="Highest Break" value={player.highestBreak} type="number" onChange={e => handlePlayerChange(player.id, 'highestBreak', parseInt(e.target.value))} />
                            </div>
                            <div className="md:col-span-2 grid grid-cols-3 gap-2 items-center">
                                <div className="space-y-1">
                                    <Label htmlFor={`player-wins-${player.id}`} className="md:hidden">Wins</Label>
                                    <Input id={`player-wins-${player.id}`} placeholder="Wins" value={player.wins ?? 0} type="number" onChange={e => handlePlayerChange(player.id, 'wins', parseInt(e.target.value))} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`player-losses-${player.id}`} className="md:hidden">Losses</Label>
                                    <Input id={`player-losses-${player.id}`} placeholder="Losses" value={player.losses ?? 0} type="number" onChange={e => handlePlayerChange(player.id, 'losses', parseInt(e.target.value))} />
                                </div>
                                <Button variant="destructive" size="icon" onClick={() => handleDelete(player.id, 'players', setPlayers)} className="justify-self-end"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="tournaments">
                <Card>
                    <CardHeader>
                    <CardTitle>Tournament Data</CardTitle>
                    <CardDescription>Edit tournament details below. Changes are saved when you click the "Save All Changes" button.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="hidden md:grid grid-cols-4 gap-4 items-center font-semibold text-sm text-muted-foreground px-2">
                        <span className="col-span-2">Name</span>
                        <span>Players</span>
                        <div className="col-span-1 grid grid-cols-2 gap-2">
                            <span>Status</span>
                            <span className="text-right">Actions</span>
                        </div>
                    </div>
                    {tournaments.map(tournament => (
                        <div key={tournament.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-2 rounded-lg bg-muted/50">
                        <div className="md:col-span-2 space-y-1">
                             <Label htmlFor={`tourney-name-${tournament.id}`} className="md:hidden">Name</Label>
                             <Input id={`tourney-name-${tournament.id}`} placeholder="Tournament Name" value={tournament.name} onChange={e => handleTournamentChange(tournament.id, 'name', e.target.value)} />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor={`tourney-players-${tournament.id}`} className="md:hidden">Players</Label>
                            <Input id={`tourney-players-${tournament.id}`} placeholder="Players" value={tournament.players} type="number" onChange={e => handleTournamentChange(tournament.id, 'players', parseInt(e.target.value))} />
                        </div>
                        <div className="md:col-span-1 grid grid-cols-2 gap-2 items-center">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor={`tourney-status-${tournament.id}`} className="md:hidden">Status</Label>
                                <Select value={tournament.status} onValueChange={(value: "Upcoming" | "In Progress" | "Finished") => handleTournamentChange(tournament.id, 'status', value)}>
                                    <SelectTrigger id={`tourney-status-${tournament.id}`}><SelectValue placeholder="Select status" /></SelectTrigger>
                                    <SelectContent>
                                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Finished">Finished</SelectItem>
                                    </SelectContent>
                                </Select>
                                {tournament.status === 'Finished' && (
                                    <Select value={tournament.winner} onValueChange={(value: string) => handleTournamentChange(tournament.id, 'winner', value)}>
                                        <SelectTrigger><SelectValue placeholder="Select winner" /></SelectTrigger>
                                        <SelectContent>
                                            {players.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <Button variant="destructive" size="icon" onClick={() => handleDelete(tournament.id, 'tournaments', setTournaments)} className="justify-self-end"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        </div>
                    ))}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="liveMatches">
            <Card>
                    <CardHeader>
                    <CardTitle>Live Match Data</CardTitle>
                    <CardDescription>Edit live match details below. Changes are saved when you click the "Save All Changes" button.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="hidden md:grid grid-cols-4 gap-4 items-center font-semibold text-sm text-muted-foreground px-2">
                            <span>Player 1</span>
                            <span>Player 2</span>
                            <span>Score (P1 - P2)</span>
                            <span className="text-right">Actions</span>
                        </div>
                        {liveMatches.map(match => (
                            <div key={match.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-2 rounded-lg bg-muted/50">
                                <div className="space-y-1">
                                    <Label htmlFor={`live-p1-${match.id}`} className="md:hidden">Player 1</Label>
                                    <Select value={match.player1} onValueChange={value => handleLiveMatchChange(match.id, 'player1', value)}>
                                        <SelectTrigger id={`live-p1-${match.id}`}><SelectValue placeholder="Select player" /></SelectTrigger>
                                        <SelectContent>
                                            {players.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`live-p2-${match.id}`} className="md:hidden">Player 2</Label>
                                    <Select value={match.player2} onValueChange={value => handleLiveMatchChange(match.id, 'player2', value)}>
                                        <SelectTrigger id={`live-p2-${match.id}`}><SelectValue placeholder="Select player" /></SelectTrigger>
                                        <SelectContent>
                                            {players.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor={`live-s1-${match.id}`} className="md:hidden">P1 Score</Label>
                                        <Input id={`live-s1-${match.id}`} value={match.score1} type="number" onChange={e => handleLiveMatchChange(match.id, 'score1', parseInt(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor={`live-s2-${match.id}`} className="md:hidden">P2 Score</Label>
                                        <Input id={`live-s2-${match.id}`} value={match.score2} type="number" onChange={e => handleLiveMatchChange(match.id, 'score2', parseInt(e.target.value))} />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" size="sm" onClick={() => handleEndLiveMatch(match.id)}>
                                        <CheckCircle className="mr-2 h-4 w-4"/>
                                        <span className="hidden md:inline">End Match</span>
                                    </Button>
                                    <Button variant="destructive" size="icon" onClick={() => handleDelete(match.id, 'liveMatches', setLiveMatches)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                        <Button onClick={handleAddLiveMatch} variant="outline" className="mt-4 w-full md:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Live Match
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="upcomingMatches">
            <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Match Data</CardTitle>
                        <CardDescription>Manage upcoming matches. Add new matches or edit existing ones.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="hidden md:grid grid-cols-5 gap-4 items-center font-semibold text-sm text-muted-foreground px-2">
                            <span>Player 1</span>
                            <span>Player 2</span>
                            <span>Tournament</span>
                            <span className="col-span-2 text-right">Actions</span>
                        </div>
                        {upcomingMatches.map(match => (
                            <div key={match.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center p-2 rounded-lg bg-muted/50">
                                <div className="space-y-1">
                                     <Label htmlFor={`upcoming-p1-${match.id}`} className="md:hidden">Player 1</Label>
                                     <Select value={match.player1} onValueChange={value => handleUpcomingMatchChange(match.id, 'player1', value)}>
                                        <SelectTrigger id={`upcoming-p1-${match.id}`}><SelectValue placeholder="Select player 1" /></SelectTrigger>
                                        <SelectContent>
                                            {players.map(p => <SelectItem key={`p1-${p.id}`} value={p.name}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`upcoming-p2-${match.id}`} className="md:hidden">Player 2</Label>
                                    <Select value={match.player2} onValueChange={value => handleUpcomingMatchChange(match.id, 'player2', value)}>
                                        <SelectTrigger id={`upcoming-p2-${match.id}`}><SelectValue placeholder="Select player 2" /></SelectTrigger>
                                        <SelectContent>
                                            {players.map(p => <SelectItem key={`p2-${p.id}`} value={p.name}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`upcoming-tourney-${match.id}`} className="md:hidden">Tournament</Label>
                                    <Select value={match.tournamentId?.toString()} onValueChange={value => handleUpcomingMatchChange(match.id, 'tournamentId', parseInt(value))}>
                                        <SelectTrigger id={`upcoming-tourney-${match.id}`}><SelectValue placeholder="Select tournament" /></SelectTrigger>
                                        <SelectContent>
                                            {tournaments.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div className="space-y-1 sm:col-span-2">
                                        <Label htmlFor={`upcoming-date-${match.id}`} className="md:hidden">Date & Time</Label>
                                        <div className="flex gap-2">
                                            <Input id={`upcoming-date-${match.id}`} type="date" value={match.date} onChange={e => handleUpcomingMatchChange(match.id, 'date', e.target.value)} />
                                            <Input type="time" value={match.time} onChange={e => handleUpcomingMatchChange(match.id, 'time', e.target.value)} />
                                        </div>
                                    </div>
                                    <Button variant="destructive" size="icon" onClick={() => handleDelete(match.id, 'upcomingMatches', setUpcomingMatches)} className="justify-self-end"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                        <Button onClick={handleAddUpcomingMatch} variant="outline" className="mt-4 w-full md:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Upcoming Match
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="rules">
            <Card>
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
            <TabsContent value="notices">
            <Card>
                    <CardHeader>
                    <CardTitle>Manage Notices</CardTitle>
                    <CardDescription>Post new notices for all users to see on the home page.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="space-y-2 p-4 border rounded-lg">
                        <h3 className="font-semibold">Post a New Notice</h3>
                        <div className="space-y-1">
                            <Label htmlFor="notice-title">Title</Label>
                            <Input id="notice-title" value={newNoticeTitle} onChange={e => setNewNoticeTitle(e.target.value)} placeholder="e.g. Holiday Opening Hours" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="notice-content">Content</Label>
                            <Textarea id="notice-content" value={newNoticeContent} onChange={e => setNewNoticeContent(e.target.value)} placeholder="Full details of the announcement..." />
                        </div>
                        <Button onClick={handleAddNotice} className="w-full md:w-auto"><Megaphone className="h-4 w-4 mr-2"/> Post Notice</Button>
                    </div>

                    <div className="space-y-2 pt-4">
                        <h3 className="font-semibold">Posted Notices</h3>
                        {notices.length > 0 ? (
                            notices.map(notice => (
                                <div key={notice.id} className="flex items-start justify-between p-2 rounded-lg bg-muted/50 gap-2">
                                    <div>
                                        <p className="font-bold">{notice.title}</p>
                                        <p className="text-sm text-muted-foreground">{notice.content}</p>
                                    </div>
                                    <Button variant="destructive" size="icon" onClick={() => handleDelete(notice.id, 'notices', setNotices)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No notices posted yet.</p>
                        )}
                    </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="siteSettings">
            <Card>
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
        </div>
      </Tabs>
      
      <Button onClick={handleSaveChanges} className="w-full md:w-auto md:col-start-2">Save All Changes</Button>
    </div>
  );
}

    