
"use client";

import React, { createContext, useContext, ReactNode } from 'react';

interface SiteLogoContextType {
  logoSrc: string | null;
}

const SiteLogoContext = createContext<SiteLogoContextType | undefined>(undefined);

export const SiteLogoProvider = ({ children, logoSrc }: { children: ReactNode; logoSrc: string | null }) => {
  return (
    <SiteLogoContext.Provider value={{ logoSrc }}>
      {children}
    </SiteLogoContext.Provider>
  );
};

export const useSiteLogo = () => {
  const context = useContext(SiteLogoContext);
  if (context === undefined) {
    throw new Error('useSiteLogo must be used within a SiteLogoProvider');
  }
  return context;
};
