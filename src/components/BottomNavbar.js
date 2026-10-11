'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DashboardIcon, BanknoteIcon, CalendarIcon, ReceiptIcon } from '@/components/icons';

const navItems = [
  { href: '/', label: 'Dashboard', icon: DashboardIcon },
  { href: '/payroll', label: 'Payroll', icon: BanknoteIcon },
  { href: '/fixed-expenses', label: 'Fixed', icon: CalendarIcon },
  { href: '/variable-expenses', label: 'Variable', icon: ReceiptIcon },
];

export default function BottomNavbar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-caudal-surface/95 backdrop-blur-xl border-t border-caudal-border/80 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] transition-transform duration-300"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-4 h-15 max-w-lg mx-auto px-1 items-stretch">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 relative py-1.5 transition-all select-none active:scale-95 ${
                isActive
                  ? 'text-caudal-green font-semibold'
                  : 'text-caudal-text-muted hover:text-caudal-text'
              }`}
            >
              {isActive && (
                <span className="absolute top-1 w-6 h-0.5 rounded-full bg-caudal-green shadow-[0_0_8px_rgba(0,200,83,0.8)]" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-caudal-green' : ''}`} />
              <span className={`text-[10px] leading-tight tracking-tight ${isActive ? 'text-caudal-text font-bold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
