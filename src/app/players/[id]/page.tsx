
"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Trophy, BarChart, Percent, Activity, Edit, Save, Swords, Check, X, Trash2 } from "lucide-react";
import { getFromStorage, saveToStorage } from "@/lib/storage";
import type { Player } from "@/app/players/page";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter, ResponsiveDialog } from "@/components/ui/dialog";
import type { Notification } from "@/types/notifications";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
    proposedBy: string; // email of user who proposed
  };
  tournamentId?: number;
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
  const [editedHighestBreak, setEditedHighestBreak] = useState(0);
  const [matchHistory, setMatchHistory] = useState<Match[]>([]);
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [newScore1, setNewScore1] = useState(0);
  const [newScore2, setNewScore2] = useState(0);
  const [matchesToShow, setMatchesToShow] = useState(5);
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const fetchPlayerData = useCallback((playerId: string) => {
    const players = getFromStorage<Player[]>('players', []);
    const foundPlayer = players.find(p => p.id === parseInt(playerId));
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
      setEditedHighestBreak(foundPlayer.highestBreak);
      
      const allMatches = getFromStorage<Match[]>('recentResults', []);
      const playerMatches = allMatches.filter(
          (match) => match.winner === foundPlayer.name || match.loser === foundPlayer.name
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMatchHistory(playerMatches);
    }
  }, []);


  useEffect(() => {
    const userData = getFromStorage<{name: string, email: string, isAdmin?: boolean} | null>('userData', null);
    setCurrentUser(userData);

    if (id) {
      fetchPlayerData(id);
    }
    
    const handleStorageChange = () => {
        if(id) {
          fetchPlayerData(id);
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [id, fetchPlayerData]);

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
            highestBreak: editedHighestBreak,
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

  const handleOpenScoreDialog = (match: Match) => {
    setSelectedMatch(match);
    const scores = match.score.split('-').map(s => parseInt(s.trim()));
    setNewScore1(scores[0]);
    setNewScore2(scores[1]);
    setIsScoreDialogOpen(true);
  }

  const handleScoreChangeRequest = () => {
    if (!selectedMatch || !currentUser) return;

    const allMatches = getFromStorage<Match[]>('recentResults', []);
    const matchIndex = allMatches.findIndex(m => m.id === selectedMatch.id);

    if (matchIndex > -1) {
      allMatches[matchIndex].pendingScore = {
        score1: newScore1,
        score2: newScore2,
        proposedBy: currentUser.email,
      };
      saveToStorage('recentResults', allMatches);
      
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
      }
      
      window.dispatchEvent(new Event('storage'));
      toast({ title: "Request Sent", description: "Your score change request has been sent for approval." });
    }
    setIsScoreDialogOpen(false);
  }

  const handleApproval = (matchId: number, approve: boolean) => {
    if (!currentUser || !player) return;

    const allMatches = getFromStorage<Match[]>('recentResults', []);
    const matchIndex = allMatches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;

    const match = allMatches[matchIndex];
    if (!match.pendingScore) return;

    const allUsers = getFromStorage<{name: string, email: string}[]>('users', []);
    const proposerUser = allUsers.find(u => u.email === match.pendingScore!.proposedBy);

    if (!proposerUser) return;
    
    if (approve) {
        const { score1, score2 } = match.pendingScore;
        
        const players = getFromStorage<Player[]>('players', []);
        const proposerPlayerIndex = players.findIndex(p => p.name === proposerUser.name);
        const approverPlayerIndex = players.findIndex(p => p.name === player.name);

        if (proposerPlayerIndex === -1 || approverPlayerIndex === -1) return;

        // Decrement old stats
        const oldWinnerWasProposer = match.winner === proposerUser.name;
        const oldWinnerIndex = oldWinnerWasProposer ? proposerPlayerIndex : approverPlayerIndex;
        const oldLoserIndex = oldWinnerWasProposer ? approverPlayerIndex : proposerPlayerIndex;
        
        players[oldWinnerIndex].wins = (players[oldWinnerIndex].wins ?? 1) - 1;
        players[oldLoserIndex].losses = (players[oldLoserIndex].losses ?? 1) -1;

        // Determine new winner/loser
        const newWinnerIsProposer = score1 > score2;
        const winnerName = newWinnerIsProposer ? proposerUser.name : player.name;
        const loserName = newWinnerIsProposer ? player.name : proposerUser.name;

        // Increment new stats
        const newWinnerIndex = newWinnerIsProposer ? proposerPlayerIndex : approverPlayerIndex;
        const newLoserIndex = newWinnerIsProposer ? approverPlayerIndex : proposerPlayerIndex;

        players[newWinnerIndex].wins = (players[newWinnerIndex].wins ?? 0) + 1;
        players[newLoserIndex].losses = (players[newLoserIndex].losses ?? 0) + 1;
        
        // Recalculate win rates
        [newWinnerIndex, newLoserIndex].forEach(idx => {
            const p = players[idx];
            p.winRate = p.matchesPlayed > 0 ? (((p.wins ?? 0) / p.matchesPlayed) * 100).toFixed(1) + '%' : '0%';
        });
        
        saveToStorage('players', players);

        allMatches[matchIndex] = {
            ...match,
            score: `${score1}-${score2}`,
            winner: winnerName,
            loser: loserName,
            pendingScore: undefined
        };

        toast({ title: "Approved", description: "The match score has been updated." });

    } else {
        allMatches[matchIndex].pendingScore = undefined;
        toast({ title: "Rejected", description: "The score change request has been rejected." });
    }

    saveToStorage('recentResults', allMatches);
    
    const proposerNotificationKey = `notifications_${proposerUser.email}`;
    const proposerNotifications = getFromStorage<Notification[]>(proposerNotificationKey, []);
    const newNotification: Notification = {
        id: Date.now().toString(),
        title: `Score Change ${approve ? 'Approved' : 'Rejected'}`,
        description: `${currentUser.name} has ${approve ? 'approved' : 'rejected'} the score for your recent match.`,
        read: false,
        date: new Date().toISOString()
    };
    saveToStorage(proposerNotificationKey, [newNotification, ...proposerNotifications]);
    
    window.dispatchEvent(new Event('storage'));
  }

  const handleAdminDeleteMatch = (matchId: number) => {
    if (!isAdmin) return;

    let allMatches = getFromStorage<Match[]>('recentResults', []);
    const matchToDelete = allMatches.find(m => m.id === matchId);
    if (!matchToDelete) return;

    // Update player stats
    let players = getFromStorage<Player[]>('players', []);
    const winnerIndex = players.findIndex(p => p.name === matchToDelete.winner);
    const loserIndex = players.findIndex(p => p.name === matchToDelete.loser);

    if (winnerIndex > -1) {
        players[winnerIndex].wins = (players[winnerIndex].wins ?? 1) - 1;
        players[winnerIndex].matchesPlayed -= 1;
        players[winnerIndex].winRate = players[winnerIndex].matchesPlayed > 0 ? (((players[winnerIndex].wins ?? 0) / players[winnerIndex].matchesPlayed) * 100).toFixed(1) + '%' : '0%';
    }
    if (loserIndex > -1) {
        players[loserIndex].losses = (players[loserIndex].losses ?? 1) - 1;
        players[loserIndex].matchesPlayed -= 1;
        players[loserIndex].winRate = players[loserIndex].matchesPlayed > 0 ? (((players[loserIndex].wins ?? 0) / players[loserIndex].matchesPlayed) * 100).toFixed(1) + '%' : '0%';
    }
    saveToStorage('players', players);

    // Remove match
    allMatches = allMatches.filter(m => m.id !== matchId);
    saveToStorage('recentResults', allMatches);

    toast({ title: 'Match Deleted', description: 'The match has been removed and stats updated.'});
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
       <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 md:h-20 md:w-20">
            <AvatarImage src={player.avatar || `https://placehold.co/80x80.png`} data-ai-hint="player portrait" alt={userStats.name} />
            <AvatarFallback>{userStats.initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold">{userStats.name}</h1>
            <p className="text-muted-foreground hidden md:block">Player Profile & Statistics</p>
          </div>
        </div>
         {(isAdmin || isOwnProfile) && (
            <Button onClick={() => setIsEditing(!isEditing)} variant="outline" className="w-full md:w-auto hidden md:flex">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {isAdmin && (
                        <div className="space-y-2">
                            <Label htmlFor="highestBreak">Highest Break</Label>
                            <Input id="highestBreak" type="number" value={editedHighestBreak} onChange={(e) => setEditedHighestBreak(parseInt(e.target.value, 10) || 0)} />
                        </div>
                    )}
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
          {matchHistory.length > 0 ? (
            <ul className="space-y-4">
              {matchHistory.slice(0, matchesToShow).map((match) => {
                const isWinner = match.winner === player.name;
                const opponentName = isWinner ? match.loser : match.winner;
                const opponent = getFromStorage<Player[]>('players', []).find(p => p.name === opponentName);

                const isMyMatch = isOwnProfile;
                const pendingChange = match.pendingScore;
                const iAmProposer = pendingChange?.proposedBy === currentUser?.email;
                
                const allUsers = getFromStorage<{name: string, email: string}[]>('users', []);
                const proposerUser = allUsers.find(u => u.email === pendingChange?.proposedBy);

                const iAmApprover = isMyMatch && pendingChange && !iAmProposer;

                return (
                  <li key={match.id} className="p-4 rounded-lg bg-muted/50">
                     <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                         <div className="flex items-center gap-4">
                            <Badge variant={isWinner ? "default" : "destructive"}>
                            {isWinner ? "WIN" : "LOSS"}
                            </Badge>
                            <Link href={`/match/${match.id}`} className="block">
                              <div>
                                <span>vs <span className="hover:underline">{opponentName}</span></span>
                                <p className="text-sm text-muted-foreground">{new Date(match.date).toLocaleDateString()}</p>
                              </div>
                            </Link>
                         </div>
                         <div className="flex items-center gap-2 self-end md:self-center">
                            <span className="font-bold text-lg">{match.score}</span>
                            {(isMyMatch || isAdmin) && !pendingChange && (
                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenScoreDialog(match); }}>
                                    <Edit className="h-4 w-4"/>
                                </Button>
                            )}
                            {isAdmin && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="icon" variant="destructive" className="h-8 w-8" title="Delete Match" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the match
                                            and recalculate player stats.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAdminDeleteMatch(match.id); }}>Continue</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                         </div>
                     </div>
                     {pendingChange && (
                        <Card className="mt-4 bg-background/50">
                            <CardHeader>
                                <CardTitle className="text-base">Pending Score Change</CardTitle>

                                <CardDescription className="text-xs">
                                    {iAmProposer ? `Waiting for ${opponentName} to approve.` : `${proposerUser?.name || 'Another player'} proposed a new score.`}
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
            <p className="text-muted-foreground text-center py-4">No match history found.</p>
          )}
        </CardContent>
        {matchHistory.length > matchesToShow && (
          <CardFooter>
            <Button onClick={() => setMatchesToShow(matchesToShow + 5)} variant="secondary" className="w-full">
              View More
            </Button>
          </CardFooter>
        )}
      </Card>
      
       {(isAdmin || isOwnProfile) && (
          <Button
            onClick={() => setIsEditing(!isEditing)}
            className="md:hidden fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
            size="icon"
          >
            {isEditing ? <Save className="h-6 w-6" /> : <Edit className="h-6 w-6" />}
            <span className="sr-only">{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
          </Button>
       )}

      <Link href="/players" passHref>
          <Button variant="outline" className="w-full md:w-auto">Back to Players List</Button>
      </Link>

      <ResponsiveDialog 
        open={isScoreDialogOpen} 
        onOpenChange={setIsScoreDialogOpen}
        title="Request Score Change"
        description={`Propose a new score for your match against ${selectedMatch?.winner === player?.name ? selectedMatch?.loser : selectedMatch?.winner}. The other player will need to approve this change.`}
      >
        <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="score1">{currentUser?.name.toLowerCase() === selectedMatch?.winner.toLowerCase() || currentUser?.name.toLowerCase() === selectedMatch?.loser.toLowerCase() ? (player?.name === selectedMatch.winner ? selectedMatch.winner : selectedMatch.loser) : player?.name}</Label>
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
      </ResponsiveDialog>
    </div>
  );
}
