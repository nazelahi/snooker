
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
import type { Tournament } from "@/app/tournaments/page";
import type { Player } from "@/app/players/page";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { Match, UpcomingMatch, LiveMatch } from "@/types/matches";

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
}

export default function DashboardPage() {
  const [playerStandings, setPlayerStandings] = useState<Player[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [recentResults, setRecentResults] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [upcomingToShow, setUpcomingToShow] = useState(5);
  const [recentToShow, setRecentToShow] = useState(5);
  const [notices, setNotices] = useState<Notice[]>([]);
  
  const liveMatchesPlugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }));
  const noticesPlugin = useRef(Autoplay({ delay: 5500, stopOnInteraction: false, stopOnMouseEnter: true }));
  const mediaPlugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true }));
  const upcomingTournamentsPlugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true }));
  const inProgressTournamentsPlugin = useRef(Autoplay({ delay: 4500, stopOnInteraction: false, stopOnMouseEnter: true }));
  const finishedTournamentsPlugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }));

  const fetchDashboardData = async () => {
    // Fetch all data from Supabase
    const { data: playersData } = await supabase.from('players').select('*').order('wins', { ascending: false });
    if (playersData) {
        setPlayers(playersData);
        setPlayerStandings(playersData);
    }

    const { data: upcomingData } = await supabase.from('upcoming_matches').select('*').order('date').order('time').limit(10);
    if(upcomingData) setUpcomingMatches(upcomingData as UpcomingMatch[]);
    
    const { data: resultsData } = await supabase.from('matches').select('*').order('date', { ascending: false }).limit(10);
    if(resultsData) setRecentResults(resultsData as Match[]);

    const { data: liveData } = await supabase.from('live_matches').select('*');
    if(liveData) setLiveMatches(liveData);

    const { data: tournamentsData } = await supabase.from('tournaments').select('*');
    if (tournamentsData) setTournaments(tournamentsData);
    
    const { data: noticesData } = await supabase.from('notices').select('*').order('date', { ascending: false }).limit(5);
    if (noticesData) setNotices(noticesData as Notice[]);
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getPlayerAvatar = (name: string) => {
    const player = players.find(p => p.name === name);
    return player ? {avatar: player.avatar, initials: player.initials, id: player.id} : {avatar: '', initials: name.split(' ').map(n=>n[0]).join(''), id: null};
  }

  const upcomingTournaments = tournaments.filter(t => t.status === "Upcoming");
  const inProgressTournaments = tournaments.filter(t => t.status === "In Progress");
  const finishedTournaments = tournaments.filter(t => t.status === "Finished" && t.winner);
  const matchMedia = recentResults.flatMap(match => (match.media || []).map(mediaUrl => ({...match, mediaUrl})));

  const PlayerLink = ({name, className}: {name: string, className?: string}) => {
    const player = getPlayerAvatar(name);
    if (!player.id) {
        return <span className={cn("font-medium", className)}>{name}</span>;
    }
    return <Link href={`/players/${player.id}`} className={cn("font-medium hover:underline", className)}>{name}</Link>
  }


  return (
    <div className="flex flex-col gap-8">
      {liveMatches.length > 0 && (
         <Card>
            <CardContent className="p-0">
                 <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    plugins={[liveMatchesPlugin.current]}
                    className="w-full relative"
                    >
                    <CarouselContent>
                        {liveMatches.map((match) => (
                            <CarouselItem key={match.id}>
                                <div className="p-1 rounded-lg">
                                    <div className="relative text-center mb-1">
                                        <span className="text-xs text-muted-foreground">{match.tournament_name}</span>
                                        <div className="absolute right-0 top-0 flex items-center gap-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                            <span className="text-xs font-medium text-green-400">Live</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 items-center text-center">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="font-bold text-base text-right"><PlayerLink name={match.player1} /></div>
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={getPlayerAvatar(match.player1).avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.player1} />
                                            <AvatarFallback>{getPlayerAvatar(match.player1).initials}</AvatarFallback>
                                        </Avatar>
                                    </div>

                                    <div className="text-xl font-bold">
                                        <span className="text-primary">{match.score1}</span>
                                        <span className="mx-2">-</span>
                                        <span>{match.score2}</span>
                                    </div>

                                    <div className="flex items-center justify-start gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={getPlayerAvatar(match.player2).avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={match.player2} />
                                            <AvatarFallback>{getPlayerAvatar(match.player2).initials}</AvatarFallback>
                                        </Avatar>
                                        <div className="font-bold text-base text-left"><PlayerLink name={match.player2} /></div>
                                    </div>
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselDots />
                </Carousel>
            </CardContent>
         </Card>
      )}

      {notices.length > 0 && (
        <Carousel
            opts={{ align: "start", loop: true, }}
            plugins={[ noticesPlugin.current ]}
            className="w-full relative"
        >
            <CarouselContent>
                {notices.map((notice) => (
                    <CarouselItem key={notice.id} className="basis-full">
                         <Card className="bg-muted/50 animate-flash">
                            <CardHeader>
                                <CardTitle className="text-lg">{notice.title}</CardTitle>
                                <CardDescription>{format(new Date(notice.date), "PPP")}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2">{notice.content}</p>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" asChild>
                                    <Link href="/notices">Read More</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselDots />
        </Carousel>
      )}

      {matchMedia.length > 0 && (
        <Carousel
             opts={{
                align: "start",
                loop: true,
            }}
            plugins={[ mediaPlugin.current ]}
            className="w-full relative"
        >
            <CarouselContent>
                {matchMedia.map((media, index) => (
                    <CarouselItem key={index} className="basis-full">
                         <Card className="overflow-hidden">
                            <CardHeader className="p-0 relative">
                                <Image src={media.mediaUrl} width={600} height={400} alt={`Media from match ${media.id}`} className="w-full h-48 md:h-64 object-cover" />
                                <Button variant="outline" asChild className="absolute top-4 right-4">
                                    <Link href={`/match/${media.id}`}>
                                        View Match <ArrowRight className="ml-2 h-4 w-4"/>
                                    </Link>
                                </Button>
                            </CardHeader>
                        </Card>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselDots />
        </Carousel>
      )}

      {upcomingTournaments.length > 0 && (
        <div className="space-y-4">
              <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="text-primary" />
                  Upcoming Tournaments
              </CardTitle>
               <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    plugins={[ upcomingTournamentsPlugin.current ]}
                    className="w-full relative"
                >
                    <CarouselContent>
                        {upcomingTournaments.map((tournament) => (
                            <CarouselItem key={tournament.id} className="basis-full md:basis-1/2 lg:basis-1/3">
                                 <Card className="overflow-hidden h-full flex flex-col">
                                    <CardHeader className="p-0">
                                        <Image src={tournament.image || `https://placehold.co/600x400.png`} data-ai-hint="snooker tournament" width={600} height={400} alt={tournament.name} className="w-full h-48 object-cover"/>
                                    </CardHeader>
                                    <CardContent className="p-4 flex-grow">
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
                    <CarouselDots />
                </Carousel>
        </div>
      )}

      {inProgressTournaments.length > 0 && (
        <div className="space-y-4">
              <CardTitle className="flex items-center gap-2">
                  <Radio className="text-primary" />
                  In Progress Tournaments
              </CardTitle>
               <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    plugins={[ inProgressTournamentsPlugin.current ]}
                    className="w-full relative"
                >
                    <CarouselContent>
                        {inProgressTournaments.map((tournament) => (
                            <CarouselItem key={tournament.id} className="basis-full">
                                <Card className="overflow-hidden h-full flex flex-col">
                                    <CardHeader className="p-0 relative">
                                        <Image src={tournament.image || `https://placehold.co/600x400.png`} data-ai-hint="snooker tournament" width={600} height={400} alt={tournament.name} className="w-full h-48 object-cover"/>
                                        <Button variant="outline" asChild className="absolute top-4 right-4">
                                            <Link href={`/tournaments/${tournament.id}`}>
                                                View Details <ArrowRight className="ml-2 h-4 w-4"/>
                                            </Link>
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-4 flex-grow">
                                        <h3 className="text-lg font-bold">{tournament.name}</h3>
                                        <p className="text-sm text-muted-foreground">{tournament.format} | {tournament.players} Players</p>
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselDots />
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
                        loop: true,
                    }}
                    plugins={[ finishedTournamentsPlugin.current ]}
                    className="w-full relative"
                >
                    <CarouselContent>
                        {finishedTournaments.map((tournament) => {
                          const winner = getPlayerAvatar(tournament.winner || '');
                          return (
                            <CarouselItem key={tournament.id} className="basis-full">
                                <Card className="overflow-hidden h-full flex flex-col">
                                    <CardHeader className="relative flex flex-row items-center gap-4 p-4 bg-muted/50">
                                        <Trophy className="h-8 w-8 text-amber-400"/>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Winner</p>
                                            <h3 className="text-lg font-bold"><PlayerLink name={tournament.winner!} /></h3>
                                        </div>
                                        <Button variant="outline" asChild className="absolute top-4 right-4">
                                            <Link href={`/tournaments/${tournament.id}`}>
                                                View Results
                                            </Link>
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-4 flex-grow">
                                        <h3 className="text-md font-semibold">{tournament.name}</h3>
                                        <p className="text-sm text-muted-foreground">{tournament.format}</p>
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                          );
                        })}
                    </CarouselContent>
                    <CarouselDots />
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
            <div className="text-2xl font-bold">{players.length > 0 ? Math.max(...players.map(p => p.highest_break)) : 0}</div>
            <p className="text-xs text-muted-foreground">by {players.length > 0 ? players.reduce((prev, current) => (prev.highest_break > current.highest_break) ? prev : current).name : 'N/A'}</p>
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
                            <PlayerLink name={match.player1} className="text-sm" />
                        </div>
                        <div className="flex-1 text-center">
                            <span className="text-muted-foreground text-sm">vs</span>
                            <p className="text-sm text-muted-foreground">{new Date(match.date).toLocaleDateString()} at {match.time}</p>
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
                          <PlayerLink name={match.winner} className="text-sm" />
                        </div>
                        <div className="flex-1 text-center">
                            <Link href={`/match/${match.id}`}>
                                <Badge variant="secondary" className="font-bold text-lg">{match.score}</Badge>
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
                <TableRow key={player.id} className="bg-muted/50 rounded-lg">
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
                    <TableCell className="text-center hidden md:table-cell">{player.matches_played}</TableCell>
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
