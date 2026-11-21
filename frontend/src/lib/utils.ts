import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export const formatCurrency = formatCurrencyUSD;
export const formatCurrencyINR = formatCurrencyUSD;

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function isDeadlineUrgent(deadlineDateString: string): boolean {
  const deadline = new Date(deadlineDateString).getTime();
  const now = new Date().getTime();
  const diffHours = (deadline - now) / (1000 * 60 * 60);
  return diffHours > 0 && diffHours <= 24;
}

/**
 * Format any long UUID or ID into a clean, short human-readable identifier
 * e.g. "c83b8e4e-0a5d-4f11-9a72-132d729db50a" -> "REQ-C83B8E"
 * or "REQ-1003" -> "REQ-1003"
 */
export function formatShortId(id?: string, prefix: string = "REQ"): string {
  if (!id) return `${prefix}-0000`;
  const clean = id.trim();
  // If already in short standard format like REQ-1003, REQ-101, QT-101, TXN-998
  if (/^[A-Z]{2,4}-[A-Z0-9]{3,8}$/i.test(clean)) {
    return clean.toUpperCase();
  }
  // Strip non-alphanumeric chars (like hyphens from UUIDs)
  const hex = clean.replace(/[^A-Za-z0-9]/g, "");
  // Take first 6 characters uppercase
  const shortCode = (hex.length >= 6 ? hex.slice(0, 6) : hex.padEnd(6, "0")).toUpperCase();
  return `${prefix}-${shortCode}`;
}
