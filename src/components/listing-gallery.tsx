"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  title: string;
};

export function ListingGallery({ images, title }: Props) {
  const [index, setIndex] = useState(0);
  const count = images.length;

  const next = useCallback(() => {
    if (count < 2) return;
    setIndex((i) => (i + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    if (count < 2) return;
    setIndex((i) => (i - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (count < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, next, prev]);

  if (count === 0) {
    return (
      <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-3xl bg-gradient-to-br from-muted to-secondary text-muted-foreground">
        <ImageOff className="h-8 w-8" />
        <span className="text-sm">No photos attached</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-muted">
        <Image
          key={images[index]}
          src={images[index]}
          alt={`${title} — photo ${index + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover animate-fade-in"
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/95 text-foreground opacity-0 shadow-lg backdrop-blur transition hover:scale-105 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/95 text-foreground opacity-0 shadow-lg backdrop-blur transition hover:scale-105 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-4 right-4 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
              {index + 1} / {count}
            </div>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-transparent transition",
                i === index
                  ? "ring-foreground"
                  : "opacity-70 hover:opacity-100",
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
