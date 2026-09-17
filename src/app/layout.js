import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Caudal',
  description: 'Personal finance tracker',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex bg-caudal-bg text-caudal-text">
        <Sidebar />
        <main className="flex-1 overflow-y-auto min-h-screen md:ml-60 w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
