import type { NextRequest } from "next/server";

import { jsonError, jsonOk, parseListingQuery } from "@/lib/api";
import { fetchListings } from "@/lib/listings-repo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { filters, page, pageSize } = parseListingQuery(new URL(req.url));
    const result = await fetchListings(filters, { page, pageSize });
    return jsonOk({
      items: result.items,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev,
      },
      filters,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonError(500, "Failed to fetch listings", { detail: message });
  }
}
