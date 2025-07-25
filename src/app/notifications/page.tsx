
"use client";

import { useState, useEffect } from "react";
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
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const fetchUserAndNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        
        const { data: notificationsData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });
        
        if (notificationsData) {
          setNotifications(notificationsData as Notification[]);
        }
      } else {
        router.push('/login');
      }
    };

    fetchUserAndNotifications();

    const notificationsSubscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        fetchUserAndNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsSubscription);
    };
  }, [router, supabase]);

  const handleMarkAsRead = async (id: number) => {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (!error) {
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };
  
  const handleNotificationClick = (notification: Notification) => {
      if (!notification.read) {
          handleMarkAsRead(notification.id);
      }
      if (notification.link) {
          router.push(notification.link);
      }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      const { error } = await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
      if (!error) {
        setNotifications(notifications.map(n => ({...n, read: true})));
      }
    }
  };
  
   const handleDeleteAllNotifications = async () => {
    if (!currentUser) return;
    const { error } = await supabase.from('notifications').delete().eq('user_id', currentUser.id);
    if (!error) {
        setNotifications([]);
    }
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
                    <li key={notification.id} 
                        className={cn("flex items-start justify-between p-4 rounded-lg", 
                                     notification.read ? 'bg-muted/30' : 'bg-primary/10',
                                     notification.link && 'cursor-pointer hover:bg-muted/50'
                        )}
                        onClick={() => handleNotificationClick(notification)}
                    >
                        <div className="space-y-1">
                            <h3 className={`font-semibold ${!notification.read && 'text-primary'}`}>{notification.title}</h3>
                            <p className="text-sm text-muted-foreground">{notification.description}</p>
                            <p className="text-xs text-muted-foreground/80">{format(new Date(notification.date), "PPP p")}</p>
                        </div>
                        {!notification.read && (
                            <Button variant="ghost" size="sm" onClick={(e) => {e.stopPropagation(); handleMarkAsRead(notification.id)}}>
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
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleMarkAllAsRead} disabled={notifications.every(n => n.read)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark All as Read
                </Button>
                <Button variant="destructive" onClick={handleDeleteAllNotifications}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
