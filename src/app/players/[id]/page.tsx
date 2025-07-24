
"use client";

import { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, BarChart, Percent, Activity } from "lucide-react";
import { getFromStorage } from "@/lib/storage";
import type { Player } from "@/app/players/page";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PlayerProfilePage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      const players = getFromStorage<Player[]>('players', []);
      const foundPlayer = players.find(p => p.id === parseInt(id));
      setPlayer(foundPlayer || null);
    }
  }, [id]);

  if (!player) {
    return (
        <div className="text-center">
            <p className="text-lg">Player not found.</p>
            <Link href="/players" passHref>
                <Button variant="link">Back to Players</Button>
            </Link>
        </div>
    );
  }

  const userStats = {
    name: player.name,
    initials: player.initials,
    matchesPlayed: player.matchesPlayed,
    wins: Math.round(player.matchesPlayed * (parseInt(player.winRate)/100)),
    losses: Math.round(player.matchesPlayed * (1 - parseInt(player.winRate)/100)),
    winRate: player.winRate,
    highestBreak: player.highestBreak,
    averageBreak: Math.floor(player.highestBreak / 2),
    tournamentsWon: player.skillLevel === 'Pro' ? 2 : (player.skillLevel === 'Intermediate' ? 1 : 0),
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={player.avatar || `https://placehold.co/80x80.png`} data-ai-hint="player portrait" alt={userStats.name} />
          <AvatarFallback>{userStats.initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-4xl font-bold">{userStats.name}</h1>
          <p className="text-muted-foreground">Player Profile & Statistics</p>
        </div>
      </div>

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
            <p className="text-xs text-muted-foreground">Personal best</p>
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
        <Link href="/players" passHref>
            <Button variant="outline" className="w-full md:w-auto">Back to Players List</Button>
        </Link>
    </div>
  );
}
