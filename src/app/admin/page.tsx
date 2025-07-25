
"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from "@/lib/supabase";

export default function AdminPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      
      const { data: user, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (user?.role === 'admin') {
        setIsAdmin(true);
        router.replace('/settings');
      } else {
        router.push('/login');
      }
      setLoading(false);
    };
    checkAdmin();
  }, [router, supabase]);
 
  if (loading) {
    return <div>Loading...</div>;
  }

  return null;
}
