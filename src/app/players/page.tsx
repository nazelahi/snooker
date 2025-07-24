
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PlusCircle, List, LayoutGrid } from "lucide-react";
import { getFromStorage, saveToStorage } from "@/lib/storage";
import { AddPlayerDialog } from "@/components/add-player-dialog";
import type { Notification } from "@/types/notifications";

export interface Player {
  id: number;
  name: string;
  skillLevel: "Beginner" | "Intermediate" | "Pro";
  matchesPlayed: number;
  winRate: string;
  highestBreak: number;
  avatar: string;
  initials: string;
  wins?: number;
  losses?: number;
  averageBreak?: number;
}

const initialPlayers: Player[] = [
  { id: 1, name: "Ronnie O'Sullivan", skillLevel: "Pro", matchesPlayed: 25, winRate: "88%", highestBreak: 147, avatar: "/avatars/ronnie.png", initials: "RO" },
  { id: 2, name: "Judd Trump", skillLevel: "Pro", matchesPlayed: 28, winRate: "71%", highestBreak: 147, avatar: "/avatars/judd.png", initials: "JT" },
  { id: 3, name: "Mark Selby", skillLevel: "Pro", matchesPlayed: 26, winRate: "73%", highestBreak: 145, avatar: "/avatars/mark.png", initials: "MS" },
  { id: 4, name: "Neil Robertson", skillLevel: "Pro", matchesPlayed: 24, winRate: "75%", highestBreak: 147, avatar: "/avatars/neil.png", initials: "NR" },
  { id: 5, name: "Alice Johnson", skillLevel: "Intermediate", matchesPlayed: 40, winRate: "60%", highestBreak: 92, avatar: "/avatars/alice.png", initials: "AJ" },
  { id: 6, name: "Bob Williams", skillLevel: "Beginner", matchesPlayed: 15, winRate: "40%", highestBreak: 45, avatar: "/avatars/bob.png", initials: "BW" },
];

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [view, setView] = useState<'list' | 'grid'>('list');


  useEffect(() => {
    const storedPlayers = getFromStorage('players', initialPlayers);
    setPlayers(storedPlayers);

    if (localStorage.getItem('players') === null) {
      saveToStorage('players', initialPlayers);
    }
  }, []);

  const handleAddPlayer = (newPlayer: Omit<Player, 'id' | 'initials' | 'winRate' | 'matchesPlayed'>) => {
    setPlayers(prevPlayers => {
      const highestBreak = newPlayer.highestBreak;
      const prevHighestBreakPlayer = prevPlayers.reduce((prev, curr) => prev.highestBreak > curr.highestBreak ? prev : curr);

      if (highestBreak > prevHighestBreakPlayer.highestBreak) {
         const notifications = getFromStorage<Notification[]>('notifications', []);
         const newNotification: Notification = {
            id: Date.now().toString(),
            title: "New Club Record!",
            description: `${newPlayer.name} has set a new high break of ${highestBreak}!`,
            read: false,
            date: new Date().toISOString()
         };
         saveToStorage('notifications', [newNotification, ...notifications]);
         window.dispatchEvent(new Event('storage'));
      }

      const newPlayers = [...prevPlayers, {
        ...newPlayer,
        id: prevPlayers.length + 1,
        initials: newPlayer.name.split(' ').map(n => n[0]).join(''),
        matchesPlayed: 0,
        winRate: "0%",
        wins: 0,
        losses: 0,
        averageBreak: 0,
      }];
      saveToStorage('players', newPlayers);
      return newPlayers;
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Players</h1>
            <p className="text-muted-foreground">Manage player profiles and view statistics.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')} className="hidden md:flex">
                <List className="h-5 w-5" />
            </Button>
            <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')} className="hidden md:flex">
                <LayoutGrid className="h-5 w-5" />
            </Button>
            <Button onClick={() => setIsAddPlayerOpen(true)} className="hidden md:flex">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Player
            </Button>
        </div>
      </div>
      {view === 'list' && (
        <Card>
            <CardContent className="pt-6">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead className="hidden sm:table-cell">Skill Level</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Matches</TableHead>
                    <TableHead className="text-center">Win Rate</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Highest Break</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {players.map((player) => (
                    <TableRow key={player.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={player.name} />
                            <AvatarFallback>{player.initials}</AvatarFallback>
                        </Avatar>
                        <Link href={`/players/${player.id}`} className="font-medium hover:underline">
                            {player.name}
                        </Link>
                        </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <Badge variant={player.skillLevel === 'Pro' ? 'default' : player.skillLevel === 'Intermediate' ? 'secondary' : 'outline'}>
                        {player.skillLevel}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell">{player.matchesPlayed}</TableCell>
                    <TableCell className="text-center">{player.winRate}</TableCell>
                    <TableCell className="text-center font-semibold text-primary hidden lg:table-cell">{player.highestBreak}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
      )}

       {view === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {players.map((player) => (
            <Card key={player.id} className="overflow-hidden">
                <CardHeader className="p-0">
                  <Link href={`/players/${player.id}`}>
                    <div className="relative aspect-square bg-muted">
                        <Avatar className="h-full w-full rounded-none">
                            <AvatarImage src={player.avatar || `https://placehold.co/400x400.png`} data-ai-hint="player portrait" alt={player.name} className="object-cover" />
                            <AvatarFallback className="text-4xl rounded-none">{player.initials}</AvatarFallback>
                        </Avatar>
                    </div>
                  </Link>
                </CardHeader>
                <CardContent className="p-4">
                  <Link href={`/players/${player.id}`} className="block">
                    <CardTitle className="text-lg hover:underline truncate">{player.name}</CardTitle>
                  </Link>
                  <Badge variant={player.skillLevel === 'Pro' ? 'default' : player.skillLevel === 'Intermediate' ? 'secondary' : 'outline'} className="mt-2">
                    {player.skillLevel}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-2">{player.winRate} Win Rate</div>
                </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button
        onClick={() => setIsAddPlayerOpen(true)}
        className="md:hidden fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <PlusCircle className="h-6 w-6" />
        <span className="sr-only">Add Player</span>
      </Button>

      <AddPlayerDialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen} onAddPlayer={handleAddPlayer} />
    </div>
  );
}
