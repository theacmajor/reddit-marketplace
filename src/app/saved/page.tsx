"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ListingCard } from "@/components/listing-card";
import { ListingGridSkeleton } from "@/components/listing-skeleton";
import { useSavedListings } from "@/hooks/use-saved-listings";
import type { Listing } from "@/types/listing";

export default function SavedPage() {
  const { saved, hydrated } = useSavedListings();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;

    const ids = [...saved];
    if (ids.length === 0) {
      setListings([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function fetchSaved() {
      const results: Listing[] = [];
      const batchSize = 10;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const fetches = batch.map(async (id) => {
          try {
            const res = await fetch(`/api/listings/${id}`);
            if (!res.ok) return null;
            const json = (await res.json()) as { listing?: Listing };
            return json.listing ?? null;
          } catch {
            return null;
          }
        });
        const resolved = await Promise.all(fetches);
        for (const l of resolved) {
          if (l) results.push(l);
        }
      }
      if (!cancelled) {
        setListings(results);
        setLoading(false);
      }
    }

    fetchSaved();
    return () => {
      cancelled = true;
    };
  }, [saved, hydrated]);

  if (!hydrated || loading) {
    return (
      <div className="container space-y-8 py-8 md:py-12">
        <Header />
        <ListingGridSkeleton count={3} />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="container space-y-8 py-8 md:py-12">
        <Header />
        <EmptyState
          icon={<Bookmark className="h-5 w-5" />}
          title="No saved listings"
          description="Tap the bookmark icon on any listing to save it here. Your saves are stored in this browser."
          action={
            <Button asChild>
              <Link href="/listings">Browse listings</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container space-y-8 py-8 md:py-12">
      <Header count={listings.length} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}

function Header({ count }: { count?: number }) {
  return (
    <header className="space-y-1">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        Saved listings
      </h1>
      <p className="text-sm text-muted-foreground">
        {count !== undefined && count > 0
          ? `${count} listing${count !== 1 ? "s" : ""} saved in this browser.`
          : "Keep track of listings you're interested in."}
      </p>
    </header>
  );
}
