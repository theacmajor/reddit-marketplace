import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { filterListings } from "@/lib/listings";
import { MOCK_LISTINGS } from "@/lib/mock-data";
import type {
  CategorySlug,
  Listing,
  ListingFilters,
  SortOption,
} from "@/types/listing";

export const USE_PRISMA = process.env.USE_PRISMA === "1";

export type Pagination = {
  page: number;
  pageSize: number;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type FacetCounts = {
  total: number;
  categories: Array<{ value: string; count: number }>;
  locations: Array<{ value: string; count: number }>;
  conditions: Array<{ value: string; count: number }>;
  hasImage: { withImage: number; withoutImage: number };
  priceRange: { min: number | null; max: number | null };
};

// -------------------------------------------------------------------------- //
// Query builder (pure) — produces Prisma args from filters/pagination.
// -------------------------------------------------------------------------- //

function postedWithinCutoff(postedWithin: ListingFilters["postedWithin"]): Date | null {
  if (!postedWithin || postedWithin === "all") return null;
  const now = Date.now();
  const days = postedWithin === "1d" ? 1 : postedWithin === "7d" ? 7 : 30;
  return new Date(now - days * 24 * 60 * 60 * 1000);
}

export function buildListingWhere(filters: ListingFilters): Prisma.ListingWhereInput {
  const and: Prisma.ListingWhereInput[] = [
    { status: "ACTIVE" },
    { isDeleted: false },
    { isRemoved: false },
    { hasImages: true },
  ];

  if (filters.q) {
    and.push({
      OR: [
        { title: { contains: filters.q, mode: "insensitive" } },
        { bodyText: { contains: filters.q, mode: "insensitive" } },
        { locationNormalized: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }
  if (filters.category) and.push({ category: filters.category });
  if (filters.location)
    and.push({ locationNormalized: { equals: filters.location, mode: "insensitive" } });
  if (typeof filters.minPrice === "number") and.push({ priceValue: { gte: filters.minPrice } });
  if (typeof filters.maxPrice === "number") and.push({ priceValue: { lte: filters.maxPrice } });
  if (filters.hasImage) and.push({ hasImages: true });
  const cutoff = postedWithinCutoff(filters.postedWithin);
  if (cutoff) and.push({ createdUtc: { gte: cutoff } });
  if (filters.minUpvotes && filters.minUpvotes > 0)
    and.push({ upvotes: { gte: filters.minUpvotes } });

  return { AND: and };
}

export function buildListingOrderBy(
  sort: SortOption | undefined,
): Prisma.ListingOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdUtc: "asc" };
    case "price_low_high":
      return { priceValue: "asc" };
    case "price_high_low":
      return { priceValue: "desc" };
    case "most_upvoted":
      return { upvotes: "desc" };
    case "most_commented":
      return { numComments: "desc" };
    case "newest":
    default:
      return { createdUtc: "desc" };
  }
}

export function normalizePagination(p?: Partial<Pagination>): Pagination {
  const page = Math.max(1, Math.floor(p?.page ?? 1));
  const pageSize = Math.min(60, Math.max(1, Math.floor(p?.pageSize ?? 24)));
  return { page, pageSize };
}

// -------------------------------------------------------------------------- //
// Repository — auto-routes between Prisma and mock based on USE_PRISMA.
// -------------------------------------------------------------------------- //

export async function fetchListings(
  filters: ListingFilters,
  pagination?: Partial<Pagination>,
): Promise<Page<Listing>> {
  const { page, pageSize } = normalizePagination(pagination);

  if (USE_PRISMA) {
    const where = buildListingWhere(filters);
    const orderBy = buildListingOrderBy(filters.sort);
    const [rows, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ]);
    return toPage(rows.map(prismaToListing), total, page, pageSize);
  }

  const filtered = filterListings(MOCK_LISTINGS, filters);
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  return toPage(items, total, page, pageSize);
}

export async function fetchListing(id: string): Promise<Listing | null> {
  if (USE_PRISMA) {
    const row = await prisma.listing.findUnique({ where: { id } });
    return row ? prismaToListing(row) : null;
  }
  return MOCK_LISTINGS.find((l) => l.id === id) ?? null;
}

export async function fetchFilters(): Promise<FacetCounts> {
  if (USE_PRISMA) {
    const baseWhere: Prisma.ListingWhereInput = {
      status: "ACTIVE",
      isDeleted: false,
      isRemoved: false,
    };
    const [total, byCategory, byLocation, byCondition, withImage, withoutImage, priceAgg] =
      await Promise.all([
        prisma.listing.count({ where: baseWhere }),
        prisma.listing.groupBy({
          by: ["category"],
          where: baseWhere,
          _count: { _all: true },
        }),
        prisma.listing.groupBy({
          by: ["locationNormalized"],
          where: baseWhere,
          _count: { _all: true },
        }),
        prisma.listing.groupBy({
          by: ["condition"],
          where: baseWhere,
          _count: { _all: true },
        }),
        prisma.listing.count({ where: { ...baseWhere, hasImages: true } }),
        prisma.listing.count({ where: { ...baseWhere, hasImages: false } }),
        prisma.listing.aggregate({
          where: { ...baseWhere, priceValue: { not: null } },
          _min: { priceValue: true },
          _max: { priceValue: true },
        }),
      ]);

    return {
      total,
      categories: byCategory
        .filter((r) => r.category)
        .map((r) => ({ value: r.category as string, count: r._count._all }))
        .sort((a, b) => b.count - a.count),
      locations: byLocation
        .filter((r) => r.locationNormalized)
        .map((r) => ({ value: r.locationNormalized as string, count: r._count._all }))
        .sort((a, b) => b.count - a.count),
      conditions: byCondition.map((r) => ({ value: r.condition, count: r._count._all })),
      hasImage: { withImage, withoutImage },
      priceRange: { min: priceAgg._min.priceValue, max: priceAgg._max.priceValue },
    };
  }

  return facetsFromMock();
}

// -------------------------------------------------------------------------- //
// Helpers
// -------------------------------------------------------------------------- //

function toPage<T>(items: T[], total: number, page: number, pageSize: number): Page<T> {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

type PrismaListingRow = Prisma.ListingGetPayload<Record<string, never>>;

function prismaToListing(row: PrismaListingRow): Listing {
  return {
    id: row.id,
    redditPostId: row.redditPostId,
    redditUrl: row.redditUrl,
    subreddit: row.subreddit,
    title: row.title,
    bodyText: row.bodyText,
    author: row.author,
    createdUtc: row.createdUtc.toISOString(),
    upvotes: row.upvotes,
    numComments: row.numComments,
    thumbnail: row.thumbnail,
    imageUrls: row.imageUrls,
    priceRaw: row.priceRaw,
    priceValue: row.priceValue,
    currency: row.currency,
    locationRaw: row.locationRaw,
    locationNormalized: row.locationNormalized,
    category: row.category,
    condition: row.condition,
    status: row.status,
    sourceType: row.sourceType,
    syncLastRunAt: row.syncLastRunAt?.toISOString() ?? null,
    priceConfidence: row.priceConfidence,
    locationConfidence: row.locationConfidence,
    categoryConfidence: row.categoryConfidence,
    scamFlag: row.scamFlag,
    duplicateGroupId: row.duplicateGroupId,
    hasImages: row.hasImages,
    isDeleted: row.isDeleted,
    isRemoved: row.isRemoved,
    lastSeenOnReddit: row.lastSeenOnReddit?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function facetsFromMock(): FacetCounts {
  const active = MOCK_LISTINGS.filter(
    (l) => l.status === "ACTIVE" && !l.isDeleted && !l.isRemoved,
  );

  const bucket = <K extends string>(key: (l: Listing) => K | null | undefined) => {
    const map = new Map<string, number>();
    for (const l of active) {
      const v = key(l);
      if (!v) continue;
      map.set(v, (map.get(v) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  };

  const prices = active.map((l) => l.priceValue).filter((v): v is number => v !== null);

  return {
    total: active.length,
    categories: bucket<CategorySlug>((l) => l.category as CategorySlug | null),
    locations: bucket((l) => l.locationNormalized),
    conditions: bucket((l) => l.condition),
    hasImage: {
      withImage: active.filter((l) => l.hasImages).length,
      withoutImage: active.filter((l) => !l.hasImages).length,
    },
    priceRange: {
      min: prices.length ? Math.min(...prices) : null,
      max: prices.length ? Math.max(...prices) : null,
    },
  };
}

// -------------------------------------------------------------------------- //
// Admin operations
// -------------------------------------------------------------------------- //

export async function adminUpdateListing(
  id: string,
  patch: {
    status?: "PENDING_REVIEW" | "ACTIVE" | "SOLD" | "EXPIRED" | "REMOVED" | "HIDDEN" | "FLAGGED";
    category?: CategorySlug | null;
    scamFlag?: boolean;
  },
): Promise<Listing | null> {
  if (!USE_PRISMA) {
    const target = MOCK_LISTINGS.find((l) => l.id === id);
    if (!target) return null;
    if (patch.status) target.status = patch.status;
    if (patch.category !== undefined) target.category = patch.category;
    if (patch.scamFlag !== undefined) target.scamFlag = patch.scamFlag;
    return target;
  }
  const row = await prisma.listing.update({
    where: { id },
    data: {
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.scamFlag !== undefined ? { scamFlag: patch.scamFlag } : {}),
    },
  });
  return prismaToListing(row);
}
