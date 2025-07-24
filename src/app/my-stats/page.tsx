
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, BarChart, Percent, Activity, Edit, Save, PlusCircle } from "lucide-react";
import { getFromStorage, saveToStorage } from "@/lib/storage";
import type { Player } from "@/app/players/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AddMatchDialog } from "@/components/add-match-dialog";
import type { Notification } from "@/types/notifications";

const initialStats = {
  name: "John Doe",
  initials: "JD",
  avatar: "",
  matchesPlayed: 32,
  wins: 20,
  losses: 12,
  winRate: "62.5%",
  highestBreak: 112,
  averageBreak: 45,
  tournamentsWon: 2,
};

export default function MyStatsPage() {
  const [userStats, setUserStats] = useState(initialStats);
  const [currentUser, setCurrentUser] = useState<{name: string, email: string} | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedAvatar, setEditedAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [editedWins, setEditedWins] = useState(0);
  const [editedLosses, setEditedLosses] = useState(0);
  const [editedAverageBreak, setEditedAverageBreak] = useState(0);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const userData = getFromStorage<{name: string, email: string} | null>('userData', null);
    if (userData) {
      setCurrentUser(userData);
      const players = getFromStorage<Player[]>('players', []);
      setAllPlayers(players);
      const player = players.find(p => p.name.toLowerCase() === userData.name.toLowerCase());

      let statsToSet;
      if (player) {
        const winRateValue = parseFloat(player.winRate) || 0;
        const wins = player.wins ?? Math.round(player.matchesPlayed * (winRateValue / 100));
        const losses = player.losses ?? player.matchesPlayed - wins;
        const averageBreak = player.averageBreak ?? Math.floor(player.highestBreak / 2);
        
        statsToSet = {
            name: player.name,
            initials: player.initials,
            avatar: player.avatar,
            matchesPlayed: player.matchesPlayed,
            wins: wins,
            losses: losses,
            winRate: player.winRate,
            highestBreak: player.highestBreak,
            averageBreak: averageBreak,
            tournamentsWon: player.skillLevel === 'Pro' ? 2 : (player.skillLevel === 'Intermediate' ? 1 : 0),
        };
      } else if (userData.name) {
         statsToSet = {...initialStats, name: userData.name, initials: userData.name.split(' ').map(n => n[0]).join('')};
      } else {
        statsToSet = initialStats;
      }
      setUserStats(statsToSet);
      setEditedName(statsToSet.name);
      setAvatarPreview(statsToSet.avatar);
      setEditedWins(statsToSet.wins);
      setEditedLosses(statsToSet.losses);
      setEditedAverageBreak(statsToSet.averageBreak);
    }
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setEditedAvatar(result);
        setAvatarPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    if (!currentUser) return;

    const players = getFromStorage<Player[]>('players', []);
    const playerIndex = players.findIndex(p => p.name.toLowerCase() === currentUser.name.toLowerCase());

    if (playerIndex > -1) {
        const matchesPlayed = editedWins + editedLosses;
        const winRate = matchesPlayed > 0 ? ((editedWins / matchesPlayed) * 100).toFixed(1) + '%' : "0%";

        const updatedPlayer = { 
            ...players[playerIndex], 
            name: editedName,
            initials: editedName.split(' ').map(n => n[0]).join(''),
            avatar: editedAvatar || players[playerIndex].avatar,
            wins: editedWins,
            losses: editedLosses,
            averageBreak: editedAverageBreak,
            matchesPlayed: matchesPlayed,
            winRate: winRate,
        };
        players[playerIndex] = updatedPlayer;
        saveToStorage('players', players);

        const newUserData = { ...currentUser, name: editedName };
        saveToStorage('userData', newUserData);
        setCurrentUser(newUserData);
        
        setUserStats(prev => ({
            ...prev,
            name: editedName,
            initials: editedName.split(' ').map(n => n[0]).join(''),
            avatar: editedAvatar || prev.avatar,
            wins: editedWins,
            losses: editedLosses,
            averageBreak: editedAverageBreak,
            matchesPlayed: matchesPlayed,
            winRate: winRate
        }));
        
        window.dispatchEvent(new Event('storage'));
    }

    toast({ title: "Success", description: "Your profile has been updated."});
    setIsEditing(false);
  }
  
  const handleAddMatch = (opponentId: number, myScore: number, opponentScore: number) => {
    if (!currentUser) return;

    const opponent = allPlayers.find(p => p.id === opponentId);
    if (!opponent) {
        toast({ variant: "destructive", title: "Error", description: "Opponent not found." });
        return;
    }
    
    const allRecentResults = getFromStorage<any[]>('recentResults', []);
    const newMatch = {
        id: allRecentResults.length > 0 ? Math.max(...allRecentResults.map(m => m.id)) + 1 : 1,
        winner: myScore > opponentScore ? currentUser.name : opponent.name,
        loser: myScore > opponentScore ? opponent.name : currentUser.name,
        score: `${myScore}-${opponentScore}`,
        date: new Date().toISOString(),
        pendingScore: {
            score1: myScore,
            score2: opponentScore,
            proposedBy: currentUser.email,
        }
    };
    
    saveToStorage('recentResults', [...allRecentResults, newMatch]);

    const allUsers = getFromStorage<{name: string, email: string}[]>('users', []);
    const opponentUser = allUsers.find(u => u.name === opponent.name);
    
    if (opponentUser) {
        const notifications = getFromStorage<Notification[]>(`notifications_${opponentUser.email}`, []);
        const newNotification: Notification = {
            id: Date.now().toString(),
            title: "New Match Reported",
            description: `${currentUser.name} has reported a new match with you. Please review and approve the score on your profile page.`,
            read: false,
            date: new Date().toISOString()
        };
        saveToStorage(`notifications_${opponentUser.email}`, [newNotification, ...notifications]);
        window.dispatchEvent(new Event('storage'));
    }

    toast({ title: "Match Reported", description: "Your new match has been reported and is awaiting approval from your opponent."});
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
            <AvatarImage src={userStats.avatar || `https://placehold.co/80x80.png`} data-ai-hint="player portrait" alt={userStats.name} />
            <AvatarFallback>{userStats.initials}</AvatarFallback>
            </Avatar>
            <div>
            <h1 className="text-4xl font-bold">{userStats.name}</h1>
            <p className="text-muted-foreground">Your personal snooker statistics.</p>
            </div>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => setIsAddMatchOpen(true)} variant="default">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Match
            </Button>
            <Button onClick={() => setIsEditing(!isEditing)} variant="outline">
                {isEditing ? 'Cancel' : <><Edit className="mr-2 h-4 w-4" /> Edit Profile</>}
            </Button>
        </div>
      </div>

       {isEditing && (
        <Card>
            <CardHeader>
                <CardTitle>Edit Your Profile</CardTitle>
                <CardDescription>Update your name, avatar, and performance details here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="avatar">Avatar</Label>
                     <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={avatarPreview || `https://placehold.co/80x80.png`} data-ai-hint="player portrait" alt={editedName} />
                            <AvatarFallback>{editedName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="wins">Wins</Label>
                        <Input id="wins" type="number" value={editedWins} onChange={(e) => setEditedWins(parseInt(e.target.value, 10) || 0)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="losses">Losses</Label>
                        <Input id="losses" type="number" value={editedLosses} onChange={(e) => setEditedLosses(parseInt(e.target.value, 10) || 0)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="averageBreak">Average Break</Label>
                        <Input id="averageBreak" type="number" value={editedAverageBreak} onChange={(e) => setEditedAverageBreak(parseInt(e.target.value, 10) || 0)} />
                    </div>
                </div>
                <Button onClick={handleSaveChanges}>
                    <Save className="mr-2 h-4 w-4"/>
                    Save Changes
                </Button>
            </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matches Played</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.matchesPlayed}</div>
            <p className="text-xs text-muted-foreground">{userStats.wins} Wins, {userStats.losses} Losses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.winRate}</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Break</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.highestBreak}</div>
            <p className="text-xs text-muted-foreground">Your personal best</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tournaments Won</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.tournamentsWon}</div>
            <p className="text-xs text-muted-foreground">Major victories</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
           <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <span className="font-medium">Wins</span>
                <span className="text-2xl font-bold text-green-400">{userStats.wins}</span>
           </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <span className="font-medium">Losses</span>
                <span className="text-2xl font-bold text-red-400">{userStats.losses}</span>
           </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <span className="font-medium">Average Break</span>
                <span className="text-2xl font-bold">{userStats.averageBreak}</span>
           </div>
        </CardContent>
      </Card>
      {currentUser && (
        <AddMatchDialog 
            open={isAddMatchOpen} 
            onOpenChange={setIsAddMatchOpen} 
            onAddMatch={handleAddMatch}
            players={allPlayers.filter(p => p.name !== currentUser?.name)}
            currentUser={currentUser}
        />
      )}
    </div>
  );
}
