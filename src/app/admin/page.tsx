
"use client";

import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const isAdmin = user?.email === 'admin@gmail.com';
      if (!isAdmin) {
        router.push('/login');
      } else {
        router.replace('/settings');
      }
    };
    checkAdmin();
  }, [router, supabase]);
 
  return null;
}
