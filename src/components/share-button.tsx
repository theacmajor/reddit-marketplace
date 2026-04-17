"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  url?: string;
  className?: string;
};

export function ShareButton({ title, url, className }: Props) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        // user cancelled or share failed, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard failed silently
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn("gap-2", className)}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-600" /> Copied
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" /> Share
        </>
      )}
    </Button>
  );
}
