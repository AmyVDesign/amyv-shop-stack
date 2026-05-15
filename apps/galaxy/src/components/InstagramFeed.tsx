"use client";

// ── SETUP STEPS ──────────────────────────────────────────────────
// 1. Go to behold.so and sign up (free tier is sufficient)
// 2. Connect @the_galaxy_sf Instagram account
// 3. Create a new feed — in the embed tab, copy the Feed ID
//    (looks like: "XXXXXXXXXXXXXXXXXXXXXXXX")
// 4. Replace BEHOLD_FEED_ID below with that value
//
// This component fetches from Behold's Data API
// (https://feeds.behold.so/FEED_ID) rather than using the
// <behold-widget> web component, so we get full click control
// for the in-page lightbox without fighting shadow DOM.
// ─────────────────────────────────────────────────────────────────

const BEHOLD_FEED_ID = "REPLACE_ME";
const GRID_COUNT = 8;

import { useState, useEffect, useCallback } from "react";
import Lightbox, { type LightboxPost } from "@/components/Lightbox";

interface BeholdPost {
  id: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  mediaUrl: string;
  thumbnailUrl?: string; // present for VIDEO
  permalink: string;
  caption?: string;
  timestamp: string;
}

export default function InstagramFeed() {
  const [posts, setPosts] = useState<BeholdPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<LightboxPost | null>(null);

  const isPlaceholder = BEHOLD_FEED_ID === "REPLACE_ME";

  useEffect(() => {
    if (isPlaceholder) {
      setLoading(false);
      return;
    }
    fetch(`https://feeds.behold.so/${BEHOLD_FEED_ID}`)
      .then((r) => {
        if (!r.ok) throw new Error("feed fetch failed");
        return r.json();
      })
      .then((data: BeholdPost[] | { posts: BeholdPost[] }) => {
        // Behold may return an array or { posts: [...] } — handle both
        const list = Array.isArray(data) ? data : (data.posts ?? []);
        setPosts(list.slice(0, GRID_COUNT));
      })
      .catch(() => {
        // leave posts empty — handled in render
      })
      .finally(() => setLoading(false));
  }, [isPlaceholder]);

  const openPost = useCallback((post: BeholdPost) => {
    setSelectedPost({
      mediaUrl: post.mediaUrl,
      caption: post.caption,
      permalink: post.permalink,
    });
  }, []);

  const closePost = useCallback(() => setSelectedPost(null), []);

  // ── Skeleton / placeholder grid ──
  const showSkeleton = loading || isPlaceholder;

  return (
    <>
      <div className="grid grid-cols-2 gap-px bg-site-border lg:grid-cols-4">
        {showSkeleton ? (
          Array.from({ length: GRID_COUNT }).map((_, i) => (
            <div
              key={i}
              className={[
                "aspect-square w-full",
                loading
                  ? "animate-pulse bg-site-bg-alt"
                  : "bg-gradient-to-br from-site-accent/10 via-site-bg-alt to-purple-950/40",
              ].join(" ")}
            />
          ))
        ) : posts.length === 0 ? (
          <p className="col-span-full py-16 text-center text-sm text-site-muted">
            Unable to load feed — check back soon.
          </p>
        ) : (
          posts.map((post) => {
            // Use thumbnail for video posts, mediaUrl for images/carousels
            const thumb =
              post.mediaType === "VIDEO"
                ? (post.thumbnailUrl ?? post.mediaUrl)
                : post.mediaUrl;

            return (
              <button
                key={post.id}
                onClick={() => openPost(post)}
                className="group relative aspect-square w-full overflow-hidden bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-site-accent"
                aria-label={
                  post.caption
                    ? `View post: ${post.caption.slice(0, 60)}`
                    : "View Instagram post"
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumb}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/25" />
              </button>
            );
          })
        )}
      </div>

      {selectedPost && <Lightbox post={selectedPost} onClose={closePost} />}
    </>
  );
}
