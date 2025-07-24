
"use client";

import { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, BarChart, Percent, Activity, Edit, Save, Swords, Check, X } from "lucide-react";
import { getFromStorage, saveToStorage } from "@/lib/storage";
import type { Player } from "@/app/players/page";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import type { Notification } from "@/types/notifications";

interface RecentMatch {
  id: number;
  winner: string;
  loser: string;
  score: string;
  date: string;
  pendingScore?: {
    score1: number;
    score2: number;
    proposedBy: string; // email of user who proposed
  }
}

export default function PlayerProfilePage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentUser, setCurrentUser] = useState<{name: string, email: string, isAdmin?: boolean} | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedAvatar, setEditedAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [editedWins, setEditedWins] = useState(0);
  const [editedLosses, setEditedLosses] = useState(0);
  const [editedAverageBreak, setEditedAverageBreak] = useState(0);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<RecentMatch | null>(null);
  const [newScore1, setNewScore1] = useState(0);
  const [newScore2, setNewScore2] = useState(0);
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  useEffect(() => {
    const userData = getFromStorage<{name: string, email: string, isAdmin?: boolean} | null>('userData', null);
    setCurrentUser(userData);

    if (id) {
      const players = getFromStorage<Player[]>('players', []);
      const foundPlayer = players.find(p => p.id === parseInt(id));
      setPlayer(foundPlayer || null);
       if (foundPlayer) {
        setEditedName(foundPlayer.name);
        setAvatarPreview(foundPlayer.avatar);
        const winRateValue = parseFloat(foundPlayer.winRate) || 0;
        const wins = foundPlayer.wins ?? Math.round(foundPlayer.matchesPlayed * (winRateValue / 100));
        const losses = foundPlayer.losses ?? foundPlayer.matchesPlayed - wins;
        const averageBreak = foundPlayer.averageBreak ?? Math.floor(foundPlayer.highestBreak / 2);
        setEditedWins(wins);
        setEditedLosses(losses);
        setEditedAverageBreak(averageBreak);
        
        const allRecentResults = getFromStorage<RecentMatch[]>('recentResults', []);
        const playerMatches = allRecentResults.filter(
            (match) => match.winner === foundPlayer.name || match.loser === foundPlayer.name
        );
        setRecentMatches(playerMatches);
      }
    }
  }, [id]);

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
    if (!player) return;

    const players = getFromStorage<Player[]>('players', []);
    const playerIndex = players.findIndex(p => p.id === player.id);

    if (playerIndex > -1) {
        const matchesPlayed = editedWins + editedLosses;
        const winRate = matchesPlayed > 0 ? ((editedWins / matchesPlayed) * 100).toFixed(1) + '%' : "0%";
        
        const updatedPlayer: Player = { 
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

        if(player.name.toLowerCase() === currentUser?.name?.toLowerCase()){
            const newUserData = { ...currentUser, name: editedName };
            saveToStorage('userData', newUserData);
        }
        
        setPlayer(updatedPlayer);
        window.dispatchEvent(new Event('storage'));
        toast({ title: "Success", description: "Player profile has been updated."});
        setIsEditing(false);
    }
  }

  const handleOpenScoreDialog = (match: RecentMatch) => {
    setSelectedMatch(match);
    const scores = match.score.split('-').map(s => parseInt(s.trim()));
    setNewScore1(scores[0]);
    setNewScore2(scores[1]);
    setIsScoreDialogOpen(true);
  }

  const handleScoreChangeRequest = () => {
    if (!selectedMatch || !currentUser) return;

    const allRecentResults = getFromStorage<RecentMatch[]>('recentResults', []);
    const matchIndex = allRecentResults.findIndex(m => m.id === selectedMatch.id);

    if (matchIndex > -1) {
      allRecentResults[matchIndex].pendingScore = {
        score1: newScore1,
        score2: newScore2,
        proposedBy: currentUser.email,
      };
      saveToStorage('recentResults', allRecentResults);
      setRecentMatches(prev => prev.map(m => m.id === selectedMatch.id ? allRecentResults[matchIndex] : m));
      
      const opponentName = selectedMatch.winner === player?.name ? selectedMatch.loser : selectedMatch.winner;
      const allUsers = getFromStorage<{name: string, email: string}[]>('users', []);
      const opponent = allUsers.find(u => u.name === opponentName);
      
      if (opponent) {
        const notifications = getFromStorage<Notification[]>(`notifications_${opponent.email}`, []);
        const newNotification: Notification = {
            id: Date.now().toString(),
            title: "Score Change Request",
            description: `${currentUser.name} has proposed a new score for your match. Please review on your profile.`,
            read: false,
            date: new Date().toISOString()
        };
        saveToStorage(`notifications_${opponent.email}`, [newNotification, ...notifications]);
        window.dispatchEvent(new Event('storage'));
      }

      toast({ title: "Request Sent", description: "Your score change request has been sent for approval." });
    }
    setIsScoreDialogOpen(false);
  }

  const handleApproval = (matchId: number, approve: boolean) => {
    if (!currentUser) return;
    const allRecentResults = getFromStorage<RecentMatch[]>('recentResults', []);
    const matchIndex = allRecentResults.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;

    const match = allRecentResults[matchIndex];
    if (!match.pendingScore) return;

    const proposerEmail = match.pendingScore.proposedBy;
    let proposerNotificationKey = `notifications_${proposerEmail}`;
    let proposerNotifications = getFromStorage<Notification[]>(proposerNotificationKey, []);

    if (approve) {
        const newWinner = match.pendingScore.score1 > match.pendingScore.score2 ? match.winner : match.loser;
        const newLoser = match.pendingScore.score1 > match.pendingScore.score2 ? match.loser : match.winner;
        
        allRecentResults[matchIndex] = {
            ...match,
            score: `${match.pendingScore.score1}-${match.pendingScore.score2}`,
            winner: newWinner,
            loser: newLoser,
            pendingScore: undefined
        };
        
        const proposerNotification: Notification = {
            id: Date.now().toString(),
            title: "Score Change Approved",
            description: `Your score change request for the match against ${currentUser.name} has been approved.`,
            read: false,
            date: new Date().toISOString()
        };
        saveToStorage(proposerNotificationKey, [proposerNotification, ...proposerNotifications]);
        toast({ title: "Approved", description: "The match score has been updated." });
    } else {
        allRecentResults[matchIndex].pendingScore = undefined;

        const proposerNotification: Notification = {
            id: Date.now().toString(),
            title: "Score Change Rejected",
            description: `Your score change request for the match against ${currentUser.name} has been rejected.`,
            read: false,
            date: new Date().toISOString()
        };
        saveToStorage(proposerNotificationKey, [proposerNotification, ...proposerNotifications]);
        toast({ title: "Rejected", description: "The score change request has been rejected." });
    }

    saveToStorage('recentResults', allRecentResults);
    setRecentMatches(prev => prev.map(m => m.id === matchId ? allRecentResults[matchIndex] : m));
    window.dispatchEvent(new Event('storage'));
  }


  if (!player) {
    return (
        <div className="text-center">
            <p className="text-lg">Player not found.</p>
            <Link href="/players" passHref>
                <Button variant="link">Back to Players</Button>
            </Link>
        </div>
    );
  }

  const winRateValue = parseFloat(player.winRate) || 0;
  const wins = player.wins ?? Math.round(player.matchesPlayed * (winRateValue / 100));
  const losses = player.losses ?? player.matchesPlayed - wins;
  const averageBreak = player.averageBreak ?? Math.floor(player.highestBreak / 2);

  const userStats = {
    name: player.name,
    initials: player.initials,
    matchesPlayed: player.matchesPlayed,
    wins: wins,
    losses: losses,
    winRate: player.winRate,
    highestBreak: player.highestBreak,
    averageBreak: averageBreak,
    tournamentsWon: player.skillLevel === 'Pro' ? 2 : (player.skillLevel === 'Intermediate' ? 1 : 0),
  };

  const isAdmin = !!currentUser?.isAdmin;
  const isOwnProfile = currentUser?.name.toLowerCase() === player.name.toLowerCase();

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={player.avatar || `https://placehold.co/80x80.png`} data-ai-hint="player portrait" alt={userStats.name} />
            <AvatarFallback>{userStats.initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-bold">{userStats.name}</h1>
            <p className="text-muted-foreground">Player Profile & Statistics</p>
          </div>
        </div>
         {(isAdmin || isOwnProfile) && (
            <Button onClick={() => setIsEditing(!isEditing)} variant="outline">
                {isEditing ? 'Cancel' : <><Edit className="mr-2 h-4 w-4" /> Edit Profile</>}
            </Button>
         )}
      </div>

       {isEditing && (isAdmin || isOwnProfile) && (
        <Card>
            <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update player name, avatar, and performance details here.</CardDescription>
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
            <p className="text-xs text-muted-foreground">Personal best</p>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords />
            Match History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentMatches.length > 0 ? (
            <ul className="space-y-4">
              {recentMatches.map((match) => {
                const isWinner = match.winner === player.name;
                const opponent = isWinner ? match.loser : match.winner;
                const isMyMatch = isOwnProfile;
                const pendingChange = match.pendingScore;
                const iAmProposer = pendingChange?.proposedBy === currentUser?.email;
                const iAmApprover = isMyMatch && pendingChange && !iAmProposer;

                return (
                  <li key={match.id} className="p-4 rounded-lg bg-muted/50">
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <Badge variant={isWinner ? "default" : "destructive"}>
                               {isWinner ? "WIN" : "LOSS"}
                            </Badge>
                            <div>
                               <span>vs {opponent}</span>
                               <p className="text-sm text-muted-foreground">{match.date}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="font-bold text-lg">{match.score}</span>
                            {isMyMatch && !pendingChange && (
                                <Button size="sm" variant="outline" onClick={() => handleOpenScoreDialog(match)}>
                                    <Edit className="h-4 w-4"/>
                                </Button>
                            )}
                         </div>
                     </div>
                     {pendingChange && (
                        <Card className="mt-4 bg-background/50">
                            <CardHeader>
                                <CardTitle className="text-base">Pending Score Change</CardTitle>
                                <CardDescription className="text-xs">
                                    {iAmProposer ? `Waiting for ${opponent} to approve.` : `${player.name} proposed a new score.`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                               <p>Proposed Score: <span className="font-bold">{pendingChange.score1} - {pendingChange.score2}</span></p>
                            </CardContent>
                           {iAmApprover && (
                             <CardFooter className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleApproval(match.id, true)}><Check className="h-4 w-4 mr-2"/>Approve</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleApproval(match.id, false)}><X className="h-4 w-4 mr-2"/>Reject</Button>
                             </CardFooter>
                           )}
                        </Card>
                     )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">No recent matches found.</p>
          )}
        </CardContent>
      </Card>

      <Link href="/players" passHref>
          <Button variant="outline" className="w-full md:w-auto">Back to Players List</Button>
      </Link>

      <Dialog open={isScoreDialogOpen} onOpenChange={setIsScoreDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Request Score Change</DialogTitle>
                <DialogDescription>
                   Propose a new score for your match against {selectedMatch?.winner === player?.name ? selectedMatch?.loser : selectedMatch?.winner}. The other player will need to approve this change.
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="score1">{player?.name} (You)</Label>
                    <Input id="score1" type="number" value={newScore1} onChange={e => setNewScore1(parseInt(e.target.value, 10) || 0)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="score2">{selectedMatch?.winner === player?.name ? selectedMatch?.loser : selectedMatch?.winner}</Label>
                    <Input id="score2" type="number" value={newScore2} onChange={e => setNewScore2(parseInt(e.target.value, 10) || 0)} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsScoreDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleScoreChangeRequest}>Send Request</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
