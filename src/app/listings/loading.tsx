import { ListingGridSkeleton } from "@/components/listing-skeleton";

export default function Loading() {
  return (
    <div className="container py-8 md:py-10">
      <header className="mb-8 space-y-2">
        <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
        <div className="h-10 w-64 animate-pulse rounded-full bg-muted" />
      </header>
      <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="hidden h-80 animate-pulse rounded-3xl bg-secondary/40 lg:block" />
        <div className="space-y-6">
          <div className="h-11 w-full animate-pulse rounded-full bg-secondary/70" />
          <ListingGridSkeleton count={6} />
        </div>
      </div>
    </div>
  );
}
