
"use client";

import { useState, useEffect } from "react";
import { getFromStorage, saveToStorage } from "@/lib/storage";
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
import { Bell, Trash2, CheckCircle, ArrowLeft } from "lucide-react";
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<{name: string, email: string, isAdmin?: boolean} | null>(null);
  const router = useRouter();

  const getNotificationKey = (user: {email: string, isAdmin?: boolean} | null) => {
    if (!user) return 'notifications';
    return user.isAdmin ? 'adminNotifications' : `notifications_${user.email}`;
  }

  useEffect(() => {
    const userData = getFromStorage<{name: string, email: string, isAdmin?: boolean} | null>('userData', null);
    setCurrentUser(userData);

    if (userData) {
      const notificationKey = getNotificationKey(userData);
      const userNotifications = getFromStorage<Notification[]>(notificationKey, []);
      setNotifications(userNotifications.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } else {
      router.push('/login');
    }
    
    const handleStorageChange = () => {
      const user = getFromStorage<{name: string, email: string, isAdmin?: boolean} | null>('userData', null);
       if (user) {
        const notificationKey = getNotificationKey(user);
        const storedNotifications = getFromStorage<Notification[]>(notificationKey, []);
        setNotifications(storedNotifications.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };

  }, [router]);

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
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
            <Bell className="h-10 w-10 text-primary" />
            <div className="hidden md:block">
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">Your recent updates and alerts.</p>
            </div>
        </div>
         <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
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
        {notifications.filter(n => !n.read).length > 0 && (
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
