import type { NextRequest } from "next/server";

import { jsonError, jsonOk } from "@/lib/api";
import { runRedditSync } from "@/lib/sync-runner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;

  if (!expected || secret !== expected) {
    return jsonError(401, "Invalid or missing cron secret");
  }

  try {
    const result = await runRedditSync({
      subreddit: "BangaloreMarketplace",
      pages: 2,
      limit: 25,
      triggeredBy: "cron",
    });

    return jsonOk({
      ok: result.status === "COMPLETED",
      runId: result.runId,
      status: result.status,
      counters: result.counters,
      durationMs: result.durationMs,
    });
  } catch (err) {
    return jsonError(500, "Cron sync failed", {
      detail: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
