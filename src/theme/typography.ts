const fontFamilies = {
  display: '"Archivo Expanded", Inter, ui-sans-serif, system-ui, sans-serif',
  ui: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
} as const;

export const typography = {
  fontFamilies,
  display: {
    fontFamily: fontFamilies.display,
    fontWeight: 700,
    letterSpacing: '-0.04em',
    lineHeight: 0.95,
  },
  heading: {
    fontFamily: fontFamilies.ui,
    fontWeight: 800,
    letterSpacing: '-0.025em',
    lineHeight: 1.1,
  },
  body: {
    fontFamily: fontFamilies.ui,
    fontWeight: 400,
    fontSize: '16px',
    lineHeight: 1.5,
  },
  caption: {
    fontFamily: fontFamilies.ui,
    fontWeight: 700,
    fontSize: '12px',
    letterSpacing: '0.08em',
    lineHeight: 1.3,
  },
  mono: {
    fontFamily: fontFamilies.mono,
    fontWeight: 700,
    fontSize: '12px',
    lineHeight: 1.35,
  },
} as const;

export type TypographyToken = keyof Omit<typeof typography, 'fontFamilies'>;
