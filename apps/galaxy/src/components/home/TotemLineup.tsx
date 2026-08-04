"use client";

import Link from "next/link";
import { Button } from "@/components/Button";
import { WhipViewer } from "@/components/whip-3d";
import { StaffViewer } from "@/components/staff-3d";
import { SplitStaffViewer } from "@/components/split-staff-3d";
import { useInView } from "./useInView";

type ProductKey = "whip" | "staff" | "split-staff";

interface LineupProduct {
  key: ProductKey;
  name: string;
  descriptor: string;
}

const PRODUCTS: LineupProduct[] = [
  { key: "whip", name: "LED Whip", descriptor: "Full-length totem, wound top to bottom." },
  { key: "staff", name: "LED Staff", descriptor: "Five-foot handheld pole, remote-controlled." },
  { key: "split-staff", name: "Split Staff", descriptor: "Unscrews into two halves for travel." },
];

function ProductCanvas({ productKey }: { productKey: ProductKey }) {
  switch (productKey) {
    case "whip":
      return <WhipViewer pattern="rainbow" length="48in" color="#39ff14" autoRotate />;
    case "staff":
      return <StaffViewer pattern="rainbow" ejected={false} autoRotate />;
    case "split-staff":
      return <SplitStaffViewer pattern="rainbow" exploded={false} ejected={false} autoRotate />;
  }
}

function LineupCard({ product }: { product: LineupProduct }) {
  const [ref, inView] = useInView<HTMLDivElement>("200px");

  return (
    <li>
      <Link
        href="/shop"
        className="group flex flex-col overflow-hidden rounded-card border border-site-border bg-site-bg-alt transition-colors hover:border-site-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-site-accent"
      >
        <div ref={ref} className="relative aspect-square w-full bg-site-bg">
          {inView ? (
            <ProductCanvas productKey={product.key} />
          ) : (
            <div className="absolute inset-0 animate-pulse bg-site-bg-alt" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-col gap-1 p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-site-text">
            {product.name}
          </h3>
          <p className="text-xs text-site-muted">{product.descriptor}</p>
        </div>
      </Link>
    </li>
  );
}

export default function TotemLineup() {
  return (
    <section className="border-t border-site-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.5em] text-site-muted">
              Full range
            </p>
            <h2 className="text-2xl font-black uppercase leading-none sm:text-3xl">
              The Lineup
            </h2>
          </div>
          <Button href="/shop" className="w-fit">
            Shop now
          </Button>
        </div>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PRODUCTS.map((product) => (
            <LineupCard key={product.key} product={product} />
          ))}
        </ul>
      </div>
    </section>
  );
}
