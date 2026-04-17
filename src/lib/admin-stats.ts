import "server-only";

import { prisma } from "@/lib/prisma";
import { MOCK_LISTINGS } from "@/lib/mock-data";
import { USE_PRISMA } from "@/lib/listings-repo";
import type { Listing } from "@/types/listing";

const LIKELY_SOLD_DAYS = 30;

export type AdminStats = {
  widgets: {
    totalListings: number;
    activeListings: number;
    likelySoldListings: number;
    uncategorized: number;
    missingPrice: number;
    missingLocation: number;
    suspicious: number;
    openReports: number;
  };
  recentSyncs: AdminSyncRun[];
  failedImports: AdminSyncError[];
  recentReports: AdminReport[];
  missingCategory: AdminListingSummary[];
  missingPriceOrLocation: AdminListingSummary[];
};

export type AdminReport = {
  id: string;
  listingId: string;
  listingTitle: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
};

export type AdminSyncRun = {
  id: string;
  subreddit: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  fetched: number;
  created: number;
  updated: number;
  failed: number;
  triggeredBy: string | null;
};

export type AdminSyncError = {
  id: string;
  syncRunId: string;
  redditPostId: string | null;
  stage: string | null;
  message: string;
  occurredAt: string;
};

export type AdminListingSummary = {
  id: string;
  title: string;
  author: string;
  category: string | null;
  locationNormalized: string | null;
  priceValue: number | null;
  priceRaw: string | null;
  status: string;
  createdUtc: string;
  redditUrl: string;
  scamFlag: boolean;
};

export async function getAdminStats(): Promise<AdminStats> {
  if (USE_PRISMA) return getStatsFromPrisma();
  return getStatsFromMock();
}

