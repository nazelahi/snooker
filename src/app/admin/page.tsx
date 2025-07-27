
"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }
      
      const { data: isAdmin, error } = await supabase.rpc('is_admin');

      if (error || !isAdmin) {
        // If not an admin, or there's an error,
        // redirect to the homepage as a fallback.
        router.replace('/');
      } else {
        // If they are an admin, redirect to the settings dashboard.
        router.replace('/settings');
      }
    };
    checkAdmin();
  }, [router]);
 
  if (loading) {
    return <p>Checking permissions...</p>
  }

  return null;
}
