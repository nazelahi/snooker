
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  User,
  Trophy,
  LogOut,
  Settings,
  CheckCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { getFromStorage, saveToStorage } from "@/lib/storage";
import type { Notification } from "@/types/notifications";
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import type { Player } from "@/app/players/page";
import { Icons } from "../icons";
import { ThemeSwitcher } from "../theme-switcher";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from '@supabase/supabase-js';

const initialUserNotifications: Notification[] = [
    { id: '1', title: "Match Reminder", description: "Your match against J. Trump starts in 1 hour.", read: false, date: new Date().toISOString() },
    { id: '2', title: "Tournament Update", description: "Round 2 bracket has been generated.", read: false, date: new Date().toISOString() },
    { id: '3', title: "New High Break!", description: "Congratulations on your new high break of 89!", read: true, date: new Date().toISOString() },
];

interface CurrentUser {
    name: string;
    email: string;
    isAdmin?: boolean;
    avatar?: string;
    initials?: string;
}

export default function Header() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [clubName, setClubName] = useState("CueScore");
  const router = useRouter();

  const getNotificationKey = (user: {email: string, isAdmin?: boolean} | null) => {
    if (!user) return 'notifications'; // Default for logged-out users
    // This logic might need updating if admin notifications are stored differently in Supabase
    return `notifications_${user.email}`;
  }

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        // Here, you might fetch profile details from a 'profiles' table in Supabase
        // For now, we'll use the user metadata and local player data
        const players = getFromStorage<Player[]>('players', []);
        const fullName = user.user_metadata.full_name || user.email;
        const player = players.find(p => p.name.toLowerCase() === fullName.toLowerCase());
        
        setCurrentUser({
            name: fullName,
            email: user.email!,
            // You'll need a way to determine if a user is an admin, e.g., from a custom claim or a 'profiles' table
            isAdmin: user.email === 'admin@gmail.com', // Placeholder logic
            avatar: player?.avatar,
            initials: player?.initials || fullName.split(' ').map((n:string) => n[0]).join('')
        });
    } else {
      setCurrentUser(null);
    }
  }

  useEffect(() => {
    fetchUserData();
    const siteSettings = getFromStorage('siteSettings', { name: 'CueScore' });
    setClubName(siteSettings.name);

    // Notification logic might need to be migrated to Supabase as well
    const notificationKey = getNotificationKey(currentUser);
    const initialData = initialUserNotifications; // Admin notifications would be different
    const storedNotifications = getFromStorage(notificationKey, initialData);
    setNotifications(storedNotifications.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    if (localStorage.getItem(notificationKey) === null) {
      saveToStorage(notificationKey, initialData);
    }

    const handleStorageChange = () => {
        fetchUserData();
        const currentKey = getNotificationKey(currentUser);
        const stored = getFromStorage(currentKey, initialUserNotifications);
        setNotifications(stored.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

        const newSiteSettings = getFromStorage('siteSettings', { name: 'CueScore' });
        setClubName(newSiteSettings.name);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser?.email]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    router.push('/login');
  };

  const handleNotificationClick = (notification: Notification) => {
    const notificationKey = getNotificationKey(currentUser);
    const updatedNotifications = notifications.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    saveToStorage(notificationKey, updatedNotifications);

    if (notification.link) {
        router.push(notification.link);
    }
  };
  
  const handleMarkAllRead = () => {
    if (!currentUser) return;
    const notificationKey = getNotificationKey(currentUser);
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    saveToStorage(notificationKey, updatedNotifications);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-2">
        <div className="md:hidden">
            <SidebarTrigger />
        </div>
      </div>
      
      <div className="flex-1 text-center md:text-left">
        <Link href="/" className="flex items-center justify-center md:justify-start gap-2 text-xl font-semibold md:hidden">
          <Icons.logo className="h-7 w-7 text-primary" />
          <span>{clubName}</span>
        </Link>
      </div>

      <div className="flex items-center justify-end gap-2 md:gap-4">
        <ThemeSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex justify-between items-center">
                <span>Notifications</span>
                {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-auto p-1 text-xs">
                        <CheckCheck className="mr-1 h-3 w-3"/>
                        Mark all as read
                    </Button>
                )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
                 <DropdownMenuItem disabled>
                    <div className="flex flex-col">
                        <p className="text-sm text-muted-foreground">
                        No new notifications.
                        </p>
                    </div>
                </DropdownMenuItem>
            ) : (
                notifications.slice(0, 5).map(notification => (
                    <DropdownMenuItem 
                      key={notification.id} 
                      className={!notification.read ? 'font-semibold' : ''}
                      onClick={() => handleNotificationClick(notification)}
                    >
                        <div className="flex flex-col">
                            <p className={!notification.read ? 'font-bold' : 'font-semibold'}>{notification.title}</p>
                            <p className="text-sm text-muted-foreground">
                            {notification.description}
                            </p>
                        </div>
                    </DropdownMenuItem>
                ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="justify-center">View all notifications</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              {currentUser ? (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatar || ''} alt={currentUser.name} />
                  <AvatarFallback>{currentUser.initials}</AvatarFallback>
                </Avatar>
              ) : (
                <User className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{currentUser ? currentUser.name : "My Account"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {currentUser ? (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/my-stats">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/tournaments">
                      <Trophy className="mr-2 h-4 w-4" />
                      <span>Tournaments</span>
                    </Link>
                  </DropdownMenuItem>
                   <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </>
            ) : (
              <Link href="/login" passHref>
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log in</span>
                </DropdownMenuItem>
              </Link>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
