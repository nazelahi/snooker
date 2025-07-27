
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Users, Trophy, Settings, Radio, Calendar, ListChecks, Megaphone, Settings2 } from "lucide-react";
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
import { SiteLogo } from '../site-logo';

const adminNavItems = [
    { href: "players", label: "Players", icon: Users },
    { href: "tournaments", label: "Tournaments", icon: Trophy },
    { href: "liveMatches", label: "Live Matches", icon: Radio },
    { href: "upcomingMatches", label: "Upcoming", icon: Calendar },
    { href: "rules", label: "Rules", icon: ListChecks },
    { href: "notices", label: "Notices", icon: Megaphone },
    { href: "siteSettings", label: "Site", icon: Settings2 },
];


export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'players';

  const isActive = (href: string) => {
    return activeTab === href;
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/settings" className="flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-semibold text-sidebar-foreground">Admin</h1>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {adminNavItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={`${pathname}?tab=${item.href}`} passHref>
                <SidebarMenuButton isActive={isActive(item.href)}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
        <Separator className="my-2" />
         <SidebarMenu>
             <SidebarMenuItem>
                <Link href="/" passHref>
                    <SidebarMenuButton>
                        <span>Back to App</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
