import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import TopNavbar from '@/components/TopNavbar';
import BottomNavbar from '@/components/BottomNavbar';

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
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/favicon-32x32.png',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0F0F0F',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex text-caudal-text">
        <Sidebar />
        <div className="flex-1 min-h-[100dvh] md:ml-60 w-full flex flex-col">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto w-full pb-20 md:pb-6">
            {children}
          </main>
        </div>
        <BottomNavbar />
      </body>
    </html>
  );
}
