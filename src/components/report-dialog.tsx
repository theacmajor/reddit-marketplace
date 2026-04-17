"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  Check,
  Copy,
  Flag,
  HelpCircle,
  MapPinOff,
  Receipt,
  ShoppingBag,
  Tag,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const REPORT_REASONS = [
  { value: "wrong_category", label: "Wrong category", icon: Tag },
  { value: "wrong_price", label: "Incorrect price", icon: Receipt },
  { value: "wrong_location", label: "Wrong location", icon: MapPinOff },
  { value: "spam", label: "Spam or irrelevant", icon: Ban },
  { value: "scam", label: "Suspected scam", icon: AlertTriangle },
  { value: "duplicate", label: "Duplicate listing", icon: Copy },
  { value: "sold", label: "Already sold", icon: ShoppingBag },
  { value: "other", label: "Something else", icon: HelpCircle },
] as const;

type Props = {
  listingId: string;
  className?: string;
};

export function ReportDialog({ listingId, className }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setReason(null);
    setDetails("");
    setError(null);
    setSubmitted(false);
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setTimeout(reset, 300);
  };

  const onSubmit = async () => {
    if (!reason) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/listings/${listingId}/report`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reason,
          details: details.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(json?.error?.message ?? `Failed (${res.status})`);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error, please try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-2", className)}>
          <Flag className="h-4 w-4" /> Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Thanks for reporting</DialogTitle>
              <DialogDescription className="mt-1">
                We'll review this listing and take action if needed.
              </DialogDescription>
            </div>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <DialogTitle>Report this listing</DialogTitle>
              <DialogDescription>
                What's wrong with this listing? Your report helps us keep the marketplace clean.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-2">
              {REPORT_REASONS.map((r) => {
                const Icon = r.icon;
                const active = reason === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-left transition-[transform,background-color,color] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] active:scale-[0.96]",
                      active
                        ? "bg-foreground text-background"
                        : "bg-secondary/60 hover:bg-secondary",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-background/70" : "text-muted-foreground")} />
                    <span className="text-sm font-medium">{r.label}</span>
                  </button>
                );
              })}
            </div>

            {reason && (
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Add more context (optional)"
                rows={3}
                className="w-full resize-none rounded-2xl bg-secondary/60 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}

            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}

            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                onClick={onSubmit}
                disabled={!reason || busy}
                className="gap-2"
              >
                {busy ? "Submitting…" : "Submit report"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
