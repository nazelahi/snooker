
"use client";

import { useState, useEffect } from "react";
import type { Player } from "@/app/players/page";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Swords, BarChart2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Match } from "@/types/matches";

interface Comparison {
  player1Wins: number;
  player2Wins: number;
  matches: Match[];
}

export default function ComparePlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: playersData } = await supabase.from('players').select('*');
      if (playersData) {
        setPlayers(playersData.sort((a, b) => a.name.localeCompare(b.name)));
      }
      
      const { data: matchesData } = await supabase.from('matches').select('*');
      if (matchesData) {
        setAllMatches(matchesData as Match[]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (player1 && player2) {
      const p1Name = player1.name;
      const p2Name = player2.name;

      const relevantMatches = allMatches.filter(match =>
        (match.winner === p1Name && match.loser === p2Name) ||
        (match.winner === p2Name && match.loser === p1Name)
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const player1Wins = relevantMatches.filter(m => m.winner === p1Name).length;
      const player2Wins = relevantMatches.filter(m => m.winner === p2Name).length;

      setComparison({
        player1Wins,
        player2Wins,
        matches: relevantMatches,
      });
    } else {
      setComparison(null);
    }
  }, [player1, player2, allMatches]);

  const handleSelectPlayer1 = (id: string) => {
    const selected = players.find(p => p.id === parseInt(id));
    setPlayer1(selected || null);
  };

  const handleSelectPlayer2 = (id: string) => {
    const selected = players.find(p => p.id === parseInt(id));
    setPlayer2(selected || null);
  };
  
  const getPlayerAvatar = (name: string) => {
    const player = players.find(p => p.name === name);
    return player ? {avatar: player.avatar, initials: player.initials, id: player.id} : {avatar: '', initials: name.split(' ').map(n=>n[0]).join(''), id: null};
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <ArrowLeftRight className="h-10 w-10 text-primary" />
        <div>
            <h1 className="text-3xl font-bold">Head-to-Head</h1>
            <p className="text-muted-foreground">Compare stats between any two players.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Select Players</CardTitle>
            <CardDescription>Choose two players from the dropdowns below to see their match history.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                 <Select onValueChange={handleSelectPlayer1} disabled={loading}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Player 1" />
                    </SelectTrigger>
                    <SelectContent>
                        {players.filter(p => p.id !== player2?.id).map(p => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Select onValueChange={handleSelectPlayer2} disabled={loading}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Player 2" />
                    </SelectTrigger>
                    <SelectContent>
                        {players.filter(p => p.id !== player1?.id).map(p => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>

      {player1 && player2 && comparison && (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart2 />Overall Record</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-around items-center text-center p-8 bg-muted/50 rounded-lg">
                    <Link href={`/players/${player1.id}`} className="flex flex-col items-center gap-2 group">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={player1.avatar || `https://placehold.co/96x96.png`} data-ai-hint="player portrait" alt={player1.name} />
                            <AvatarFallback>{player1.initials}</AvatarFallback>
                        </Avatar>
                        <h3 className="text-xl font-bold group-hover:underline">{player1.name}</h3>
                    </Link>

                    <div className="text-5xl font-bold text-primary">
                        <span>{comparison.player1Wins}</span>
                        <span className="mx-4">-</span>
                        <span>{comparison.player2Wins}</span>
                    </div>

                     <Link href={`/players/${player2.id}`} className="flex flex-col items-center gap-2 group">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={player2.avatar || `https://placehold.co/96x96.png`} data-ai-hint="player portrait" alt={player2.name} />
                            <AvatarFallback>{player2.initials}</AvatarFallback>
                        </Avatar>
                        <h3 className="text-xl font-bold group-hover:underline">{player2.name}</h3>
                    </Link>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Swords />Match History</CardTitle>
                </CardHeader>
                <CardContent>
                    {comparison.matches.length > 0 ? (
                        <ul className="space-y-4">
                            {comparison.matches.map(match => {
                                const winner = getPlayerAvatar(match.winner);
                                const loser = getPlayerAvatar(match.loser);
                                return (
                                <li key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-2 justify-start w-2/5">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={winner.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.winner} />
                                        <AvatarFallback>{winner.initials}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-sm">{match.winner}</span>
                                    </div>
                                    <div className="flex-1 text-center">
                                    <Link href={`/match/${match.id}`}>
                                        <Badge variant="secondary" className="font-bold text-lg">{match.score}</Badge>
                                        <p className="text-xs text-muted-foreground mt-1">{new Date(match.date).toLocaleDateString()}</p>
                                    </Link>
                                    </div>
                                    <div className="flex items-center gap-2 justify-end w-2/5">
                                    <span className="font-medium text-sm">{match.loser}</span>
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
                        <p className="text-muted-foreground text-center py-8">These two players have not played against each other yet.</p>
                    )}
                </CardContent>
            </Card>
        </>
      )}

    </div>
  );
}
