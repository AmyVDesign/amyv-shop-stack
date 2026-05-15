import { IconInstagram, IconSpotify } from "@/components/icons";

export default function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-site-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-sm text-site-muted sm:flex-row sm:justify-between">
        <p>© {year} The Galaxy SF. All rights reserved.</p>

        <ul className="flex items-center gap-5">
          <li>
            <a
              href="https://instagram.com/the_galaxy_sf"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="The Galaxy SF on Instagram"
              className="flex items-center gap-2 transition-colors hover:text-site-text"
            >
              <IconInstagram size={18} />
              <span className="text-xs uppercase tracking-widest">Instagram</span>
            </a>
          </li>
          <li>
            <a
              href="#"
              aria-label="The Galaxy SF on Spotify"
              className="flex items-center gap-2 transition-colors hover:text-site-text"
            >
              <IconSpotify size={18} />
              <span className="text-xs uppercase tracking-widest">Spotify</span>
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
