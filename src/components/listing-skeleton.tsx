import { cn } from "@/lib/utils";

export function ListingCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-3xl bg-card shadow-sm",
        className,
      )}
    >
      <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
        <div className="flex items-center justify-between pt-3">
          <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}
