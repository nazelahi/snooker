
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from '@/components/layout/app-layout';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { useState, useEffect } from 'react';
import { getFromStorage } from '@/lib/storage';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteName, setSiteName] = useState("CueScore");
  const [siteDescription, setSiteDescription] = useState("The ultimate snooker club management app.");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const settings = getFromStorage('siteSettings', { name: 'CueScore', description: 'The ultimate snooker club management app.' });
    setSiteName(settings.name);
    setSiteDescription(settings.description);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <title>CueScore</title>
          <meta name="description" content="The ultimate snooker club management app." />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </head>
        <body className="font-body antialiased">
          <div>Loading...</div>
        </body>
      </html>
    );
  }

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
          <AuthProvider>
            <AppLayout>
              {children}
            </AppLayout>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
