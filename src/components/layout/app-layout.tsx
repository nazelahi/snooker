
"use client";

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import BottomNav from './bottom-nav';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
            {children}
        </main>
        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
