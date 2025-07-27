
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import AdminSettings from "@/components/settings/admin-settings";
import UserSettings from "@/components/settings/user-settings";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

function AdminSettingsWrapper() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'players';
  return <AdminSettings activeTab={tab} />;
}

function SettingsPageContent() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthorized(true);
        const { data: isAdminData } = await supabase.rpc('is_admin');
        setIsAdmin(isAdminData);
      } else {
        router.push('/login');
      }
    };
    checkUserRole();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      checkUserRole();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  if (isAuthorized === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="mt-8 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  return isAdmin ? <Suspense fallback={<p>Loading...</p>}><AdminSettingsWrapper /></Suspense> : <UserSettings />;
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><p>Loading settings...</p></div>}>
            <SettingsPageContent />
        </Suspense>
    )
}
