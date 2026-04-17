import Link from "next/link";
import {
  ArrowRight,
  Armchair,
  Home,
  Laptop,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchListings } from "@/lib/listings-repo";

export async function Hero() {
  const { total } = await fetchListings({}, { page: 1, pageSize: 1 });

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-secondary to-background px-6 py-14 md:px-12 md:py-20">
      <div className="absolute inset-y-0 right-0 hidden w-1/2 translate-x-24 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.18),transparent_60%)] md:block" />

      <div className="relative grid items-center gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-background px-4 py-1.5 text-xs font-medium shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Live from r/BangaloreMarketplace
          </div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            The Bangalore marketplace,
            <br />
            rebuilt from Reddit.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground md:text-lg">
            Discover flats, furniture, gadgets, and gigs posted by real redditors
            in your neighborhood. No more subreddit scrolling.
          </p>

          <form
            action="/listings"
            className="flex w-full max-w-xl items-center gap-2 rounded-full bg-background p-1.5 shadow-sm"
          >
            <Search className="ml-3 h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              name="q"
              placeholder="Try '2BHK Indiranagar' or 'MacBook'"
              className="bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
            />
            <Button type="submit" size="sm" className="gap-1">
              Search <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2 pt-2 text-sm text-muted-foreground">
            <span>Popular:</span>
            {["Koramangala flats", "MacBook", "Sofa", "Tiffin service", "Royal Enfield"].map(
              (t) => (
                <Link
                  key={t}
                  href={`/listings?q=${encodeURIComponent(t)}`}
                  className="rounded-full bg-background px-3 py-1 text-xs font-medium shadow-sm hover:bg-secondary transition"
                >
                  {t}
                </Link>
              ),
            )}
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              value={total.toLocaleString()}
              label="Active listings"
              className="col-span-2"
              accent
            />
            <StatCard
              icon={<MapPin className="h-4 w-4" />}
              value="12+"
              label="Neighborhoods"
            />
            <StatCard
              icon={<Users className="h-4 w-4" />}
              value="r/BangaloreMarketplace"
              label="Community sourced"
            />

            <div className="col-span-2 rounded-2xl bg-background/80 p-4 shadow-sm backdrop-blur">
              <div className="text-xs font-medium text-muted-foreground mb-3">
                Top categories
              </div>
              <div className="flex flex-wrap gap-2">
                <CategoryChip icon={<Laptop className="h-3.5 w-3.5" />} label="Electronics" />
                <CategoryChip icon={<Home className="h-3.5 w-3.5" />} label="Housing" />
                <CategoryChip icon={<Armchair className="h-3.5 w-3.5" />} label="Furniture" />
                <CategoryChip icon={<MessageCircle className="h-3.5 w-3.5" />} label="Services" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  value,
  label,
  className,
  accent,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl bg-background/80 p-3.5 shadow-sm backdrop-blur ${className ?? ""}`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            accent
              ? "bg-primary/10 text-primary"
              : "bg-secondary text-foreground"
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight">{value}</div>
          <div className="text-[11px] text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

function CategoryChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={`/listings?category=${label.toUpperCase()}`}
      className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-3 py-1.5 text-xs font-medium transition hover:bg-secondary"
    >
      {icon}
      {label}
    </Link>
  );
}
