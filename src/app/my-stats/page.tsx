
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, BarChart, Percent, Activity, Edit, Save, PlusCircle, Swords, Check, X } from "lucide-react";
import { getFromStorage, saveToStorage } from "@/lib/storage";
import type { Player } from "@/app/players/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AddMatchDialog } from "@/components/add-match-dialog";
import type { Notification } from "@/types/notifications";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface Match {
  id: number;
  winner: string;
  loser: string;
  score: string;
  date: string;
  media?: string[];
  pendingScore?: {
    score1: number;
    score2: number;
    proposedBy: string;
  }
}

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
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [matchHistory, setMatchHistory] = useState<Match[]>([]);

  const { toast } = useToast();

  const fetchCurrentUserData = () => {
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

      const allMatches = getFromStorage<Match[]>('recentResults', []);
      const matchesForApproval = allMatches.filter(match => 
        (match.winner === userData.name || match.loser === userData.name) && 
        match.pendingScore && match.pendingScore.proposedBy !== userData.email
      );
      setPendingMatches(matchesForApproval);

      const playerMatches = allMatches.filter(
          (match) => match.winner === userData.name || match.loser === userData.name
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMatchHistory(playerMatches);
    }
  };

  useEffect(() => {
    fetchCurrentUserData();
    
    const handleStorageChange = () => {
        fetchCurrentUserData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
    
    const allMatches = getFromStorage<any[]>('recentResults', []);
    const newMatch = {
        id: allMatches.length > 0 ? Math.max(...allMatches.map(m => m.id)) + 1 : 1,
        winner: myScore > opponentScore ? currentUser.name : opponent.name,
        loser: myScore > opponentScore ? opponent.name : currentUser.name,
        score: `${myScore}-${opponentScore}`,
        date: new Date().toISOString(),
        media: [],
        pendingScore: {
            score1: myScore > opponentScore ? myScore : opponentScore,
            score2: myScore > opponentScore ? opponentScore : myScore,
            proposedBy: currentUser.email,
        }
    };
    
    saveToStorage('recentResults', [...allMatches, newMatch]);

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

  const handleApproval = (matchId: number, approve: boolean) => {
    if (!currentUser) return;
    const allMatches = getFromStorage<Match[]>('recentResults', []);
    const matchIndex = allMatches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;

    const match = allMatches[matchIndex];
    if (!match.pendingScore) return;

    const allUsers = getFromStorage<{name: string, email: string}[]>('users', []);
    const proposerUser = allUsers.find(u => u.email === match.pendingScore!.proposedBy);

    if (approve) {
        const { score1, score2, proposedBy } = match.pendingScore;
        
        let winnerName: string, loserName: string;
        
        const proposerIsPlayer1 = proposedBy === match.pendingScore.proposedBy;

        const players = getFromStorage<Player[]>('players', []);
        const currentUserPlayer = players.find(p => p.name === currentUser.name);
        const proposerPlayer = players.find(p => p.name === proposerUser?.name);
        
        if (!currentUserPlayer || !proposerPlayer) return;

        // Determine winner based on who proposed what.
        if (proposerPlayer.name === match.winner) { // Proposer reported themselves as winner initially
            winnerName = score1 > score2 ? proposerPlayer.name : currentUserPlayer.name;
            loserName = score1 > score2 ? currentUserPlayer.name : proposerPlayer.name;
        } else { // Proposer reported themselves as loser initially
            winnerName = score1 > score2 ? currentUserPlayer.name : proposerPlayer.name;
            loserName = score1 > score2 ? proposerPlayer.name : currentUserPlayer.name;
        }

        allMatches[matchIndex] = {
            ...match,
            score: `${score1}-${score2}`,
            winner: winnerName,
            loser: loserName,
            pendingScore: undefined
        };
        toast({ title: "Approved", description: "The match score has been updated." });

        // Update player stats
        
        const winnerIndex = players.findIndex(p => p.name === winnerName);
        const loserIndex = players.findIndex(p => p.name === loserName);

        if (winnerIndex > -1) {
            players[winnerIndex].wins = (players[winnerIndex].wins ?? 0) + 1;
            players[winnerIndex].matchesPlayed += 1;
            players[winnerIndex].winRate = ((players[winnerIndex].wins! / players[winnerIndex].matchesPlayed) * 100).toFixed(1) + '%';
        }
        if (loserIndex > -1) {
            players[loserIndex].losses = (players[loserIndex].losses ?? 0) + 1;
            players[loserIndex].matchesPlayed += 1;
            players[loserIndex].winRate = ((players[loserIndex].wins! / players[loserIndex].matchesPlayed) * 100).toFixed(1) + '%';
        }
        saveToStorage('players', players);

    } else {
        allMatches.splice(matchIndex, 1);
        toast({ title: "Rejected", description: "The score has been rejected and the match report removed." });
    }

    saveToStorage('recentResults', allMatches);
    setPendingMatches(prev => prev.filter(m => m.id !== matchId));

    if (proposerUser) {
        const proposerNotificationKey = `notifications_${proposerUser.email}`;
        const proposerNotifications = getFromStorage<Notification[]>(proposerNotificationKey, []);
        const newNotification: Notification = {
            id: Date.now().toString(),
            title: `Match Result ${approve ? 'Approved' : 'Rejected'}`,
            description: `${currentUser.name} has ${approve ? 'approved' : 'rejected'} the score for your recent match.`,
            read: false,
            date: new Date().toISOString()
        };
        saveToStorage(proposerNotificationKey, [newNotification, ...proposerNotifications]);
    }
    
    // Refresh all data
    fetchCurrentUserData();
    window.dispatchEvent(new Event('storage'));
  }

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
      
      {pendingMatches.length > 0 && (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Swords /> Pending Match Approvals</CardTitle>
                <CardDescription>Review match results reported by other players.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {pendingMatches.map(match => {
                        const proposerUser = getFromStorage<{name:string, email:string}[]>('users', []).find(u => u.email === match.pendingScore?.proposedBy)
                        const opponentName = proposerUser?.name ?? 'Opponent';

                        let myProposedScore, opponentProposedScore;
                        
                        // The proposer's score is always score1 in the pending object when created from their side
                        const proposerIsWinnerInReport = match.winner === opponentName;
                        
                        if(proposerIsWinnerInReport) { 
                           opponentProposedScore = match.pendingScore?.score1;
                           myProposedScore = match.pendingScore?.score2;
                        } else {
                           opponentProposedScore = match.pendingScore?.score2;
                           myProposedScore = match.pendingScore?.score1;
                        }


                        return (
                            <li key={match.id} className="p-4 rounded-lg bg-muted/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p>vs <strong>{opponentName}</strong></p>
                                        <p className="text-sm text-muted-foreground">Proposed Score: <span className="font-bold">{myProposedScore}-{opponentProposedScore}</span></p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleApproval(match.id, true)}><Check className="h-4 w-4 mr-2"/>Approve</Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleApproval(match.id, false)}><X className="h-4 w-4 mr-2"/>Reject</Button>
                                    </div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </CardContent>
         </Card>
      )}

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
          <CardTitle className="flex items-center gap-2">
            <Swords />
            My Match History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {matchHistory.length > 0 ? (
            <ul className="space-y-4">
              {matchHistory.map((match) => {
                const isWinner = match.winner === currentUser?.name;
                const opponentName = isWinner ? match.loser : match.winner;
                const opponent = getFromStorage<Player[]>('players', []).find(p => p.name === opponentName);

                return (
                  <li key={match.id}>
                    <Link href={`/match/${match.id}`} className="block p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Badge variant={isWinner ? "default" : "destructive"}>
                                {isWinner ? "WIN" : "LOSS"}
                                </Badge>
                                <div>
                                <span>vs <Link href={`/players/${opponent?.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>{opponentName}</Link></span>
                                <p className="text-sm text-muted-foreground">{new Date(match.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-lg">{match.score}</span>
                            </div>
                        </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">No match history found.</p>
          )}
        </CardContent>
      </Card>

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
