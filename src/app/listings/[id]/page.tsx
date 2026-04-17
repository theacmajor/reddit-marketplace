import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  ExternalLink,
  MapPin,
  MessageCircle,
  Tag,
  TrendingUp,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ListingCard } from "@/components/listing-card";
import { ListingGallery } from "@/components/listing-gallery";
import { ReportDialog } from "@/components/report-dialog";
import { SaveButton } from "@/components/save-button";
import { ShareButton } from "@/components/share-button";
import { fetchListing, fetchListings } from "@/lib/listings-repo";
import { cn, formatListingPrice, timeAgo } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  type CategorySlug,
  type Listing,
} from "@/types/listing";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const listing = await fetchListing(id);
  if (!listing) return { title: "Listing not found" };
  return {
    title: listing.title,
    description: (listing.bodyText ?? listing.title).slice(0, 160),
    openGraph: {
      images: listing.imageUrls.slice(0, 1),
    },
  };
}

export default async function ListingDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await fetchListing(id);
  if (!listing) notFound();

  const related = listing.category
    ? (await fetchListings({ category: listing.category, sort: "most_upvoted" }, { page: 1, pageSize: 4 }))
        .items.filter((l) => l.id !== listing.id)
        .slice(0, 3)
    : [];

  const categoryLabel = listing.category
    ? (CATEGORY_LABELS[listing.category as CategorySlug] ?? listing.category)
    : null;

  const postedDate = new Date(listing.createdUtc);
  const prettyDate = postedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const priceMissing = listing.priceValue === null && !listing.priceRaw;
  const locationMissing = !listing.locationNormalized && !listing.locationRaw;

  return (
    <div className="container py-6 md:py-10">
      <nav className="mb-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-2">
          <Link href="/listings">
            <ArrowLeft className="h-4 w-4" /> Back to listings
          </Link>
        </Button>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
        <div className="space-y-10 min-w-0">
          <ListingGallery images={listing.imageUrls} title={listing.title} />

          <section className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {categoryLabel && (
                <Badge variant="solid" className="inline-flex items-center gap-1">
                  <Tag className="h-3 w-3" /> {categoryLabel}
                </Badge>
              )}
              <Badge variant="secondary">r/{listing.subreddit}</Badge>
              {listing.condition !== "UNKNOWN" && (
                <Badge variant="outline">
                  {listing.condition.replace(/_/g, " ").toLowerCase()}
                </Badge>
              )}
              {listing.scamFlag && (
                <Badge variant="destructive">Flagged for review</Badge>
              )}
            </div>

            <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-[2.75rem] md:leading-[1.1]">
              {listing.title}
            </h1>

            <MetadataRow listing={listing} prettyDate={prettyDate} />

            {(priceMissing || locationMissing) && (
              <div className="flex flex-col gap-2">
                {priceMissing && (
                  <WarningBadge
                    label="Price not detected"
                    hint="Our extractor couldn't find a price in the post. Check the description or ask on Reddit."
                  />
                )}
                {locationMissing && (
                  <WarningBadge
                    label="Location not detected"
                    hint="No specific neighborhood was identified. Confirm the pickup area before meeting."
                  />
                )}
              </div>
            )}
          </section>

          <Separator />

          <section className="space-y-4">
            <SectionHeading eyebrow="Description" title="From the original post" />
            {listing.bodyText ? (
              <article className="max-w-prose whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
                {listing.bodyText}
              </article>
            ) : (
              <p className="max-w-prose text-sm text-muted-foreground">
                The author didn't include a description. Open the original Reddit
                thread for more context.
              </p>
            )}
          </section>

          <Separator />

          <section className="space-y-4">
            <SectionHeading eyebrow="Details" title="Listing details" />
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <DetailRow
                label="Price (raw)"
                value={listing.priceRaw ?? "Not listed"}
              />
              <DetailRow
                label="Currency"
                value={listing.currency ?? "—"}
              />
              <DetailRow
                label="Location (raw)"
                value={listing.locationRaw ?? "Not detected"}
              />
              <DetailRow
                label="Neighborhood"
                value={listing.locationNormalized ?? "—"}
              />
              <DetailRow label="Condition" value={formatCondition(listing.condition)} />
              <DetailRow label="Source" value={formatSource(listing.sourceType)} />
              <DetailRow label="Reddit ID" value={listing.redditPostId} mono />
              <DetailRow label="First seen" value={prettyDate} />
            </dl>
          </section>
        </div>

        <Sidebar listing={listing} />
      </div>

      {related.length > 0 && (
        <section className="mt-20 space-y-6">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Keep browsing"
              title={`More in ${categoryLabel}`}
            />
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href={`/listings?category=${listing.category}`}>
                View all <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Sidebar({ listing }: { listing: Listing }) {
  return (
    <aside className="relative">
      <div className="lg:sticky lg:top-24 space-y-4">
        <div className="rounded-3xl bg-card p-6 shadow-sm md:p-7">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Asking price
          </div>
          <div className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
            {formatListingPrice(listing)}
          </div>
          {listing.priceRaw && listing.priceValue !== null && (
            <div className="mt-1 text-xs text-muted-foreground">
              Listed as "{listing.priceRaw}"
            </div>
          )}

          <div className="mt-7 grid gap-2">
            <Button asChild size="lg" className="w-full">
              <a
                href={listing.redditUrl}
                target="_blank"
                rel="noreferrer"
                className="gap-2"
              >
                View original post on Reddit
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <SaveButton
              listingId={listing.id}
              variant="full"
              size="lg"
              className="w-full"
            />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <ShareButton title={listing.title} />
              <ReportDialog listingId={listing.id} />
            </div>
          </div>

          <Separator className="my-6" />

          <dl className="space-y-3 text-sm">
            <SidebarRow
              label="Subreddit"
              value={
                <a
                  href={`https://www.reddit.com/r/${listing.subreddit}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium hover:underline"
                >
                  r/{listing.subreddit}
                </a>
              }
            />
            <SidebarRow
              label="Upvotes"
              value={
                <span className="inline-flex items-center gap-1 font-medium">
                  <TrendingUp className="h-3.5 w-3.5" /> {listing.upvotes}
                </span>
              }
            />
            <SidebarRow
              label="Comments"
              value={
                <span className="inline-flex items-center gap-1 font-medium">
                  <MessageCircle className="h-3.5 w-3.5" /> {listing.numComments}
                </span>
              }
            />
            <SidebarRow label="Author" value={listing.author} />
          </dl>
        </div>

        <p className="px-2 text-xs text-muted-foreground">
          bangalore.market surfaces public Reddit posts and does not verify or
          endorse them. Always meet in public and exercise caution.
        </p>
      </div>
    </aside>
  );
}

function MetadataRow({
  listing,
  prettyDate,
}: {
  listing: Listing;
  prettyDate: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
      <MetaItem
        icon={<MapPin className="h-4 w-4" />}
        label={
          listing.locationNormalized ??
          listing.locationRaw ??
          "Location not detected"
        }
        muted={!listing.locationNormalized && !listing.locationRaw}
      />
      <MetaItem
        icon={<CalendarDays className="h-4 w-4" />}
        label={`${prettyDate} · ${timeAgo(listing.createdUtc)}`}
      />
      <MetaItem icon={<User className="h-4 w-4" />} label={listing.author} />
      <MetaItem
        icon={<TrendingUp className="h-4 w-4" />}
        label={`${listing.upvotes.toLocaleString()} upvotes`}
      />
      <MetaItem
        icon={<MessageCircle className="h-4 w-4" />}
        label={`${listing.numComments.toLocaleString()} comments`}
      />
    </div>
  );
}

function MetaItem({
  icon,
  label,
  muted,
}: {
  icon: React.ReactNode;
  label: string;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        muted && "italic text-muted-foreground/70",
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function WarningBadge({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[11px] font-semibold dark:bg-amber-900/60">
        !
      </span>
      <div className="space-y-0.5">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs opacity-80">{hint}</div>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-widest text-primary">
        {eyebrow}
      </div>
      <h2 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">
        {title}
      </h2>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className={cn("text-sm", mono && "font-mono text-xs")}>{value}</dd>
    </div>
  );
}

function SidebarRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatCondition(condition: Listing["condition"]): string {
  if (condition === "UNKNOWN") return "Not specified";
  return condition
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatSource(source: Listing["sourceType"]): string {
  switch (source) {
    case "REDDIT_API":
      return "Reddit API";
    case "REDDIT_PUSHSHIFT":
      return "Pushshift";
    case "REDDIT_RSS":
      return "Reddit RSS";
    case "MANUAL":
      return "Manual entry";
    case "IMPORT":
      return "Bulk import";
  }
}
