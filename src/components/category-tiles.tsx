import Link from "next/link";
import {
  Armchair,
  Bike,
  Dumbbell,
  Home,
  Laptop,
  MoreHorizontal,
  Shirt,
  Wrench,
} from "lucide-react";

import { CATEGORY_LABELS, CATEGORY_SLUGS, type CategorySlug } from "@/types/listing";

const ICONS: Record<CategorySlug, React.ComponentType<{ className?: string }>> = {
  HOUSING: Home,
  FURNITURE: Armchair,
  ELECTRONICS: Laptop,
  VEHICLES: Bike,
  SERVICES: Wrench,
  FASHION: Shirt,
  HOBBIES: Dumbbell,
  OTHER: MoreHorizontal,
};

export function CategoryTiles() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {CATEGORY_SLUGS.map((c) => {
        const Icon = ICONS[c];
        return (
          <Link
            key={c}
            href={`/listings?category=${c}`}
            className="group flex flex-col items-center justify-center gap-2 rounded-3xl bg-secondary/60 p-5 text-center transition hover:bg-secondary"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background text-foreground shadow-sm transition group-hover:text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium">{CATEGORY_LABELS[c]}</span>
          </Link>
        );
      })}
    </div>
  );
}
