import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="text-sm font-medium uppercase tracking-widest text-primary">
        404
      </div>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        We couldn't find that listing.
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The post may have been deleted from Reddit or the URL is out of date.
      </p>
      <Button asChild>
        <Link href="/listings">Back to listings</Link>
      </Button>
    </div>
  );
}
