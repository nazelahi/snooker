
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Trophy, User as UserIcon, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/matches", label: "Matches", icon: Swords },
  { href: "/players", label: "Players", icon: Users },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/my-stats", label: "My Stats", icon: UserIcon, auth: true },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };

    checkLoginStatus();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      checkLoginStatus();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const filteredNavItems = navItems.filter(item => !item.auth || isLoggedIn);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-20">
      <nav className="h-full">
        <ul className="flex justify-around items-center h-full">
          {filteredNavItems.map((item) => (
            <li key={item.label}>
              <Link href={item.href} passHref>
                <div className={cn(
                    "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
                    isActive(item.href) ? "text-primary" : "text-muted-foreground hover:text-primary"
                  )}>
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs">{item.label}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
