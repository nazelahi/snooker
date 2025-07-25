
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Tournament } from "@/app/tournaments/page";
import type { Player } from "@/app/players/page";
import { Calendar, Users, Shield, ArrowLeft, Save, MapPin, Check, X, Edit, ListChecks, CheckCircle, Swords, ClipboardList, Trophy, Radio, Shuffle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import type { Notification } from "@/types/notifications";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { TournamentBracket, type Matchup, type Round } from "@/components/tournament-bracket";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { Match, UpcomingMatch, LiveMatch } from "@/types/matches";


interface EnrolledPlayer {
  id: number;
  name: string;
  avatar: string;
  initials: string;
  email: string;
}

export default function TournamentDetailsPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [editedTournament, setEditedTournament] = useState<Tournament | null>(null);
  const [currentUser, setCurrentUser] = useState<{name: string, email: string, isAdmin?: boolean} | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [enrolledPlayers, setEnrolledPlayers] = useState<EnrolledPlayer[]>([]);
  const [pendingPlayers, setPendingPlayers] = useState<EnrolledPlayer[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [predefinedRules, setPredefinedRules] = useState<string[]>([]);
  const [tournamentMatches, setTournamentMatches] = useState<Match[]>([]);
  const [tournamentUpcoming, setTournamentUpcoming] = useState<UpcomingMatch[]>([]);
  const [tournamentLive, setTournamentLive] = useState<LiveMatch[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [winnerPlayer, setWinnerPlayer] = useState<Player | null>(null);
  const supabase = createSupabaseBrowserClient();


  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const router = useRouter();

  const fetchTournamentData = async () => {
    if (!id) return;
    
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    const currentUserName = user?.user_metadata.full_name || user?.email;
    setCurrentUser(user ? { name: currentUserName, email: user.email!, isAdmin: user.email === 'imnazelahi@gmail.com' } : null);

    const { data: playersData } = await supabase.from('players').select('*');
    if (playersData) setAllPlayers(playersData);

    const { data: tournamentData, error } = await supabase.from('tournaments').select('*').eq('id', parseInt(id)).single();
    
    if (error || !tournamentData) {
      toast({ variant: 'destructive', title: 'Error', description: 'Tournament not found.' });
      setTournament(null);
      return;
    }

    setTournament(tournamentData as Tournament);
    setEditedTournament({ ...tournamentData } as Tournament);

    if (currentUserName && ((tournamentData as Tournament).registeredPlayers?.includes(currentUserName) || (tournamentData as Tournament).pendingPlayers?.includes(currentUserName))) {
      setHasApplied(true);
    }
    if ((tournamentData as Tournament).winner && playersData) {
      setWinnerPlayer(playersData.find(p => p.name === (tournamentData as Tournament).winner) || null);
    }
    
    if(playersData) {
        const getPlayerDetails = (playerName: string) => {
            const p = playersData.find(p => p.name === playerName);
            return {
                id: p?.id || 0,
                name: p?.name || playerName,
                avatar: p?.avatar || '',
                initials: p?.initials || '?',
                email: p?.name || playerName,
            };
        };
        const enrolled = (tournamentData as Tournament).registeredPlayers || [];
        const pending = (tournamentData as Tournament).pendingPlayers || [];
        
        setEnrolledPlayers(enrolled.map(getPlayerDetails));
        setPendingPlayers(pending.map(getPlayerDetails));
    }
    
    const { data: rulesData } = await supabase.from('settings').select('value').eq('key', 'tournamentRules').single();
    if(rulesData?.value) setPredefinedRules(rulesData.value);

    const { data: matchesData } = await supabase.from('matches').select('*').eq('tournament_id', (tournamentData as Tournament).id);
    if (matchesData) setTournamentMatches(matchesData as Match[]);
    
    const { data: upcomingData } = await supabase.from('upcoming_matches').select('*').eq('tournament_id', (tournamentData as Tournament).id);
    if(upcomingData) setTournamentUpcoming(upcomingData as UpcomingMatch[]);
    
    const { data: liveData } = await supabase.from('live_matches').select('*').eq('tournament_id', (tournamentData as Tournament).id);
    if(liveData) setTournamentLive(liveData as LiveMatch[]);
  };

  useEffect(() => {
    fetchTournamentData();
    
    const tournamentsSubscription = supabase
      .channel(`tournaments:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${id}` }, (payload) => {
        fetchTournamentData();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(tournamentsSubscription);
    };

  }, [id, toast]);

  const getPlayerAvatar = (name: string) => {
    const player = allPlayers.find(p => p.name === name);
    return player ? {avatar: player.avatar, initials: player.initials, id: player.id} : {avatar: '', initials: name.split(' ').map(n=>n[0]).join(''), id: null};
  }

  const PlayerLink = ({name, className}: {name: string, className?: string}) => {
    const player = getPlayerAvatar(name);
    if (!player.id) {
        return <span className="font-medium">{name}</span>;
    }
    return <Link href={`/players/${player.id}`} className="font-medium hover:underline">{name}</Link>
  }

  const handleApply = async () => {
    if (!currentUser || !tournament) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to apply." });
        router.push('/login');
        return;
    }

    const newPendingPlayers = [...(tournament.pendingPlayers || []), currentUser.name];
    const { data, error } = await supabase.from('tournaments').update({ pendingPlayers: newPendingPlayers }).eq('id', tournament.id).select().single();

    if(error) {
      toast({ variant: "destructive", title: "Error", description: 'Could not submit application.' });
      return;
    }

    if(data) {
      setTournament(data as Tournament);
      setHasApplied(true);
      toast({ title: "Application Sent!", description: `Your application for "${tournament?.name}" is pending approval.` });
    }
  }

  const handleApproval = async (playerName: string, isApproved: boolean) => {
    if (!tournament) return;

    const updatedPending = (tournament.pendingPlayers || []).filter(name => name !== playerName);
    let updatedRegistered = tournament.registeredPlayers || [];

    if (isApproved) {
        updatedRegistered = [...updatedRegistered, playerName];
    }

    const {data, error} = await supabase.from('tournaments').update({
        pendingPlayers: updatedPending,
        registeredPlayers: updatedRegistered
    }).eq('id', tournament.id).select().single();

    if (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not process application." });
        return;
    }

    if(data) {
        setTournament(data as Tournament);
        setEditedTournament(data as Tournament);
        
        await supabase.from('notifications').insert([{
            user_name: playerName,
            title: `Application ${isApproved ? 'Approved' : 'Rejected'}`,
            description: `Your application for the "${tournament.name}" tournament has been ${isApproved ? 'approved' : 'rejected'}.`,
            read: false,
            date: new Date().toISOString(),
        }]);
        
        toast({
            title: isApproved ? "Player Approved" : "Player Rejected",
            description: `The application has been processed.`,
        });
    }
  }

  const handleSaveChanges = async () => {
    if (!editedTournament) return;
    const { data, error } = await supabase
      .from('tournaments')
      .update(editedTournament)
      .eq('id', editedTournament.id)
      .select()
      .single();

    if(error) {
      toast({ variant: "destructive", title: "Error", description: "Could not save changes." });
      return;
    }
    
    if(data) {
      setTournament(data as Tournament);
      if ((data as Tournament).winner) {
        const winner = allPlayers.find(p => p.name === (data as Tournament).winner);
        setWinnerPlayer(winner || null);
      }
      toast({
        title: "Success",
        description: "Tournament details have been updated."
      });
      setIsEditing(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editedTournament) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedTournament({ ...editedTournament, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRuleChange = (rule: string, checked: boolean) => {
    if (!editedTournament) return;
    const currentRules = editedTournament.rules || [];
    let updatedRules;
    if (checked) {
      updatedRules = [...currentRules, rule];
    } else {
      updatedRules = currentRules.filter(r => r !== rule);
    }
    setEditedTournament({ ...editedTournament, rules: updatedRules });
  };
  
  const handleGenerateBracket = async () => {
     if (!tournament || tournament.format !== 'Knockout' || !tournament.registeredPlayers) {
        toast({ variant: 'destructive', title: "Error", description: "Cannot generate bracket for this tournament."});
        return;
    }

    const shuffledPlayers = [...(tournament.registeredPlayers || [])].sort(() => 0.5 - Math.random());
    
    const firstRoundMatchups: Matchup[] = [];
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
        const player1Name = shuffledPlayers[i];
        const player2Name = shuffledPlayers[i+1]; // Might be undefined for odd number of players

        firstRoundMatchups.push({
            id: i / 2,
            player1: player1Name,
            player2: player2Name,
        });
    }

    const bracket: Round[] = [{ name: "Round 1", matchups: firstRoundMatchups }];
    
    let numMatchups = firstRoundMatchups.length / 2;
    let roundNum = 2;
    while(numMatchups >= 1) {
        const matchups: Matchup[] = [];
        for(let i=0; i<numMatchups; i++){
            matchups.push({id: i});
        }
        let roundName = `Round ${roundNum}`;
        if (numMatchups === 1) roundName = "Final";
        else if (numMatchups < 2) roundName = "Semi-Finals";
        else if (numMatchups < 4) roundName = "Quarter-Finals";

        bracket.push({name: roundName, matchups});
        numMatchups /= 2;
        roundNum++;
    }

    const { error } = await supabase
      .from('tournaments')
      .update({ bracket: bracket, status: 'In Progress' })
      .eq('id', tournament.id);

    if (error) {
       toast({variant: 'destructive', title: "Error", description: "Could not generate bracket."});
       return;
    }

    toast({title: "Bracket Generated!", description: "The tournament is now In Progress."});
  };


  if (!tournament || !editedTournament) {
    return (
        <div className="text-center">
            <p className="text-lg">Loading tournament data...</p>
        </div>
    );
  }

  const isAdmin = !!currentUser?.isAdmin;
  const applicationStatus = tournament.registeredPlayers?.includes(currentUser?.name || '') ? 'Approved' : 
                            tournament.pendingPlayers?.includes(currentUser?.name || '') ? 'Pending' : 'Not Applied';

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <Button variant="outline" onClick={() => router.back()} className="w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Back to Tournaments</span>
            <span className="md:hidden">Back</span>
        </Button>
        {isAdmin && (
           <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => { setIsEditing(false); setEditedTournament(tournament ? {...tournament} : null); }}>Cancel</Button>
                <Button onClick={handleSaveChanges}>
                  <Save className="mr-2 h-4 w-4"/>
                  Save Changes
                </Button>
              </>
            ) : (
               <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Tournament
              </Button>
            )}
           </div>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="relative">
            <Image src={isEditing ? editedTournament.image || `https://placehold.co/1200x400.png`: tournament.image || `https://placehold.co/1200x400.png`} data-ai-hint="tournament banner" width={1200} height={400} alt={tournament.name} className="w-full h-48 md:h-64 object-cover"/>
            {isEditing && (
              <div className="absolute bottom-2 right-2">
                <Input id="image-upload" type="file" className="hidden" onChange={handleImageChange} accept="image/*"/>
                <Label htmlFor="image-upload" className="bg-background/80 text-foreground py-2 px-4 rounded-md cursor-pointer hover:bg-background">
                  Change Image
                </Label>
              </div>
            )}
        </div>
        <CardHeader>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                id="tournament-name"
                className="text-2xl md:text-4xl font-bold -ml-1.5 h-auto p-1.5 border-border bg-muted/50 transition-all"
                value={editedTournament.name}
                onChange={(e) => setEditedTournament({...editedTournament, name: e.target.value})}
              />
            </div>
          ) : (
             <CardTitle className="text-2xl md:text-4xl font-bold">{tournament.name}</CardTitle>
          )}
         
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{tournament.status}</span>
            </div>
            <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>{tournament.players} Players</span>
            </div>
            <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>{tournament.format}</span>
            </div>
             <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {isEditing ? (
                  <Input 
                    value={editedTournament.location || ''}
                    onChange={(e) => setEditedTournament({...editedTournament, location: e.target.value})}
                    placeholder="Location"
                    className="h-8 -ml-1.5 p-1.5 border-border bg-muted/50 transition-all"
                  />
                ) : (
                   <span>{tournament.location || 'Not specified'}</span>
                )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <ListChecks className="text-primary"/>
              Tournament Rules
            </h3>
             {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/20">
                    {predefinedRules.map((rule, index) => (
                        <div key={rule} className="flex items-start space-x-2">
                            <Checkbox
                                id={`rule-${index}`}
                                checked={(editedTournament.rules || []).includes(rule)}
                                onCheckedChange={(checked) => handleRuleChange(rule, !!checked)}
                                className="mt-1"
                            />
                            <Label htmlFor={`rule-${index}`} className="font-normal flex-1">{rule}</Label>
                        </div>
                    ))}
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(tournament.rules || []).map((rule, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0"/>
                      <span className="text-muted-foreground">{rule}</span>
                    </div>
                  ))}
                </div>
             )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center flex-wrap gap-4">
            <div>
              {tournament.status === 'Upcoming' && !isAdmin && (
                   <Button onClick={handleApply} disabled={hasApplied}>
                      {applicationStatus === 'Approved' ? 'Approved' : applicationStatus === 'Pending' ? 'Application Pending' : 'Apply to Participate'}
                   </Button>
              )}
              {tournament.status === 'In Progress' && <Badge>In Progress</Badge>}
              {tournament.status === 'Finished' && <Badge variant="secondary">Finished</Badge>}
            </div>
             {isAdmin && tournament.status === 'Upcoming' && tournament.format === 'Knockout' && (enrolledPlayers.length > 1) && (
                <Button onClick={handleGenerateBracket} variant="outline">
                    <Shuffle className="mr-2 h-4 w-4" />
                    Generate Bracket & Start
                </Button>
             )}
        </CardFooter>
      </Card>
      
      {tournament.status === 'Finished' && winnerPlayer && (
        <Card className="border-amber-400">
            <CardHeader className="text-center">
                <Trophy className="mx-auto h-12 w-12 text-amber-400" />
                <CardTitle className="text-2xl mt-2">Tournament Winner</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <Link href={`/players/${winnerPlayer.id}`} className="flex flex-col items-center gap-2 group">
                    <Avatar className="h-24 w-24 border-2 border-amber-400">
                        <AvatarImage src={winnerPlayer.avatar || `https://placehold.co/96x96.png`} data-ai-hint="player portrait" alt={winnerPlayer.name} />
                        <AvatarFallback>{winnerPlayer.initials}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-bold group-hover:underline">{winnerPlayer.name}</h3>
                </Link>
            </CardContent>
        </Card>
      )}
      
      {tournament.format === 'Knockout' && tournament.bracket && tournament.bracket.length > 0 && (
          <Card>
              <CardHeader>
                  <CardTitle>Tournament Bracket</CardTitle>
              </CardHeader>
              <CardContent>
                  <TournamentBracket bracket={tournament.bracket} players={allPlayers} />
              </CardContent>
          </Card>
      )}

      {tournamentLive.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Radio className="text-primary animate-pulse" />
                    Live Matches
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                {tournamentLive.map((match) => (
                    <li key={match.id} className="p-4 rounded-lg bg-muted/50">
                        <div className="grid grid-cols-3 items-center text-center">
                          <div className="flex items-center justify-end gap-2 md:gap-4">
                              <div className="font-bold text-lg text-right"><PlayerLink name={match.player1} /></div>
                              <Avatar>
                                  <AvatarImage src={getPlayerAvatar(match.player1).avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.player1} />
                                  <AvatarFallback>{getPlayerAvatar(match.player1).initials}</AvatarFallback>
                              </Avatar>
                          </div>

                          <div className="text-2xl md:text-4xl font-bold">
                              <span className="text-primary">{match.score1}</span>
                              <span className="mx-2 md:mx-4">-</span>
                              <span>{match.score2}</span>
                          </div>

                          <div className="flex items-center justify-start gap-2 md:gap-4">
                              <Avatar>
                                  <AvatarImage src={getPlayerAvatar(match.player2).avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.player2} />
                                  <AvatarFallback>{getPlayerAvatar(match.player2).initials}</AvatarFallback>
                              </Avatar>
                              <div className="font-bold text-lg text-left"><PlayerLink name={match.player2} /></div>
                          </div>
                        </div>
                    </li>
                ))}
                </ul>
            </CardContent>
        </Card>
      )}

      {tournamentMatches.length > 0 && (
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ClipboardList /> Recent Results</CardTitle>
            </CardHeader>
            <CardContent>
                 <ul className="space-y-4">
              {tournamentMatches.map((match) => {
                const winner = getPlayerAvatar(match.winner);
                const loser = getPlayerAvatar(match.loser);
                return (
                     <li key={match.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 justify-start w-2/5">
                           <Avatar className="h-8 w-8">
                              <AvatarImage src={winner.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.winner} />
                              <AvatarFallback>{winner.initials}</AvatarFallback>
                          </Avatar>
                          <PlayerLink name={match.winner} />
                        </div>
                        <div className="flex-1 text-center">
                            <Link href={`/match/${match.id}`}>
                                <Badge variant="secondary" className="font-bold text-lg">{match.score}</Badge>
                            </Link>
                        </div>
                       <div className="flex items-center gap-2 justify-end w-2/5">
                            <PlayerLink name={match.loser} />
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={loser.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.loser} />
                                <AvatarFallback>{loser.initials}</AvatarFallback>
                            </Avatar>
                      </div>
                    </li>
                );
              })}
            </ul>
            </CardContent>
          </Card>
      )}

      {tournamentUpcoming.length > 0 && (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Swords /> Upcoming Matches</CardTitle>
            </CardHeader>
            <CardContent>
               <ul className="space-y-4">
              {tournamentUpcoming.map((match) => {
                const player1 = getPlayerAvatar(match.player1);
                const player2 = getPlayerAvatar(match.player2);
                return (
                    <li key={match.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 justify-start w-2/5">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={player1.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.player1} />
                                <AvatarFallback>{player1.initials}</AvatarFallback>
                            </Avatar>
                            <PlayerLink name={match.player1} />
                        </div>
                        <div className="flex-1 text-center">
                            <span className="text-muted-foreground text-sm">vs</span>
                            <p className="text-xs text-muted-foreground">{new Date(match.date).toLocaleDateString()} at {match.time}</p>
                        </div>
                         <div className="flex items-center gap-2 justify-end w-2/5">
                            <PlayerLink name={match.player2} />
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={player2.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.player2} />
                                <AvatarFallback>{player2.initials}</AvatarFallback>
                            </Avatar>
                        </div>
                    </li>
                );
              })}
            </ul>
            </CardContent>
         </Card>
      )}

      {isAdmin && pendingPlayers.length > 0 && (
          <Card>
              <CardHeader>
                  <CardTitle>Pending Applications ({pendingPlayers.length})</CardTitle>
                  <CardDescription>Review and approve or reject player applications for this tournament.</CardDescription>
              </CardHeader>
              <CardContent>
                  <ul className="space-y-2">
                      {pendingPlayers.map(player => (
                          <li key={player.email} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-3">
                                  <Avatar>
                                      <AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={player.name} />
                                      <AvatarFallback>{player.initials}</AvatarFallback>
                                  </Avatar>
                                   <Link href={`/players/${player.id}`} className="font-medium hover:underline">
                                    {player.name}
                                  </Link>
                              </div>
                              <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleApproval(player.name, true)}>
                                      <Check className="h-4 w-4 mr-2"/> Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleApproval(player.name, false)}>
                                      <X className="h-4 w-4 mr-2"/> Reject
                                  </Button>
                              </div>
                          </li>
                      ))}
                  </ul>
              </CardContent>
          </Card>
      )}

       {enrolledPlayers.length > 0 && (
         <Card>
            <CardHeader>
                <CardTitle>Player Draw / Enrolled Players ({enrolledPlayers.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {enrolledPlayers.map((player) => (
                        <Link key={player.id} href={`/players/${player.id}`} className="flex flex-col items-center gap-2 group">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={player.avatar || `https://placehold.co/64x64.png`} data-ai-hint="player portrait" alt={player.name} />
                                <AvatarFallback>{player.initials}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-center group-hover:underline">{player.name}</span>
                        </Link>
                    ))}
                </div>
            </CardContent>
         </Card>
       )}
    </div>
  );
}
