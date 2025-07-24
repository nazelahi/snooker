
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { BarChart, Users, Trophy, ClipboardList, Radio, Calendar as CalendarIcon, ArrowRight, Camera, Megaphone } from "lucide-react";
import { getFromStorage, saveToStorage } from "@/lib/storage";
import type { LiveMatch, Tournament } from "@/app/tournaments/page";
import type { Player } from "@/app/players/page";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
  CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { format } from 'date-fns';

const initialUpcomingMatches = [
  { id: 1, player1: "Ronnie O'Sullivan", player2: "Judd Trump", date: "2024-08-15", time: "19:00", tournamentId: 1 },
  { id: 2, player1: "Mark Selby", player2: "Neil Robertson", date: "2024-08-15", time: "21:00", tournamentId: 1 },
  { id: 3, player1: "Alice Johnson", player2: "Bob Williams", date: "2024-08-16", time: "20:00", tournamentId: 2 },
];

const initialRecentResults = [
  { id: 1, winner: "Ronnie O'Sullivan", loser: "John Higgins", score: "6-2", date: "2024-08-10", tournamentId: 1 },
  { id: 2, winner: "Judd Trump", loser: "Kyren Wilson", score: "6-4", date: "2024-08-09", tournamentId: 1 },
  { id: 3, winner: "Mark Selby", loser: "Neil Robertson", score: "5-1", date: "2024-08-11", tournamentId: 2 },
];

const initialLiveMatches: LiveMatch[] = [
    { id: 1, tournamentId: 1, tournamentName: "Club Championship 2024", player1: "Ronnie O'Sullivan", player2: "Judd Trump", score1: 3, score2: 2 },
    { id: 2, tournamentId: 2, tournamentName: "Summer League", player1: "Mark Selby", player2: "Neil Robertson", score1: 1, score2: 4 },
];

const initialPlayers: Player[] = [
    { id: 1, name: "Ronnie O'Sullivan", skillLevel: "Pro", matchesPlayed: 25, winRate: "88%", highestBreak: 147, avatar: "/avatars/ronnie.png", initials: "RO", wins: 22, losses: 3 },
    { id: 2, name: "Judd Trump", skillLevel: "Pro", matchesPlayed: 28, winRate: "71%", highestBreak: 147, avatar: "/avatars/judd.png", initials: "JT", wins: 20, losses: 8 },
    { id: 3, name: "Mark Selby", skillLevel: "Pro", matchesPlayed: 26, winRate: "73%", highestBreak: 145, avatar: "/avatars/mark.png", initials: "MS", wins: 19, losses: 7 },
    { id: 4, name: "Neil Robertson", skillLevel: "Pro", matchesPlayed: 24, winRate: "75%", highestBreak: 147, avatar: "/avatars/neil.png", initials: "NR", wins: 18, losses: 6 },
    { id: 5, name: "Alice Johnson", skillLevel: "Intermediate", matchesPlayed: 40, winRate: "60%", highestBreak: 92, avatar: "/avatars/alice.png", initials: "AJ", wins: 24, losses: 16 },
    { id: 6, name: "Bob Williams", skillLevel: "Beginner", matchesPlayed: 15, winRate: "40%", highestBreak: 45, avatar: "/avatars/bob.png", initials: "BW", wins: 6, losses: 9 },
];

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
}

