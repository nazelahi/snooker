
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getFromStorage } from "@/lib/storage";
import type { Tournament } from "@/app/tournaments/page";
import { Calendar, Users, Shield, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function TournamentDetailsPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      const tournaments = getFromStorage<Tournament[]>('tournaments', []);
      const foundTournament = tournaments.find(t => t.id === parseInt(id));
      setTournament(foundTournament || null);
    }
  }, [id]);

  const handleApply = () => {
    toast({
        title: "Application Sent!",
        description: `Your application for "${tournament?.name}" has been received.`,
    });
  }

  if (!tournament) {
    return (
        <div className="text-center">
            <p className="text-lg">Tournament not found.</p>
            <Link href="/tournaments" passHref>
                <Button variant="link">Back to Tournaments</Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <Button variant="outline" onClick={() => router.back()} className="w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tournaments
        </Button>
      <Card className="overflow-hidden">
        <Image src={tournament.image || `https://placehold.co/1200x400.png`} data-ai-hint="tournament banner" width={1200} height={400} alt={tournament.name} className="w-full h-64 object-cover"/>
        <CardHeader>
          <CardTitle className="text-4xl font-bold">{tournament.name}</CardTitle>
          <div className="flex items-center gap-4 text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{tournament.status}</span>
            </div>
            <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>{tournament.players} Players</span>
            </div>
            <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>{tournament.format}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Tournament Rules</h3>
            <p className="text-muted-foreground whitespace-pre-line">{tournament.rules}</p>
          </div>
        </CardContent>
        <CardFooter>
            {tournament.status === 'Upcoming' && (
                 <Button onClick={handleApply}>Apply to Participate</Button>
            )}
            {tournament.status === 'In Progress' && (
                <Badge>In Progress</Badge>
            )}
             {tournament.status === 'Finished' && (
                <Badge variant="secondary">Finished</Badge>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
