import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(val: number, options?: { showSign?: boolean; decimals?: number }): string {
  const { showSign = false, decimals = 2 } = options || {};
  const sign = val > 0 && showSign ? '+' : '';
  const formattedNumber = Math.abs(val).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (val < 0) {
    return `-₹${formattedNumber}`;
  }
  return `${sign}₹${formattedNumber}`;
}

export function formatPercent(val: number, showSign = true): string {
  const sign = val > 0 && showSign ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

export function formatVolume(val: number): string {
  if (val >= 10000000) {
    return `${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `${(val / 100000).toFixed(2)} L`;
  }
  if (val >= 1000) {
    return `${(val / 1000).toFixed(1)} K`;
  }
  return val.toString();
}

export function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return isoString;
  }
}

export function formatBenchmarkTimeLabel(
  snapshot: { benchmarkTime?: string; benchmarkLabel?: string; isFirstSession?: boolean } | null | undefined
): string {
  if (!snapshot) return 'Today at 09:15 AM (Market Open)';

  const label = snapshot.benchmarkLabel || '';

  // Clean relative simulated labels like "15 Minutes Ago", "2 Hours Ago", "4 Hours Ago", "1 Day Ago", "3 Days Ago", "1 Week Ago"
  if (/(\b\d+\s+(minute|minutes|hour|hours|day|days|week|weeks)\s+ago\b)/i.test(label)) {
    const match = label.match(/(\d+\s+(?:minute|minutes|hour|hours|day|days|week|weeks)\s+ago)/i);
    if (match) {
      return match[1]
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    return label.replace(/^Simulated:\s*/i, '');
  }

  // If label says "First session today" or isFirstSession flag is true
  if (snapshot.isFirstSession || label.toLowerCase().includes('first session')) {
    return '09:15 AM Market Open (First Session Today)';
  }

  // If the snapshot has an actual benchmark timestamp (ISO string), format in the client's local timezone!
  if (snapshot.benchmarkTime) {
    const date = new Date(snapshot.benchmarkTime);
    if (!isNaN(date.getTime())) {
      const localTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const now = new Date();
      const isToday = now.toDateString() === date.toDateString();
      const dayPrefix = isToday ? 'Today' : date.toLocaleDateString([], { month: 'short', day: 'numeric' });

      // If taken within the last 5 minutes or explicitly marked "Just now"
      const diffMinutes = Math.abs(now.getTime() - date.getTime()) / (1000 * 60);
      if (label.toLowerCase().includes('just now') || diffMinutes < 5) {
        return `${dayPrefix} at ${localTime} (Just now)`;
      }
      return `${dayPrefix} at ${localTime}`;
    }
  }

  return label || 'Today at 09:15 AM (Market Open)';
}
