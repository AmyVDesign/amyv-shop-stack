import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Galaxy SF",
  description: "Custom waterproof LED totems for festivals and raves. San Francisco.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-site-bg text-site-text">
        {children}
      </body>
      {/*
        Behold widget script — enables the <behold-widget> web component
        if ever switching from the Data API approach to the embed widget.
        Safe to leave in; lazyOnload means it loads during browser idle time.
      */}
      <Script
        src="https://w.behold.so/widget.js"
        type="module"
        strategy="lazyOnload"
      />
    </html>
  );
}
