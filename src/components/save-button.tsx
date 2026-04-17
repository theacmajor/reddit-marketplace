"use client";

import { Bookmark } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useSavedListings } from "@/hooks/use-saved-listings";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  variant?: "overlay" | "full";
  className?: string;
  size?: ButtonProps["size"];
};

export function SaveButton({ listingId, variant = "full", className, size }: Props) {
  const { isSaved, toggle, hydrated } = useSavedListings();
  const saved = hydrated && isSaved(listingId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(listingId);
  };

  if (variant === "overlay") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved" : "Save listing"}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/95 text-foreground shadow-sm backdrop-blur transition-[transform,background-color] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] hover:scale-110 hover:bg-background active:scale-95",
          saved && "bg-primary text-primary-foreground hover:bg-primary",
          className,
        )}
      >
        <Bookmark
          className={cn("h-4 w-4", saved && "fill-current")}
        />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant={saved ? "default" : "secondary"}
      size={size ?? "sm"}
      className={cn("gap-2", className)}
      onClick={handleClick}
      aria-pressed={saved}
    >
      <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
