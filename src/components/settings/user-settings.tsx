

"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { getFromStorage, saveToStorage } from "@/lib/storage";
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
import { Settings, Bell, Trophy, Trash2, CheckCircle, Clock } from "lucide-react";
import { Badge } from "../ui/badge";
import { format } from 'date-fns';

export default function UserSettings() {
  const [registeredTournaments, setRegisteredTournaments] = useState<Tournament[]>([]);
  const [pendingTournaments, setPendingTournaments] = useState<Tournament[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<{name: string, email: string} | null>(null);

  const getNotificationKey = (user: {email: string} | null) => {
    if (!user) return 'notifications';
    return `notifications_${user.email}`;
  }

  useEffect(() => {
    const userData = getFromStorage<{name: string, email: string} | null>('userData', null);
    setCurrentUser(userData);

    if (userData) {
      const allTournaments = getFromStorage<Tournament[]>('tournaments', []);
      const userRegistered = allTournaments.filter(t => 
        t.registeredPlayers?.includes(userData.email)
      );
      setRegisteredTournaments(userRegistered);
      
      const userPending = allTournaments.filter(t => 
        t.pendingPlayers?.includes(userData.email)
      );
      setPendingTournaments(userPending);

      const notificationKey = getNotificationKey(userData);
      const userNotifications = getFromStorage<Notification[]>(notificationKey, []);
      setNotifications(userNotifications);
    }
    
    const handleStorageChange = () => {
      const user = getFromStorage<{name: string, email: string} | null>('userData', null);
      if (user) {
        const notificationKey = getNotificationKey(user);
        const storedNotifications = getFromStorage<Notification[]>(notificationKey, []);
        setNotifications(storedNotifications);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };

  }, []);

  const handleMarkAsRead = (id: string) => {
    if (!currentUser) return;
    const notificationKey = getNotificationKey(currentUser);
    const updatedNotifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updatedNotifications);
    saveToStorage(notificationKey, updatedNotifications);
    setTimeout(() => window.dispatchEvent(new Event('storage')), 0);
  };

  const handleClearAllNotifications = () => {
    if (!currentUser) return;
    const notificationKey = getNotificationKey(currentUser);
    const updatedNotifications = notifications.map(n => ({...n, read: true}));
    setNotifications(updatedNotifications);
    saveToStorage(notificationKey, updatedNotifications);
    setTimeout(() => window.dispatchEvent(new Event('storage')), 0);
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
        {notifications.length > 0 && (
            <CardFooter>
                <Button variant="outline" onClick={handleClearAllNotifications}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Mark All as Read
                </Button>
            </CardFooter>
        )}
      </Card>

    </div>
  );
}
