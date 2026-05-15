import Link from "next/link";
import InstagramFeed from "@/components/InstagramFeed";
import { IconInstagram } from "@/components/icons";

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[calc(100svh-65px)] flex-col items-center justify-center px-4 text-center">
        {/* ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon/5 blur-3xl" />
        </div>

        <p className="mb-5 text-xs tracking-[0.5em] uppercase text-white/30">
          San Francisco
        </p>

        <h1 className="mb-6 text-[clamp(4rem,16vw,13rem)] font-black uppercase leading-none tracking-tight">
          The{" "}
          <span className="text-neon [text-shadow:0_0_40px_#39ff1460]">
            Galaxy
          </span>
        </h1>

        <p className="mb-10 max-w-sm text-base leading-relaxed text-white/50 sm:text-lg">
          Custom waterproof LED totems for festivals and raves.
        </p>

        <Link
          href="/shop"
          className="border border-neon px-10 py-3 text-sm font-semibold uppercase tracking-widest text-neon transition-colors hover:bg-neon hover:text-black"
        >
          Shop Totems
        </Link>
      </section>

      {/* ── Totems feature ───────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-24">
        <div className="relative overflow-hidden">
          {/* placeholder — replace with real image */}
          <div className="h-[28rem] bg-gradient-to-br from-neon/20 via-black to-purple-950/60 sm:h-[36rem]" />
          <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-12">
            <p className="mb-1 text-[10px] uppercase tracking-[0.4em] text-neon/60">
              Custom builds
            </p>
            <h2 className="mb-3 text-4xl font-black uppercase leading-none sm:text-5xl">
              LED Totems
            </h2>
            <p className="mb-6 max-w-sm text-sm leading-relaxed text-white/50">
              Fully waterproof, festival-ready light sculptures built to your
              specs. Every build is one-of-a-kind.
            </p>
            <Link
              href="/shop"
              className="w-fit text-xs font-semibold uppercase tracking-widest text-neon hover:underline"
            >
              View shop →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Instagram feed ───────────────────────────────────────── */}
      <section className="border-t border-site-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-[0.5em] text-site-muted">
                @the_galaxy_sf
              </p>
              <h2 className="text-2xl font-black uppercase leading-none sm:text-3xl">
                From the feed
              </h2>
            </div>
            <p className="text-sm text-site-muted">
              Real photos from the field.
            </p>
          </div>

          <InstagramFeed />

          <div className="mt-6 flex justify-center">
            <a
              href="https://instagram.com/the_galaxy_sf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-site-muted transition-colors hover:text-site-accent"
            >
              <IconInstagram size={16} />
              Follow @the_galaxy_sf
            </a>
          </div>
        </div>
      </section>

      {/* ── What we do ───────────────────────────────────────────── */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <p className="mb-6 text-[10px] uppercase tracking-[0.5em] text-white/25">
            What we do
          </p>
          <p className="text-lg leading-8 text-white/55 sm:text-xl sm:leading-9">
            The Galaxy SF builds{" "}
            <span className="text-white">custom waterproof LED totems</span>{" "}
            for festivals and raves — designed to be spotted from anywhere on
            the field. Every totem is fully weatherproof and built to your exact
            specs.
          </p>
        </div>
      </section>
    </>
  );
}