export default function DashboardPage() {
  const [playerStandings, setPlayerStandings] = useState<Player[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState(initialUpcomingMatches);
  const [recentResults, setRecentResults] = useState(initialRecentResults);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [upcomingToShow, setUpcomingToShow] = useState(5);
  const [recentToShow, setRecentToShow] = useState(5);
  const [matchMedia, setMatchMedia] = useState<string[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const autoplayPlugin = useRef(Autoplay({ delay: 2000, stopOnInteraction: true }));
  const [liveMatchApi, setLiveMatchApi] = useState<CarouselApi>();
  const [mediaApi, setMediaApi] = useState<CarouselApi>();
  const [noticeApi, setNoticeApi] = useState<CarouselApi>();


  const fetchDashboardData = () => {
    const storedPlayers = getFromStorage('players', initialPlayers);
    const storedMatches = getFromStorage('upcomingMatches', initialUpcomingMatches);
    const storedResults = getFromStorage('recentResults', initialRecentResults);
    const storedLiveMatches = getFromStorage('liveMatches', initialLiveMatches);
    const storedTournaments = getFromStorage('tournaments', []);
    const storedNotices = getFromStorage('notices', []);

    setPlayers(storedPlayers);
    setNotices(storedNotices.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    const sortedStandings = [...storedPlayers]
        .sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0));
    setPlayerStandings(sortedStandings);


    const sortedMatches = storedMatches.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
    });
    setUpcomingMatches(sortedMatches);

    setRecentResults(storedResults);
    setLiveMatches(storedLiveMatches);
    setTournaments(storedTournaments);

    const allMedia = storedResults
        .map(match => match.media || [])
        .flat()
        .reverse();
    setMatchMedia(allMedia);
  }

  useEffect(() => {
    // Initial data load
    fetchDashboardData();

    // Set initial values if they don't exist
    if (localStorage.getItem('players') === null) {
        saveToStorage('players', initialPlayers);
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
    if (localStorage.getItem('notices') === null) {
        saveToStorage('notices', []);
    }
    if (localStorage.getItem('tournaments') === null) {
        saveToStorage('tournaments', []);
    }

    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'notices') {
            const newNotices = getFromStorage('notices', []);
            setNotices(newNotices.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } else {
            // For other changes, we can refetch all data
            fetchDashboardData();
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getPlayerAvatar = (name: string) => {
    const player = players.find(p => p.name === name);
    return player ? {avatar: player.avatar, initials: player.initials, id: player.id} : {avatar: '', initials: name.split(' ').map(n=>n[0]).join(''), id: null};
  }

  const upcomingTournaments = tournaments.filter(t => t.status === "Upcoming");
  const finishedTournaments = tournaments.filter(t => t.status === "Finished" && t.winner);

  const PlayerLink = ({name}: {name: string}) => {
    const player = getPlayerAvatar(name);
    if (!player.id) {
        return <span className="font-medium">{name}</span>;
    }
    return <Link href={`/players/${player.id}`} className="font-medium hover:underline">{name}</Link>
  }


  return (
    <div className="flex flex-col gap-8">
      {liveMatches.length > 0 && (
        <Card className="relative">
          <CardContent className="p-0">
            <Carousel
              setApi={setLiveMatchApi}
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {liveMatches.map((match) => (
                  <CarouselItem key={match.id} className="w-full">
                    <div className="p-1">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="relative text-center mb-2">
                            <span className="text-sm text-muted-foreground">{match.tournamentName}</span>
                            <div className="absolute right-0 top-0 flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="text-sm font-medium text-green-400">Live</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 items-center text-center">
                          <div className="flex items-center justify-end gap-2 md:gap-4">
                              <div className="font-bold text-lg text-right"><PlayerLink name={match.player1} /></div>
                              <Avatar>
                                  <AvatarImage src={getPlayerAvatar(match.player1).avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.player1} />
                                  <AvatarFallback>{getPlayerAvatar(match.player1).initials}</AvatarFallback>
                              </Avatar>
                          </div>

                          <div className="text-2xl md:text-4xl font-bold">
                              <span className="text-primary">{match.score1}</span>
                              <span className="mx-2 md:mx-4">-</span>
                              <span>{match.score2}</span>
                          </div>

                          <div className="flex items-center justify-start gap-2 md:gap-4">
                              <Avatar>
                                  <AvatarImage src={getPlayerAvatar(match.player2).avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.player2} />
                                  <AvatarFallback>{getPlayerAvatar(match.player2).initials}</AvatarFallback>
                              </Avatar>
                              <div className="font-bold text-lg text-left"><PlayerLink name={match.player2} /></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {liveMatches.length > 1 && liveMatchApi && <CarouselDots api={liveMatchApi} />}
            </Carousel>
          </CardContent>
        </Card>
      )}

      {notices.length > 0 && (
         <Card className="relative">
            <CardContent className="p-0">
                 <Carousel
                    setApi={setNoticeApi}
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent>
                        {notices.map((notice) => (
                             <CarouselItem key={notice.id} className="w-full">
                                <div className="p-1">
                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <div className="flex items-start gap-3">
                                            <Megaphone className="h-5 w-5 text-primary mt-0.5 shrink-0"/>
                                            <div>
                                                <h3 className="font-semibold text-lg">{notice.title}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">{notice.content}</p>
                                                <p className="text-xs text-muted-foreground/80 mt-2">{format(new Date(notice.date), "PPP")}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                     {notices.length > 1 && noticeApi && <CarouselDots api={noticeApi} />}
                </Carousel>
            </CardContent>
         </Card>
      )}
      
       <Card className="relative">
            <CardContent className="p-0">
                {matchMedia.length > 0 ? (
                     <Carousel
                        setApi={setMediaApi}
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        plugins={[autoplayPlugin.current]}
                        className="w-full"
                    >
                        <CarouselContent>
                            {matchMedia.map((mediaUrl, index) => (
                                <CarouselItem key={index} className="w-full">
                                    <div className="p-1">
                                      <div className="relative aspect-[3/1] rounded-lg overflow-hidden bg-muted">
                                          {mediaUrl.startsWith('data:image') && (
                                              <Image src={mediaUrl} alt={`Match media ${index + 1}`} layout="fill" objectFit="cover" />
                                          )}
                                          {mediaUrl.startsWith('data:video') && (
                                              <video src={mediaUrl} controls className="w-full h-full object-cover" />
                                          )}
                                      </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        {matchMedia.length > 1 && mediaApi && <CarouselDots api={mediaApi} />}
                    </Carousel>
                ) : (
                    <p className="text-muted-foreground text-center py-4">No match media has been uploaded yet.</p>
                )}
            </CardContent>
        </Card>

      {upcomingTournaments.length > 0 && (
        <div className="space-y-4">
              <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="text-primary" />
                  Upcoming Tournaments
              </CardTitle>
              <Carousel
                  opts={{
                      align: "start",
                  }}
                  className="w-full"
              >
                  <CarouselContent className="-ml-2">
                      {upcomingTournaments.map((tournament) => (
                          <CarouselItem key={tournament.id} className="md:basis-1/2 lg:basis-1/3 pl-2">
                              <Card className="overflow-hidden">
                                  <CardHeader className="p-0">
                                      <Image src={tournament.image || `https://placehold.co/600x400.png`} data-ai-hint="snooker tournament" width={600} height={400} alt={tournament.name} className="w-full h-48 object-cover"/>
                                  </CardHeader>
                                  <CardContent className="p-4">
                                      <h3 className="text-lg font-bold">{tournament.name}</h3>
                                      <p className="text-sm text-muted-foreground">{tournament.format} | {tournament.players} Players</p>
                                  </CardContent>
                                  <CardFooter className="p-4 bg-muted/50">
                                      <Button variant="outline" asChild>
                                         <Link href={`/tournaments/${tournament.id}`}>
                                           View Details <ArrowRight className="ml-2 h-4 w-4"/>
                                         </Link>
                                      </Button>
                                  </CardFooter>
                               </Card>
                          </CarouselItem>
                      ))}
                  </CarouselContent>
              </Carousel>
        </div>
      )}

      {finishedTournaments.length > 0 && (
        <div className="space-y-4">
              <CardTitle className="flex items-center gap-2">
                  <Trophy className="text-primary" />
                  Finished Tournaments
              </CardTitle>
              <Carousel
                  opts={{
                      align: "start",
                  }}
                  className="w-full"
              >
                  <CarouselContent className="-ml-2">
                      {finishedTournaments.map((tournament) => {
                        const winner = getPlayerAvatar(tournament.winner || '');
                        return (
                          <CarouselItem key={tournament.id} className="md:basis-1/2 lg:basis-1/3 pl-2">
                              <Card className="overflow-hidden">
                                <CardHeader className="flex flex-row items-center gap-4 p-4 bg-muted/50">
                                    <Trophy className="h-8 w-8 text-amber-400"/>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Winner</p>
                                      <h3 className="text-lg font-bold"><PlayerLink name={tournament.winner!} /></h3>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="p-4">
                                      <h3 className="text-md font-semibold">{tournament.name}</h3>
                                      <p className="text-sm text-muted-foreground">{tournament.format}</p>
                                  </CardContent>
                                  <CardFooter className="p-4">
                                      <Button variant="outline" asChild>
                                         <Link href={`/tournaments/${tournament.id}`}>
                                           View Results <ArrowRight className="ml-2 h-4 w-4"/>
                                         </Link>
                                      </Button>
                                  </CardFooter>
                               </Card>
                          </CarouselItem>
                        );
                      })}
                  </CarouselContent>
              </Carousel>
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{players.length}</div>
            <p className="text-xs text-muted-foreground">+5 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tournaments.filter(t => t.status === "In Progress").length}</div>
            <p className="text-xs text-muted-foreground">2 Knockout, 2 League</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matches Played Today</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveMatches.length}</div>
            <p className="text-xs text-muted-foreground">Currently live</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Break</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{players.length > 0 ? Math.max(...players.map(p => p.highestBreak)) : 0}</div>
            <p className="text-xs text-muted-foreground">by {players.length > 0 ? players.reduce((prev, current) => (prev.highestBreak > current.highestBreak) ? prev : current).name : 'N/A'}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Matches</CardTitle>
            <CardDescription>Scheduled games for today and tomorrow.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {upcomingMatches.slice(0, upcomingToShow).map((match) => {
                const player1 = getPlayerAvatar(match.player1);
                const player2 = getPlayerAvatar(match.player2);
                return (
                    <li key={match.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 justify-start w-2/5">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={player1.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.player1} />
                                <AvatarFallback>{player1.initials}</AvatarFallback>
                            </Avatar>
                            <PlayerLink name={match.player1} />
                        </div>
                        <div className="flex-1 text-center">
                            <span className="text-muted-foreground text-sm">vs</span>
                            <p className="text-xs text-muted-foreground">{new Date(match.date).toLocaleDateString()} at {match.time}</p>
                        </div>
                        <div className="flex items-center gap-2 justify-end w-2/5">
                            <PlayerLink name={match.player2} />
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={player2.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.player2} />
                                <AvatarFallback>{player2.initials}</AvatarFallback>
                            </Avatar>
                        </div>
                    </li>
                );
              })}
            </ul>
          </CardContent>
          {upcomingToShow < upcomingMatches.length && (
            <CardFooter>
              <Button onClick={() => setUpcomingToShow(upcomingToShow + 5)} variant="secondary" className="w-full">
                View More
              </Button>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
            <CardDescription>Latest match outcomes.</CardDescription>
          </CardHeader>
          <CardContent>
          <ul className="space-y-4">
              {recentResults.slice(0, recentToShow).map((match) => {
                const winner = getPlayerAvatar(match.winner);
                const loser = getPlayerAvatar(match.loser);
                return (
                    <li key={match.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 justify-start w-2/5">
                          <Avatar className="h-8 w-8">
                              <AvatarImage src={winner.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.winner} />
                              <AvatarFallback>{winner.initials}</AvatarFallback>
                          </Avatar>
                          <PlayerLink name={match.winner} />
                        </div>
                        <div className="flex-1 text-center">
                            <Link href={`/match/${match.id}`}>
                                <Badge variant="secondary" className="font-bold text-lg">{match.score}</Badge>
                            </Link>
                        </div>
                      <div className="flex items-center gap-2 justify-end w-2/5">
                            <PlayerLink name={match.loser} />
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={loser.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.loser} />
                                <AvatarFallback>{loser.initials}</AvatarFallback>
                            </Avatar>
                      </div>
                    </li>
                );
              })}
            </ul>
          </CardContent>
          {recentToShow < recentResults.length && (
            <CardFooter>
                <Button onClick={() => setRecentToShow(recentToShow + 5)} variant="secondary" className="w-full">
                    View More
                </Button>
            </CardFooter>
          )}
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
                <TableHead className="w-[50px] text-center">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-center hidden md:table-cell">Matches</TableHead>
                <TableHead className="text-center">Wins</TableHead>
                <TableHead className="text-center hidden md:table-cell">Losses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerStandings.map((player, index) => (
                <TableRow key={player.id}>
                    <TableCell className="font-medium text-center">{index + 1}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={player.name} />
                            <AvatarFallback>{player.initials}</AvatarFallback>
                        </Avatar>
                         <Link href={`/players/${player.id}`} className="font-medium hover:underline">
                            {player.name}
                        </Link>
                        </div>
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell">{player.matchesPlayed}</TableCell>
                    <TableCell className="text-green-400 text-center">{player.wins}</TableCell>
                    <TableCell className="text-red-400 text-center hidden md:table-cell">{player.losses}</TableCell>
                    </TableRow>
                )
            )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
