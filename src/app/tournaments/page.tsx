
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
}

export interface LiveMatch {
  id: number;
  tournamentId: number;
  tournamentName: string;
  player1: string;
  player2: string;
  score1: number;
  score2: number;
}

const initialTournaments: Tournament[] = [
  { id: 1, name: "Club Championship 2024", format: "Knockout", players: 64, status: "In Progress", rules: ["Standard knockout rules", "Best of 11 frames."], image: "https://placehold.co/600x400.png", pendingPlayers: [], registeredPlayers: [], location: "Main Hall" },
  { id: 2, name: "Summer League", format: "League", players: 16, status: "In Progress", rules: ["Round-robin league format.", "Each player plays each other once.", "2 points for a win, 1 for a draw."], image: "https://placehold.co/600x400.png", pendingPlayers: [], registeredPlayers: [], location: "Upstairs Lounge" },
  { id: 3, name: "9-Ball Challenge", format: "Round Robin", players: 8, status: "Finished", rules: ["9-ball rules.", "Race to 7."], image: "https://placehold.co/600x400.png", pendingPlayers: [], registeredPlayers: [], location: "Pool Room" },
  { id: 4, name: "Annual Pro-Am", format: "Knockout", players: 32, status: "Upcoming", rules: ["Pro-Am knockout tournament.", "Amateurs get a handicap."], image: "https://placehold.co/600x400.png", pendingPlayers: [], registeredPlayers: [], location: "Main Hall" },
];

const initialLiveMatches: LiveMatch[] = [
    { id: 1, tournamentId: 1, tournamentName: "Club Championship 2024", player1: "Ronnie O'Sullivan", player2: "Judd Trump", score1: 3, score2: 2 },
    { id: 2, tournamentId: 2, tournamentName: "Summer League", player1: "Mark Selby", player2: "Neil Robertson", score1: 1, score2: 4 },
];

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [isAddTournamentOpen, setIsAddTournamentOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{name: string, email: string, isAdmin?: boolean} | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const userData = getFromStorage<{name: string, email: string, isAdmin?: boolean} | null>('userData', null);
    setCurrentUser(userData);

    const storedTournaments = getFromStorage('tournaments', initialTournaments);
    setTournaments(storedTournaments);

    const storedLiveMatches = getFromStorage('liveMatches', initialLiveMatches);
    setLiveMatches(storedLiveMatches);

    const storedPlayers = getFromStorage('players', []);
    setPlayers(storedPlayers);

    if (localStorage.getItem('tournaments') === null) {
      saveToStorage('tournaments', initialTournaments);
    }
    if (localStorage.getItem('liveMatches') === null) {
        saveToStorage('liveMatches', initialLiveMatches);
    }
  }, []);

  const handleAddTournament = (newTournament: Omit<Tournament, 'id' | 'pendingPlayers' | 'registeredPlayers'>) => {
    setTournaments(prevTournaments => {
      const newTournaments = [...prevTournaments, {
        ...newTournament,
        id: prevTournaments.length + 1,
        pendingPlayers: [],
        registeredPlayers: [],
      }];
      saveToStorage('tournaments', newTournaments);
      return newTournaments;
    });
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
        <div>
            <h1 className="text-3xl font-bold">Tournaments</h1>
            <p className="text-muted-foreground">Create and manage club tournaments.</p>
        </div>
        {currentUser?.isAdmin && (
            <Button onClick={() => setIsAddTournamentOpen(true)}>
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
                    <span className="text-sm text-muted-foreground">{match.tournamentName}</span>
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
                <TableHead>Tournament Name</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="text-center">Players</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell>
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
                     <Button asChild variant="ghost" size="sm">
                        <Link href={`/tournaments/${tournament.id}`}>
                           {currentUser?.isAdmin ? <Pencil className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                           {currentUser?.isAdmin ? 'Edit & Manage' : 'View Rules & Apply'}
                        </Link>
                     </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddTournamentDialog open={isAddTournamentOpen} onOpenChange={setIsAddTournamentOpen} onAddTournament={handleAddTournament} />
    </div>
  );
}
