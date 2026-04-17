import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | null | undefined, currency = "INR"): string {
  if (amount === null || amount === undefined) return "Contact seller";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString("en-IN")}`;
  }
}

export function formatListingPrice(listing: {
  priceValue: number | null;
  priceRaw: string | null;
  currency: string | null;
}): string {
  if (listing.priceValue !== null) {
    return formatPrice(listing.priceValue, listing.currency ?? "INR");
  }
  if (listing.priceRaw) return listing.priceRaw;
  return "Contact seller";
}

export function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const seconds = Math.max(1, Math.floor((now - then) / 1000));
  const units: Array<[string, number]> = [
    ["y", 60 * 60 * 24 * 365],
    ["mo", 60 * 60 * 24 * 30],
    ["w", 60 * 60 * 24 * 7],
    ["d", 60 * 60 * 24],
    ["h", 60 * 60],
    ["m", 60],
  ];
  for (const [label, secs] of units) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) return `${value}${label} ago`;
  }
  return "just now";
}
