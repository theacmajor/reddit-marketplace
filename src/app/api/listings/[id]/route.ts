import type { NextRequest } from "next/server";

import { jsonError, jsonOk, VALID_CATEGORIES } from "@/lib/api";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { adminUpdateListing, fetchListing } from "@/lib/listings-repo";
import type { CategorySlug, ListingStatus } from "@/types/listing";

export const dynamic = "force-dynamic";

const VALID_STATUSES: ListingStatus[] = [
  "PENDING_REVIEW",
  "ACTIVE",
  "SOLD",
  "EXPIRED",
  "REMOVED",
  "HIDDEN",
  "FLAGGED",
];

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const listing = await fetchListing(id);
    if (!listing) return jsonError(404, "Listing not found");
    return jsonOk({ listing });
  } catch (err) {
    return jsonError(500, "Failed to fetch listing", {
      detail: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifySessionToken(token))) {
    return jsonError(401, "Authentication required");
  }

  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return jsonError(400, "Invalid JSON body");

    const patch: Parameters<typeof adminUpdateListing>[1] = {};

    if (typeof body.status === "string") {
      if (!VALID_STATUSES.includes(body.status as ListingStatus)) {
        return jsonError(400, `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`);
      }
      patch.status = body.status as ListingStatus;
    }
    if (body.category === null) {
      patch.category = null;
    } else if (typeof body.category === "string") {
      if (!VALID_CATEGORIES.includes(body.category as CategorySlug)) {
        return jsonError(400, `Invalid category. Allowed: ${VALID_CATEGORIES.join(", ")}`);
      }
      patch.category = body.category as CategorySlug;
    }
    if (typeof body.scamFlag === "boolean") patch.scamFlag = body.scamFlag;

    if (Object.keys(patch).length === 0) {
      return jsonError(400, "No updatable fields provided");
    }

    const updated = await adminUpdateListing(id, patch);
    if (!updated) return jsonError(404, "Listing not found");

    return jsonOk({ listing: updated });
  } catch (err) {
    return jsonError(500, "Failed to update listing", {
      detail: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
