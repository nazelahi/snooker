
"use client";

import { useSiteLogo } from './site-logo-provider';
import Image from 'next/image';
import { Icons } from './icons';
import { cn } from '@/lib/utils';
import type { SVGProps } from "react";


interface SiteLogoProps extends SVGProps<SVGSVGElement> {
    // any additional props if needed
}

export function SiteLogo({ className, ...props }: SiteLogoProps) {
  const { logoSrc } = useSiteLogo();

  if (logoSrc) {
    return <Image src={logoSrc} alt="Site Logo" width={32} height={32} className={cn("object-contain", className)} />;
  }

  return <Icons.logo className={className} {...props} />;
}
