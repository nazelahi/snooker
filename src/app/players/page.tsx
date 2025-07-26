
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { PlusCircle, List, LayoutGrid, Search, ArrowLeftRight } from "lucide-react";
import { AddPlayerDialog } from "@/components/add-player-dialog";
import type { Notification } from "@/types/notifications";
import { Input } from "@/components/ui/input";
import type { Achievement } from "@/types/achievements";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export interface Player {
  id: number;
  name: string;
  email?: string | null; // Optional email
  skill_level: "Beginner" | "Intermediate" | "Pro";
  matches_played: number;
  win_rate: string;
  highest_break: number;
  avatar: string;
  initials: string;
  wins?: number;
  losses?: number;
  average_break?: number;
  created_at: string;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [playersToShow, setPlayersToShow] = useState(10);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const fetchPlayers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('players').select('*').order('name', { ascending: true });
    if (data) {
        setPlayers(data as Player[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPlayers();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        const user = session?.user;
        setIsAdmin(user?.email === 'admin@gmail.com');
    });

    async function initialize() {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAdmin(user?.email === 'admin@gmail.com');
    }
    initialize();

  }, []);

  const handleAddPlayer = async (newPlayerData: Omit<Player, 'id' | 'initials' | 'win_rate' | 'matches_played' | 'wins' | 'losses' | 'average_break' | 'created_at'>) => {
    
    // This is now primarily for admin use, signup handles user creation.
    const { error } = await supabase.from('players').insert([{
        ...newPlayerData,
        initials: newPlayerData.name.split(' ').map(n => n[0]).join(''),
        win_rate: '0%',
        matches_played: 0,
        wins: 0,
        losses: 0,
        average_break: 0
    }]);

    if (error) {
        // Handle error, maybe show a toast
    } else {
        fetchPlayers(); // Refresh the list
    }

  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const paginatedPlayers = filteredPlayers.slice(0, playersToShow);

  const ViewMoreButton = () => {
    if (playersToShow >= filteredPlayers.length) return null;
    return (
        <Button onClick={() => setPlayersToShow(playersToShow + 10)} variant="secondary" className="w-full">
            View More
        </Button>
    );
  };

  const PlayerListSkeleton = () => (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
                <TableHead>Player</TableHead>
                <TableHead className="hidden sm:table-cell">Skill Level</TableHead>
                <TableHead className="text-center">Matches</TableHead>
                <TableHead className="text-center">Win Rate</TableHead>
                <TableHead className="text-center hidden lg:table-cell">Highest Break</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                <TableCell className="text-center hidden lg:table-cell"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const PlayerGridSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(8)].map((_, i) => (
            <Card key={i}>
                <CardHeader className="p-0">
                    <Skeleton className="aspect-square w-full" />
                </CardHeader>
                <CardContent className="p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </CardContent>
            </Card>
        ))}
    </div>
  );


  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="hidden md:block">
            <h1 className="text-3xl font-bold">Players</h1>
            <p className="text-muted-foreground">Manage player profiles and view statistics.</p>
        </div>
        <div className="flex items-center gap-2 w-full">
             <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search players..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')} className="shrink-0">
                <List className="h-5 w-5" />
            </Button>
            <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')} className="shrink-0">
                <LayoutGrid className="h-5 w-5" />
            </Button>
             <Button asChild className="hidden md:flex shrink-0">
                <Link href="/compare">
                    <ArrowLeftRight className="mr-2 h-4 w-4"/>
                    Compare
                </Link>
            </Button>
        </div>
      </div>
      {loading ? (
        view === 'list' ? <PlayerListSkeleton /> : <PlayerGridSkeleton />
      ) : view === 'list' ? (
        <Card>
            <CardContent className="pt-6">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead className="hidden sm:table-cell">Skill Level</TableHead>
                    <TableHead className="text-center">Matches</TableHead>
                    <TableHead className="text-center">Win Rate</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Highest Break</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {paginatedPlayers.map((player) => (
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
                        <Badge variant={player.skill_level === 'Pro' ? 'default' : player.skill_level === 'Intermediate' ? 'secondary' : 'outline'}>
                        {player.skill_level}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-center">{player.matches_played}</TableCell>
                    <TableCell className="text-center">{player.win_rate}</TableCell>
                    <TableCell className="text-center font-semibold text-primary hidden lg:table-cell">{player.highest_break}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
             {filteredPlayers.length > playersToShow && (
                <CardFooter>
                  <ViewMoreButton />
                </CardFooter>
            )}
        </Card>
      ) : (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {paginatedPlayers.map((player) => (
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
                    <Badge variant={player.skill_level === 'Pro' ? 'default' : player.skill_level === 'Intermediate' ? 'secondary' : 'outline'} className="mt-2">
                        {player.skill_level}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-2">{player.win_rate} Win Rate</div>
                    </CardContent>
                </Card>
            ))}
            </div>
             {filteredPlayers.length > playersToShow && (
                <ViewMoreButton />
            )}
        </>
      )}
       {filteredPlayers.length === 0 && !loading && (
            <div className="text-center py-16">
                <h3 className="text-xl font-semibold">No Players Found</h3>
                <p className="text-muted-foreground mt-2">Your search for "{searchQuery}" did not match any players.</p>
            </div>
        )}

      <div className="md:hidden fixed bottom-20 right-4 flex flex-col gap-2">
          {isAdmin && (
               <Button
                onClick={() => setIsAddPlayerOpen(true)}
                className="h-14 w-14 rounded-full shadow-lg"
                size="icon"
                >
                    <PlusCircle className="h-6 w-6"/>
                    <span className="sr-only">Add Player</span>
                </Button>
          )}
          <Button
            asChild
            className="h-14 w-14 rounded-full shadow-lg"
            size="icon"
            variant="outline"
          >
             <Link href="/compare">
                <ArrowLeftRight className="h-6 w-6"/>
                <span className="sr-only">Compare Players</span>
            </Link>
          </Button>
      </div>

       <AddPlayerDialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen} onAddPlayer={handleAddPlayer} />

    </div>
  );
}
