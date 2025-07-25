
"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import type { Tournament } from "@/app/tournaments/page";
import type { Notification } from "@/types/notifications";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Bell, Trophy, CheckCircle, Clock } from "lucide-react";
import { Badge } from "../ui/badge";
import { format } from 'date-fns';
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function UserSettings() {
  const [registeredTournaments, setRegisteredTournaments] = useState<Tournament[]>([]);
  const [pendingTournaments, setPendingTournaments] = useState<Tournament[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchData(user: User | null) {
      if (user) {
        setCurrentUser(user);

        const { data: player } = await supabase.from('players').select('name').eq('user_id', user.id).single();
        const playerName = player?.name;

        if (playerName) {
            const { data: allTournaments } = await supabase.from('tournaments').select('*');
            if (allTournaments) {
            const userRegistered = allTournaments.filter(t => 
                t.registeredPlayers?.includes(playerName)
            );
            setRegisteredTournaments(userRegistered as Tournament[]);
            
            const userPending = allTournaments.filter(t => 
                t.pendingPlayers?.includes(playerName)
            );
            setPendingTournaments(userPending as Tournament[]);
            }
        }


        const { data: notificationsData } = await supabase.from('notifications').select('*').eq('user_id', user.id);
        if(notificationsData) setNotifications(notificationsData as Notification[]);
      }
    }
    
    const initialFetch = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        fetchData(user);
    }
    initialFetch();

    const notificationsSubscription = supabase
      .channel('public:notifications:user')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        initialFetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsSubscription);
    };
  }, []);

  const handleMarkAsRead = async (id: number) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if(unreadIds.length > 0) {
      await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
      setNotifications(notifications.map(n => ({...n, read: true})));
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Settings className="h-10 w-10 text-primary" />
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold">User Settings</h1>
          <p className="text-muted-foreground">Manage your tournament registrations and notifications.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy />
            My Tournament Applications
          </CardTitle>
          <CardDescription>A list of tournaments you have applied for.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingTournaments.length === 0 && registeredTournaments.length === 0 ? (
             <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You have not registered for any upcoming tournaments.</p>
              <Button asChild>
                <Link href="/tournaments">Browse Tournaments</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
               {pendingTournaments.map(tournament => (
                    <li key={tournament.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div>
                            <h3 className="font-semibold">{tournament.name}</h3>
                            <p className="text-sm text-muted-foreground">{tournament.format}</p>
                        </div>
                        <Badge variant="outline" className="text-amber-500 border-amber-500">
                          <Clock className="mr-2 h-4 w-4" />
                          Pending Approval
                        </Badge>
                    </li>
                ))}
                {registeredTournaments.map(tournament => (
                    <li key={tournament.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div>
                            <h3 className="font-semibold">{tournament.name}</h3>
                            <p className="text-sm text-muted-foreground">{tournament.format}</p>
                        </div>
                        <Badge variant="secondary" className="text-green-500 border-green-500">
                           <CheckCircle className="mr-2 h-4 w-4" />
                           Approved
                        </Badge>
                    </li>
                ))}
             </ul>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell />
            My Notifications
          </CardTitle>
          <CardDescription>Manage your notifications below.</CardDescription>
        </CardHeader>
        <CardContent>
           {notifications.length > 0 ? (
             <ul className="space-y-3">
                {notifications.map(notification => (
                    <li key={notification.id} className={`flex items-start justify-between p-4 rounded-lg ${notification.read ? 'bg-muted/30' : 'bg-primary/10'}`}>
                        <div className="space-y-1">
                            <h3 className={`font-semibold ${!notification.read && 'text-primary'}`}>{notification.title}</h3>
                            <p className="text-sm text-muted-foreground">{notification.description}</p>
                            <p className="text-xs text-muted-foreground/80">{format(new Date(notification.date), "PPP p")}</p>
                        </div>
                        {!notification.read && (
                            <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Mark as read
                            </Button>
                        )}
                    </li>
                ))}
             </ul>
          ) : (
             <p className="text-center py-8 text-muted-foreground">You have no notifications.</p>
          )}
        </CardContent>
        {notifications.some(n => !n.read) && (
            <CardFooter>
                <Button variant="outline" onClick={handleMarkAllAsRead}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark All as Read
                </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
