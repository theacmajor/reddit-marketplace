export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CategoryTiles } from "@/components/category-tiles";
import { Hero } from "@/components/hero";
import { ListingCard } from "@/components/listing-card";
import { fetchListings } from "@/lib/listings-repo";

export default async function HomePage() {
  const [trendingResult, freshResult] = await Promise.all([
    fetchListings({ sort: "most_upvoted" }, { page: 1, pageSize: 4 }),
    fetchListings({ sort: "newest" }, { page: 1, pageSize: 8 }),
  ]);
  const trending = trendingResult.items;
  const fresh = freshResult.items;

  return (
    <div className="container space-y-16 py-8 md:py-12">
      <Hero />

      <section className="space-y-5">
        <SectionHeader
          eyebrow="Categories"
          title="Browse by what you need"
          description="Jump straight into the category that matches your hunt."
        />
        <CategoryTiles />
      </section>

      <section className="space-y-5">
        <SectionHeader
          eyebrow="Trending"
          title="Most upvoted this week"
          description="Listings the r/BangaloreMarketplace community is paying attention to."
          action={
            <Button asChild variant="ghost" className="gap-1">
              <Link href="/listings?sort=most_upvoted">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
        <div className="stagger-grid grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trending.slice(0, 4).map((l, i) => (
            <ListingCard key={l.id} listing={l} priority={i < 2} />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeader
          eyebrow="Just posted"
          title="Fresh off Reddit"
          description="The newest community listings, updated continuously."
          action={
            <Button asChild variant="ghost" className="gap-1">
              <Link href="/listings">
                Explore all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
        <div className="stagger-grid grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {fresh.slice(0, 8).map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="text-xs font-medium uppercase tracking-widest text-primary">
          {eyebrow}
        </div>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
