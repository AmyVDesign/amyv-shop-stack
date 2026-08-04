"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useReducedMotion } from "@/components/whip-3d/useReducedMotion";
import { CALLOUTS, headlineOpacity, windowOpacity, type Callout } from "./scrollStageData";

/**
 * HeroStageScene touches WebGL at mount time, so it must never run during
 * SSR. Loaded lazily here (via plain import()) purely to know when to hide
 * the skeleton -- same pattern WhipViewer uses for WhipModel.
 */
const HeroStageScene = dynamic(() => import("./HeroStageScene"), { ssr: false });

interface CalloutBoxProps {
  callout: Callout;
  boxRef: (el: HTMLDivElement | null) => void;
}

function CalloutArrow({ rotate }: { rotate: string }) {
  return (
    <svg
      aria-hidden="true"
      width="48"
      height="48"
      viewBox="0 0 48 48"
      className="pointer-events-none absolute top-1/2 left-1/2 -z-10 opacity-70"
      style={{ transform: `translate(-50%, -50%) rotate(${rotate})` }}
    >
      <line x1="4" y1="24" x2="40" y2="24" stroke="var(--site-accent)" strokeWidth="1.5" />
      <path d="M32 16 L42 24 L32 32" fill="none" stroke="var(--site-accent)" strokeWidth="1.5" />
    </svg>
  );
}

function CalloutBox({ callout, boxRef }: CalloutBoxProps) {
  return (
    <div
      ref={boxRef}
      className="pointer-events-none absolute max-w-[240px] border border-site-border bg-site-bg/85 px-4 py-3 opacity-0 backdrop-blur-sm"
      style={callout.style}
    >
      <CalloutArrow rotate={callout.arrow.rotate} />
      <p className="relative text-base leading-snug text-white">
        <span className="font-bold text-site-accent">{callout.heading}.</span>{" "}
        {callout.body}
      </p>
    </div>
  );
}

function HeroContent({
  contentRef,
}: {
  contentRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={contentRef}
      className="pointer-events-auto relative flex flex-col items-center px-4 text-center"
    >
      <p className="mb-5 text-xs tracking-[0.5em] uppercase text-white/30">San Francisco</p>
      <h1 className="mb-6 text-[clamp(4rem,16vw,13rem)] font-black uppercase leading-none tracking-tight">
        The{" "}
        <span className="text-neon [text-shadow:0_0_40px_#39ff1460]">Galaxy</span>
      </h1>
      <p className="mb-10 max-w-sm text-base leading-relaxed text-white/50 sm:text-lg">
        Custom waterproof LED totems for festivals and raves.
      </p>
      <Link
        href="/shop"
        className="pointer-events-auto border border-neon px-10 py-3 text-sm font-semibold uppercase tracking-widest text-neon transition-colors hover:bg-neon hover:text-black"
      >
        Shop Totems
      </Link>
    </div>
  );
}

/** Static, non-pinned fallback rendered under prefers-reduced-motion. */
function StaticFallback() {
  return (
    <>
      <section className="relative flex min-h-[calc(100svh-65px)] flex-col items-center justify-center px-4 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon/5 blur-3xl" />
        </div>
        <HeroContent contentRef={() => {}} />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-24">
        <div className="relative h-[28rem] overflow-hidden bg-site-bg-alt sm:h-[36rem]">
          <HeroStageScene />
        </div>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CALLOUTS.map((callout) => (
            <li key={callout.id} className="border border-site-border bg-site-bg-alt px-4 py-3">
              <p className="text-base leading-snug text-white">
                <span className="font-bold text-site-accent">{callout.heading}.</span>{" "}
                {callout.body}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/**
 * Pinned scroll-driven product journey: a ~400svh section whose inner
 * viewport stays sticky while a scroll-progress value (0..1, kept in a ref
 * to avoid re-rendering React on every scroll pixel) drives both the R3F
 * camera rig (inside HeroStageScene) and these HTML overlay's opacities,
 * applied imperatively via direct DOM writes in the scroll handler.
 */
export default function HeroScrollStage() {
  const reducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const heroContentElRef = useRef<HTMLDivElement | null>(null);
  const calloutElRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let cancelled = false;
    import("./HeroStageScene").then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let rafId = 0;
    const update = () => {
      rafId = 0;
      const rect = wrapper.getBoundingClientRect();
      const scrollableHeight = rect.height - window.innerHeight;
      const raw = scrollableHeight > 0 ? -rect.top / scrollableHeight : 0;
      const progress = Math.min(1, Math.max(0, raw));
      progressRef.current = progress;

      const heroOpacity = headlineOpacity(progress);
      const heroEl = heroContentElRef.current;
      if (heroEl) {
        heroEl.style.opacity = String(heroOpacity);
        const active = heroOpacity > 0.02;
        heroEl.style.pointerEvents = active ? "auto" : "none";
        heroEl.style.visibility = active ? "visible" : "hidden";
      }

      CALLOUTS.forEach((callout, i) => {
        const el = calloutElRefs.current[i];
        if (el) el.style.opacity = String(windowOpacity(progress, callout.window));
      });
    };

    const onScrollOrResize = () => {
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  const calloutBoxRefs = useMemo(
    () =>
      CALLOUTS.map((_, i) => (el: HTMLDivElement | null) => {
        calloutElRefs.current[i] = el;
      }),
    []
  );

  if (reducedMotion) return <StaticFallback />;

  return (
    <section ref={wrapperRef} className="relative h-[400svh]">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-site-bg">
        {!ready && (
          <div className="absolute inset-0 z-0 animate-pulse bg-site-bg-alt" aria-hidden="true" />
        )}
        <div className="absolute inset-0 z-0">
          <HeroStageScene progressRef={progressRef} />
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <HeroContent
            contentRef={(el) => {
              heroContentElRef.current = el;
            }}
          />
        </div>

        <div className="pointer-events-none absolute inset-0 z-10">
          {CALLOUTS.map((callout, i) => (
            <CalloutBox key={callout.id} callout={callout} boxRef={calloutBoxRefs[i]} />
          ))}
        </div>
      </div>
    </section>
  );
}
