import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Tracks prefers-reduced-motion so animated pieces can fall back to a
 * static paint. useSyncExternalStore is the right primitive for a browser
 * API like matchMedia: it uses getServerSnapshot for both the server
 * render and the first client render (so the two agree and hydration
 * never mismatches), then syncs to the live value right after.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
