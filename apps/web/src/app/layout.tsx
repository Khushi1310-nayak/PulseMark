import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Footer } from '../components/footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PulseMark | Smart Market Watchlist & Event-Driven Change Engine',
  description:
    'Institutional stock watchlist replacing passive spreadsheets with an event-driven change engine. Computes multi-dimensional temporal deltas, ranks anomalies, and isolates actionable market shifts.',
  keywords: ['Stock Watchlist', 'Market Pulse', 'Event Driven', 'Quant Trading', 'Delta Tracking', 'Indian Equities', 'NSE'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200 flex flex-col justify-between">
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
