
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import AdminSettings from "@/components/settings/admin-settings";
import UserSettings from "@/components/settings/user-settings";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthorized(true);
        setIsAdmin(user.email === 'admin@gmail.com');
      } else {
        router.push('/login');
      }
    };
    checkUserRole();
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading settings...</p>
      </div>
    );
  }

  return isAdmin ? <AdminSettings /> : <UserSettings />;
}
