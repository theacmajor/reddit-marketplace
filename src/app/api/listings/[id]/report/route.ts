import type { NextRequest } from "next/server";

import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { USE_PRISMA } from "@/lib/listings-repo";

export const dynamic = "force-dynamic";

const VALID_REASONS = [
  "wrong_category",
  "wrong_price",
  "wrong_location",
  "spam",
  "scam",
  "duplicate",
  "sold",
  "other",
];

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

    if (!body || typeof body.reason !== "string") {
      return jsonError(400, "Missing reason field");
    }

    if (!VALID_REASONS.includes(body.reason)) {
      return jsonError(400, `Invalid reason. Allowed: ${VALID_REASONS.join(", ")}`);
    }

    const details = typeof body.details === "string" ? body.details.trim().slice(0, 2000) : null;

    if (!USE_PRISMA) {
      return jsonOk({ ok: true, id: "mock-report" });
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!listing) {
      return jsonError(404, "Listing not found");
    }

    const report = await prisma.listingReport.create({
      data: {
        listingId: id,
        reason: body.reason,
        details,
      },
      select: { id: true },
    });

    return jsonOk({ ok: true, id: report.id });
  } catch (err) {
    return jsonError(500, "Failed to submit report", {
      detail: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
