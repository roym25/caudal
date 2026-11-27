'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopNavbar from '@/components/TopNavbar';
import BottomNavbar from '@/components/BottomNavbar';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <main className="flex-1 w-full min-h-[100dvh]">{children}</main>;
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 min-h-[100dvh] md:ml-60 w-full flex flex-col">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto w-full pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNavbar />
    </>
  );
}
