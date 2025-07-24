
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
import { BarChart, Users, Trophy, ClipboardList, Radio } from "lucide-react";
import { getFromStorage, saveToStorage } from "@/lib/storage";
import type { LiveMatch } from "@/app/tournaments/page";
import type { Player } from "@/app/players/page";

const initialPlayerStandings = [
  { rank: 1, name: "Ronnie O'Sullivan", matchesPlayed: 25, wins: 22, losses: 3, avatar: "/avatars/ronnie.png", initials: "RO" },
  { rank: 2, name: "Judd Trump", matchesPlayed: 28, wins: 20, losses: 8, avatar: "/avatars/judd.png", initials: "JT" },
  { rank: 3, name: "Mark Selby", matchesPlayed: 26, wins: 19, losses: 7, avatar: "/avatars/mark.png", initials: "MS" },
  { rank: 4, name: "Neil Robertson", matchesPlayed: 24, wins: 18, losses: 6, avatar: "/avatars/neil.png", initials: "NR" },
];

const initialUpcomingMatches = [
  { id: 1, player1: "Ronnie O'Sullivan", player2: "Judd Trump", date: "2024-08-15", time: "19:00" },
  { id: 2, player1: "Mark Selby", player2: "Neil Robertson", date: "2024-08-15", time: "21:00" },
];

const initialRecentResults = [
  { id: 1, winner: "Ronnie O'Sullivan", loser: "John Higgins", score: "6-2", date: "2024-08-10" },
  { id: 2, winner: "Judd Trump", loser: "Kyren Wilson", score: "6-4", date: "2024-08-09" },
];

const initialLiveMatches: LiveMatch[] = [
    { id: 1, tournamentName: "Club Championship 2024", player1: "Ronnie O'Sullivan", player2: "Judd Trump", score1: 3, score2: 2 },
    { id: 2, tournamentName: "Summer League", player1: "Mark Selby", player2: "Neil Robertson", score1: 1, score2: 4 },
];

const initialPlayers: Player[] = [
    { id: 1, name: "Ronnie O'Sullivan", skillLevel: "Pro", matchesPlayed: 25, winRate: "88%", highestBreak: 147, avatar: "/avatars/ronnie.png", initials: "RO" },
    { id: 2, name: "Judd Trump", skillLevel: "Pro", matchesPlayed: 28, winRate: "71%", highestBreak: 147, avatar: "/avatars/judd.png", initials: "JT" },
    { id: 3, name: "Mark Selby", skillLevel: "Pro", matchesPlayed: 26, winRate: "73%", highestBreak: 145, avatar: "/avatars/mark.png", initials: "MS" },
    { id: 4, name: "Neil Robertson", skillLevel: "Pro", matchesPlayed: 24, winRate: "75%", highestBreak: 147, avatar: "/avatars/neil.png", initials: "NR" },
];

export default function DashboardPage() {
  const [playerStandings, setPlayerStandings] = useState(initialPlayerStandings);
  const [upcomingMatches, setUpcomingMatches] = useState(initialUpcomingMatches);
  const [recentResults, setRecentResults] = useState(initialRecentResults);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const storedStandings = getFromStorage('playerStandings', initialPlayerStandings);
    const storedMatches = getFromStorage('upcomingMatches', initialUpcomingMatches);
    const storedResults = getFromStorage('recentResults', initialRecentResults);
    const storedLiveMatches = getFromStorage('liveMatches', initialLiveMatches);
    const storedPlayers = getFromStorage('players', initialPlayers);

    setPlayerStandings(storedStandings);
    setUpcomingMatches(storedMatches);
    setRecentResults(storedResults);
    setLiveMatches(storedLiveMatches);
    setPlayers(storedPlayers);

    if (localStorage.getItem('playerStandings') === null) {
      saveToStorage('playerStandings', initialPlayerStandings);
    }
    if (localStorage.getItem('upcomingMatches') === null) {
      saveToStorage('upcomingMatches', initialUpcomingMatches);
    }
     if (localStorage.getItem('recentResults') === null) {
      saveToStorage('recentResults', initialRecentResults);
    }
    if (localStorage.getItem('liveMatches') === null) {
        saveToStorage('liveMatches', initialLiveMatches);
    }
    if (localStorage.getItem('players') === null) {
        saveToStorage('players', initialPlayers);
    }
  }, []);

  const getPlayerAvatar = (name: string) => {
    const player = players.find(p => p.name === name);
    return player ? {avatar: player.avatar, initials: player.initials} : {avatar: '', initials: name.split(' ').map(n=>n[0]).join('')};
  }

  return (
    <div className="flex flex-col gap-8">
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="text-primary animate-pulse" />
            Live Matches
          </CardTitle>
          <CardDescription>Ongoing matches in active tournaments.</CardDescription>
        </CardHeader>
        <CardContent>
          {liveMatches.length > 0 ? (
            <ul className="space-y-6">
              {liveMatches.map((match) => (
                <li key={match.id} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">{match.tournamentName}</span>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-sm font-medium text-green-400">Live</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 items-center text-center">
                    <div className="flex items-center justify-end gap-4">
                        <span className="font-bold text-lg">{match.player1}</span>
                        <Avatar>
                            <AvatarImage src={getPlayerAvatar(match.player1).avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.player1} />
                            <AvatarFallback>{getPlayerAvatar(match.player1).initials}</AvatarFallback>
                        </Avatar>
                    </div>

                    <div className="text-4xl font-bold">
                        <span className="text-primary">{match.score1}</span>
                        <span className="mx-4">-</span>
                        <span>{match.score2}</span>
                    </div>

                    <div className="flex items-center justify-start gap-4">
                        <Avatar>
                            <AvatarImage src={getPlayerAvatar(match.player2).avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.player2} />
                            <AvatarFallback>{getPlayerAvatar(match.player2).initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-lg">{match.player2}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">No live matches currently in progress.</p>
          )}
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">+5 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">2 Knockout, 2 League</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matches Played Today</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+10% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Break</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">147</div>
            <p className="text-xs text-muted-foreground">by Judd Trump</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Matches</CardTitle>
            <CardDescription>Scheduled games for today and tomorrow.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {upcomingMatches.map((match) => (
                <li key={match.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="font-medium">{match.player1} vs {match.player2}</div>
                  <div className="text-sm text-muted-foreground">{match.date} at {match.time}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
            <CardDescription>Latest match outcomes.</CardDescription>
          </CardHeader>
          <CardContent>
          <ul className="space-y-4">
              {recentResults.map((match) => (
                <li key={match.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <span className="font-medium">{match.winner}</span>
                    <span className="text-muted-foreground"> beat </span>
                    <span className="font-medium">{match.loser}</span>
                  </div>
                  <Badge variant="secondary">{match.score}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Player Standings</CardTitle>
          <CardDescription>Top players in the club league.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-center">Matches</TableHead>
                <TableHead className="text-center">Wins</TableHead>
                <TableHead className="text-center">Losses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerStandings.map((player) => (
                <TableRow key={player.rank}>
                  <TableCell className="font-medium text-center">{player.rank}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                         <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={player.name} />
                        <AvatarFallback>{player.initials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{player.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{player.matchesPlayed}</TableCell>
                  <TableCell className="text-green-400 text-center">{player.wins}</TableCell>
                  <TableCell className="text-red-400 text-center">{player.losses}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
