"use client";

import Link from "next/link";
import { useState } from "react";
import { IconMenu, IconClose } from "@/components/icons";

const links = [
  { href: "/shop",    label: "Shop"    },
  { href: "/contact", label: "Contact" },
];

export default function PublicNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-site-border">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* Wordmark */}
        <Link
          href="/"
          className="text-lg font-semibold uppercase tracking-widest text-site-text"
        >
          The Galaxy
        </Link>

        {/* Desktop links */}
        <ul className="hidden gap-8 sm:flex">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-sm text-site-muted transition-colors hover:text-site-text"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile hamburger */}
        <button
          className="p-2 text-site-muted transition-colors hover:text-site-text sm:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <IconClose /> : <IconMenu />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <ul className="flex flex-col gap-4 border-t border-site-border px-4 py-4 sm:hidden">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="block text-sm text-site-muted hover:text-site-text"
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
