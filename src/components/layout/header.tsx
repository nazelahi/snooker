
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
import type { Notification } from "@/types/notifications";
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ThemeSwitcher } from "../theme-switcher";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { SiteLogo } from "../site-logo";

interface CurrentUser {
    name: string;
    email: string;
    role?: string;
    avatar?: string;
    initials?: string;
}

export default function Header() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const router = useRouter();
  const [siteName, setSiteName] = useState("CueScore");

  const fetchUserData = async (user: SupabaseUser | null) => {
    if (user) {
        const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single();

        if (userData) {
            setCurrentUser({
                name: userData.name,
                email: userData.email,
                role: userData.role,
                avatar: userData.avatar,
                initials: userData.name.split(' ').map((n:string) => n[0]).join('')
            });

            const { data: notificationsData } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (notificationsData) {
                setNotifications(notificationsData as Notification[]);
            }
        } else {
            // This can happen if the user record in auth exists but not in users table yet.
            // The DB trigger should handle this, but as a fallback, we can set a basic user object.
             setCurrentUser({
                name: user.user_metadata.full_name || user.email!,
                email: user.email!,
                initials: (user.user_metadata.full_name || user.email!).split(' ').map((n:string) => n[0]).join('')
            });
            setNotifications([]);
        }

    } else {
      setCurrentUser(null);
      setNotifications([]);
    }
  }

  useEffect(() => {
    const fetchInitialSettings = async () => {
        const { data } = await supabase.from('settings').select('value').eq('key', 'siteSettings').single();
        if (data?.value) {
            setSiteName(data.value.name);
        }
    };
    fetchInitialSettings();

    const settingsChannel = supabase
      .channel('site-settings-header')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'settings', filter: 'key=eq.siteSettings' },
        (payload) => {
           const newSettings = payload.new.value;
           setSiteName(newSettings.name);
        }
      )
      .subscribe();
      
    const notificationsSubscription = supabase
        .channel('public:notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
            const fetchAndSetUser = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                fetchUserData(user);
            }
            fetchAndSetUser();
        })
        .subscribe();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserData(session?.user ?? null);
    });

    const initialFetch = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        fetchUserData(user);
    }
    initialFetch();

    return () => {
        supabase.removeChannel(settingsChannel);
        supabase.removeChannel(notificationsSubscription);
        authListener.subscription.unsubscribe();
    }
  }, [supabase]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    router.push('/login');
    router.refresh();
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
        await supabase.from('notifications').update({ read: true }).eq('id', notification.id);
        setNotifications(notifications.map(n => n.id === notification.id ? { ...n, read: true } : n));
    }
    if (notification.link) {
        router.push(notification.link);
    }
  };
  
  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
        await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
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
          <SiteLogo className="h-7 w-7 text-primary" />
          <span>{siteName}</span>
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
