
"use client";

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import BottomNav from './bottom-nav';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdminSettingsTabsMobile } from '../settings/admin-settings';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(user?.email === 'admin@gmail.com');
    }
    checkUserRole();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      checkUserRole();
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
        {showAdminNav ? null : <BottomNav />}
      </SidebarInset>
    </SidebarProvider>
  );
}
