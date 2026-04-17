import { NextResponse } from "next/server";

import type { CategorySlug, ListingFilters, PostedWithin, SortOption } from "@/types/listing";

export const VALID_SORTS: SortOption[] = [
  "newest",
  "oldest",
  "price_low_high",
  "price_high_low",
  "most_upvoted",
  "most_commented",
];

export const VALID_POSTED_WITHIN: PostedWithin[] = ["1d", "7d", "30d", "all"];

export const VALID_CATEGORIES: CategorySlug[] = [
  "HOUSING",
  "FURNITURE",
  "ELECTRONICS",
  "VEHICLES",
  "FASHION",
  "HOBBIES",
  "SERVICES",
  "OTHER",
];

export function parseInt(value: string | null, opts: { min?: number; max?: number } = {}) {
  if (value === null || value === "") return undefined;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return undefined;
  if (opts.min !== undefined && n < opts.min) return opts.min;
  if (opts.max !== undefined && n > opts.max) return opts.max;
  return n;
}

export function parseBool(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  return value === "1" || value === "true";
}

export type ParsedListingQuery = {
  filters: ListingFilters;
  page: number;
  pageSize: number;
};

export function parseListingQuery(url: URL): ParsedListingQuery {
  const sp = url.searchParams;
  const rawSort = sp.get("sort");
  const rawPostedWithin = sp.get("postedWithin");
  const rawCategory = sp.get("category");

  const filters: ListingFilters = {
    q: sp.get("q")?.trim() || undefined,
    category: rawCategory && VALID_CATEGORIES.includes(rawCategory as CategorySlug)
      ? rawCategory
      : undefined,
    location: sp.get("location") || undefined,
    minPrice: parseInt(sp.get("minPrice"), { min: 0 }),
    maxPrice: parseInt(sp.get("maxPrice"), { min: 0 }),
    hasImage: parseBool(sp.get("hasImage")),
    postedWithin:
      rawPostedWithin && VALID_POSTED_WITHIN.includes(rawPostedWithin as PostedWithin)
        ? (rawPostedWithin as PostedWithin)
        : undefined,
    minUpvotes: parseInt(sp.get("minUpvotes"), { min: 0 }),
    sort:
      rawSort && VALID_SORTS.includes(rawSort as SortOption)
        ? (rawSort as SortOption)
        : "newest",
  };

  const page = parseInt(sp.get("page"), { min: 1 }) ?? 1;
  const pageSize = parseInt(sp.get("pageSize"), { min: 1, max: 60 }) ?? 24;

  return { filters, page, pageSize };
}

export function jsonError(status: number, message: string, extras?: Record<string, unknown>) {
  return NextResponse.json({ error: { message, ...extras } }, { status });
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
