

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
import { useAuthContext } from "@/components/auth-provider";

export default function UserSettings() {
  const { user, profile, isAuthenticated } = useAuthContext();
  const [registeredTournaments, setRegisteredTournaments] = useState<Tournament[]>([]);
  const [pendingTournaments, setPendingTournaments] = useState<Tournament[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mounted, setMounted] = useState(false);

  const getNotificationKey = (userEmail: string | null) => {
    if (!userEmail) return 'notifications';
    return `notifications_${userEmail}`;
  }

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return; // Don't run on server

    if (isAuthenticated && profile?.email) {
      const allTournaments = getFromStorage<Tournament[]>('tournaments', []);
      const userRegistered = allTournaments.filter(t => 
        t.registeredPlayers?.includes(profile.email)
      );
      setRegisteredTournaments(userRegistered);
      
      const userPending = allTournaments.filter(t => 
        t.pendingPlayers?.includes(profile.email)
      );
      setPendingTournaments(userPending);

      const notificationKey = getNotificationKey(profile.email);
      const userNotifications = getFromStorage<Notification[]>(notificationKey, []);
      setNotifications(userNotifications);
    } else {
      // Clear data when not authenticated
      setRegisteredTournaments([]);
      setPendingTournaments([]);
      setNotifications([]);
    }
    
    const handleStorageChange = () => {
      if (isAuthenticated && profile?.email) {
        const notificationKey = getNotificationKey(profile.email);
        const storedNotifications = getFromStorage<Notification[]>(notificationKey, []);
        setNotifications(storedNotifications);
      } else {
        setNotifications([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };

  }, [mounted, isAuthenticated, profile?.email]);

  const handleMarkAsRead = (id: string) => {
    if (!isAuthenticated || !profile?.email) return;
    
    const notificationKey = getNotificationKey(profile.email);
    const updatedNotifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updatedNotifications);
    saveToStorage(notificationKey, updatedNotifications);
    setTimeout(() => window.dispatchEvent(new Event('storage')), 0);
  };

  const handleClearAllNotifications = () => {
    if (!isAuthenticated || !profile?.email) return;
    
    const notificationKey = getNotificationKey(profile.email);
    const updatedNotifications = notifications.map(n => ({...n, read: true}));
    setNotifications(updatedNotifications);
    saveToStorage(notificationKey, updatedNotifications);
    setTimeout(() => window.dispatchEvent(new Event('storage')), 0);
  };

  // Show loading state while mounting
  if (!mounted) {
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
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show message if not authenticated
  if (!isAuthenticated) {
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
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">Please log in to view your settings.</p>
            <Button asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
