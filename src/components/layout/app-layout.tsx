
"use client";

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import BottomNav from './bottom-nav';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdminSettingsTabsMobile } from '../settings/admin-settings';
import { supabase } from "@/lib/supabase/client";
import type { User } from '@supabase/supabase-js';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUserRole = async (user: User | null) => {
      if (user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        setIsAdmin(userProfile?.role === 'admin');
      } else {
        setIsAdmin(false);
      }
    };

    const initializeUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      checkUserRole(session?.user ?? null);
    };

    initializeUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      checkUserRole(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const showAdminNav = isMobile && isAdmin && pathname === '/settings';

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
            {children}
        </main>
        {showAdminNav ? <AdminSettingsTabsMobile activeTab="players" onTabChange={() => {}} /> : <BottomNav />}
      </SidebarInset>
    </SidebarProvider>
  );
}
