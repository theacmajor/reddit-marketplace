"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "bm:saved-listings";
const EVENT = "bm:saved-listings-changed";

function readStore(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeStore(set: Set<string>) {
  window.localStorage.setItem(KEY, JSON.stringify([...set]));
  window.dispatchEvent(new Event(EVENT));
}

export function useSavedListings() {
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSaved(readStore());
    setHydrated(true);
    const onChange = () => setSaved(readStore());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const current = readStore();
    if (current.has(id)) current.delete(id);
    else current.add(id);
    writeStore(current);
    setSaved(new Set(current));
  }, []);

  const isSaved = useCallback((id: string) => saved.has(id), [saved]);

  return { saved, isSaved, toggle, hydrated };
}
