
"use client";

import { useState, useEffect } from "react";
import { getFromStorage, saveToStorage } from "@/lib/storage";
import { useRouter } from 'next/navigation';
import AdminSettings from "@/components/settings/admin-settings";
import UserSettings from "@/components/settings/user-settings";

export default function SettingsPage() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userData = getFromStorage<{name: string, email: string, isAdmin?: boolean} | null>('userData', null);
    if (userData) {
      setIsAuthorized(true);
      setIsAdmin(!!userData.isAdmin);
    } else {
      router.push('/login');
    }
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
