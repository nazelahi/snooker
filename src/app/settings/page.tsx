
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import AdminSettings from "@/components/settings/admin-settings";
import UserSettings from "@/components/settings/user-settings";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SettingsPage() {
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
      <div className="flex items-center justify-center h-full">
        <p>Loading settings...</p>
      </div>
    );
  }

  return isAdmin ? <AdminSettings /> : <UserSettings />;
}

