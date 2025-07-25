
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from '@/components/layout/app-layout';
import { ThemeProvider } from '@/components/theme-provider';
import { useState, useEffect } from 'react';
import { getFromStorage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteName, setSiteName] = useState("CueScore");
  const [siteDescription, setSiteDescription] = useState("The ultimate snooker club management app.");

  useEffect(() => {
    const settings = getFromStorage('siteSettings', { name: 'CueScore', description: 'The ultimate snooker club management app.' });
    setSiteName(settings.name);
    setSiteDescription(settings.description);

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // For now, we just trigger a storage event to make other components update
      // In the future, this can be handled more elegantly with a global state manager
      setTimeout(() => window.dispatchEvent(new Event('storage')), 0);
    });

    return () => {
      authListener.subscription.unsubscribe();
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
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
