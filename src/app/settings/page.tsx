
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import AdminSettings from "@/components/settings/admin-settings";
import UserSettings from "@/components/settings/user-settings";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export default function SettingsPage() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthorized(true);
        const { data: user, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setIsAdmin(user?.role === 'admin');
      } else {
        router.push('/login');
      }
    };
    checkUserRole();
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
