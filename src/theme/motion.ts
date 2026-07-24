export const motion = {
  duration: {
    fast: '100ms',
    normal: '150ms',
    slow: '300ms',
  },
  easing: {
    default: 'ease-out',
  },
  transition: {
    fast: '100ms ease-out',
    normal: '150ms ease-out',
    slow: '300ms ease-out',
  },
} as const;

export type MotionDurationToken = keyof typeof motion.duration;
export type MotionEasingToken = keyof typeof motion.easing;
