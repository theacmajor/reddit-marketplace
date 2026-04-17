/**
 * Sync posts from a public subreddit into our DB.
 *
 *   npm run reddit:sync
 *   npm run reddit:sync -- --subreddit=BangaloreMarketplace --pages=4 --limit=25
 *   npm run reddit:sync -- --dry
 *   npm run reddit:sync -- --verbose
 *
 * fetchSubredditPosts in lib/reddit.ts is still a placeholder — this script
 * will fetch 0 posts until the live fetch is wired there.
 */

import { prisma } from "@/lib/prisma";
import { runRedditSync, type SyncEvent } from "@/lib/sync-runner";

type CliOptions = {
  subreddit: string;
  pages: number;
  limit: number;
  dry: boolean;
  verbose: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    subreddit: "BangaloreMarketplace",
    pages: 4,
    limit: 25,
    dry: false,
    verbose: false,
  };

  for (const arg of argv.slice(2)) {
    if (arg === "--dry" || arg === "--dry-run") {
      opts.dry = true;
      continue;
    }
    if (arg === "--verbose" || arg === "-v") {
      opts.verbose = true;
      continue;
    }
    const m = /^--([^=]+)=(.*)$/.exec(arg);
    if (!m) continue;
    const [, key, value] = m;
    switch (key) {
      case "subreddit":
        opts.subreddit = value.trim();
        break;
      case "pages":
        opts.pages = Number(value) || opts.pages;
        break;
      case "limit":
        opts.limit = Number(value) || opts.limit;
        break;
    }
  }

  return opts;
}

function makeLogger(opts: CliOptions) {
  return (event: SyncEvent) => {
    switch (event.type) {
      case "start":
        console.log(
          `→ syncing r/${event.subreddit}  pages=${event.pages}${opts.dry ? "  (dry run)" : ""}`,
        );
        break;
      case "post":
        if (opts.verbose || event.action !== "skipped") {
          const marker =
            event.action === "created" ? "+" : event.action === "updated" ? "~" : "·";
          const title = event.title.length > 72
            ? event.title.slice(0, 69) + "…"
            : event.title;
          console.log(
            `  ${marker} ${event.redditPostId.padEnd(10)}  ${title}`,
          );
        }
        break;
      case "error":
        console.error(
          `  ✗ [${event.stage}] ${event.redditPostId ?? ""} ${event.message}`,
        );
        break;
      case "end": {
        const { counters, durationMs } = event;
        const seconds = (durationMs / 1000).toFixed(2);
        console.log(
          `✓ done in ${seconds}s  fetched=${counters.fetched}  created=${counters.created}  updated=${counters.updated}  failed=${counters.failed}  skipped=${counters.skipped}`,
        );
        if (counters.fetched === 0) {
          console.log(
            "  (fetch adapter is a placeholder — wire fetchSubredditPosts in src/lib/reddit.ts to go live.)",
          );
        }
        break;
      }
    }
  };
}

async function main() {
  const opts = parseArgs(process.argv);

  const controller = new AbortController();
  const onSigint = () => {
    console.log("\n⚠ received SIGINT — finishing current post then exiting…");
    controller.abort();
  };
  process.once("SIGINT", onSigint);
  process.once("SIGTERM", onSigint);

  try {
    const result = await runRedditSync({
      subreddit: opts.subreddit,
      pages: opts.pages,
      limit: opts.limit,
      dry: opts.dry,
      triggeredBy: "cli",
      signal: controller.signal,
      onEvent: makeLogger(opts),
    });

    if (result.status === "FAILED") {
      process.exitCode = 1;
      console.error(`✗ sync failed: ${result.notes ?? "unknown error"}`);
    } else if (result.status === "CANCELED") {
      process.exitCode = 130;
    }
  } catch (err) {
    process.exitCode = 1;
    console.error(err instanceof Error ? err.stack ?? err.message : err);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

void main();
