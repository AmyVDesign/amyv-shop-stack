"use client";

import { use, useState } from "react";
import Link from "next/link";
import TotemSVG, { type Pattern, type Length } from "@/components/TotemSVG";
import TotemConfigurator from "@/components/TotemConfigurator";

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Client components unwrap params with React.use(), not await
  const { slug } = use(params);

  // ── Configurator state ──────────────────────────────────────────
  const [pattern, setPattern] = useState<Pattern>("solid");
  const [color,   setColor]   = useState("#39FF14");
  const [length,  setLength]  = useState<Length>("36in");

  // Format slug as a display title: "led-totem" → "LED Totem"
  const title = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-10 flex items-center gap-2 text-xs text-site-muted"
      >
        <Link href="/shop" className="transition-colors hover:text-site-text">
          Shop
        </Link>
        <span aria-hidden>/</span>
        <span className="text-site-text">{title}</span>
      </nav>

      {/* ── Two-column layout ───────────────────────────────────────
          Mobile:  stacked — SVG first, then controls
          Desktop: side-by-side, SVG sticky on left            */}
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-start md:gap-12 lg:gap-20">

        {/* Left: SVG visualization */}
        <div className="flex justify-center md:sticky md:top-8">
          <TotemSVG pattern={pattern} color={color} length={length} />
        </div>

        {/* Right: Configurator controls */}
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.5em] text-site-muted">
            Custom Build
          </p>
          <h1 className="mb-3 text-4xl font-black uppercase leading-none sm:text-5xl">
            {title}
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-site-muted">
            Fully waterproof LED totem, hand-built to order. Every piece
            is one-of-a-kind.
          </p>

          <TotemConfigurator
            pattern={pattern}
            color={color}
            length={length}
            onPatternChange={setPattern}
            onColorChange={setColor}
            onLengthChange={setLength}
          />
        </div>

      </div>
    </div>
  );
}
