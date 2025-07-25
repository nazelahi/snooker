
"use client";

import { useState, useEffect } from 'react';
import { getFromStorage } from '@/lib/storage';
import Image from 'next/image';
import { Icons } from './icons';
import { cn } from '@/lib/utils';
import type { SVGProps } from "react";


interface SiteLogoProps extends SVGProps<SVGSVGElement> {
    // any additional props if needed
}

export function SiteLogo({ className, ...props }: SiteLogoProps) {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);

  useEffect(() => {
    const updateLogo = () => {
      const settings = getFromStorage<{ logo?: string }>('siteSettings', {});
      setLogoSrc(settings.logo || null);
    };

    updateLogo();

    window.addEventListener('storage', updateLogo);
    return () => {
      window.removeEventListener('storage', updateLogo);
    };
  }, []);

  if (logoSrc) {
    return <Image src={logoSrc} alt="Site Logo" width={32} height={32} className={cn("object-contain", className)} />;
  }

  return <Icons.logo className={className} {...props} />;
}
