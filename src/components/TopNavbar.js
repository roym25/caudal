'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const routeTitles = {
  '/': 'Dashboard',
  '/payroll': 'Payroll',
  '/fixed-expenses': 'Fixed Expenses',
  '/variable-expenses': 'Variable Expenses',
};

export default function TopNavbar({ onMenuClick }) {
  const pathname = usePathname();
  const currentTitle = routeTitles[pathname] || 'Dashboard';

  useEffect(() => {
    document.title = `Caudal | ${currentTitle}`;
  }, [currentTitle]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-caudal-surface/85 backdrop-blur-md border-b border-caudal-border">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-1.5 text-caudal-text-muted hover:text-caudal-text bg-caudal-surface-alt border border-caudal-border rounded-lg"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        <div className="flex items-center gap-2 text-sm">
          <span className="text-caudal-green font-bold tracking-tight">Caudal</span>
          <span className="text-caudal-border font-light">|</span>
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

