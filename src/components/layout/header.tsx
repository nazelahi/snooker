
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  User,
  Trophy,
  LogOut,
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
import { getFromStorage } from "@/lib/storage";
import type { Notification } from "@/types/notifications";

const initialNotifications: Notification[] = [
    { id: '1', title: "Match Reminder", description: "Your match against J. Trump starts in 1 hour.", read: false, date: new Date().toISOString() },
    { id: '2', title: "Tournament Update", description: "Round 2 bracket has been generated.", read: false, date: new Date().toISOString() },
    { id: '3', title: "New High Break!", description: "Congratulations on your new high break of 89!", read: true, date: new Date().toISOString() },
];

export default function Header() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const storedNotifications = getFromStorage('notifications', initialNotifications);
    setNotifications(storedNotifications);

    if (localStorage.getItem('notifications') === null) {
      localStorage.setItem('notifications', JSON.stringify(initialNotifications));
    }

    const handleStorageChange = () => {
        const stored = getFromStorage('notifications', initialNotifications);
        setNotifications(stored);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>

      <div className="flex w-full items-center justify-end gap-4">
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
                    <DropdownMenuItem key={notification.id} className={!notification.read ? 'font-semibold' : ''}>
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
              <User className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="#">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/my-stats">
                  <Trophy className="mr-2 h-4 w-4" />
                  <span>My Stats</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <Link href="/login" passHref>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
