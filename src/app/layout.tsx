
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from '@/components/layout/app-layout';
import { ThemeProvider } from '@/components/theme-provider';
import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase/client";
import { SiteLogoProvider } from '@/components/site-logo-provider';
import { useRouter } from 'next/navigation';

const defaultSettings = { 
  name: 'CueScore', 
  description: 'The ultimate snooker club management app.',
  logo: null 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteName, setSiteName] = useState(defaultSettings.name);
  const [siteDescription, setSiteDescription] = useState(defaultSettings.description);
  const [siteLogo, setSiteLogo] = useState<string | null>(defaultSettings.logo);
  const router = useRouter();

  const fetchSiteSettings = async () => {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'siteSettings')
      .single();
    
    const settings = data?.value || defaultSettings;
    setSiteName(settings.name);
    setSiteDescription(settings.description);
    setSiteLogo(settings.logo);
  };

  useEffect(() => {
    fetchSiteSettings();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      fetchSiteSettings();
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        router.refresh();
      }
    });

    const settingsChannel = supabase
      .channel('site-settings-channel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'settings', filter: 'key=eq.siteSettings' },
        (payload) => {
           const newSettings = payload.new.value;
           setSiteName(newSettings.name);
           setSiteDescription(newSettings.description);
           setSiteLogo(newSettings.logo);
        }
      )
      .subscribe();

    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{siteName}</title>
        <meta name="description" content={siteDescription} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SiteLogoProvider logoSrc={siteLogo}>
            <AppLayout>
              {children}
            </AppLayout>
          </SiteLogoProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
