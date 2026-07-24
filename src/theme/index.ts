export { colors } from './colors';
export type { ColorToken } from './colors';
export { typography } from './typography';
export type { TypographyToken } from './typography';
export { spacing } from './spacing';
export type { SpacingToken } from './spacing';
export { radius } from './radius';
export type { RadiusToken } from './radius';
export { motion } from './motion';
export type { MotionDurationToken, MotionEasingToken } from './motion';
export { borders } from './borders';
export type { BorderToken } from './borders';

import { borders } from './borders';
import { colors } from './colors';
import { motion } from './motion';
import { radius } from './radius';
import { spacing } from './spacing';
import { typography } from './typography';

export const askrTheme = {
  colors,
  typography,
  spacing,
  radius,
  motion,
  borders,
} as const;

export type AskrTheme = typeof askrTheme;
