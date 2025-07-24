
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getFromStorage, saveToStorage } from "@/lib/storage";
import type { Tournament } from "@/app/tournaments/page";
import type { Player } from "@/app/players/page";
import { Calendar, Users, Shield, ArrowLeft, Save, MapPin, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import type { Notification } from "@/types/notifications";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EnrolledPlayer {
  name: string;
  avatar: string;
  initials: string;
  email: string;
}

export default function TournamentDetailsPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [editedTournament, setEditedTournament] = useState<Tournament | null>(null);
  const [currentUser, setCurrentUser] = useState<{name: string, email: string, isAdmin?: boolean} | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [enrolledPlayers, setEnrolledPlayers] = useState<EnrolledPlayer[]>([]);
  const [pendingPlayers, setPendingPlayers] = useState<EnrolledPlayer[]>([]);
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

        if (foundTournament) {
            if(userData && (foundTournament.registeredPlayers?.includes(userData.email) || foundTournament.pendingPlayers?.includes(userData.email))) {
                setHasApplied(true);
            }

            const allPlayers = getFromStorage<Player[]>('players', []);
            const allUsers = getFromStorage<{name: string, email: string, password?: string}[]>('users', []);
            
            const getPlayerDetails = (email: string) => {
                const user = allUsers.find(u => u.email === email);
                const player = allPlayers.find(p => p.name.toLowerCase() === user?.name.toLowerCase());
                return {
                    name: user?.name || 'Unknown User',
                    avatar: player?.avatar || '',
                    initials: player?.initials || 'UU',
                    email: email,
                };
            };
            
            const registeredPlayerDetails = (foundTournament.registeredPlayers || []).map(getPlayerDetails);
            setEnrolledPlayers(registeredPlayerDetails);

            const pendingPlayerDetails = (foundTournament.pendingPlayers || []).map(getPlayerDetails);
            setPendingPlayers(pendingPlayerDetails);
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
            pendingPlayers: [...(tournaments[tournamentIndex].pendingPlayers || []), currentUser.email]
        };
        tournaments[tournamentIndex] = updatedTournament;
        saveToStorage('tournaments', tournaments);
        setHasApplied(true);
        setTournament(updatedTournament);
    }
    
    const adminNotifications = getFromStorage<Notification[]>('adminNotifications', []);
    const newNotification: Notification = {
      id: Date.now().toString(),
      title: 'New Tournament Application',
      description: `User ${currentUser.name} (${currentUser.email}) has applied for the "${tournament.name}" tournament.`,
      read: false,
      date: new Date().toISOString(),
    };
    saveToStorage('adminNotifications', [newNotification, ...adminNotifications]);
    window.dispatchEvent(new Event('storage'));

    toast({
        title: "Application Sent!",
        description: `Your application for "${tournament?.name}" has been received and is awaiting admin approval.`,
    });
  }

  const handleApproval = (playerEmail: string, isApproved: boolean) => {
    if (!tournament) return;
    const tournaments = getFromStorage<Tournament[]>('tournaments', []);
    const tournamentIndex = tournaments.findIndex(t => t.id === tournament.id);

    if (tournamentIndex !== -1) {
        const currentTournament = tournaments[tournamentIndex];
        const updatedPending = (currentTournament.pendingPlayers || []).filter(email => email !== playerEmail);
        let updatedRegistered = currentTournament.registeredPlayers || [];

        if (isApproved) {
            updatedRegistered = [...updatedRegistered, playerEmail];
        }

        const updatedTournament = {
            ...currentTournament,
            pendingPlayers: updatedPending,
            registeredPlayers: updatedRegistered
        };

        tournaments[tournamentIndex] = updatedTournament;
        saveToStorage('tournaments', tournaments);

        setTournament(updatedTournament);
        setEditedTournament(updatedTournament);

        const allPlayers = getFromStorage<Player[]>('players', []);
        const allUsers = getFromStorage<{name: string, email: string}[]>('users', []);
        const getPlayerDetails = (email: string) => {
            const user = allUsers.find(u => u.email === email);
            const player = allPlayers.find(p => p.name.toLowerCase() === user?.name.toLowerCase());
            return {
                name: user?.name || 'Unknown User',
                avatar: player?.avatar || '',
                initials: player?.initials || 'UU',
                email: email,
            };
        };
        
        setPendingPlayers(updatedPending.map(getPlayerDetails));
        setEnrolledPlayers(updatedRegistered.map(getPlayerDetails));
        
        const userNotifications = getFromStorage<Notification[]>(`notifications_${playerEmail}`, []);
        const newNotification: Notification = {
          id: Date.now().toString(),
          title: `Application ${isApproved ? 'Approved' : 'Rejected'}`,
          description: `Your application for the "${tournament.name}" tournament has been ${isApproved ? 'approved' : 'rejected'}.`,
          read: false,
          date: new Date().toISOString(),
        };
        saveToStorage(`notifications_${playerEmail}`, [newNotification, ...userNotifications]);

        toast({
            title: isApproved ? "Player Approved" : "Player Rejected",
            description: `The application has been processed.`,
        });
    }
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
  const applicationStatus = tournament.registeredPlayers?.includes(currentUser?.email || '') ? 'Approved' : 
                            tournament.pendingPlayers?.includes(currentUser?.email || '') ? 'Pending' : 'Not Applied';

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
                className="text-4xl font-bold -ml-1.5 h-auto p-1.5 border-transparent focus:border-border focus:bg-muted/50 transition-all"
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
                    className="h-8 -ml-1.5 p-1.5 border-transparent focus:border-border focus:bg-muted/50 transition-all"
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
                className="whitespace-pre-line border-transparent focus:border-border focus:bg-muted/50 transition-all"
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
                      {applicationStatus === 'Approved' ? 'Approved' : applicationStatus === 'Pending' ? 'Application Pending' : 'Apply to Participate'}
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

      {isEditing && pendingPlayers.length > 0 && (
          <Card>
              <CardHeader>
                  <CardTitle>Pending Applications ({pendingPlayers.length})</CardTitle>
                  <CardDescription>Review and approve or reject player applications for this tournament.</CardDescription>
              </CardHeader>
              <CardContent>
                  <ul className="space-y-2">
                      {pendingPlayers.map(player => (
                          <li key={player.email} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-3">
                                  <Avatar>
                                      <AvatarImage src={player.avatar || `https://placehold.co/40x40.png`} data-ai-hint="player portrait" alt={player.name} />
                                      <AvatarFallback>{player.initials}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{player.name}</span>
                              </div>
                              <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleApproval(player.email, true)}>
                                      <Check className="h-4 w-4 mr-2"/> Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleApproval(player.email, false)}>
                                      <X className="h-4 w-4 mr-2"/> Reject
                                  </Button>
                              </div>
                          </li>
                      ))}
                  </ul>
              </CardContent>
          </Card>
      )}

       {enrolledPlayers.length > 0 && (
         <Card>
            <CardHeader>
                <CardTitle>Enrolled Players ({enrolledPlayers.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {enrolledPlayers.map((player, index) => (
                        <div key={index} className="flex flex-col items-center gap-2">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={player.avatar || `https://placehold.co/64x64.png`} data-ai-hint="player portrait" alt={player.name} />
                                <AvatarFallback>{player.initials}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-center">{player.name}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
         </Card>
       )}
    </div>
  );
}
