
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  User,
  Trophy,
  LogOut,
  Settings,
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

const initialUserNotifications: Notification[] = [
    { id: '1', title: "Match Reminder", description: "Your match against J. Trump starts in 1 hour.", read: false, date: new Date().toISOString() },
    { id: '2', title: "Tournament Update", description: "Round 2 bracket has been generated.", read: false, date: new Date().toISOString() },
    { id: '3', title: "New High Break!", description: "Congratulations on your new high break of 89!", read: true, date: new Date().toISOString() },
];

export default function Header() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<{name: string, email: string, isAdmin?: boolean, avatar?: string, initials?: string} | null>(null);
  const [clubName, setClubName] = useState("CueScore");
  const router = useRouter();

  const getNotificationKey = (user: {email: string, isAdmin?: boolean} | null) => {
    if (!user) return 'notifications'; // Default for logged-out users
    return user.isAdmin ? 'adminNotifications' : `notifications_${user.email}`;
  }

  const fetchUserData = () => {
    const userData = getFromStorage<{name: string, email: string, isAdmin?: boolean} | null>('userData', null);
     if (userData) {
      const players = getFromStorage<Player[]>('players', []);
      const player = players.find(p => p.name.toLowerCase() === userData.name.toLowerCase());
      setCurrentUser({
        ...userData,
        avatar: player?.avatar,
        initials: player?.initials || userData.name.split(' ').map(n => n[0]).join('')
      });
    } else {
      setCurrentUser(null);
    }
  }

  useEffect(() => {
    fetchUserData();
    const siteSettings = getFromStorage('siteSettings', { name: 'CueScore' });
    setClubName(siteSettings.name);

    const userData = getFromStorage<{name: string, email: string, isAdmin?: boolean} | null>('userData', null);
    const notificationKey = getNotificationKey(userData);
    const initialData = userData?.isAdmin ? [] : initialUserNotifications;

    const storedNotifications = getFromStorage(notificationKey, initialData);
    setNotifications(storedNotifications);
    
    if (localStorage.getItem(notificationKey) === null) {
      saveToStorage(notificationKey, initialData);
    }

    const handleStorageChange = () => {
        fetchUserData();
        const user = getFromStorage<{name: string, email: string, isAdmin?: boolean} | null>('userData', null);
        const currentKey = getNotificationKey(user);
        const currentInitialData = user?.isAdmin ? [] : initialUserNotifications;
        const stored = getFromStorage(currentKey, currentInitialData);
        setNotifications(stored);

        const newSiteSettings = getFromStorage('siteSettings', { name: 'CueScore' });
        setClubName(newSiteSettings.name);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userData');
    setCurrentUser(null);
    window.dispatchEvent(new Event('storage'));
    router.push('/login');
  };

  const handleNotificationClick = (id: string) => {
    const notificationKey = getNotificationKey(currentUser);
    const updatedNotifications = notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
    );
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
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <Icons.logo className="h-7 w-7 text-primary" />
        </Link>
      </div>
      
      <div className="flex-1 text-center md:text-left">
        <Link href="/" className="text-xl font-semibold md:hidden">
          {clubName}
        </Link>
      </div>

      <div className="flex items-center justify-end gap-2 md:gap-4">
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
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
                 <DropdownMenuItem>
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
                      onClick={() => handleNotificationClick(notification.id)}
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
