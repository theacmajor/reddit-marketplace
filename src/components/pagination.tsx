"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
};

export function Pagination({ page, totalPages, total, pageSize }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  const goTo = (target: number) => {
    if (target < 1 || target > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) params.delete("page");
    else params.set("page", String(target));
    const qs = params.toString();
    startTransition(() => {
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const pageWindow = visiblePages(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between",
        pending && "opacity-70",
      )}
    >
      <div className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{start}</span>–
        <span className="font-medium text-foreground">{end}</span> of{" "}
        <span className="font-medium text-foreground">{total.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          className="gap-1"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1 || pending}
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>

        {pageWindow.map((p, i) =>
          p === "…" ? (
            <span key={`dots-${i}`} className="px-2 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page}
              onClick={() => goTo(p)}
              disabled={pending}
              className={cn(
                "min-w-9 rounded-full px-3 py-1.5 text-xs font-medium transition-[background-color,color] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
                p === page
                  ? "bg-foreground text-background"
                  : "bg-secondary/70 text-foreground hover:bg-secondary",
              )}
            >
              {p}
            </button>
          ),
        )}

        <Button
          variant="secondary"
          size="sm"
          className="gap-1"
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages || pending}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}

function visiblePages(current: number, total: number): Array<number | "…"> {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  for (let i = 0; i < sorted.length; i++) {
    const n = sorted[i];
    if (i > 0 && n - sorted[i - 1] > 1) out.push("…");
    out.push(n);
  }
  return out;
}
