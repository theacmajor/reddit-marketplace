"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Image as ImageIcon, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BANGALORE_AREAS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  CATEGORY_SLUGS,
  POSTED_WITHIN_LABELS,
  UPVOTE_PRESETS,
  type ListingFilters,
  type PostedWithin,
} from "@/types/listing";

type Props = {
  filters: ListingFilters;
  onApplied?: () => void;
  className?: string;
};

const POSTED_WITHIN_ORDER: PostedWithin[] = ["all", "1d", "7d", "30d"];

export function FilterPanel({ filters, onApplied, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [minPrice, setMinPrice] = useState(
    filters.minPrice != null ? String(filters.minPrice) : "",
  );
  const [maxPrice, setMaxPrice] = useState(
    filters.maxPrice != null ? String(filters.maxPrice) : "",
  );

  useEffect(() => {
    setMinPrice(filters.minPrice != null ? String(filters.minPrice) : "");
    setMaxPrice(filters.maxPrice != null ? String(filters.maxPrice) : "");
  }, [filters.minPrice, filters.maxPrice]);

  const pushParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      // any filter change resets pagination
      params.delete("page");
      const query = params.toString();
      startTransition(() => {
        router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const setParam = useCallback(
    (key: string, value: string | null) => {
      pushParams((p) => {
        if (value === null || value === "") p.delete(key);
        else p.set(key, value);
      });
    },
    [pushParams],
  );

  const activeCount = useMemo(() => {
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

  const applyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    pushParams((p) => {
      if (minPrice) p.set("minPrice", minPrice);
      else p.delete("minPrice");
      if (maxPrice) p.set("maxPrice", maxPrice);
      else p.delete("maxPrice");
    });
    onApplied?.();
  };

  const clearAll = () => {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    const sort = searchParams.get("sort");
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);
    startTransition(() => {
      router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, {
        scroll: false,
      });
    });
    setMinPrice("");
    setMaxPrice("");
    onApplied?.();
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Filters</h2>
          <p className="text-xs text-muted-foreground">
            {activeCount > 0
              ? `${activeCount} active`
              : "Narrow down the community catalog"}
          </p>
        </div>
        {activeCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-8 px-3 text-xs"
          >
            Clear all
          </Button>
        )}
      </header>

      <Section title="Category">
        <div className="grid grid-cols-2 gap-2">
          <CategoryPill
            label="All"
            active={!filters.category}
            onClick={() => setParam("category", null)}
          />
          {CATEGORY_SLUGS.map((c) => (
            <CategoryPill
              key={c}
              label={CATEGORY_LABELS[c]}
              active={filters.category === c}
              onClick={() => setParam("category", c)}
            />
          ))}
        </div>
      </Section>

      <Section title="Price range">
        <form onSubmit={applyPrice} className="flex items-center gap-2">
          <Input
            aria-label="Minimum price"
            type="number"
            inputMode="numeric"
            placeholder="Min ₹"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="h-10 bg-background"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            aria-label="Maximum price"
            type="number"
            inputMode="numeric"
            placeholder="Max ₹"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-10 bg-background"
          />
          <Button type="submit" size="sm">
            Go
          </Button>
        </form>
      </Section>

      <Section title="Location">
        <Select
          value={filters.location ?? "ANY"}
          onValueChange={(v) => setParam("location", v === "ANY" ? null : v)}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Any neighborhood" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ANY">Any neighborhood</SelectItem>
            {BANGALORE_AREAS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      <Section title="Media">
        <div className="flex items-center justify-between rounded-2xl bg-secondary/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-background">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div>
              <Label htmlFor="hasImage" className="cursor-pointer">
                Has image
              </Label>
              <p className="text-xs text-muted-foreground">
                Hide listings without photos
              </p>
            </div>
          </div>
          <Switch
            id="hasImage"
            checked={!!filters.hasImage}
            onCheckedChange={(v) => setParam("hasImage", v ? "1" : null)}
          />
        </div>
      </Section>

      <Section title="Posted within">
        <div className="grid grid-cols-2 gap-2">
          {POSTED_WITHIN_ORDER.map((v) => (
            <CategoryPill
              key={v}
              label={POSTED_WITHIN_LABELS[v]}
              active={(filters.postedWithin ?? "all") === v}
              onClick={() => setParam("postedWithin", v === "all" ? null : v)}
            />
          ))}
        </div>
      </Section>

      <Section title="Minimum upvotes">
        <Select
          value={String(filters.minUpvotes ?? 0)}
          onValueChange={(v) => setParam("minUpvotes", v === "0" ? null : v)}
        >
          <SelectTrigger className="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UPVOTE_PRESETS.map((p) => (
              <SelectItem key={p.value} value={String(p.value)}>
                <span className="inline-flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  {p.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-2 text-xs font-medium transition-[background-color,color] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
        active
          ? "bg-foreground text-background"
          : "bg-secondary/70 text-foreground/80 hover:bg-secondary",
      )}
    >
      {label}
    </button>
  );
}
