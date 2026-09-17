import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import TopNavbar from '@/components/TopNavbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Caudal | Dashboard',
  description: 'Personal finance tracker',
  icons: {
    icon: [
      { url: '/icon.png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex text-caudal-text">
        <Sidebar />
        <div className="flex-1 min-h-screen md:ml-60 w-full flex flex-col">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
