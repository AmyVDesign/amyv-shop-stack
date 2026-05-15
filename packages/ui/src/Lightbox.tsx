"use client";

import { useEffect } from "react";
import { IconClose } from "./icons";

export interface LightboxPost {
  mediaUrl: string;
  caption?: string;
  permalink: string;
}

interface LightboxProps {
  post: LightboxPost;
  onClose: () => void;
}

export default function Lightbox({ post, onClose }: LightboxProps) {
  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Post preview"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in sm:p-8"
    >
      {/* Backdrop — click outside to close */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className="relative z-10 flex w-full max-w-lg flex-col bg-site-bg-alt shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close preview"
          className="absolute right-3 top-3 z-10 rounded p-1 text-site-muted transition-colors hover:text-site-text"
        >
          <IconClose size={18} />
        </button>

        {/* Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.mediaUrl}
            alt={post.caption ? post.caption.slice(0, 80) : "Instagram post"}
            className="h-full w-full object-contain"
          />
        </div>

        {/* Caption + IG link */}
        <div className="border-t border-site-border p-4">
          {post.caption && (
            <p className="mb-3 line-clamp-4 text-sm leading-relaxed text-site-muted">
              {post.caption}
            </p>
          )}
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold uppercase tracking-widest text-site-accent transition-opacity hover:opacity-70"
          >
            View on Instagram →
          </a>
        </div>
      </div>
    </div>
  );
}
