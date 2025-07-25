
"use client";

import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const isAdmin = user?.email === 'imnazelahi@gmail.com';
      if (!isAdmin) {
        router.push('/login');
      } else {
        router.replace('/settings');
      }
    };
    checkAdmin();
  }, [router]);
 
  return null;
}
