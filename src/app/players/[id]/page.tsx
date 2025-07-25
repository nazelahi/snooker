

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
import type { Player } from "@/app/players/page";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { DialogFooter, ResponsiveDialog } from "@/components/ui/dialog";
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
import { supabase } from "@/lib/supabase";
import { Match } from "@/types/matches";


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

  const fetchPlayerData = useCallback(async (playerId: string) => {
    const { data: playerData, error: playerError } = await supabase.from('players').select('*').eq('id', parseInt(playerId)).single();
    
    if (playerError || !playerData) {
      setPlayer(null);
      return;
    }
    setPlayer(playerData);

    setEditedName(playerData.name);
    setAvatarPreview(playerData.avatar);
    setEditedWins(playerData.wins ?? 0);
    setEditedLosses(playerData.losses ?? 0);
    setEditedAverageBreak(playerData.average_break ?? 0);
    setEditedHighestBreak(playerData.highest_break);
    
    const { data: matchesData } = await supabase
      .from('matches')
      .select('*')
      .or(`winner.eq.${playerData.name},loser.eq.${playerData.name}`)
      .order('date', { ascending: false });
    
    if (matchesData) {
      setMatchHistory(matchesData as Match[]);
    }
  }, []);


  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;
      setCurrentUser(user ? { name: user.user_metadata.full_name || user.email!, email: user.email!, isAdmin: user.email === 'admin@gmail.com' } : null);
      if (id) {
        await fetchPlayerData(id);
      }
    });

    async function initialize() {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user ? { name: user.user_metadata.full_name || user.email!, email: user.email!, isAdmin: user.email === 'admin@gmail.com' } : null);
        if (id) {
          await fetchPlayerData(id);
        }
    }
    initialize();
    
    return () => {
      authListener.subscription.unsubscribe();
    };
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

  const handleSaveChanges = async () => {
    if (!player) return;

    const matchesPlayed = editedWins + editedLosses;
    const winRate = matchesPlayed > 0 ? ((editedWins / matchesPlayed) * 100).toFixed(1) + '%' : "0%";
    
    const updatedPlayer: Omit<Player, 'id' | 'created_at'> = { 
      name: editedName,
      initials: editedName.split(' ').map(n => n[0]).join(''),
      avatar: editedAvatar || player.avatar,
      wins: editedWins,
      losses: editedLosses,
      average_break: editedAverageBreak,
      highest_break: editedHighestBreak,
      matches_played: matchesPlayed,
      win_rate: winRate,
      skill_level: player.skill_level, // Keep existing
    };

    const { data, error } = await supabase.from('players').update(updatedPlayer).eq('id', player.id).select().single();
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return;
    }

    if (data) {
        setPlayer(data);
    }
    
    if(player.name.toLowerCase() === currentUser?.name?.toLowerCase() && editedName !== currentUser.name){
        await supabase.auth.updateUser({ data: { full_name: editedName }});
    }
    
    toast({ title: "Success", description: "Player profile has been updated."});
    setIsEditing(false);
  }

  const handleOpenScoreDialog = (match: Match) => {
    setSelectedMatch(match);
    const scores = match.score.split('-').map(s => parseInt(s.trim()));
    setNewScore1(scores[0]);
    setNewScore2(scores[1]);
    setIsScoreDialogOpen(true);
  }

  const handleScoreChangeRequest = async () => {
    if (!selectedMatch || !currentUser) return;

    const { error } = await supabase.from('matches').update({
      pending_score: {
        score1: newScore1,
        score2: newScore2,
        proposed_by: currentUser.email,
      }
    }).eq('id', selectedMatch.id);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not send request.' });
      return;
    }
      
    const opponentName = selectedMatch.winner === player?.name ? selectedMatch.loser : selectedMatch.winner;
    
    await supabase.from('notifications').insert([{
        user_name: opponentName,
        title: "Score Change Request",
        description: `${currentUser.name} has proposed a new score for your match. Please review on your profile.`,
        read: false,
        date: new Date().toISOString()
    }]);
    
    toast({ title: "Request Sent", description: "Your score change request has been sent for approval." });
    setIsScoreDialogOpen(false);
    fetchPlayerData(id);
  }

  const handleApproval = async (matchId: number, approve: boolean) => {
    if (!currentUser || !player) return;

    const match = matchHistory.find(m => m.id === matchId);
    if (!match || !match.pending_score) return;
    
    const proposerIsWinner = match.winner.toLowerCase() === match.pending_score.proposed_by.toLowerCase();
    const opponentName = proposerIsWinner ? match.loser : match.winner;

    if (approve) {
        const { score1, score2 } = match.pending_score;
        const {data: allPlayers} = await supabase.from('players').select('*');
        if (!allPlayers) return;

        const proposerPlayer = allPlayers.find(p => p.name === opponentName);
        const approverPlayer = player;
        
        if (!proposerPlayer || !approverPlayer) return;

        // Decrement old stats
        const oldWinner = allPlayers.find(p => p.name === match.winner);
        const oldLoser = allPlayers.find(p => p.name === match.loser);
        if(oldWinner) await supabase.from('players').update({ wins: (oldWinner.wins ?? 1) - 1 }).eq('id', oldWinner.id);
        if(oldLoser) await supabase.from('players').update({ losses: (oldLoser.losses ?? 1) - 1 }).eq('id', oldLoser.id);

        // Determine new winner/loser
        const newWinnerIsProposer = score1 > score2;
        const winnerName = newWinnerIsProposer ? opponentName : player.name;
        const loserName = newWinnerIsProposer ? player.name : opponentName;

        // Increment new stats
        const newWinner = newWinnerIsProposer ? proposerPlayer : approverPlayer;
        const newLoser = newWinnerIsProposer ? approverPlayer : proposerPlayer;
        await supabase.from('players').update({ wins: (newWinner.wins ?? 0) + 1 }).eq('id', newWinner.id);
        await supabase.from('players').update({ losses: (newLoser.losses ?? 0) + 1 }).eq('id', newLoser.id);

        // Update match
        await supabase.from('matches').update({
            score: `${score1}-${score2}`,
            winner: winnerName,
            loser: loserName,
            pending_score: null
        }).eq('id', match.id);

        toast({ title: "Approved", description: "The match score has been updated." });
    } else {
        await supabase.from('matches').update({ pending_score: null }).eq('id', match.id);
        toast({ title: "Rejected", description: "The score change request has been rejected." });
    }
    
    await supabase.from('notifications').insert([{
      user_name: opponentName,
      title: `Score Change ${approve ? 'Approved' : 'Rejected'}`,
      description: `${currentUser.name} has ${approve ? 'approved' : 'rejected'} the score for your recent match.`,
      read: false,
      date: new Date().toISOString()
    }]);
    
    fetchPlayerData(id);
  }

  const handleAdminDeleteMatch = async (matchId: number) => {
    if (!isAdmin) return;

    const matchToDelete = matchHistory.find(m => m.id === matchId);
    if (!matchToDelete) return;

    // Update player stats
    const { data: players } = await supabase.from('players').select('*').in('name', [matchToDelete.winner, matchToDelete.loser]);
    if (players) {
        const winner = players.find(p => p.name === matchToDelete.winner);
        const loser = players.find(p => p.name === matchToDelete.loser);

        if (winner) await supabase.from('players').update({ wins: (winner.wins ?? 1) - 1, matches_played: winner.matches_played - 1 }).eq('id', winner.id);
        if (loser) await supabase.from('players').update({ losses: (loser.losses ?? 1) - 1, matches_played: loser.matches_played - 1 }).eq('id', loser.id);
    }
    
    // Remove match
    await supabase.from('matches').delete().eq('id', matchId);

    toast({ title: 'Match Deleted', description: 'The match has been removed and stats updated.'});
    fetchPlayerData(id);
  }


  if (!player) {
    return (
        <div className="text-center">
            <p className="text-lg">Loading player data...</p>
        </div>
    );
  }

  const userStats = {
    name: player.name,
    initials: player.initials,
    matchesPlayed: player.matches_played,
    wins: player.wins ?? 0,
    losses: player.losses ?? 0,
    winRate: player.win_rate,
    highestBreak: player.highest_break,
    averageBreak: player.average_break ?? 0,
    tournamentsWon: player.skill_level === 'Pro' ? 2 : (player.skill_level === 'Intermediate' ? 1 : 0),
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
                
                const isMyMatch = isOwnProfile;
                const pendingChange = match.pending_score;
                const iAmProposer = pendingChange?.proposed_by === currentUser?.email;

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
                                    {iAmProposer ? `Waiting for ${opponentName} to approve.` : `A new score was proposed.`}
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
