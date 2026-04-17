import type { Metadata } from "next";
import { Suspense } from "react";

import { FilterPanel } from "@/components/filter-panel";
import { ListingGrid } from "@/components/listing-grid";
import { ListingGridSkeleton } from "@/components/listing-skeleton";
import { ListingsToolbar } from "@/components/listings-toolbar";
import { Pagination } from "@/components/pagination";
import { parseFiltersFromSearchParams } from "@/lib/listings";
import { fetchListings } from "@/lib/listings-repo";
import type { ListingFilters } from "@/types/listing";

export const metadata: Metadata = {
  title: "Browse listings",
  description:
    "Search, filter, and discover Bangalore marketplace listings sourced from r/BangaloreMarketplace.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ListingsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = parseFiltersFromSearchParams(sp);
  const page = toInt(sp.page, 1, 1);
  const pageSize = toInt(sp.pageSize, 24, 60);

  const suspenseKey = JSON.stringify({ ...filters, page, pageSize });

  return (
    <div className="container py-8 md:py-10">
      <header className="mb-8 space-y-1">
        <div className="text-xs font-medium uppercase tracking-widest text-primary">
          Marketplace
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Bangalore listings
        </h1>
        <p className="text-sm text-muted-foreground">
          Search, filter, and save community listings pulled from r/BangaloreMarketplace.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl bg-secondary/40 p-5 pr-3">
            <FilterPanel filters={filters} />
          </div>
        </aside>

        <section className="space-y-6">
          <Suspense
            key={suspenseKey}
            fallback={<ToolbarSkeleton filters={filters} />}
          >
            <ListingsResults
              filters={filters}
              page={page}
              pageSize={pageSize}
            />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

async function ListingsResults({
  filters,
  page,
  pageSize,
}: {
  filters: ListingFilters;
  page: number;
  pageSize: number;
}) {
  const result = await fetchListings(filters, { page, pageSize });

  return (
    <div className="space-y-6">
      <ListingsToolbar filters={filters} totalCount={result.total} />
      <ListingGrid listings={result.items} />
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        pageSize={result.pageSize}
      />
    </div>
  );
}

function ToolbarSkeleton({ filters }: { filters: ListingFilters }) {
  return (
    <div className="space-y-6">
      <ListingsToolbar filters={filters} totalCount={0} />
      <ListingGridSkeleton count={6} />
    </div>
  );
}

function toInt(
  raw: string | string[] | undefined,
  fallback: number,
  max?: number,
): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = v ? Number.parseInt(v, 10) : Number.NaN;
  if (!Number.isFinite(n) || n < 1) return fallback;
  return max ? Math.min(n, max) : n;
}
