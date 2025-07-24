

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Trophy, LogIn, Home, Settings } from "lucide-react";
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

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/players", label: "Players", icon: Users },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
];

const settingsItem = { href: "/settings", label: "Settings", icon: Settings };

export default function AppSidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{name: string, email: string, isAdmin?: boolean} | null>(null);
  const [clubName, setClubName] = useState("CueScore");

  useEffect(() => {
    const userData = getFromStorage<{name: string, email: string, isAdmin?: boolean} | null>('userData', null);
    setCurrentUser(userData);

    const siteSettings = getFromStorage('siteSettings', { name: 'CueScore' });
    setClubName(siteSettings.name);

    const handleStorageChange = () => {
        const user = getFromStorage<{name: string, email: string, isAdmin?: boolean} | null>('userData', null);
        setCurrentUser(user);
        const newSiteSettings = getFromStorage('siteSettings', { name: 'CueScore' });
        setClubName(newSiteSettings.name);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  const isActive = (href: string) => {
    return pathname === href;
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
          {currentUser && (
             <SidebarMenuItem>
              <Link href={settingsItem.href} passHref>
                <SidebarMenuButton isActive={isActive(settingsItem.href)}>
                  <settingsItem.icon className="h-5 w-5" />
                  <span>{settingsItem.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Separator className="my-2" />
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
      </SidebarFooter>
    </Sidebar>
  );
}
