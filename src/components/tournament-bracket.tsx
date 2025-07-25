
"use client";

import { cn } from "@/lib/utils";
import type { Player } from "@/app/players/page";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export interface Matchup {
  id: number;
  player1?: string;
  player2?: string;
  score1?: number;
  score2?: number;
  winner?: string;
  matchId?: number;
}

export interface Round {
  name: string;
  matchups: Matchup[];
}

interface TournamentBracketProps {
  bracket: Round[];
  players: Player[];
}

export function TournamentBracket({ bracket, players }: TournamentBracketProps) {
  
  const getPlayer = (name: string | undefined) => {
    if (!name) return null;
    return players.find(p => p.name === name);
  };
  
  return (
    <div className="flex overflow-x-auto bg-muted/50 p-4 rounded-lg">
      <div className="flex gap-8">
        {bracket.map((round, roundIndex) => (
          <div key={roundIndex} className="flex flex-col justify-around">
            <h3 className="text-lg font-bold text-center mb-4">{round.name}</h3>
            <div className="space-y-8">
              {round.matchups.map((matchup) => (
                <div key={matchup.id} className="relative">
                  <div className="relative bg-background p-3 rounded-lg shadow-md w-64">
                    <div className={cn("flex justify-between items-center pb-2 mb-2 border-b", matchup.winner === matchup.player1 && "font-bold text-primary")}>
                      <div className="flex items-center gap-2">
                        {matchup.player1 ? (
                          <>
                            <Avatar className="h-6 w-6">
                               <AvatarImage src={getPlayer(matchup.player1)?.avatar} data-ai-hint="player portrait" />
                               <AvatarFallback>{getPlayer(matchup.player1)?.initials}</AvatarFallback>
                            </Avatar>
                            <Link href={`/players/${getPlayer(matchup.player1)?.id}`} className="hover:underline">{matchup.player1}</Link>
                          </>
                        ) : (
                          <span className="text-muted-foreground italic">TBD</span>
                        )}
                      </div>
                      <span className="font-semibold">{matchup.score1 ?? "-"}</span>
                    </div>
                     <div className={cn("flex justify-between items-center", matchup.winner === matchup.player2 && "font-bold text-primary")}>
                      <div className="flex items-center gap-2">
                         {matchup.player2 ? (
                          <>
                             <Avatar className="h-6 w-6">
                               <AvatarImage src={getPlayer(matchup.player2)?.avatar} data-ai-hint="player portrait" />
                               <AvatarFallback>{getPlayer(matchup.player2)?.initials}</AvatarFallback>
                            </Avatar>
                            <Link href={`/players/${getPlayer(matchup.player2)?.id}`} className="hover:underline">{matchup.player2}</Link>
                          </>
                        ) : (
                          <span className="text-muted-foreground italic">TBD</span>
                        )}
                      </div>
                      <span className="font-semibold">{matchup.score2 ?? "-"}</span>
                    </div>
                     {matchup.matchId && (
                         <Link href={`/match/${matchup.matchId}`} className="absolute -bottom-2 -right-2 text-xs">
                           <div className="bg-secondary text-secondary-foreground rounded-full h-5 w-5 flex items-center justify-center shadow-md hover:bg-primary hover:text-primary-foreground transition-colors">
                            {'>'}
                           </div>
                        </Link>
                     )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

