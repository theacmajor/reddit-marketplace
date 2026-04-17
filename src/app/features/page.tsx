import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Database,
  Eye,
  Filter,
  Globe,
  Layers,
  MapPin,
  MessageSquare,
  Receipt,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Tag,
  TrendingUp,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchListings } from "@/lib/listings-repo";

export const metadata: Metadata = {
  title: "Features",
  description:
    "How bangalore.market works. The problem, the solution, and the tech behind it.",
};

export const dynamic = "force-dynamic";

export default async function FeaturesPage() {
  const { total } = await fetchListings({}, { page: 1, pageSize: 1 });

  return (
    <div className="container max-w-4xl py-12 md:py-20">
      <header className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Why we built this
        </div>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Reddit listings deserve
          <br />
          a better home.
        </h1>
        <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
          bangalore.market takes the chaos of subreddit buy/sell threads and
          turns them into a clean, searchable, filterable marketplace.
        </p>
      </header>

      <section className="mt-20 space-y-6">
        <SectionLabel>The problem</SectionLabel>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Buying and selling on Reddit is painful.
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <ProblemCard
            icon={<Search className="h-5 w-5" />}
            title="No search or filters"
            description="Reddit has no way to filter by price, location, or category. You scroll endlessly or miss what you need."
          />
          <ProblemCard
            icon={<Eye className="h-5 w-5" />}
            title="Posts disappear fast"
            description="A listing posted 2 days ago is already buried under memes, questions, and other posts."
          />
          <ProblemCard
            icon={<Layers className="h-5 w-5" />}
            title="No structure"
            description="Prices are in the title, body, or comments. Locations are vague. There's no consistent format."
          />
        </div>
      </section>

      <section className="mt-20 space-y-6">
        <SectionLabel>The solution</SectionLabel>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          A real marketplace, built on community data.
        </h2>
        <p className="max-w-2xl text-muted-foreground">
          We automatically pull public posts from r/BangaloreMarketplace, extract
          structured data from unstructured text, and present it in a clean UI
          you can actually browse.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <SolutionCard
            icon={<Filter className="h-5 w-5" />}
            title="Filter by everything"
            description="Category, price range, neighborhood, upvotes, recency, and whether it has images. All server-side, all fast."
          />
          <SolutionCard
            icon={<MapPin className="h-5 w-5" />}
            title="Location-aware"
            description="We detect 50+ Bangalore neighborhoods from post text. Filter by Koramangala, HSR, Whitefield, and more."
          />
          <SolutionCard
            icon={<Receipt className="h-5 w-5" />}
            title="Price extraction"
            description="Our extractor understands '22k', '₹1.5L', 'Rs. 55,000/month', and 'free'. Parsed into real numbers you can sort by."
          />
          <SolutionCard
            icon={<Tag className="h-5 w-5" />}
            title="Auto-categorization"
            description="Keywords are matched and weighted to classify listings into Housing, Electronics, Furniture, Vehicles, and more."
          />
          <SolutionCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="Community signals"
            description="Upvotes and comment counts help you spot popular and trustworthy listings. Sort by most upvoted to see what the community validates."
          />
          <SolutionCard
            icon={<MessageSquare className="h-5 w-5" />}
            title="One-click to Reddit"
            description="Every listing links back to the original post. Contact the seller directly on Reddit where the conversation started."
          />
        </div>
      </section>

      <section className="mt-20 space-y-6">
        <SectionLabel>How it works</SectionLabel>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          From Reddit post to marketplace listing.
        </h2>
        <div className="space-y-0">
          <PipelineStep
            step={1}
            icon={<Globe className="h-5 w-5" />}
            title="Fetch"
            description="We hit Reddit's public JSON API and pull the latest posts from r/BangaloreMarketplace. Pagination follows the 'after' cursor across multiple pages."
          />
          <PipelineStep
            step={2}
            icon={<Database className="h-5 w-5" />}
            title="Store raw"
            description="The original Reddit post JSON is saved as-is in the RawRedditPost table. This is our source of truth — we never lose the original data."
          />
          <PipelineStep
            step={3}
            icon={<Bot className="h-5 w-5" />}
            title="Extract"
            description="Four heuristic extractors run against the title and body text: price (regex patterns for ₹, k, L, cr), location (50+ neighborhood dictionary), category (weighted keyword scoring), and condition (rule-based matching)."
          />
          <PipelineStep
            step={4}
            icon={<Zap className="h-5 w-5" />}
            title="Normalize"
            description="Images are pulled from Reddit's preview, gallery, and media_metadata fields. Deleted and removed posts are flagged. Each field gets a confidence score."
          />
          <PipelineStep
            step={5}
            icon={<Layers className="h-5 w-5" />}
            title="Upsert"
            description="Raw post and enriched listing are upserted in a single database transaction. Re-syncing updates scores and comments without overwriting admin corrections."
          />
          <PipelineStep
            step={6}
            icon={<Eye className="h-5 w-5" />}
            title="Serve"
            description="The Next.js app queries PostgreSQL with server-side filtering, sorting, and pagination. Results render as visual cards with images, prices, and location chips."
          />
        </div>
      </section>

      <section className="mt-20 space-y-6">
        <SectionLabel>Tech stack</SectionLabel>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Built with modern, boring technology.
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <TechPill label="Next.js 16" detail="App Router, RSC" />
          <TechPill label="TypeScript" detail="End to end" />
          <TechPill label="Tailwind CSS" detail="Utility-first styling" />
          <TechPill label="shadcn/ui" detail="Radix primitives" />
          <TechPill label="Prisma" detail="Type-safe ORM" />
          <TechPill label="PostgreSQL" detail="Neon serverless" />
          <TechPill label="Vercel" detail="Edge deployment" />
          <TechPill label="Reddit JSON API" detail="Public, no auth needed" />
          <TechPill label="Lucide" detail="Icon system" />
        </div>
      </section>

      <section className="mt-20 space-y-6">
        <SectionLabel>Admin tools</SectionLabel>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Moderation built in from day one.
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <SolutionCard
            icon={<Shield className="h-5 w-5" />}
            title="Password-protected admin"
            description="HMAC-signed session cookies. No third-party auth needed. Set ADMIN_SECRET in your environment and you're in."
          />
          <SolutionCard
            icon={<RefreshCw className="h-5 w-5" />}
            title="One-click sync"
            description="Trigger a Reddit sync from the admin dashboard. See live counters for fetched, created, updated, and failed posts."
          />
          <SolutionCard
            icon={<Tag className="h-5 w-5" />}
            title="Manual overrides"
            description="Assign categories, flag suspicious listings, or hide content directly from the admin table. Changes take effect immediately."
          />
          <SolutionCard
            icon={<MessageSquare className="h-5 w-5" />}
            title="User reports"
            description="Anyone can report a listing for wrong category, wrong price, spam, scam, or other issues. Reports surface in the admin dashboard."
          />
        </div>
      </section>

      <section className="mt-20 rounded-3xl bg-gradient-to-br from-primary/10 via-secondary to-background p-8 text-center md:p-12">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {total.toLocaleString()} listings and counting.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          All sourced from real community posts on r/BangaloreMarketplace.
          No fake listings, no paid placements.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link href="/listings">
              Browse listings <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium uppercase tracking-widest text-primary">
      {children}
    </div>
  );
}

function ProblemCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl bg-destructive/5 p-6 dark:bg-destructive/10">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function SolutionCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl bg-secondary/50 p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background shadow-sm">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function PipelineStep({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 py-5 border-b border-border/40 last:border-0">
      <div className="flex flex-col items-center gap-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-sm font-bold">
          {step}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <h3 className="font-semibold">{title}</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function TechPill({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 px-4 py-3">
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}
