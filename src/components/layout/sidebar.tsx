
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, Trophy, LogIn, Home, Settings, LogOut, User as UserIcon, Swords } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "../ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { SiteLogo } from '../site-logo';
import type { User } from '@supabase/supabase-js';

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/matches", label: "Matches", icon: Swords },
  { href: "/players", label: "Players", icon: Users },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
];

const bottomNavItems = [
  { href: "/settings", label: "Settings", icon: Settings, auth: true },
];

interface CurrentUser {
    name: string;
    email: string;
    avatar?: string;
    initials?: string;
    role?: string;
}

const UserMenu = () => {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const router = useRouter();

    const fetchUserData = async (user: User | null) => {
        if (user) {
            const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single();
            if (userData) {
                 setCurrentUser({
                    name: userData.name,
                    email: userData.email,
                    avatar: userData.avatar,
                    initials: userData.name.split(' ').map((n:string) => n[0]).join(''),
                    role: userData.role
                });
            } else {
                 setCurrentUser({
                    name: user.user_metadata.full_name || user.email!,
                    email: user.email!,
                    initials: (user.user_metadata.full_name || user.email!).split(' ').map((n:string) => n[0]).join('')
                });
            }
        } else {
            setCurrentUser(null);
        }
    };
    
    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          fetchUserData(session?.user ?? null);
        });

        const fetchInitialUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            fetchUserData(session?.user ?? null);
        }
        fetchInitialUser();
        
        return () => {
          authListener.subscription.unsubscribe();
        };
    }, [supabase]);


    const handleLogout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        router.push('/login');
        router.refresh();
    };

    if (!currentUser) {
        return (
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/login" passHref>
                  <SidebarMenuButton>
                    <LogIn className="h-5 w-5" />
                    <span>Login</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto p-2" size="lg">
                   <div className="flex items-center gap-2">
                     <Avatar className="h-8 w-8">
                        <AvatarImage src={currentUser.avatar || ''} alt={currentUser.name} />
                        <AvatarFallback>{currentUser.initials}</AvatarFallback>
                     </Avatar>
                     <span className="font-semibold">{currentUser.name}</span>
                   </div>
                </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="mb-2 w-56">
                <DropdownMenuLabel>{currentUser.role === 'admin' ? 'Admin' : 'My Account'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/my-stats">
                      <UserIcon className="mr-2 h-4 w-4" />
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
            </DropdownMenuContent>
        </DropdownMenu>
    )
}


export default function AppSidebar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [clubName, setClubName] = useState("CueScore");

  useEffect(() => {
    const fetchUserAndSettings = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);

        const { data: settingsData } = await supabase.from('settings').select('value').eq('key', 'siteSettings').single();
        if (settingsData?.value.name) {
            setClubName(settingsData.value.name);
        }
    };

    fetchUserAndSettings();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        setIsLoggedIn(!!session);
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
             fetchUserAndSettings();
        }
    });

    const settingsChannel = supabase
      .channel('site-settings-sidebar')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings', filter: 'key=eq.siteSettings' },
        (payload) => {
          setClubName(payload.new.value.name);
        }
      )
      .subscribe();

    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(settingsChannel);
    };
  }, [supabase]);


  const isActive = (href: string) => {
    if (href === "/") {
        return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <SiteLogo className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-semibold text-sidebar-foreground">{clubName}</h1>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} passHref>
                <SidebarMenuButton isActive={isActive(item.href)}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          <Separator className="my-2" />
          {bottomNavItems.map((item) => {
            if (item.auth && !isLoggedIn) return null;
            return (
                <SidebarMenuItem key={item.label}>
                <Link href={item.href} passHref>
                    <SidebarMenuButton isActive={isActive(item.href)}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    </SidebarMenuButton>
                </Link>
                </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Separator className="my-2" />
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
