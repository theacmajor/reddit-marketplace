import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ImageOff,
  MapPin,
  MessageCircle,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/save-button";
import { cn, formatListingPrice, timeAgo } from "@/lib/utils";
import { CATEGORY_LABELS, type CategorySlug, type Listing } from "@/types/listing";

type Props = {
  listing: Listing;
  priority?: boolean;
  className?: string;
};

export function ListingCard({ listing, priority, className }: Props) {
  const cover = listing.imageUrls[0];
  const detailHref = `/listings/${listing.id}`;
  const categoryLabel = listing.category
    ? (CATEGORY_LABELS[listing.category as CategorySlug] ?? listing.category)
    : null;

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-3xl bg-card shadow-sm transition-shadow hover:shadow-lg",
        className,
      )}
    >
      <Link
        href={detailHref}
        aria-label={listing.title}
        className="relative block aspect-[4/3] w-full rounded-t-3xl bg-muted"
      >
        <div className="absolute inset-0 overflow-hidden rounded-t-3xl">
          {cover ? (
            <Image
              src={cover}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              priority={priority}
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-secondary text-muted-foreground">
              <ImageOff className="h-6 w-6" />
            </div>
          )}
        </div>

        {categoryLabel && (
          <div className="absolute left-3 top-3">
            <Badge variant="solid" className="backdrop-blur">
              {categoryLabel}
            </Badge>
          </div>
        )}

        <div className="absolute right-3 top-3">
          <Badge
            variant="secondary"
            className="bg-background/90 text-foreground backdrop-blur"
          >
            <TrendingUp className="mr-1 h-3 w-3" />
            {listing.upvotes}
          </Badge>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-end bg-gradient-to-t from-black/60 via-black/10 to-transparent p-3">
          <span className="pointer-events-auto text-[11px] font-medium text-white/90">
            {timeAgo(listing.createdUtc)}
          </span>
        </div>
      </Link>

      <div className="absolute right-3 top-14 z-10">
        <SaveButton listingId={listing.id} variant="overlay" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={detailHref}
            className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight hover:underline"
          >
            {listing.title}
          </Link>
          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {listing.locationNormalized ?? listing.locationRaw ?? "Bangalore"}
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {listing.numComments}
          </span>
          <span aria-hidden>·</span>
          <span>{listing.author}</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="text-xl font-semibold tracking-tight">
            {formatListingPrice(listing)}
          </span>
          <Button asChild size="sm" className="gap-1">
            <Link href={detailHref}>
              View details <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
