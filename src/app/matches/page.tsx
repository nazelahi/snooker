
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Swords, Calendar } from "lucide-react";
import type { Player } from "@/app/players/page";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { Match, UpcomingMatch } from "@/types/matches";

export default function AllMatchesPage() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchesToShow, setMatchesToShow] = useState(10);
  const [upcomingToShow, setUpcomingToShow] = useState(5);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: matchesData } = await supabase.from('matches').select('*').order('date', { ascending: false });
      if (matchesData) {
        setAllMatches(matchesData as Match[]);
      }

      const { data: upcomingData } = await supabase.from('upcoming_matches').select('*').order('date', { ascending: true }).order('time', { ascending: true });
      if (upcomingData) {
        setUpcomingMatches(upcomingData as UpcomingMatch[]);
      }

      const { data: playersData } = await supabase.from('players').select('*');
      if (playersData) {
        setPlayers(playersData);
      }
      
      setLoading(false);
    }

    fetchData();
  }, []);

  const filteredMatches = allMatches.filter(match =>
    match.winner.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.loser.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredUpcomingMatches = upcomingMatches.filter(match =>
    match.player1.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.player2.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedMatches = filteredMatches.slice(0, matchesToShow);
  const paginatedUpcoming = filteredUpcomingMatches.slice(0, upcomingToShow);

  const getPlayerAvatar = (name: string) => {
    const player = players.find(p => p.name === name);
    return player ? { avatar: player.avatar, initials: player.initials, id: player.id } : { avatar: '', initials: name.split(' ').map(n => n[0]).join(''), id: null };
  };
  
  const PlayerLink = ({name, className}: {name: string, className?: string}) => {
    const player = getPlayerAvatar(name);
    if (!player.id) {
        return <span className={cn("font-medium", className)}>{name}</span>;
    }
    return <Link href={`/players/${player.id}`} className={cn("font-medium hover:underline", className)}>{name}</Link>
  }


  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="hidden md:block">
            <h1 className="text-3xl font-bold">All Matches</h1>
            <p className="text-muted-foreground">Browse the full history of matches.</p>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by player name..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

       <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Calendar />
                Upcoming Matches
            </CardTitle>
            <CardDescription>Scheduled games for the upcoming days.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
                <p>Loading upcoming matches...</p>
            ) : paginatedUpcoming.length > 0 ? (
                <ul className="space-y-4">
                {paginatedUpcoming.map((match) => {
                    const player1 = getPlayerAvatar(match.player1);
                    const player2 = getPlayerAvatar(match.player2);
                    return (
                        <li key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 justify-start w-2/5">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={player1.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.player1} />
                                    <AvatarFallback>{player1.initials}</AvatarFallback>
                                </Avatar>
                                <PlayerLink name={match.player1} className="text-sm" />
                            </div>
                            <div className="flex-1 text-center">
                                <span className="text-muted-foreground text-sm">vs</span>
                                <p className="text-xs text-muted-foreground">{new Date(match.date).toLocaleDateString()} at {match.time}</p>
                            </div>
                            <div className="flex items-center gap-2 justify-end w-2/5">
                                <PlayerLink name={match.player2} className="text-sm" />
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={player2.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.player2} />
                                    <AvatarFallback>{player2.initials}</AvatarFallback>
                                </Avatar>
                            </div>
                        </li>
                    );
                })}
                </ul>
            ) : (
                 <div className="text-center py-16">
                    <h3 className="text-xl font-semibold">No Upcoming Matches</h3>
                    <p className="text-muted-foreground mt-2">There are no scheduled matches.</p>
                </div>
            )}
          </CardContent>
          {filteredUpcomingMatches.length > upcomingToShow && (
            <CardFooter>
              <Button onClick={() => setUpcomingToShow(upcomingToShow + 5)} variant="secondary" className="w-full">
                View More
              </Button>
            </CardFooter>
          )}
        </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords />
            Match Results
          </CardTitle>
           <CardDescription>
            Showing {paginatedMatches.length} of {filteredMatches.length} matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <p>Loading match results...</p>
          ) : paginatedMatches.length > 0 ? (
            <ul className="space-y-4">
              {paginatedMatches.map((match) => {
                const winner = getPlayerAvatar(match.winner);
                const loser = getPlayerAvatar(match.loser);
                return (
                  <li key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 justify-start w-2/5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={winner.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.winner} />
                        <AvatarFallback>{winner.initials}</AvatarFallback>
                      </Avatar>
                      <PlayerLink name={match.winner} className="text-sm" />
                    </div>
                    <div className="flex-1 text-center">
                      <Link href={`/match/${match.id}`}>
                        <Badge variant="secondary" className="font-bold text-lg">{match.score}</Badge>
                         <p className="text-xs text-muted-foreground mt-1">{new Date(match.date).toLocaleDateString()}</p>
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 justify-end w-2/5">
                      <PlayerLink name={match.loser} className="text-sm" />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={loser.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.loser} />
                        <AvatarFallback>{loser.initials}</AvatarFallback>
                      </Avatar>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-center py-16">
                <h3 className="text-xl font-semibold">No Matches Found</h3>
                <p className="text-muted-foreground mt-2">Your search for "{searchQuery}" did not match any results.</p>
            </div>
          )}
        </CardContent>
        {filteredMatches.length > matchesToShow && (
          <CardFooter>
            <Button onClick={() => setMatchesToShow(matchesToShow + 10)} variant="secondary" className="w-full">
              View More
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

    
