
"use client";

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import BottomNav from './bottom-nav';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const showMobileNav = !pathname.startsWith('/settings');

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
            {children}
        </main>
        {showMobileNav && <BottomNav />}
      </SidebarInset>
    </SidebarProvider>
  );
}
