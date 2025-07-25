
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Trophy, LogIn, Home, Settings, LogOut, User as UserIcon, Swords, Bell } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Icons } from "@/components/icons";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { getFromStorage } from "@/lib/storage";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "../ui/dropdown-menu";
import { useRouter } from "next/navigation";
import type { Player } from "@/app/players/page";
import { supabase } from "@/lib/supabase";

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
    isAdmin?: boolean;
    avatar?: string;
    initials?: string;
}

const UserMenu = () => {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const router = useRouter();

    const fetchUserData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const players = getFromStorage<Player[]>('players', []);
            const fullName = user.user_metadata.full_name || user.email;
            const player = players.find(p => p.name.toLowerCase() === fullName.toLowerCase());
            setCurrentUser({
                name: fullName,
                email: user.email!,
                isAdmin: user.email === 'admin@gmail.com', // Placeholder logic
                avatar: player?.avatar,
                initials: player?.initials || fullName.split(' ').map((n:string) => n[0]).join('')
            });
        } else {
            setCurrentUser(null);
        }
    };
    
    useEffect(() => {
        fetchUserData();
        window.addEventListener('storage', fetchUserData);
        return () => window.removeEventListener('storage', fetchUserData);
    }, []);


    const handleLogout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        router.push('/login');
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
                <DropdownMenuLabel>{currentUser.isAdmin ? 'Admin' : 'My Account'}</DropdownMenuLabel>
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
  const [currentUser, setCurrentUser] = useState<{name: string, email: string, isAdmin?: boolean} | null>(null);
  const [clubName, setClubName] = useState("CueScore");

  const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if(user) {
          setCurrentUser({
              name: user.user_metadata.full_name || user.email!,
              email: user.email!,
              isAdmin: user.email === 'admin@gmail.com', // Placeholder
          });
      } else {
          setCurrentUser(null);
      }
  }

  useEffect(() => {
    fetchUser();
    const siteSettings = getFromStorage('siteSettings', { name: 'CueScore' });
    setClubName(siteSettings.name);

    const handleStorageChange = () => {
        fetchUser();
        const newSiteSettings = getFromStorage('siteSettings', { name: 'CueScore' });
        setClubName(newSiteSettings.name);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


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
          <Icons.logo className="h-8 w-8 text-primary" />
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
            if (item.auth && !currentUser) return null;
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
