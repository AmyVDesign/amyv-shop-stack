import type { Theme } from "./types";

export function generateThemeCSS(theme: Theme): string {
  return `
:root {
  --site-bg:           ${theme.colors.bg};
  --site-bg-alt:       ${theme.colors.bgAlt};
  --site-border:       ${theme.colors.border};
  --site-text:         ${theme.colors.text};
  --site-muted:        ${theme.colors.muted};
  --site-accent:       ${theme.colors.accent};
  --site-accent-dark:  ${theme.colors.accentDark};
  --site-accent-light: ${theme.colors.accentLight};
}

@theme inline {
  --color-site-bg:           var(--site-bg);
  --color-site-bg-alt:       var(--site-bg-alt);
  --color-site-border:       var(--site-border);
  --color-site-text:         var(--site-text);
  --color-site-muted:        var(--site-muted);
  --color-site-accent:       var(--site-accent);
  --color-site-accent-dark:  var(--site-accent-dark);
  --color-site-accent-light: var(--site-accent-light);
}
`.trimStart();
}
