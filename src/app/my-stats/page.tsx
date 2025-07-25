
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
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
import type { Player } from "@/app/players/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AddMatchDialog } from "@/components/add-match-dialog";
import type { Notification } from "@/types/notifications";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Match } from "@/types/matches";

const initialStats = {
  name: "John Doe",
  initials: "JD",
  avatar: "",
  matchesPlayed: 0,
  wins: 0,
  losses: 0,
  winRate: "0%",
  highestBreak: 0,
  averageBreak: 0,
  tournamentsWon: 0,
};

export default function MyStatsPage() {
  const [userStats, setUserStats] = useState(initialStats);
  const [currentUser, setCurrentUser] = useState<{name: string, email: string, avatar?: string} | null>(null);
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
  const router = useRouter();

  const { toast } = useToast();

  const fetchCurrentUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: playersData } = await supabase.from('players').select('*');
    if (playersData) {
      setAllPlayers(playersData);
      const player = playersData.find(p => p.name.toLowerCase() === (user.user_metadata.full_name || "").toLowerCase());

      const currentUserData = { name: user.user_metadata.full_name || user.email!, email: user.email!, avatar: player?.avatar };
      setCurrentUser(currentUserData);
      
      let statsToSet;
      if (player) {
        statsToSet = {
            name: player.name,
            initials: player.initials,
            avatar: player.avatar,
            matchesPlayed: player.matches_played,
            wins: player.wins ?? 0,
            losses: player.losses ?? 0,
            winRate: player.win_rate,
            highestBreak: player.highest_break,
            averageBreak: player.average_break ?? 0,
            tournamentsWon: player.skill_level === 'Pro' ? 2 : (player.skill_level === 'Intermediate' ? 1 : 0),
        };
      } else {
         statsToSet = {...initialStats, name: currentUserData.name, initials: currentUserData.name.split(' ').map(n => n[0]).join('')};
      }
      setUserStats(statsToSet);
      setEditedName(statsToSet.name);
      setAvatarPreview(statsToSet.avatar);
      setEditedWins(statsToSet.wins);
      setEditedLosses(statsToSet.losses);
      setEditedAverageBreak(statsToSet.averageBreak);

      const { data: allMatches } = await supabase.from('matches').select('*');
      if (allMatches) {
        const matchesForApproval = allMatches.filter(match => 
          (match.winner === currentUserData.name || match.loser === currentUserData.name) && 
          match.pending_score && match.pending_score.proposed_by !== currentUserData.email
        );
        setPendingMatches(matchesForApproval as Match[]);

        const playerMatches = allMatches.filter(
            (match) => match.winner === currentUserData.name || match.loser === currentUserData.name
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setMatchHistory(playerMatches as Match[]);
      }
    }
  };

  useEffect(() => {
    fetchCurrentUserData();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'SIGNED_OUT') {
        fetchCurrentUserData();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
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

  const handleSaveChanges = async () => {
    if (!currentUser) return;
    
    const currentPlayer = allPlayers.find(p => p.name.toLowerCase() === currentUser.name.toLowerCase());
    if (!currentPlayer) return;

    const matchesPlayed = editedWins + editedLosses;
    const winRate = matchesPlayed > 0 ? ((editedWins / matchesPlayed) * 100).toFixed(1) + '%' : "0%";

    const updatedPlayerData = { 
      name: editedName,
      initials: editedName.split(' ').map(n => n[0]).join(''),
      avatar: editedAvatar || currentPlayer.avatar,
      wins: editedWins,
      losses: editedLosses,
      average_break: editedAverageBreak,
      matches_played: matchesPlayed,
      win_rate: winRate,
    };
    
    const { error } = await supabase.from('players').update(updatedPlayerData).eq('id', currentPlayer.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return;
    }
    
    // Also update user metadata if name changed
    if (editedName !== currentUser.name) {
      await supabase.auth.updateUser({ data: { full_name: editedName } });
    }

    toast({ title: "Success", description: "Your profile has been updated."});
    setIsEditing(false);
    fetchCurrentUserData(); // Refresh all data
  }
  
  const handleAddMatch = async (opponentId: number, myScore: number, opponentScore: number) => {
    if (!currentUser) return;

    const opponent = allPlayers.find(p => p.id === opponentId);
    if (!opponent) {
        toast({ variant: "destructive", title: "Error", description: "Opponent not found." });
        return;
    }
    
    const newMatch = {
        winner: myScore > opponentScore ? currentUser.name : opponent.name,
        loser: myScore > opponentScore ? opponent.name : currentUser.name,
        score: `${myScore}-${opponentScore}`,
        date: new Date().toISOString(),
        media: [],
        comments: [],
        pending_score: {
            score1: myScore > opponentScore ? myScore : opponentScore,
            score2: myScore > opponentScore ? opponentScore : myScore,
            proposed_by: currentUser.email,
        }
    };

    const { error } = await supabase.from('matches').insert([newMatch]);

    if (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Could not report match.' });
       return;
    }
    
    await supabase.from('notifications').insert([{
        user_name: opponent.name,
        title: "New Match Reported",
        description: `${currentUser.name} has reported a new match with you. Please review and approve the score on your profile page.`,
        read: false,
        date: new Date().toISOString()
    }]);

    toast({ title: "Match Reported", description: "Your new match has been reported and is awaiting approval from your opponent."});
    fetchCurrentUserData();
  };

  const handleApproval = async (matchId: number, approve: boolean) => {
    if (!currentUser) return;
    
    const match = pendingMatches.find(m => m.id === matchId);
    if (!match || !match.pending_score) return;

    const proposerIsWinner = match.winner.toLowerCase() === match.pending_score.proposed_by.toLowerCase();
    const opponentName = proposerIsWinner ? match.loser : match.winner;
    
    if (approve) {
        const { score1, score2 } = match.pending_score;
        
        const winnerName = score1 > score2 ? currentUser.name : opponentName;
        const loserName = score1 > score2 ? opponentName : currentUser.name;

        // Update match to be confirmed
        const { error: matchUpdateError } = await supabase
            .from('matches')
            .update({ 
                score: `${score1}-${score2}`, 
                winner: winnerName, 
                loser: loserName, 
                pending_score: null 
            })
            .eq('id', matchId);

        if(matchUpdateError) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not approve match.' });
          return;
        }

        // Update player stats
        const winner = allPlayers.find(p => p.name === winnerName)!;
        const loser = allPlayers.find(p => p.name === loserName)!;
        
        await supabase.from('players').update({ wins: (winner.wins ?? 0) + 1, matches_played: winner.matches_played + 1 }).eq('id', winner.id);
        await supabase.from('players').update({ losses: (loser.losses ?? 0) + 1, matches_played: loser.matches_played + 1 }).eq('id', loser.id);
        
        toast({ title: "Approved", description: "The match score has been updated." });
    } else {
        // Delete rejected match report
        await supabase.from('matches').delete().eq('id', matchId);
        toast({ title: "Rejected", description: "The score has been rejected and the match report removed." });
    }

    await supabase.from('notifications').insert([{
        user_name: opponentName,
        title: `Match Result ${approve ? 'Approved' : 'Rejected'}`,
        description: `${currentUser.name} has ${approve ? 'approved' : 'rejected'} the score for your recent match.`,
        read: false,
        date: new Date().toISOString()
    }]);
    
    // Refresh all data
    fetchCurrentUserData();
  }

  if(!currentUser) return <p>Loading...</p>

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 md:h-20 md:w-20">
            <AvatarImage src={userStats.avatar || `https://placehold.co/80x80.png`} data-ai-hint="player portrait" alt={userStats.name} />
            <AvatarFallback>{userStats.initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold">{userStats.name}</h1>
              <p className="text-muted-foreground hidden md:block">Your personal snooker statistics.</p>
            </div>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => setIsAddMatchOpen(true)} variant="default" className="hidden md:flex">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Match
            </Button>
            <Button onClick={() => setIsEditing(!isEditing)} variant="outline" className="hidden md:flex">
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
                        if(!match.pending_score) return null;
                        
                        const proposerIsWinner = match.winner.toLowerCase() === match.pending_score.proposed_by.toLowerCase();
                        const opponentName = proposerIsWinner ? match.loser : match.winner;

                        let myProposedScore, opponentProposedScore;
                        
                        if(proposerIsWinner) {
                           myProposedScore = match.pending_score.score2;
                           opponentProposedScore = match.pending_score.score1;
                        } else {
                           myProposedScore = match.pending_score.score1;
                           opponentProposedScore = match.pending_score.score2;
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
          <CardTitle>
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
                const opponent = allPlayers.find(p => p.name === opponentName);

                return (
                  <li 
                    key={match.id} 
                    className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => router.push(`/match/${match.id}`)}
                  >
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                              <Badge variant={isWinner ? "default" : "destructive"}>
                              {isWinner ? "WIN" : "LOSS"}
                              </Badge>
                              <div>
                                  <span>vs <span className="hover:underline">{opponentName}</span></span>
                                  <p className="text-sm text-muted-foreground">{new Date(match.date).toLocaleDateString()}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-4">
                              <span className="font-bold text-lg">{match.score}</span>
                          </div>
                      </div>
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

      <div className="md:hidden flex gap-2 fixed bottom-20 right-4">
         <Button
            onClick={() => setIsAddMatchOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg"
            size="icon"
          >
            <PlusCircle className="h-6 w-6" />
            <span className="sr-only">Add Match</span>
          </Button>
         <Button
            onClick={() => setIsEditing(!isEditing)}
            className="h-14 w-14 rounded-full shadow-lg"
            size="icon"
            variant="outline"
          >
            {isEditing ? <Save className="h-6 w-6" /> : <Edit className="h-6 w-6" />}
            <span className="sr-only">{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
          </Button>
      </div>


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
    
