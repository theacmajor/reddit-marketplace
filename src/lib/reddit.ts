import type { Prisma } from "@prisma/client";

import type { ListingExtraction } from "@/lib/extractors";

const REDDIT_BASE = "https://www.reddit.com";

// -------------------------------------------------------------------------- //
// Types — covering the subset of the Reddit JSON response we care about.
// -------------------------------------------------------------------------- //

export type RedditListingResponse = {
  kind: "Listing";
  data: {
    after: string | null;
    before: string | null;
    children: Array<{ kind: "t3"; data: RedditPostData }>;
  };
};

export type RedditPostData = {
  id: string;
  name: string; // e.g. "t3_abc123"
  subreddit: string;
  permalink: string;
  url: string;
  title: string;
  selftext: string;
  author: string;
  created_utc: number; // seconds since epoch
  score: number;
  ups?: number;
  num_comments: number;
  thumbnail: string;
  preview?: {
    enabled?: boolean;
    images?: Array<{
      id: string;
      source: { url: string; width: number; height: number };
      resolutions: Array<{ url: string; width: number; height: number }>;
    }>;
  };
  media_metadata?: Record<
    string,
    {
      id: string;
      m?: string;
      s?: { u?: string; gif?: string; mp4?: string };
      p?: Array<{ u: string; x: number; y: number }>;
    }
  >;
  gallery_data?: { items: Array<{ media_id: string; id?: number }> };
  is_gallery?: boolean;
  is_self?: boolean;
  is_video?: boolean;
  over_18?: boolean;
  stickied?: boolean;
  post_hint?: string;
  removed?: boolean;
  removed_by_category?: string | null;
  approved?: boolean;
};

// -------------------------------------------------------------------------- //
// Fetch client
// -------------------------------------------------------------------------- //

export type FetchOpts = {
  limit?: number;
  signal?: AbortSignal;
  userAgent?: string;
};

const DEFAULT_USER_AGENT = "bangalore.market/0.1 (reddit-sync; placeholder)";

