import { MOCK_LISTINGS } from "@/lib/mock-data";
import type { Listing, ListingFilters, PostedWithin } from "@/types/listing";

function postedWithinCutoff(value: PostedWithin | undefined): number | null {
  if (!value || value === "all") return null;
  const now = Date.now();
  switch (value) {
    case "1d":
      return now - 24 * 60 * 60 * 1000;
    case "7d":
      return now - 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return now - 30 * 24 * 60 * 60 * 1000;
  }
}

export function filterListings(listings: Listing[], filters: ListingFilters): Listing[] {
  let result = listings.filter(
    (l) => l.status === "ACTIVE" && !l.isDeleted && !l.isRemoved && l.hasImages,
  );

  if (filters.q) {
    const needle = filters.q.toLowerCase();
    result = result.filter(
      (l) =>
        l.title.toLowerCase().includes(needle) ||
        (l.bodyText ?? "").toLowerCase().includes(needle) ||
        (l.locationNormalized ?? "").toLowerCase().includes(needle),
    );
  }

  if (filters.category) {
    result = result.filter((l) => l.category === filters.category);
  }

  if (filters.location) {
    result = result.filter(
      (l) =>
        (l.locationNormalized ?? "").toLowerCase() ===
        filters.location!.toLowerCase(),
    );
  }

  if (typeof filters.minPrice === "number") {
    result = result.filter((l) => (l.priceValue ?? 0) >= filters.minPrice!);
  }

  if (typeof filters.maxPrice === "number") {
    result = result.filter(
      (l) => (l.priceValue ?? Number.MAX_SAFE_INTEGER) <= filters.maxPrice!,
    );
  }

  if (filters.hasImage) {
    result = result.filter((l) => l.hasImages && l.imageUrls.length > 0);
  }

  const cutoff = postedWithinCutoff(filters.postedWithin);
  if (cutoff !== null) {
    result = result.filter((l) => new Date(l.createdUtc).getTime() >= cutoff);
  }

  if (typeof filters.minUpvotes === "number" && filters.minUpvotes > 0) {
    result = result.filter((l) => l.upvotes >= filters.minUpvotes!);
  }

  switch (filters.sort) {
    case "oldest":
      result.sort(
        (a, b) => new Date(a.createdUtc).getTime() - new Date(b.createdUtc).getTime(),
      );
      break;
    case "price_low_high":
      result.sort((a, b) => (a.priceValue ?? Infinity) - (b.priceValue ?? Infinity));
      break;
    case "price_high_low":
      result.sort((a, b) => (b.priceValue ?? -Infinity) - (a.priceValue ?? -Infinity));
      break;
    case "most_upvoted":
      result.sort((a, b) => b.upvotes - a.upvotes);
      break;
    case "most_commented":
      result.sort((a, b) => b.numComments - a.numComments);
      break;
    case "newest":
    default:
      result.sort(
        (a, b) => new Date(b.createdUtc).getTime() - new Date(a.createdUtc).getTime(),
      );
  }

  return result;
}

export function parseFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): ListingFilters {
  const get = (key: string) => {
    const v = searchParams[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const postedWithin = get("postedWithin") as PostedWithin | undefined;
  const sort = get("sort") as ListingFilters["sort"] | undefined;
  const minPrice = get("minPrice");
  const maxPrice = get("maxPrice");
  const minUpvotes = get("minUpvotes");
  const hasImage = get("hasImage");

  return {
    q: get("q") || undefined,
    category: get("category") || undefined,
    location: get("location") || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    hasImage: hasImage === "1" || hasImage === "true" ? true : undefined,
    postedWithin: postedWithin || undefined,
    minUpvotes: minUpvotes ? Number(minUpvotes) : undefined,
    sort: sort || "newest",
  };
}

export async function getListings(filters: ListingFilters): Promise<Listing[]> {
  // TODO: replace with Prisma query once seed is loaded
  return filterListings(MOCK_LISTINGS, filters);
}

export async function getListing(id: string): Promise<Listing | null> {
  return MOCK_LISTINGS.find((l) => l.id === id) ?? null;
}
