import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import AuthProvider from '@/components/AuthProvider';
import './globals.css';

// We'll use system fonts for better performance and classic typography
// Helvetica for headings, Garamond for body text

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0ea5e9',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  title: 'Hyrlqi - Ofform Gambling Platform',
  description: 'Ofform the thrill of Plinko, Mines, and Crash games on the most elegant gambling platform. Provably fair, instant payouts, and industry-leading security.',
  keywords: 'gambling, casino, plinko, mines, crash, provably fair, crypto gambling',
  authors: [{ name: 'Hyrlqi Team' }],
  creator: 'Hyrlqi',
  publisher: 'Hyrlqi',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hyrlqi.com',
    title: 'Hyrlqi - Ofform Gambling Platform',
    description: 'Ofform the thrill of Plinko, Mines, and Crash games on the most elegant gambling platform.',
    siteName: 'Hyrlqi',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Hyrlqi - Ofform Gambling Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hyrlqi - Ofform Gambling Platform',
    description: 'Ofform the thrill of Plinko, Mines, and Crash games on the most elegant gambling platform.',
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
    <html lang="en" className="dark">
      <body className="antialiased" style={{backgroundColor: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-helvetica)'}}>
        <AuthProvider>
          <div className="min-h-screen" style={{background: 'linear-gradient(135deg, var(--bg) 0%, var(--surface) 50%, var(--surface-2) 100%)'}}>
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
        </AuthProvider>
      </body>
    </html>
  );
}
