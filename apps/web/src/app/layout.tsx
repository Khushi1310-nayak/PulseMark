import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PulseMark | Smart Market Watchlist & Event-Driven Change Engine',
  description:
    'Institutional stock watchlist replacing passive spreadsheets with an event-driven change engine. Computes multi-dimensional temporal deltas, ranks anomalies, and isolates actionable market shifts.',
  keywords: ['Stock Watchlist', 'Market Pulse', 'Event Driven', 'Quant Trading', 'Delta Tracking', 'Indian Equities', 'NSE'],
};

import { Footer } from '../components/footer';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200 flex flex-col justify-between">
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