export async function fetchSubredditPosts(
  subreddit: string,
  after?: string,
  opts: FetchOpts = {},
): Promise<RedditListingResponse> {
  const limit = opts.limit ?? 25;
  const qs = new URLSearchParams({ limit: String(limit), raw_json: "1" });
  if (after) qs.set("after", after);

  const res = await fetch(
    `${REDDIT_BASE}/r/${subreddit}/new.json?${qs}`,
    {
      headers: { "user-agent": opts.userAgent ?? DEFAULT_USER_AGENT },
      signal: opts.signal,
    },
  );

  if (!res.ok) {
    throw new Error(`Reddit fetch failed: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as RedditListingResponse;
}

/**
 * Async iterator over a subreddit, transparently following the `after` cursor.
 * Stops when Reddit returns `after: null` or when `pages` is reached.
 */
export async function* iterateSubredditPosts(
  subreddit: string,
  opts: { pages?: number; limit?: number; signal?: AbortSignal } = {},
): AsyncGenerator<RedditPostData, void, unknown> {
  const pages = opts.pages ?? 4;
  const limit = opts.limit ?? 25;

  let after: string | undefined;
  for (let page = 0; page < pages; page++) {
    const response = await fetchSubredditPosts(subreddit, after, {
      limit,
      signal: opts.signal,
    });
    for (const child of response.data.children) {
      if (child.kind === "t3") yield child.data;
    }
    if (!response.data.after) return;
    after = response.data.after;
  }
}

// -------------------------------------------------------------------------- //
// Extraction helpers
// -------------------------------------------------------------------------- //

const INVALID_THUMBS = new Set([
  "",
  "self",
  "default",
  "image",
  "nsfw",
  "spoiler",
  "none",
]);

const IMAGE_URL_RE = /\.(jpe?g|png|gif|webp)(\?.*)?$/i;

export function decodeRedditUrl(url: string): string {
  return url
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'");
}

export function extractThumbnail(post: RedditPostData): string | null {
  const t = post.thumbnail;
  if (!t || INVALID_THUMBS.has(t)) return null;
  if (!/^https?:\/\//.test(t)) return null;
  return decodeRedditUrl(t);
}

export function extractImageUrls(post: RedditPostData): string[] {
  const urls = new Set<string>();

  if (post.is_gallery && post.gallery_data?.items && post.media_metadata) {
    for (const item of post.gallery_data.items) {
      const meta = post.media_metadata[item.media_id];
      const src = meta?.s?.u ?? meta?.s?.gif;
      if (src) urls.add(decodeRedditUrl(src));
    }
  }

  if (post.preview?.images?.length) {
    for (const img of post.preview.images) {
      if (img.source?.url) urls.add(decodeRedditUrl(img.source.url));
    }
  }

  if (post.url && IMAGE_URL_RE.test(post.url)) {
    urls.add(decodeRedditUrl(post.url));
  }

  return [...urls];
}

export function isDeletedPost(post: RedditPostData): boolean {
  return post.author === "[deleted]" || post.selftext === "[deleted]";
}

export function isRemovedPost(post: RedditPostData): boolean {
  return (
    post.removed === true ||
    !!post.removed_by_category ||
    post.selftext === "[removed]"
  );
}

function cleanBody(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed === "[removed]" || trimmed === "[deleted]") return null;
  return trimmed;
}

// -------------------------------------------------------------------------- //
// Normalized shape — the neutral DTO produced from a Reddit post.
// -------------------------------------------------------------------------- //

export type NormalizedRedditPost = {
  redditPostId: string;
  subreddit: string;
  permalink: string;
  redditUrl: string;
  title: string;
  bodyText: string | null;
  author: string;
  createdUtc: Date;
  upvotes: number;
  numComments: number;
  thumbnail: string | null;
  imageUrls: string[];
  hasImages: boolean;
  isDeleted: boolean;
  isRemoved: boolean;
};

export function normalizeRedditPost(post: RedditPostData): NormalizedRedditPost {
  const imageUrls = extractImageUrls(post);
  const upvotes =
    typeof post.score === "number" ? post.score : typeof post.ups === "number" ? post.ups : 0;

  return {
    redditPostId: post.id,
    subreddit: post.subreddit,
    permalink: post.permalink,
    redditUrl: `${REDDIT_BASE}${post.permalink}`,
    title: post.title,
    bodyText: cleanBody(post.selftext),
    author: post.author,
    createdUtc: new Date(post.created_utc * 1000),
    upvotes,
    numComments: typeof post.num_comments === "number" ? post.num_comments : 0,
    thumbnail: extractThumbnail(post),
    imageUrls,
    hasImages: imageUrls.length > 0,
    isDeleted: isDeletedPost(post),
    isRemoved: isRemovedPost(post),
  };
}

// -------------------------------------------------------------------------- //
// Prisma shapers — ready-to-use inputs for upsert/create.
// -------------------------------------------------------------------------- //

export function toRawRedditPostInput(
  post: RedditPostData,
): Prisma.RawRedditPostCreateInput {
  return {
    redditPostId: post.id,
    subreddit: post.subreddit,
    permalink: post.permalink,
    rawJson: post as unknown as Prisma.InputJsonValue,
    fetchedAt: new Date(),
  };
}

export function toListingCreateInput(
  post: RedditPostData,
  normalized: NormalizedRedditPost = normalizeRedditPost(post),
  extraction?: ListingExtraction,
): Prisma.ListingUncheckedCreateInput {
  const now = new Date();
  const status: Prisma.ListingUncheckedCreateInput["status"] =
    normalized.isDeleted || normalized.isRemoved ? "REMOVED" : "PENDING_REVIEW";

  return {
    redditPostId: normalized.redditPostId,
    redditUrl: normalized.redditUrl,
    subreddit: normalized.subreddit,
    title: normalized.title,
    bodyText: normalized.bodyText,
    author: normalized.author,
    createdUtc: normalized.createdUtc,
    upvotes: normalized.upvotes,
    numComments: normalized.numComments,
    thumbnail: normalized.thumbnail,
    imageUrls: normalized.imageUrls,
    hasImages: normalized.hasImages,
    isDeleted: normalized.isDeleted,
    isRemoved: normalized.isRemoved,
    status,
    sourceType: "REDDIT_API",
    syncLastRunAt: now,
    lastSeenOnReddit: now,
    priceRaw: extraction?.priceRaw ?? null,
    priceValue: extraction?.priceValue ?? null,
    currency: extraction?.currency ?? "INR",
    priceConfidence: extraction?.priceConfidence ?? null,
    locationRaw: extraction?.locationRaw ?? null,
    locationNormalized: extraction?.locationNormalized ?? null,
    locationConfidence: extraction?.locationConfidence ?? null,
    category: extraction?.category ?? null,
    categoryConfidence: extraction?.categoryConfidence ?? null,
    condition: extraction?.condition ?? "UNKNOWN",
  };
}

/**
 * Fields safe to overwrite on each sync. We refresh drift-y signals (score,
 * comments, liveness) and let extraction re-run since it's deterministic
 * given the post text. If you introduce manual admin overrides later, gate
 * those fields here.
 */
export function toListingUpdateInput(
  normalized: NormalizedRedditPost,
  extraction?: ListingExtraction,
): Prisma.ListingUncheckedUpdateInput {
  const now = new Date();
  return {
    title: normalized.title,
    bodyText: normalized.bodyText,
    upvotes: normalized.upvotes,
    numComments: normalized.numComments,
    thumbnail: normalized.thumbnail,
    imageUrls: normalized.imageUrls,
    hasImages: normalized.hasImages,
    isDeleted: normalized.isDeleted,
    isRemoved: normalized.isRemoved,
    lastSeenOnReddit: now,
    syncLastRunAt: now,
    ...(extraction && {
      priceRaw: extraction.priceRaw,
      priceValue: extraction.priceValue,
      currency: extraction.currency ?? "INR",
      priceConfidence: extraction.priceConfidence,
      locationRaw: extraction.locationRaw,
      locationNormalized: extraction.locationNormalized,
      locationConfidence: extraction.locationConfidence,
      category: extraction.category,
      categoryConfidence: extraction.categoryConfidence,
      condition: extraction.condition,
    }),
  };
}

export const REDDIT = { BASE: REDDIT_BASE, DEFAULT_USER_AGENT } as const;
