import Link from "next/link";
import { IconArrow } from "@amyv/ui";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Primary CTA button, matching the Amy V Design portfolio brand system: a
 * thin site-accent ring behind a site-bg surface, sentence-case label, and
 * a trailing arrow. Renders as a Next.js Link when given `href`, otherwise
 * as a native button.
 */

const INNER_CLASS =
  "relative z-10 inline-flex items-center gap-2 rounded-button bg-site-bg px-[24px] py-[11px] text-[14px] font-semibold tracking-[0.015em] text-site-text transition-colors hover:bg-site-accent hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-site-accent focus-visible:outline-offset-2";

interface ButtonOwnProps {
  children: ReactNode;
  className?: string;
  /** Stretches the button (and centers its label) to fill its container. */
  fullWidth?: boolean;
}

interface ButtonAsLinkProps
  extends ButtonOwnProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> {
  href: string;
}

interface ButtonAsButtonProps
  extends ButtonOwnProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  href?: undefined;
}

export type ButtonProps = ButtonAsLinkProps | ButtonAsButtonProps;

export function Button({ children, className, fullWidth, ...props }: ButtonProps) {
  const label = (
    <>
      {children}
      <IconArrow size={14} />
    </>
  );
  const innerClass = fullWidth ? `${INNER_CLASS} w-full justify-center` : INNER_CLASS;

  return (
    <span className={`relative inline-flex ${fullWidth ? "w-full" : ""} ${className ?? ""}`}>
      <span aria-hidden className="absolute -inset-[1.5px] rounded-button-ring bg-site-accent" />
      {props.href ? (
        <Link {...(props as ButtonAsLinkProps)} className={innerClass}>
          {label}
        </Link>
      ) : (
        <button type="button" {...(props as ButtonAsButtonProps)} className={innerClass}>
          {label}
        </button>
      )}
    </span>
  );
}
