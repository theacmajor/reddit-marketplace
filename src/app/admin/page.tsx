import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Database,
  ExternalLink,
  Flag,
  Inbox,
  LayoutDashboard,
  Layers,
  MapPinOff,
  Receipt,
  ShoppingBag,
  Tag,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  CategoryPicker,
  DismissReportButton,
  FlagScamButton,
  HideListingButton,
  RerunNormalizationButton,
  TriggerSyncButton,
} from "@/components/admin/admin-actions";
import { AdminLogoutButton } from "@/components/admin/admin-logout";
import { getAdminStats, type AdminListingSummary, type AdminReport } from "@/lib/admin-stats";
import { cn, formatPrice, timeAgo } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  type CategorySlug,
} from "@/types/listing";

export const metadata: Metadata = {
  title: "Admin dashboard",
  description: "Internal dashboard for moderating ingested Reddit listings.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const stats = await getAdminStats();

  return (
    <div className="container space-y-10 py-8 md:py-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium">
            <LayoutDashboard className="h-3.5 w-3.5" /> Internal
          </div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Admin dashboard
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Moderation and ingest controls for Reddit-sourced listings. Stats
            refresh on navigation; trigger a sync or normalization run below.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:items-center md:justify-end">
          <AdminLogoutButton />
          <RerunNormalizationButton />
          <TriggerSyncButton />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={Database}
          label="Total listings"
          value={stats.widgets.totalListings}
          hint="All time"
        />
        <Stat
          icon={Activity}
          label="Active"
          value={stats.widgets.activeListings}
          hint="Visible on the marketplace"
          accent
        />
        <Stat
          icon={ShoppingBag}
          label="Likely sold"
          value={stats.widgets.likelySoldListings}
          hint="Active · older than 30 days"
        />
        <Stat
          icon={Layers}
          label="Uncategorized"
          value={stats.widgets.uncategorized}
          hint="Awaiting category"
        />
        <Stat
          icon={Receipt}
          label="Missing price"
          value={stats.widgets.missingPrice}
          hint="No priceValue or priceRaw"
          warn
        />
        <Stat
          icon={MapPinOff}
          label="Missing location"
          value={stats.widgets.missingLocation}
          hint="No normalized or raw location"
          warn
        />
        <Stat
          icon={AlertOctagon}
          label="Suspicious"
          value={stats.widgets.suspicious}
          hint="scamFlag = true"
          destructive
        />
        <Stat
          icon={Flag}
          label="Open reports"
          value={stats.widgets.openReports}
          hint="User-submitted reports"
          destructive={stats.widgets.openReports > 0}
        />
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.2fr_minmax(0,1fr)]">
        <Panel
          title="Recent sync runs"
          description="Most recent 8 runs. Click Trigger sync to start a new run."
          icon={Activity}
          empty={stats.recentSyncs.length === 0}
          emptyLabel="No syncs yet. Press Trigger sync to kick one off."
        >
          <div className="overflow-hidden rounded-2xl bg-background">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Started</th>
                  <th className="px-4 py-2">Subreddit</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Fetched</th>
                  <th className="px-4 py-2 text-right">New</th>
                  <th className="px-4 py-2 text-right">Updated</th>
                  <th className="px-4 py-2 text-right">Failed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {stats.recentSyncs.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary/40">
                    <td className="px-4 py-2">
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(r.startedAt)}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-medium">r/{r.subreddit}</td>
                    <td className="px-4 py-2">
                      <SyncStatusPill status={r.status} />
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.fetched}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.created}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.updated}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {r.failed > 0 ? (
                        <span className="font-medium text-destructive">{r.failed}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Failed imports"
          description="Most recent sync errors."
          icon={AlertTriangle}
          empty={stats.failedImports.length === 0}
          emptyLabel="Clean. No recent import errors."
        >
          <ul className="space-y-3">
            {stats.failedImports.map((e) => (
              <li key={e.id} className="rounded-2xl bg-background p-4">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-muted-foreground">
                    {e.redditPostId ?? "—"}
                  </span>
                  <span className="text-muted-foreground">
                    {timeAgo(e.occurredAt)}
                  </span>
                </div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wider text-destructive">
                  {e.stage ?? "error"}
                </div>
                <div className="mt-1 text-sm">{e.message}</div>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <Panel
        title="User reports"
        description="Reports submitted by users about listing issues. Review and resolve them."
        icon={Flag}
        empty={stats.recentReports.length === 0}
        emptyLabel="No open reports. The marketplace is looking clean."
      >
        <ReportsTable reports={stats.recentReports} />
      </Panel>

      <Panel
        title="Listings missing a category"
        description="Assign a category manually or hide the listing if it isn't marketplace content."
        icon={Tag}
        empty={stats.missingCategory.length === 0}
        emptyLabel="Every listing has a category."
      >
        <AdminListingTable rows={stats.missingCategory} mode="category" />
      </Panel>

      <Panel
        title="Listings missing price or location"
        description="The extractor couldn't determine a price or a neighborhood. These need attention before they go live."
        icon={Inbox}
        empty={stats.missingPriceOrLocation.length === 0}
        emptyLabel="All listings have price and location coverage."
      >
        <AdminListingTable rows={stats.missingPriceOrLocation} mode="missing" />
      </Panel>
    </div>
  );
}

function AdminListingTable({
  rows,
  mode,
}: {
  rows: AdminListingSummary[];
  mode: "category" | "missing";
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-background">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2">Listing</th>
            {mode === "missing" && <th className="px-4 py-2">Gap</th>}
            <th className="px-4 py-2">Category</th>
            <th className="px-4 py-2">Posted</th>
            <th className="px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((l) => {
            const gaps: string[] = [];
            if (l.priceValue === null && !l.priceRaw) gaps.push("Price");
            if (!l.locationNormalized) gaps.push("Location");

            return (
              <tr key={l.id} className="hover:bg-secondary/40 align-top">
                <td className="max-w-sm px-4 py-3">
                  <Link
                    href={`/listings/${l.id}`}
                    className="line-clamp-2 font-medium hover:underline"
                  >
                    {l.title}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{l.author}</span>
                    <span>·</span>
                    <span>
                      {l.priceValue !== null
                        ? formatPrice(l.priceValue)
                        : (l.priceRaw ?? "—")}
                    </span>
                    <a
                      href={l.redditUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" /> reddit
                    </a>
                  </div>
                </td>
                {mode === "missing" && (
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {gaps.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        gaps.map((g) => (
                          <Badge key={g} variant="destructive">
                            {g}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                )}
                <td className="px-4 py-3">
                  <CategoryPicker
                    listingId={l.id}
                    value={l.category}
                  />
                  {l.category && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {CATEGORY_LABELS[l.category as CategorySlug] ?? l.category}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {timeAgo(l.createdUtc)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <FlagScamButton listingId={l.id} flagged={l.scamFlag} />
                    <HideListingButton listingId={l.id} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReportsTable({ reports }: { reports: AdminReport[] }) {
  const REASON_LABELS: Record<string, string> = {
    wrong_category: "Wrong category",
    wrong_price: "Incorrect price",
    wrong_location: "Wrong location",
    spam: "Spam",
    scam: "Suspected scam",
    duplicate: "Duplicate",
    sold: "Already sold",
    other: "Other",
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-background">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2">Listing</th>
            <th className="px-4 py-2">Reason</th>
            <th className="px-4 py-2">Details</th>
            <th className="px-4 py-2">Reported</th>
            <th className="px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {reports.map((r) => (
            <tr key={r.id} className="hover:bg-secondary/40 align-top">
              <td className="max-w-[200px] px-4 py-3">
                <Link
                  href={`/listings/${r.listingId}`}
                  className="line-clamp-2 font-medium hover:underline"
                >
                  {r.listingTitle}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Badge variant="destructive">
                  {REASON_LABELS[r.reason] ?? r.reason}
                </Badge>
              </td>
              <td className="max-w-[250px] px-4 py-3 text-xs text-muted-foreground">
                {r.details ? (
                  <span className="line-clamp-2">{r.details}</span>
                ) : (
                  <span className="italic">No details</span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {timeAgo(r.createdAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <DismissReportButton reportId={r.id} />
                  <HideListingButton listingId={r.listingId} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  warn,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  hint?: string;
  accent?: boolean;
  warn?: boolean;
  destructive?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-card p-5 shadow-sm",
        destructive && "bg-destructive/5",
        warn && "bg-amber-50/70 dark:bg-amber-950/30",
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary",
            accent && "bg-primary/10 text-primary",
            warn && "bg-amber-200/80 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100",
            destructive && "bg-destructive/15 text-destructive",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight tabular-nums">
        {value.toLocaleString()}
      </div>
      <div className="text-xs font-medium">{label}</div>
      {hint && (
        <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}

function Panel({
  title,
  description,
  icon: Icon,
  empty,
  emptyLabel,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  empty?: boolean;
  emptyLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-3xl bg-secondary/40 p-5 md:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-background">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {empty ? (
        <div className="rounded-2xl bg-background p-8 text-center text-sm text-muted-foreground">
          {emptyLabel ?? "Nothing to show."}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

function SyncStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    RUNNING: {
      label: "Running",
      className: "bg-primary/15 text-primary",
    },
    COMPLETED: {
      label: "Completed",
      className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    },
    FAILED: {
      label: "Failed",
      className: "bg-destructive/15 text-destructive",
    },
    CANCELED: {
      label: "Canceled",
      className: "bg-muted text-muted-foreground",
    },
  };
  const entry = map[status] ?? { label: status, className: "bg-muted" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        entry.className,
      )}
    >
      {entry.label}
    </span>
  );
}
