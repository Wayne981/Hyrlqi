import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0ea5e9',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  title: 'Hyrlqi - Premium Gambling Platform',
  description: 'Experience the thrill of Plinko, Mines, and Crash games on the most elegant gambling platform. Provably fair, instant payouts, and industry-leading security.',
  keywords: 'gambling, casino, plinko, mines, crash, provably fair, crypto gambling',
  authors: [{ name: 'Hyrlqi Team' }],
  creator: 'Hyrlqi',
  publisher: 'Hyrlqi',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hyrlqi.com',
    title: 'Hyrlqi - Premium Gambling Platform',
    description: 'Experience the thrill of Plinko, Mines, and Crash games on the most elegant gambling platform.',
    siteName: 'Hyrlqi',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Hyrlqi - Premium Gambling Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hyrlqi - Premium Gambling Platform',
    description: 'Experience the thrill of Plinko, Mines, and Crash games on the most elegant gambling platform.',
    images: ['/og-image.jpg'],
    creator: '@hyrlqi',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
          {children}
        </div>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(17, 24, 39, 0.95)',
              color: '#ffffff',
              border: '1px solid rgba(55, 65, 81, 0.5)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
