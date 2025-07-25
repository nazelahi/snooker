
"use client";

import { useState, useEffect, useCallback } from "react";
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
import { supabase } from "@/lib/supabase/client";
import { Match } from "@/types/matches";
import type { User } from "@supabase/supabase-js";

const initialStats = {
  name: "New Player",
  initials: "NP",
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
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedAvatar, setEditedAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [matchHistory, setMatchHistory] = useState<Match[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  const fetchCurrentUserData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);

    let { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single();
    
    if (playerError || !playerData) {
        // Player does not exist, create one.
        const newUserPlayer = {
            user_id: user.id,
            name: user.user_metadata.full_name || user.email,
            email: user.email,
            initials: (user.user_metadata.full_name || user.email!).split(' ').map(n => n[0]).join(''),
            avatar: user.user_metadata.avatar_url,
            skill_level: "Beginner",
            matches_played: 0,
            win_rate: "0%",
            highest_break: 0,
            wins: 0,
            losses: 0,
            average_break: 0,
        };
        
        const { data: newPlayerData, error: newPlayerError } = await supabase
            .from('players')
            .insert(newUserPlayer)
            .select()
            .single();

        if (newPlayerError) {
            toast({ variant: 'destructive', title: "Error", description: "Could not create your player profile."});
            return;
        }
        playerData = newPlayerData;
    }

    setPlayer(playerData);
    setEditedName(playerData.name);
    setAvatarPreview(playerData.avatar);

    const { data: allPlayersData } = await supabase.from('players').select('*');
    if (allPlayersData) setAllPlayers(allPlayersData);

    const { data: allMatches } = await supabase.from('matches').select('*');
    if (allMatches) {
        const matchesForApproval = allMatches.filter(match => 
            (match.loser === playerData?.name) && 
            match.pending_score
        );
        setPendingMatches(matchesForApproval as Match[]);

        const playerMatches = allMatches.filter(
            (match) => match.winner === playerData?.name || match.loser === playerData?.name
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setMatchHistory(playerMatches as Match[]);
    }
  }, [router, toast]);

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
  }, [fetchCurrentUserData]);

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
    if (!currentUser || !player) return;

    const updatedPlayerData = { 
      name: editedName,
      initials: editedName.split(' ').map(n => n[0]).join(''),
      avatar: editedAvatar || player.avatar,
    };
    
    const { error } = await supabase.from('players').update(updatedPlayerData).eq('id', player.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return;
    }
    
    if (editedName !== player.name) {
      await supabase.auth.updateUser({ data: { full_name: editedName } });
    }

    toast({ title: "Success", description: "Your profile has been updated."});
    setIsEditing(false);
    fetchCurrentUserData();
  }
  
  const handleAddMatch = async (opponentId: number, myScore: number, opponentScore: number) => {
    if (!currentUser || !player) return;

    const opponent = allPlayers.find(p => p.id === opponentId);
    if (!opponent || !opponent.user_id) {
        toast({ variant: "destructive", title: "Error", description: "Opponent not found or does not have a user account." });
        return;
    }
    
    const newMatch = {
        winner: myScore > opponentScore ? player.name : opponent.name,
        loser: myScore > opponentScore ? opponent.name : player.name,
        score: `${myScore}-${opponentScore}`,
        date: new Date().toISOString(),
        media: [],
        comments: [],
        pending_score: {
            winnerScore: myScore > opponentScore ? myScore : opponentScore,
            loserScore: myScore > opponentScore ? opponentScore : myScore,
            proposed_by: player.name,
        }
    };

    const { error } = await supabase.from('matches').insert([newMatch]);

    if (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Could not report match.' });
       return;
    }
    
    await supabase.from('notifications').insert([{
        user_id: opponent.user_id,
        title: "New Match Reported",
        description: `${player.name} has reported a new match with you. Please review and approve the score on your profile page.`,
        read: false,
        date: new Date().toISOString(),
        link: '/my-stats'
    }]);

    toast({ title: "Match Reported", description: "Your new match has been reported and is awaiting approval from your opponent."});
    fetchCurrentUserData();
  };

  const handleApproval = async (matchId: number, approve: boolean) => {
    if (!currentUser || !player) return;
    
    const match = pendingMatches.find(m => m.id === matchId);
    if (!match || !match.pending_score) return;
    
    const opponentName = match.pending_score.proposed_by;
    const opponent = allPlayers.find(p => p.name === opponentName);

    if (approve) {
        const { winnerScore, loserScore } = match.pending_score;
        
        // Update match to be confirmed
        const { error: matchUpdateError } = await supabase
            .from('matches')
            .update({ 
                score: `${winnerScore}-${loserScore}`, 
                winner: opponentName,
                loser: player.name,
                pending_score: null 
            })
            .eq('id', matchId);

        if(matchUpdateError) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not approve match.' });
          return;
        }

        // Update player stats
        if(opponent) {
            await supabase.from('players').update({ wins: (opponent.wins ?? 0) + 1, matches_played: opponent.matches_played + 1 }).eq('id', opponent.id);
        }
        await supabase.from('players').update({ losses: (player.losses ?? 0) + 1, matches_played: player.matches_played + 1 }).eq('id', player.id);
        
        toast({ title: "Approved", description: "The match score has been updated." });
    } else {
        // Delete rejected match report
        await supabase.from('matches').delete().eq('id', matchId);
        toast({ title: "Rejected", description: "The score has been rejected and the match report removed." });
    }
    
    if(opponent?.user_id) {
        await supabase.from('notifications').insert([{
            user_id: opponent.user_id,
            title: `Match Result ${approve ? 'Approved' : 'Rejected'}`,
            description: `${player.name} has ${approve ? 'approved' : 'rejected'} the score for your recent match.`,
            read: false,
            date: new Date().toISOString(),
            link: `/match/${match.id}`
        }]);
    }
    
    fetchCurrentUserData();
  }

  if(!player) return <div className="text-center p-8">Loading your stats...</div>

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 md:h-20 md:w-20">
            <AvatarImage src={player.avatar || `https://placehold.co/80x80.png`} data-ai-hint="player portrait" alt={player.name} />
            <AvatarFallback>{player.initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold">{player.name}</h1>
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
                        
                        const opponentName = match.pending_score.proposed_by;
                        const proposedScore = `${match.pending_score.winnerScore}-${match.pending_score.loserScore}`

                        return (
                            <li key={match.id} className="p-4 rounded-lg bg-muted/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p>vs <strong>{opponentName}</strong></p>
                                        <p className="text-sm text-muted-foreground">Proposed Score: <span className="font-bold">{proposedScore}</span></p>
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
                <CardDescription>Update your name and avatar. Other stats are calculated automatically.</CardDescription>
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
            <div className="text-2xl font-bold">{player.matches_played}</div>
            <p className="text-xs text-muted-foreground">{player.wins} Wins, {player.losses} Losses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{player.win_rate}</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Break</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{player.highest_break}</div>
            <p className="text-xs text-muted-foreground">Your personal best</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tournaments Won</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{player.tournamentsWon || 0}</div>
            <p className="text-xs text-muted-foreground">Major victories</p>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>
            My Match History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {matchHistory.length > 0 ? (
            <ul className="space-y-4">
              {matchHistory.map((match) => {
                const isWinner = match.winner === player.name;
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
                                  <span>vs <Link href={`/players/${opponent?.id}`} className="hover:underline">{opponentName}</Link></span>
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

      <AddMatchDialog 
          open={isAddMatchOpen} 
          onOpenChange={setIsAddMatchOpen} 
          onAddMatch={handleAddMatch}
          players={allPlayers.filter(p => p.id !== player?.id)}
          currentUser={player}
      />
    </div>
  );
}
