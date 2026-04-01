import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://newschautari.ai'),
  title: {
    default: 'NewsChautari.ai - AI-Powered Nepal News | Smart. Short. Simple.',
    template: '%s | NewsChautari.ai',
  },
  description: 'NewsChautari.ai delivers the latest news from Nepal and around the world. AI-powered summaries, intelligent categorization, and concise updates you can trust.',
  keywords: 'NewsChautari.ai, Nepal news, Nepali news, breaking news, AI news summary, smart news, Nepal politics, Nepal sports, Nepal business, technology news Nepal',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://newschautari.ai',
    siteName: 'NewsChautari.ai',
    title: 'NewsChautari.ai - AI-Powered Nepal News',
    description: 'AI-powered news aggregator delivering the latest from Nepal and the world. Smart summaries, short updates, simple navigation.',
    images: [{ url: '/logo.png', width: 1024, height: 1024, alt: 'NewsChautari.ai' }],
  },
  twitter: {
    card: 'summary',
    title: 'NewsChautari.ai - AI-Powered Nepal News',
    description: 'AI-powered news aggregator for Nepal. Smart summaries, short updates, simple navigation.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://newschautari.ai',
  },
  verification: {
    // Add Google Search Console verification here when available
    // google: 'your-verification-code',
  },
};

const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  name: 'NewsChautari.ai',
  url: 'https://newschautari.ai',
  logo: 'https://newschautari.ai/logo.png',
  description: 'AI-powered news aggregator delivering the latest news from Nepal and around the world.',
  sameAs: [],
};

const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'NewsChautari.ai',
  url: 'https://newschautari.ai',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://newschautari.ai/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