async function getStatsFromPrisma(): Promise<AdminStats> {
  const likelySoldCutoff = new Date(
    Date.now() - LIKELY_SOLD_DAYS * 24 * 60 * 60 * 1000,
  );

  const [
    totalListings,
    activeListings,
    likelySoldListings,
    uncategorized,
    missingPrice,
    missingLocation,
    suspicious,
    openReports,
    recentSyncsRaw,
    failedImportsRaw,
    recentReportsRaw,
    missingCategoryRaw,
    missingPriceOrLocationRaw,
  ] = await Promise.all([
    prisma.listing.count(),
    prisma.listing.count({
      where: { status: "ACTIVE", isDeleted: false, isRemoved: false },
    }),
    prisma.listing.count({
      where: {
        status: "ACTIVE",
        createdUtc: { lte: likelySoldCutoff },
      },
    }),
    prisma.listing.count({ where: { category: null } }),
    prisma.listing.count({ where: { priceValue: null, priceRaw: null } }),
    prisma.listing.count({
      where: { locationNormalized: null, locationRaw: null },
    }),
    prisma.listing.count({ where: { scamFlag: true } }),
    prisma.listingReport.count({ where: { status: "OPEN" } }),
    prisma.syncRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 8,
      select: syncRunSelect,
    }),
    prisma.syncError.findMany({
      orderBy: { occurredAt: "desc" },
      take: 8,
      select: syncErrorSelect,
    }),
    prisma.listingReport.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { listing: { select: { title: true } } },
    }),
    prisma.listing.findMany({
      where: { category: null, status: { not: "REMOVED" } },
      orderBy: { createdUtc: "desc" },
      take: 10,
      select: listingSummarySelect,
    }),
    prisma.listing.findMany({
      where: {
        status: { not: "REMOVED" },
        OR: [
          { priceValue: null, priceRaw: null },
          { locationNormalized: null, locationRaw: null },
        ],
      },
      orderBy: { createdUtc: "desc" },
      take: 10,
      select: listingSummarySelect,
    }),
  ]);

  return {
    widgets: {
      totalListings,
      activeListings,
      likelySoldListings,
      uncategorized,
      missingPrice,
      missingLocation,
      suspicious,
      openReports,
    },
    recentSyncs: recentSyncsRaw.map(mapSyncRun),
    failedImports: failedImportsRaw.map(mapSyncError),
    recentReports: recentReportsRaw.map((r) => ({
      id: r.id,
      listingId: r.listingId,
      listingTitle: r.listing.title,
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
    missingCategory: missingCategoryRaw.map(mapListingSummary),
    missingPriceOrLocation: missingPriceOrLocationRaw.map(mapListingSummary),
  };
}

function getStatsFromMock(): AdminStats {
  const active = MOCK_LISTINGS.filter(
    (l) => l.status === "ACTIVE" && !l.isDeleted && !l.isRemoved,
  );
  const cutoff = Date.now() - LIKELY_SOLD_DAYS * 24 * 60 * 60 * 1000;

  const summary = (l: Listing): AdminListingSummary => ({
    id: l.id,
    title: l.title,
    author: l.author,
    category: l.category,
    locationNormalized: l.locationNormalized,
    priceValue: l.priceValue,
    priceRaw: l.priceRaw,
    status: l.status,
    createdUtc: l.createdUtc,
    redditUrl: l.redditUrl,
    scamFlag: l.scamFlag,
  });

  return {
    widgets: {
      totalListings: MOCK_LISTINGS.length,
      activeListings: active.length,
      likelySoldListings: active.filter(
        (l) => new Date(l.createdUtc).getTime() <= cutoff,
      ).length,
      uncategorized: MOCK_LISTINGS.filter((l) => !l.category).length,
      missingPrice: MOCK_LISTINGS.filter(
        (l) => l.priceValue === null && !l.priceRaw,
      ).length,
      missingLocation: MOCK_LISTINGS.filter(
        (l) => !l.locationNormalized && !l.locationRaw,
      ).length,
      suspicious: MOCK_LISTINGS.filter((l) => l.scamFlag).length,
      openReports: 0,
    },
    recentSyncs: [],
    failedImports: [],
    recentReports: [],
    missingCategory: MOCK_LISTINGS.filter((l) => !l.category)
      .slice(0, 10)
      .map(summary),
    missingPriceOrLocation: MOCK_LISTINGS.filter(
      (l) =>
        (l.priceValue === null && !l.priceRaw) ||
        (!l.locationNormalized && !l.locationRaw),
    )
      .slice(0, 10)
      .map(summary),
  };
}

const syncRunSelect = {
  id: true,
  subreddit: true,
  status: true,
  startedAt: true,
  finishedAt: true,
  fetched: true,
  created: true,
  updated: true,
  failed: true,
  triggeredBy: true,
} as const;

const syncErrorSelect = {
  id: true,
  syncRunId: true,
  redditPostId: true,
  stage: true,
  message: true,
  occurredAt: true,
} as const;

const listingSummarySelect = {
  id: true,
  title: true,
  author: true,
  category: true,
  locationNormalized: true,
  priceValue: true,
  priceRaw: true,
  status: true,
  createdUtc: true,
  redditUrl: true,
  scamFlag: true,
} as const;

type PrismaSyncRun = {
  id: string;
  subreddit: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  fetched: number;
  created: number;
  updated: number;
  failed: number;
  triggeredBy: string | null;
};

type PrismaSyncError = {
  id: string;
  syncRunId: string;
  redditPostId: string | null;
  stage: string | null;
  message: string;
  occurredAt: Date;
};

type PrismaListingSummary = {
  id: string;
  title: string;
  author: string;
  category: string | null;
  locationNormalized: string | null;
  priceValue: number | null;
  priceRaw: string | null;
  status: string;
  createdUtc: Date;
  redditUrl: string;
  scamFlag: boolean;
};

function mapSyncRun(r: PrismaSyncRun): AdminSyncRun {
  return {
    ...r,
    startedAt: r.startedAt.toISOString(),
    finishedAt: r.finishedAt?.toISOString() ?? null,
  };
}

function mapSyncError(r: PrismaSyncError): AdminSyncError {
  return { ...r, occurredAt: r.occurredAt.toISOString() };
}

function mapListingSummary(r: PrismaListingSummary): AdminListingSummary {
  return { ...r, createdUtc: r.createdUtc.toISOString() };
}
