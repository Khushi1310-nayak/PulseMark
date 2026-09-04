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
