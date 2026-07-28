"use client";

import { useState } from "react";
import { WhipViewer, type Pattern } from "@/components/whip-3d";

const PATTERNS: { value: Pattern; label: string }[] = [
  { value: "rainbow", label: "Rainbow" },
  { value: "comet", label: "Comet" },
  { value: "pulse", label: "Pulse" },
  { value: "galaxy", label: "Galaxy" },
  { value: "solid", label: "Solid" },
  { value: "off", label: "Off" },
];

/** Shared styling for toggle-style option buttons — matches TotemConfigurator. */
function toggleClass(active: boolean) {
  return [
    "px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors",
    active
      ? "bg-site-accent text-black"
      : "border border-site-border text-site-muted hover:border-site-muted hover:text-site-text",
  ].join(" ");
}

export default function WhipDevClient() {
  const [pattern, setPattern] = useState<Pattern>("rainbow");
  const [folded, setFolded] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-site-bg text-site-text">
      <div className="min-h-0 flex-1">
        <WhipViewer pattern={pattern} folded={folded} color="#39ff14" length="48in" />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-site-border p-4">
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
        <button
          type="button"
          onClick={() => setFolded((f) => !f)}
          aria-pressed={folded}
          className={toggleClass(folded)}
        >
          {folded ? "Unfold" : "Fold"}
        </button>
      </div>
    </div>
  );
}
