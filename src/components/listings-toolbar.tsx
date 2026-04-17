"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterPanel } from "@/components/filter-panel";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  POSTED_WITHIN_LABELS,
  SORT_LABELS,
  type CategorySlug,
  type ListingFilters,
  type PostedWithin,
  type SortOption,
} from "@/types/listing";

type Props = {
  filters: ListingFilters;
  totalCount: number;
};

const SORT_ORDER: SortOption[] = [
  "newest",
  "oldest",
  "price_low_high",
  "price_high_low",
  "most_upvoted",
  "most_commented",
];

export function ListingsToolbar({ filters, totalCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);

  const [query, setQuery] = useState(filters.q ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(filters.q ?? "");
  }, [filters.q]);

  const pushParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      // any filter change should reset to page 1
      params.delete("page");
      const qs = params.toString();
      startTransition(() => {
        router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const commitSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if ((filters.q ?? "") === trimmed) return;
      pushParams((p) => {
        if (trimmed) p.set("q", trimmed);
        else p.delete("q");
      });
    },
    [filters.q, pushParams],
  );

  const onSearchChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => commitSearch(value), 400);
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    commitSearch(query);
  };

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const clearParam = (key: string) => pushParams((p) => p.delete(key));

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string }> = [];
    if (filters.q) chips.push({ key: "q", label: `"${filters.q}"` });
    if (filters.category)
      chips.push({
        key: "category",
        label:
          CATEGORY_LABELS[filters.category as CategorySlug] ?? filters.category,
      });
    if (filters.location) chips.push({ key: "location", label: filters.location });
    if (filters.minPrice != null)
      chips.push({ key: "minPrice", label: `≥ ₹${filters.minPrice.toLocaleString()}` });
    if (filters.maxPrice != null)
      chips.push({ key: "maxPrice", label: `≤ ₹${filters.maxPrice.toLocaleString()}` });
    if (filters.hasImage) chips.push({ key: "hasImage", label: "Has image" });
    if (filters.postedWithin && filters.postedWithin !== "all")
      chips.push({
        key: "postedWithin",
        label: POSTED_WITHIN_LABELS[filters.postedWithin as PostedWithin],
      });
    if (filters.minUpvotes && filters.minUpvotes > 0)
      chips.push({ key: "minUpvotes", label: `≥ ${filters.minUpvotes} upvotes` });
    return chips;
  }, [filters]);

  const mobileActiveCount = useMemo(() => {
    let n = 0;
    if (filters.category) n++;
    if (filters.location) n++;
    if (filters.minPrice != null) n++;
    if (filters.maxPrice != null) n++;
    if (filters.hasImage) n++;
    if (filters.postedWithin && filters.postedWithin !== "all") n++;
    if (filters.minUpvotes && filters.minUpvotes > 0) n++;
    return n;
  }, [filters]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <form onSubmit={onSearchSubmit} className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search listings, flats, laptops, gigs…"
            className="h-11 bg-secondary/70 pl-11 pr-10"
            aria-label="Search listings"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                clearParam("q");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-background hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button type="submit" className="sr-only">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <div className="hidden text-sm text-muted-foreground md:block">
            <span className="font-medium text-foreground">
              {totalCount.toLocaleString()}
            </span>{" "}
            results
          </div>

          <div className="w-48">
            <Select
              value={filters.sort ?? "newest"}
              onValueChange={(v) =>
                pushParams((p) => (v === "newest" ? p.delete("sort") : p.set("sort", v)))
              }
            >
              <SelectTrigger className="h-11 bg-secondary/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SORT_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="secondary" size="sm" className="h-11 gap-2 lg:hidden">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {mobileActiveCount > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                    {mobileActiveCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-full flex-col overflow-hidden p-0 sm:max-w-md"
            >
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                <FilterPanel
                  filters={filters}
                  onApplied={() => setSheetOpen(false)}
                />
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="secondary" className="flex-1 sm:flex-none">
                    Close
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button className="flex-1 sm:flex-none">Show results</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm md:hidden">
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span>{" "}
          results
        </span>
      </div>

      {activeFilterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Active:
          </div>
          {activeFilterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => clearParam(chip.key)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium transition hover:bg-secondary/70",
              )}
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ListingsToolbarBadge({ count }: { count: number }) {
  return <Badge variant="secondary">{count}</Badge>;
}
