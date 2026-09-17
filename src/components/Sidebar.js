'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DashboardIcon, BanknoteIcon, CalendarIcon, ReceiptIcon, MenuIcon, XMarkIcon } from '@/components/icons';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard', icon: DashboardIcon },
    { href: '/payroll', label: 'Payroll', icon: BanknoteIcon },
    { href: '/fixed-expenses', label: 'Fixed Expenses', icon: CalendarIcon },
    { href: '/variable-expenses', label: 'Variable Expenses', icon: ReceiptIcon },
  ];

  return (
    <>
      {/* Mobile hamburger button */}
      <div className="md:hidden fixed top-0 left-0 p-4 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-md text-caudal-text-muted hover:text-caudal-text bg-caudal-surface border border-caudal-border shadow-sm focus:outline-none"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <div className={`fixed top-0 left-0 h-full w-60 bg-caudal-surface border-r border-caudal-border z-50 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Header - Option C with Custom Caudal Wave Emblem */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-caudal-border">
          <Link href="/" className="flex items-center group w-full" onClick={() => setIsOpen(false)}>
            <div className="w-full rounded-xl overflow-hidden border border-caudal-border bg-black/70 px-3 py-2 flex items-center justify-center shadow-sm group-hover:border-caudal-green/50 transition-all">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/caudal-logo.png"
                alt="Caudal"
                className="h-9 w-auto max-w-[150px] object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>

          <button 
            className="md:hidden text-caudal-text-muted hover:text-caudal-text ml-2 flex-shrink-0"
            onClick={() => setIsOpen(false)}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
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
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 transition-colors duration-200 ${
                  isActive 
                    ? 'border-l-2 border-caudal-green bg-caudal-surface-alt text-caudal-text' 
                    : 'border-l-2 border-transparent text-caudal-text-muted hover:bg-caudal-surface-alt hover:text-caudal-text'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-caudal-green' : ''}`} />
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Minimal Footer */}
        <div className="px-5 py-4 border-t border-caudal-border flex items-center justify-between text-xs text-caudal-text-dim">
          <span>v2.0</span>
          <span className="text-[11px] text-caudal-text-dim">Caudal OS</span>
        </div>
      </div>
    </>
  );
}
