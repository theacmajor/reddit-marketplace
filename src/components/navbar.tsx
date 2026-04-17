import Link from "next/link";
import { Bookmark, Compass, LayoutDashboard, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/listings", label: "Browse", icon: Compass },
  { href: "/features", label: "Features", icon: Sparkles },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/admin", label: "Admin", icon: LayoutDashboard },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 group/logo">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-lg transition-transform duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-hover/logo:rotate-[-4deg] group-hover/logo:scale-110 group-active/logo:scale-95">
            b
          </div>
          <span className="text-lg font-semibold tracking-tight hidden sm:inline">
            bangalore.market
          </span>
        </Link>

        <form
          action="/listings"
          className="relative flex-1 max-w-xl hidden md:block"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            name="q"
            placeholder="Search flats, phones, furniture, gigs…"
            className="pl-11 h-11"
          />
        </form>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              asChild
              variant="ghost"
              size="sm"
              className={cn("gap-2 font-medium")}
            >
              <Link href={href}>
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            </Button>
          ))}
          <ThemeToggle />
          <Button asChild size="sm" className="ml-1 hidden sm:inline-flex">
            <Link href="/listings">Explore</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
