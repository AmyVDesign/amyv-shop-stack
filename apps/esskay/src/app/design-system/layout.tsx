import type { ReactNode } from 'react'

const DS_VARS = `
  .ds-scope {
    --site-heading-letter-spacing: 0.04em;
    --label-tracking: 0.12em;
    --site-bg: #F8F5F0;
    --site-bg-alt: #FDFCFA;
    --site-border: #E8E3D8;
    --site-text: #0F3A57;
    --site-text-soft: #1A1A1A;
    --site-muted: #6B6B6B;
    --site-accent: #0F3A57;
    --site-radius: 16px;
    --site-card-radius: 20px;
    --site-body-size: 16px;
    --site-h2-size: clamp(24px, 2.8vw, 32px);
    --site-section-pad-desktop: 80px 8vw;
    --site-section-pad-mobile: 64px 20px;
  }
`

export default function DesignSystemLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: DS_VARS }} />
      <div className="ds-scope">{children}</div>
    </>
  )
}
