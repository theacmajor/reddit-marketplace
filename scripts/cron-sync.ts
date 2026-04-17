/**
 * Standalone auto-sync process. Runs a Reddit sync every hour.
 *
 *   npm run reddit:cron
 *
 * Keeps running until killed (Ctrl+C). Each cycle syncs 2 pages (50 posts).
 * For production, use the HTTP endpoint instead:
 *
 *   curl "http://localhost:3000/api/cron/sync?secret=$CRON_SECRET"
 */

import { prisma } from "@/lib/prisma";
import { runRedditSync, type SyncEvent } from "@/lib/sync-runner";

const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

function log(event: SyncEvent) {
  const ts = new Date().toISOString().slice(11, 19);
  switch (event.type) {
    case "start":
      console.log(`[${ts}] syncing r/${event.subreddit}…`);
      break;
    case "end": {
      const c = event.counters;
      console.log(
        `[${ts}] done in ${(event.durationMs / 1000).toFixed(1)}s — ` +
          `fetched=${c.fetched} new=${c.created} updated=${c.updated} failed=${c.failed}`,
      );
      break;
    }
    case "error":
      console.error(`[${ts}] error [${event.stage}] ${event.message}`);
      break;
  }
}

async function cycle() {
  try {
    await runRedditSync({
      subreddit: "BangaloreMarketplace",
      pages: 2,
      limit: 25,
      triggeredBy: "cron",
      onEvent: log,
    });
  } catch (err) {
    console.error("Sync cycle failed:", err instanceof Error ? err.message : err);
  }
}

async function main() {
  console.log(`Auto-sync started — syncing every ${INTERVAL_MS / 60_000} minutes`);
  console.log("Press Ctrl+C to stop.\n");

  await cycle();

  const timer = setInterval(cycle, INTERVAL_MS);

  const shutdown = async () => {
    console.log("\nShutting down…");
    clearInterval(timer);
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

void main();
