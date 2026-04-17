"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  AlertTriangle,
  EyeOff,
  RefreshCcw,
  RotateCcw,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LABELS, CATEGORY_SLUGS, type CategorySlug } from "@/types/listing";
import { cn } from "@/lib/utils";

export function TriggerSyncButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onClick = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/sync/reddit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subreddit: "BangaloreMarketplace",
          pages: 2,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            counters?: { created: number; updated: number; failed: number; fetched: number };
            error?: { message: string };
          }
        | null;
      if (!res.ok || !json?.ok) {
        setMessage(json?.error?.message ?? `Sync failed (${res.status})`);
      } else if (json.counters) {
        const c = json.counters;
        setMessage(
          `Synced ${c.fetched} posts · +${c.created} new · ~${c.updated} updated${c.failed ? ` · ${c.failed} failed` : ""}`,
        );
      } else {
        setMessage("Sync completed");
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        onClick={onClick}
        disabled={busy || pending}
        className="gap-2"
      >
        <RefreshCcw className={cn("h-4 w-4", (busy || pending) && "animate-spin")} />
        {busy ? "Syncing…" : "Trigger sync"}
      </Button>
      {message && (
        <span className="text-xs text-muted-foreground">{message}</span>
      )}
    </div>
  );
}

export function RerunNormalizationButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/normalize", { method: "POST" });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        total?: number;
        updated?: number;
        failed?: number;
        error?: { message: string };
      } | null;
      if (!res.ok || !json?.ok) {
        setMessage(json?.error?.message ?? `Failed (${res.status})`);
      } else {
        setMessage(
          `Re-normalized ${json.updated}/${json.total} listings${json.failed ? ` · ${json.failed} failed` : ""}`,
        );
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="secondary"
        type="button"
        onClick={onClick}
        disabled={busy}
        className="gap-2"
      >
        <RotateCcw className={cn("h-4 w-4", busy && "animate-spin")} />
        Re-run normalization
      </Button>
      {message && (
        <span className="text-xs text-muted-foreground">{message}</span>
      )}
    </div>
  );
}

export function HideListingButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    try {
      await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "HIDDEN" }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={onClick}
      disabled={busy}
      className="gap-1 text-xs"
    >
      <EyeOff className="h-3.5 w-3.5" />
      Hide
    </Button>
  );
}

export function FlagScamButton({
  listingId,
  flagged,
}: {
  listingId: string;
  flagged: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    try {
      await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scamFlag: !flagged }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size="sm"
      variant={flagged ? "destructive" : "ghost"}
      onClick={onClick}
      disabled={busy}
      className="gap-1 text-xs"
    >
      <AlertTriangle className="h-3.5 w-3.5" />
      {flagged ? "Unflag" : "Flag"}
    </Button>
  );
}

export function DismissReportButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    try {
      await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "DISMISSED" }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={onClick}
      disabled={busy}
      className="gap-1 text-xs"
    >
      <X className="h-3.5 w-3.5" />
      Dismiss
    </Button>
  );
}

export function CategoryPicker({
  listingId,
  value,
}: {
  listingId: string;
  value: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onChange = async (next: string) => {
    setBusy(true);
    try {
      await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: next === "__NONE__" ? null : next,
        }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Select
      disabled={busy}
      value={value ?? "__NONE__"}
      onValueChange={onChange}
    >
      <SelectTrigger className="h-8 w-44 bg-background text-xs">
        <SelectValue placeholder="Assign category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__NONE__">— none —</SelectItem>
        {CATEGORY_SLUGS.map((c) => (
          <SelectItem key={c} value={c}>
            {CATEGORY_LABELS[c as CategorySlug]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
