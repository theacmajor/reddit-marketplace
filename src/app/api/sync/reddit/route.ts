import type { NextRequest } from "next/server";

import { jsonError, jsonOk, parseInt } from "@/lib/api";
import { runRedditSync } from "@/lib/sync-runner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const subredditParam = typeof body.subreddit === "string" ? body.subreddit.trim() : "";
    const subreddit = subredditParam || "BangaloreMarketplace";

    const pages = clampInt(body.pages, { min: 1, max: 10, fallback: 2 });
    const limit = clampInt(body.limit, { min: 1, max: 100, fallback: 25 });
    const dry = body.dry === true;

    const result = await runRedditSync({
      subreddit,
      pages,
      limit,
      dry,
      triggeredBy: "admin",
    });

    const status = result.status === "FAILED" ? 500 : 200;
    return jsonOk(
      {
        ok: result.status === "COMPLETED",
        runId: result.runId,
        status: result.status,
        counters: result.counters,
        durationMs: result.durationMs,
        notes: result.notes ?? null,
      },
      { status },
    );
  } catch (err) {
    return jsonError(500, "Failed to trigger sync", {
      detail: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

function clampInt(
  value: unknown,
  opts: { min: number; max: number; fallback: number },
): number {
  if (typeof value === "number") {
    const n = Math.floor(value);
    if (Number.isFinite(n)) return Math.max(opts.min, Math.min(opts.max, n));
  }
  if (typeof value === "string") {
    const parsed = parseInt(value, { min: opts.min, max: opts.max });
    if (parsed !== undefined) return parsed;
  }
  return opts.fallback;
}
