import { colors } from './colors';

export const borders = {
  default: `1px solid ${colors.border}`,
  selected: `1px solid ${colors.volt}`,
  divider: `1px solid ${colors.border}`,
} as const;

export type BorderToken = keyof typeof borders;
