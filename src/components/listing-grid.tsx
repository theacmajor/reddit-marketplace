import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/empty-state";
import type { Listing } from "@/types/listing";

type Props = {
  listings: Listing[];
};

export function ListingGrid({ listings }: Props) {
  if (listings.length === 0) {
    return (
      <EmptyState
        title="No listings match your filters"
        description="Try clearing a filter or broadening your search to see more community listings."
      />
    );
  }

  return (
    <div className="stagger-grid grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing, index) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          priority={index < 4}
        />
      ))}
    </div>
  );
}
