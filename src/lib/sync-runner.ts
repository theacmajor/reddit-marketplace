import { prisma } from "@/lib/prisma";
import { extractListingFields } from "@/lib/extractors";
import {
  iterateSubredditPosts,
  normalizeRedditPost,
  toListingCreateInput,
  toListingUpdateInput,
  toRawRedditPostInput,
  type RedditPostData,
} from "@/lib/reddit";

export type SyncOptions = {
  subreddit: string;
  pages?: number;
  limit?: number;
  dry?: boolean;
  triggeredBy?: string;
  signal?: AbortSignal;
  onEvent?: (event: SyncEvent) => void;
};

export type SyncEvent =
  | { type: "start"; subreddit: string; pages: number }
  | { type: "page"; page: number; after: string | null }
  | { type: "post"; index: number; redditPostId: string; title: string; action: "created" | "updated" | "skipped" }
  | { type: "error"; redditPostId?: string; stage: string; message: string }
  | { type: "end"; counters: SyncCounters; durationMs: number };

export type SyncCounters = {
  fetched: number;
  created: number;
  updated: number;
  failed: number;
  skipped: number;
  pages: number;
};

export type SyncRunResult = {
  runId: string | null;
  counters: SyncCounters;
  durationMs: number;
  status: "COMPLETED" | "FAILED" | "CANCELED";
  notes?: string;
};

function emptyCounters(): SyncCounters {
  return { fetched: 0, created: 0, updated: 0, failed: 0, skipped: 0, pages: 0 };
}

export async function runRedditSync(opts: SyncOptions): Promise<SyncRunResult> {
  const {
    subreddit,
    pages = 4,
    limit = 25,
    dry = false,
    triggeredBy = "cli",
    signal,
    onEvent,
  } = opts;

  const started = Date.now();
  const counters = emptyCounters();

  onEvent?.({ type: "start", subreddit, pages });

  let runId: string | null = null;
  if (!dry) {
    try {
      const run = await prisma.syncRun.create({
        data: { subreddit, status: "RUNNING", triggeredBy, pages },
        select: { id: true },
      });
      runId = run.id;
    } catch (err) {
      onEvent?.({
        type: "error",
        stage: "sync-run-create",
        message: (err as Error).message,
      });
    }
  }

  let status: SyncRunResult["status"] = "COMPLETED";
  let notes: string | undefined;

  try {
    let index = 0;
    for await (const post of iterateSubredditPosts(subreddit, {
      pages,
      limit,
      signal,
    })) {
      if (signal?.aborted) {
        status = "CANCELED";
        notes = "Aborted by caller";
        break;
      }

      counters.fetched++;
      try {
        const action = await processPost(post, { dry, runId, onEvent });
        if (action === "created") counters.created++;
        else if (action === "updated") counters.updated++;
        else counters.skipped++;

        onEvent?.({
          type: "post",
          index: index++,
          redditPostId: post.id,
          title: post.title,
          action,
        });
      } catch (err) {
        counters.failed++;
        const message = err instanceof Error ? err.message : String(err);
        onEvent?.({
          type: "error",
          redditPostId: post.id,
          stage: "process",
          message,
        });
        if (runId) {
          await recordSyncError(runId, post.id, "process", message);
        }
      }
    }
  } catch (err) {
    status = "FAILED";
    notes = err instanceof Error ? err.message : String(err);
    onEvent?.({ type: "error", stage: "iterate", message: notes });
  }

  const durationMs = Date.now() - started;

  if (runId) {
    try {
      await prisma.syncRun.update({
        where: { id: runId },
        data: {
          status,
          finishedAt: new Date(),
          fetched: counters.fetched,
          created: counters.created,
          updated: counters.updated,
          failed: counters.failed,
          notes,
        },
      });
    } catch (err) {
      onEvent?.({
        type: "error",
        stage: "sync-run-update",
        message: (err as Error).message,
      });
    }
  }

  onEvent?.({ type: "end", counters, durationMs });
  return { runId, counters, durationMs, status, notes };
}

type ProcessContext = {
  dry: boolean;
  runId: string | null;
  onEvent?: (event: SyncEvent) => void;
};

async function processPost(
  post: RedditPostData,
  ctx: ProcessContext,
): Promise<"created" | "updated" | "skipped"> {
  const normalized = normalizeRedditPost(post);
  const extraction = extractListingFields(normalized.title, normalized.bodyText);
  const rawInput = toRawRedditPostInput(post);
  const createInput = toListingCreateInput(post, normalized, extraction);
  const updateInput = toListingUpdateInput(normalized, extraction);

  if (ctx.dry) return "skipped";

  const existing = await prisma.listing.findUnique({
    where: { redditPostId: normalized.redditPostId },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.rawRedditPost.upsert({
      where: { redditPostId: normalized.redditPostId },
      create: rawInput,
      update: {
        rawJson: rawInput.rawJson,
        fetchedAt: new Date(),
        permalink: rawInput.permalink,
        subreddit: rawInput.subreddit,
      },
    });

    await tx.listing.upsert({
      where: { redditPostId: normalized.redditPostId },
      create: createInput,
      update: updateInput,
    });
  });

  return existing ? "updated" : "created";
}

async function recordSyncError(
  syncRunId: string,
  redditPostId: string | undefined,
  stage: string,
  message: string,
) {
  try {
    await prisma.syncError.create({
      data: { syncRunId, redditPostId, stage, message: message.slice(0, 4000) },
    });
  } catch {
    // swallow — logging-path errors must never break the sync
  }
}
