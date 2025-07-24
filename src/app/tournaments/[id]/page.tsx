
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getFromStorage, saveToStorage } from "@/lib/storage";
import type { Tournament } from "@/app/tournaments/page";
import { Calendar, Users, Shield, ArrowLeft, Save, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import type { Notification } from "@/types/notifications";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function TournamentDetailsPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [editedTournament, setEditedTournament] = useState<Tournament | null>(null);
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
      setEditedTournament(foundTournament || null);

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
        setTournament(updatedTournament);
    }
    
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

  const handleSaveChanges = () => {
    if (!editedTournament) return;
    const tournaments = getFromStorage<Tournament[]>('tournaments', []);
    const tournamentIndex = tournaments.findIndex(t => t.id === editedTournament.id);
    if (tournamentIndex !== -1) {
      tournaments[tournamentIndex] = editedTournament;
      saveToStorage('tournaments', tournaments);
      setTournament(editedTournament);
      toast({
        title: "Success",
        description: "Tournament details have been updated."
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editedTournament) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedTournament({ ...editedTournament, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!tournament || !editedTournament) {
    return (
        <div className="text-center">
            <p className="text-lg">Tournament not found.</p>
            <Link href="/tournaments" passHref>
                <Button variant="link">Back to Tournaments</Button>
            </Link>
        </div>
    );
  }

  const isEditing = !!currentUser?.isAdmin;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <Button variant="outline" onClick={() => router.back()} className="w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tournaments
        </Button>
      <Card className="overflow-hidden">
        <div className="relative">
            <Image src={editedTournament.image || `https://placehold.co/1200x400.png`} data-ai-hint="tournament banner" width={1200} height={400} alt={editedTournament.name} className="w-full h-64 object-cover"/>
            {isEditing && (
              <div className="absolute bottom-2 right-2">
                <Input id="image-upload" type="file" className="hidden" onChange={handleImageChange} accept="image/*"/>
                <Label htmlFor="image-upload" className="bg-background/80 text-foreground py-2 px-4 rounded-md cursor-pointer hover:bg-background">
                  Change Image
                </Label>
              </div>
            )}
        </div>
        <CardHeader>
          {isEditing ? (
            <div className="space-y-2">
              <Label htmlFor="tournament-name">Tournament Name</Label>
              <Input
                id="tournament-name"
                className="text-4xl font-bold h-auto p-0 border-0 shadow-none focus-visible:ring-0"
                value={editedTournament.name}
                onChange={(e) => setEditedTournament({...editedTournament, name: e.target.value})}
              />
            </div>
          ) : (
            <CardTitle className="text-4xl font-bold">{tournament.name}</CardTitle>
          )}
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
             <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {isEditing ? (
                  <Input 
                    value={editedTournament.location || ''}
                    onChange={(e) => setEditedTournament({...editedTournament, location: e.target.value})}
                    placeholder="Location"
                    className="h-8 p-1 border-0 shadow-none focus-visible:ring-0"
                  />
                ) : (
                   <span>{tournament.location || 'Not specified'}</span>
                )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Tournament Rules</h3>
             {isEditing ? (
              <Textarea 
                value={editedTournament.rules}
                onChange={(e) => setEditedTournament({...editedTournament, rules: e.target.value})}
                className="whitespace-pre-line"
                rows={5}
              />
             ) : (
              <p className="text-muted-foreground whitespace-pre-line">{tournament.rules}</p>
             )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
            <div>
              {tournament.status === 'Upcoming' && !isEditing && (
                   <Button onClick={handleApply} disabled={hasApplied}>
                      {hasApplied ? 'Applied' : 'Apply to Participate'}
                   </Button>
              )}
              {tournament.status === 'In Progress' && <Badge>In Progress</Badge>}
              {tournament.status === 'Finished' && <Badge variant="secondary">Finished</Badge>}
            </div>

            {isEditing && (
              <Button onClick={handleSaveChanges}>
                <Save className="mr-2 h-4 w-4"/>
                Save Changes
              </Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
