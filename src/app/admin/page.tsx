
"use client";

import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { getFromStorage } from "@/lib/storage";
import AdminSettings from "@/components/settings/admin-settings";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const userData = getFromStorage<{name: string, email: string, isAdmin?: boolean} | null>('userData', null);
    if (!userData?.isAdmin) {
      router.push('/login');
    } else {
      router.replace('/settings');
    }
  }, [router]);
 
  return (
      <div className="flex items-center justify-center h-full">
        <p>Redirecting to settings...</p>
      </div>
  );
}
