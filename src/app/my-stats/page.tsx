
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, BarChart, Percent, Activity } from "lucide-react";
import { getFromStorage } from "@/lib/storage";
import type { Player } from "@/app/players/page";

const initialStats = {
  name: "John Doe",
  initials: "JD",
  matchesPlayed: 32,
  wins: 20,
  losses: 12,
  winRate: "62.5%",
  highestBreak: 112,
  averageBreak: 45,
  tournamentsWon: 2,
};

export default function MyStatsPage() {
  const [userStats, setUserStats] = useState(initialStats);
  const [currentUser, setCurrentUser] = useState<{name: string, email: string} | null>(null);

  useEffect(() => {
    // Fetch user data from local storage
    const userData = getFromStorage<{name: string, email: string} | null>('userData', null);
    if (userData) {
      setCurrentUser(userData);
      // For demonstration, we'll find this user in the players list
      // and display their stats. If not found, we use some default stats.
      const players = getFromStorage<Player[]>('players', []);
      const player = players.find(p => p.name.toLowerCase() === userData.name.toLowerCase());
      if (player) {
        setUserStats({
            name: player.name,
            initials: player.initials,
            matchesPlayed: player.matchesPlayed,
            wins: Math.round(player.matchesPlayed * (parseInt(player.winRate)/100)),
            losses: Math.round(player.matchesPlayed * (1 - parseInt(player.winRate)/100)),
            winRate: player.winRate,
            highestBreak: player.highestBreak,
            averageBreak: Math.floor(player.highestBreak / 2),
            tournamentsWon: player.skillLevel === 'Pro' ? 2 : (player.skillLevel === 'Intermediate' ? 1 : 0),
        });
      } else if (userData.name){
         setUserStats(prev => ({...prev, name: userData.name, initials: userData.name.split(' ').map(n => n[0]).join('')}));
      }
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={`https://placehold.co/80x80.png`} data-ai-hint="player portrait" alt={userStats.name} />
          <AvatarFallback>{userStats.initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-4xl font-bold">{userStats.name}</h1>
          <p className="text-muted-foreground">Your personal snooker statistics.</p>
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
            <p className="text-xs text-muted-foreground">Your personal best</p>
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
    </div>
  );
}
