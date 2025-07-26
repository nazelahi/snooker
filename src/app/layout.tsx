
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from '@/components/layout/app-layout';
import { ThemeProvider } from '@/components/theme-provider';
import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { SiteLogoProvider } from '@/components/site-logo-provider';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

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
  const supabase = createSupabaseBrowserClient();

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
      // Refetch settings on auth change, as a new user might have different permissions
      // or to ensure data is fresh after login/logout.
      fetchSiteSettings();
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
      </head>
      <body className={cn("font-sans antialiased", inter.variable)}>
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
