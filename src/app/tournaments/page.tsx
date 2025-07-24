"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
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
import { PlusCircle } from "lucide-react";
import { getFromStorage, saveToStorage } from "@/lib/storage";
import { AddTournamentDialog } from "@/components/add-tournament-dialog";

export interface Tournament {
  id: number;
  name: string;
  format: "Knockout" | "League" | "Round Robin";
  players: number;
  status: "Upcoming" | "In Progress" | "Finished";
}


const initialTournaments: Tournament[] = [
  { id: 1, name: "Club Championship 2024", format: "Knockout", players: 64, status: "In Progress" },
  { id: 2, name: "Summer League", format: "League", players: 16, status: "In Progress" },
  { id: 3, name: "9-Ball Challenge", format: "Round Robin", players: 8, status: "Finished" },
  { id: 4, name: "Annual Pro-Am", format: "Knockout", players: 32, status: "Upcoming" },
];

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isAddTournamentOpen, setIsAddTournamentOpen] = useState(false);

  useEffect(() => {
    const storedTournaments = getFromStorage('tournaments', initialTournaments);
    setTournaments(storedTournaments);

    if (localStorage.getItem('tournaments') === null) {
      saveToStorage('tournaments', initialTournaments);
    }
  }, []);

  const handleAddTournament = (newTournament: Omit<Tournament, 'id'>) => {
    setTournaments(prevTournaments => {
      const newTournaments = [...prevTournaments, {
        ...newTournament,
        id: prevTournaments.length + 1,
      }];
      saveToStorage('tournaments', newTournaments);
      return newTournaments;
    });
  };

  return (
    <div className="flex flex-col gap-8">
       <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Tournaments</h1>
            <p className="text-muted-foreground">Create and manage club tournaments.</p>
        </div>
        <Button onClick={() => setIsAddTournamentOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Tournament
        </Button>
      </div>
      <Card>
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
                  <TableCell className="font-medium">{tournament.name}</TableCell>
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
                    <Button variant="ghost" size="sm" onClick={() => alert(`Viewing details for ${tournament.name}`)}>View Details</Button>
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
