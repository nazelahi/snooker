
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import AdminSidebar from '@/components/settings/admin-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import Header from '@/components/layout/header';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data: isAdminData } = await supabase.rpc('is_admin');
      setIsAdmin(isAdminData);
      setLoading(false);
    };

    checkAdmin();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      checkAdmin();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAdmin) {
    return (
        <main className="p-4 sm:p-6 lg:p-8">
            {children}
        </main>
    );
  }

  return (
    <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
            <Header />
            <main className="p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
