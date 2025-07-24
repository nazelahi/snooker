
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from '@/components/layout/app-layout';
import { useEffect, useState } from 'react';
import { getFromStorage } from '@/lib/storage';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteSettings, setSiteSettings] = useState({ name: 'CueScore', description: 'The ultimate snooker club management app.' });

  useEffect(() => {
    const storedSettings = getFromStorage('siteSettings', { name: 'CueScore', description: 'The ultimate snooker club management app.' });
    setSiteSettings(storedSettings);

    const handleStorageChange = () => {
        const stored = getFromStorage('siteSettings', { name: 'CueScore', description: 'The ultimate snooker club management app.' });
        setSiteSettings(stored);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    document.title = siteSettings.name;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', siteSettings.description);
    }
  }, [siteSettings]);

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="description" content={siteSettings.description} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppLayout>
          {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
