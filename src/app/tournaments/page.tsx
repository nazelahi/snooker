
"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Radio, Pencil, Eye } from "lucide-react";
import { getFromStorage, saveToStorage } from "@/lib/storage";
import { AddTournamentDialog } from "@/components/add-tournament-dialog";
import type { Player } from "@/app/players/page";
import type { Round } from "@/components/tournament-bracket";
import { supabase } from "@/lib/supabase";
import { LiveMatch } from "@/types/matches";

export interface Tournament {
  id: number;
  name: string;
  format: "Knockout" | "League" | "Round Robin";
  players: number;
  status: "Upcoming" | "In Progress" | "Finished";
  rules: string[];
  image?: string;
  pendingPlayers?: string[]; // Array of user emails awaiting approval
  registeredPlayers?: string[]; // Array of approved user emails
  location?: string;
  winner?: string;
  bracket?: Round[];
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [isAddTournamentOpen, setIsAddTournamentOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{name: string, email: string, isAdmin?: boolean} | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    async function fetchData() {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user ? { name: user.user_metadata.full_name || user.email!, email: user.email!, isAdmin: user.email === 'admin@gmail.com' } : null);
        
        const { data: tournamentsData } = await supabase.from('tournaments').select('*');
        if (tournamentsData) setTournaments(tournamentsData);

        const { data: liveMatchesData } = await supabase.from('live_matches').select('*');
        if (liveMatchesData) setLiveMatches(liveMatchesData);

        const { data: playersData } = await supabase.from('players').select('*');
        if(playersData) setPlayers(playersData);
    }
    fetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      fetchData();
    });

    return () => {
      authListener.subscription.unsubscribe();
    }
  }, []);

  const handleAddTournament = async (newTournament: Omit<Tournament, 'id' | 'pendingPlayers' | 'registeredPlayers'>) => {
    const { data, error } = await supabase.from('tournaments').insert([{
      ...newTournament,
      pendingPlayers: [],
      registeredPlayers: [],
    }]).select();

    if (data) {
      setTournaments(prev => [...prev, ...data]);
    }
    if (error) {
      console.error('Error adding tournament:', error);
    }
  };

  const PlayerLink = ({name}: {name: string}) => {
    const player = players.find(p => p.name === name);
    if (!player) {
        return <span className="font-medium">{name}</span>;
    }
    return <Link href={`/players/${player.id}`} className="font-medium hover:underline">{name}</Link>
  }

  return (
    <div className="flex flex-col gap-8">
       <div className="flex items-center justify-between">
        <div className="hidden md:block">
            <h1 className="text-3xl font-bold">Tournaments</h1>
            <p className="text-muted-foreground">Create and manage club tournaments.</p>
        </div>
        {currentUser?.isAdmin && (
            <Button onClick={() => setIsAddTournamentOpen(true)} className="hidden md:flex">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Tournament
            </Button>
        )}
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="text-primary animate-pulse" />
            Live Matches
          </CardTitle>
          <CardDescription>Ongoing matches in active tournaments.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {liveMatches.length > 0 ? (
            <ul className="space-y-4">
              {liveMatches.map((match) => (
                <li key={match.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">{match.tournament_name}</span>
                    <div><PlayerLink name={match.player1} /> vs <PlayerLink name={match.player2} /></div>
                  </div>
                  <div className="text-2xl font-bold">
                    <span className="text-primary">{match.score1}</span>
                    <span> - </span>
                    <span>{match.score2}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">No live matches currently in progress.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>All Tournaments</CardTitle>
             <CardDescription>A list of all tournaments, including upcoming and finished ones.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="text-center">Players</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.map((tournament) => (
                <TableRow key={tournament.id}>
                  <TableCell className="font-medium">
                    <Link href={`/tournaments/${tournament.id}`} className="hover:underline">
                      {tournament.name}
                    </Link>
                  </TableCell>
                  <TableCell>{tournament.format}</TableCell>
                  <TableCell className="text-center">{tournament.players}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant={
                        tournament.status === 'In Progress' ? 'default'
                        : tournament.status === 'Finished' ? 'secondary'
                        : 'outline'
                      }
                      className={tournament.status === 'Upcoming' ? 'text-blue-400 border-blue-400' : ''}
                    >
                      {tournament.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                     <Button asChild variant="ghost" size="icon">
                        <Link href={`/tournaments/${tournament.id}`}>
                           {currentUser?.isAdmin ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                           <span className="sr-only">{currentUser?.isAdmin ? 'Edit & Manage' : 'View Rules & Apply'}</span>
                        </Link>
                     </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {currentUser?.isAdmin && (
        <Button
          onClick={() => setIsAddTournamentOpen(true)}
          className="md:hidden fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <PlusCircle className="h-6 w-6" />
          <span className="sr-only">Create Tournament</span>
        </Button>
      )}
      <AddTournamentDialog open={isAddTournamentOpen} onOpenChange={setIsAddTournamentOpen} onAddTournament={handleAddTournament} />
    </div>
  );
}
