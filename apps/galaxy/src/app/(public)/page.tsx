import InstagramFeed from "@/components/InstagramFeed";
import { IconInstagram } from "@/components/icons";
import HeroScrollStage from "@/components/home/HeroScrollStage";
import TotemLineup from "@/components/home/TotemLineup";

export default function HomePage() {
  return (
    <>
      {/* ── Hero + zoom stage ────────────────────────────────────── */}
      <HeroScrollStage />

      {/* ── Totem lineup ─────────────────────────────────────────── */}
      <TotemLineup />

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
    </>
  );
}
