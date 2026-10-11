'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DashboardIcon, BanknoteIcon, CalendarIcon, ReceiptIcon } from '@/components/icons';

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard', icon: DashboardIcon },
    { href: '/payroll', label: 'Payroll', icon: BanknoteIcon },
    { href: '/fixed-expenses', label: 'Fixed Expenses', icon: CalendarIcon },
    { href: '/variable-expenses', label: 'Variable Expenses', icon: ReceiptIcon },
  ];

  return (
    <aside className="hidden md:flex fixed top-0 left-0 h-full w-60 bg-caudal-surface border-r border-caudal-border z-30 flex-col">
      {/* Header with Custom Caudal Wave Emblem */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-caudal-border">
        <Link href="/" className="flex items-center justify-center group w-full">
          <div className="w-full rounded-xl overflow-hidden border border-caudal-border/80 bg-black/70 px-3 py-2.5 flex items-center justify-center shadow-md group-hover:border-caudal-green/50 transition-all">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/caudal-logo.png"
              alt="Caudal"
              className="h-12 w-auto max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
            />
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-6 py-3 transition-colors duration-200 ${
                isActive 
                  ? 'border-l-2 border-caudal-green bg-caudal-surface-alt text-caudal-text font-semibold' 
                  : 'border-l-2 border-transparent text-caudal-text-muted hover:bg-caudal-surface-alt hover:text-caudal-text'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-caudal-green' : ''}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Minimal Footer */}
      <div className="px-5 py-4 border-t border-caudal-border flex items-center justify-between text-xs text-caudal-text-dim">
        <span>v2.0</span>
        <span className="text-[11px] text-caudal-text-dim">Caudal OS</span>
      </div>
    </aside>
  );
}
