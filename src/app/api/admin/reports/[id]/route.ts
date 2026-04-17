import type { NextRequest } from "next/server";

import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { USE_PRISMA } from "@/lib/listings-repo";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["OPEN", "REVIEWED", "RESOLVED", "DISMISSED"] as const;

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

    if (!body || typeof body.status !== "string") {
      return jsonError(400, "Missing status field");
    }

    if (!VALID_STATUSES.includes(body.status as (typeof VALID_STATUSES)[number])) {
      return jsonError(400, `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`);
    }

    if (!USE_PRISMA) {
      return jsonOk({ ok: true });
    }

    const report = await prisma.listingReport.update({
      where: { id },
      data: {
        status: body.status as (typeof VALID_STATUSES)[number],
        resolvedAt: body.status !== "OPEN" ? new Date() : null,
      },
      select: { id: true, status: true },
    });

    return jsonOk({ ok: true, report });
  } catch (err) {
    return jsonError(500, "Failed to update report", {
      detail: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
