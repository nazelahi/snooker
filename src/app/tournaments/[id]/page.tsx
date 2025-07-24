
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
import { getFromStorage, saveToStorage } from "@/lib/storage";
import type { Tournament } from "@/app/tournaments/page";
import { Calendar, Users, Shield, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import type { Notification } from "@/types/notifications";

export default function TournamentDetailsPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [currentUser, setCurrentUser] = useState<{name: string, email: string, isAdmin?: boolean} | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const userData = getFromStorage<{name: string, email: string, isAdmin?: boolean} | null>('userData', null);
    setCurrentUser(userData);

    if (id) {
      const tournaments = getFromStorage<Tournament[]>('tournaments', []);
      const foundTournament = tournaments.find(t => t.id === parseInt(id));
      setTournament(foundTournament || null);

      if (foundTournament && userData && foundTournament.registeredPlayers?.includes(userData.email)) {
        setHasApplied(true);
      }
    }
  }, [id]);

  const handleApply = () => {
    if (!currentUser || !tournament) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in to apply for a tournament.",
        });
        router.push('/login');
        return;
    }

    // Update tournament with new registered player
    const tournaments = getFromStorage<Tournament[]>('tournaments', []);
    const tournamentIndex = tournaments.findIndex(t => t.id === tournament.id);
    if (tournamentIndex !== -1) {
        const updatedTournament = {
            ...tournaments[tournamentIndex],
            registeredPlayers: [...(tournaments[tournamentIndex].registeredPlayers || []), currentUser.email]
        };
        tournaments[tournamentIndex] = updatedTournament;
        saveToStorage('tournaments', tournaments);
        setHasApplied(true);
    }
    
    // Create notification for admin
    const notifications = getFromStorage<Notification[]>('notifications', []);
    const newNotification: Notification = {
      id: Date.now().toString(),
      title: 'New Tournament Application',
      description: `User ${currentUser.name} (${currentUser.email}) has applied for the "${tournament.name}" tournament.`,
      read: false,
      date: new Date().toISOString(),
    };
    saveToStorage('notifications', [newNotification, ...notifications]);
    window.dispatchEvent(new Event('storage'));

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
            {tournament.status === 'Upcoming' && !currentUser?.isAdmin && (
                 <Button onClick={handleApply} disabled={hasApplied}>
                    {hasApplied ? 'Applied' : 'Apply to Participate'}
                 </Button>
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
