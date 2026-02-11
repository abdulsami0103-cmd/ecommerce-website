import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'MarketHub - Multi-Vendor Marketplace',
    template: '%s | MarketHub',
  },
  description: 'Your trusted multi-vendor marketplace for quality products from verified sellers.',
  keywords: ['marketplace', 'ecommerce', 'multi-vendor', 'online shopping'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
