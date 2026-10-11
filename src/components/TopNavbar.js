'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

const routeTitles = {
  '/': 'Dashboard',
  '/payroll': 'Payroll',
  '/fixed-expenses': 'Fixed Expenses',
  '/variable-expenses': 'Variable Expenses',
};

export default function TopNavbar() {
  const pathname = usePathname();
  const currentTitle = routeTitles[pathname] || 'Dashboard';

  useEffect(() => {
    document.title = `Caudal | ${currentTitle}`;
  }, [currentTitle]);

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-caudal-surface/85 backdrop-blur-md border-b border-caudal-border transition-all"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
    >
      <div className="flex items-center gap-2.5">
        <Link href="/" className="md:hidden flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/caudal-logo.png"
            alt="Caudal"
            className="h-7 w-auto object-contain rounded"
          />
        </Link>

        <div className="flex items-center gap-2 text-sm sm:text-base">
          <span className="text-caudal-green font-bold tracking-tight hidden sm:inline">Caudal</span>
          <span className="text-caudal-border font-light hidden sm:inline">|</span>
          <span className="text-caudal-text font-semibold">{currentTitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-caudal-text-muted hidden sm:inline-block font-medium">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
    </header>
  );
}
