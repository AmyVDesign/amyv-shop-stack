"use client";

import { useState } from "react";
import { SplitStaffViewer, type SplitStaffPattern } from "@/components/split-staff-3d";

const PATTERNS: { value: SplitStaffPattern; label: string }[] = [
  { value: "rainbow", label: "Rainbow" },
  { value: "comet", label: "Comet" },
  { value: "pulse", label: "Pulse" },
  { value: "galaxy", label: "Galaxy" },
  { value: "mirror", label: "Mirror" },
  { value: "off", label: "Off" },
];

/** Toggle-style option buttons, matching TotemConfigurator/staff dev route, with an explicit visible focus ring. */
function toggleClass(active: boolean) {
  return [
    "px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-site-accent",
    active
      ? "bg-site-accent text-black"
      : "border border-site-border text-site-muted hover:border-site-muted hover:text-site-text",
  ].join(" ");
}

export default function SplitStaffDevClient() {
  const [pattern, setPattern] = useState<SplitStaffPattern>("rainbow");
  const [exploded, setExploded] = useState(false);
  const [ejected, setEjected] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-site-bg text-site-text">
      <div className="min-h-0 flex-1">
        <SplitStaffViewer pattern={pattern} exploded={exploded} ejected={ejected} />
      </div>
      <div
        role="group"
        aria-label="Assembly"
        className="flex flex-wrap items-center justify-center gap-2 border-t border-site-border p-4"
      >
        <button
          type="button"
          onClick={() => setExploded((e) => !e)}
          aria-pressed={exploded}
          className={toggleClass(exploded)}
        >
          {exploded ? "Show it together" : "Show it apart"}
        </button>
        <button
          type="button"
          onClick={() => setEjected((e) => !e)}
          aria-pressed={ejected}
          className={toggleClass(ejected)}
        >
          {ejected ? "Seat battery" : "Eject battery to charge"}
        </button>
      </div>
      <div
        role="group"
        aria-label="LED pattern"
        className="flex flex-wrap items-center justify-center gap-2 border-t border-site-border p-4"
      >
        {PATTERNS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setPattern(value)}
            aria-pressed={pattern === value}
            className={toggleClass(pattern === value)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
