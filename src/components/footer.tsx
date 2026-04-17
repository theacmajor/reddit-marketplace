import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40 mt-20">
      <div className="container py-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="text-sm font-semibold">bangalore.market</div>
          <p className="text-xs text-muted-foreground max-w-md">
            Community listings from r/BangaloreMarketplace, reimagined as a clean
            marketplace. Not affiliated with Reddit.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/listings" className="hover:text-foreground">
            Browse
          </Link>
          <Link href="/saved" className="hover:text-foreground">
            Saved
          </Link>
          <Link href="/admin" className="hover:text-foreground">
            Admin
          </Link>
          <a
            href="https://www.reddit.com/r/BangaloreMarketplace/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            r/BangaloreMarketplace
          </a>
        </div>
      </div>
    </footer>
  );
}
