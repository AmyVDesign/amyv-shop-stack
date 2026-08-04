"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether an element is near the viewport so callers can lazy-mount
 * (and unmount when well offscreen) expensive children like a WebGL canvas.
 */
export function useInView<T extends HTMLElement>(rootMargin = "200px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return [ref, inView] as const;
}
