export const colors = {
  background: '#0A0A0A',
  surface1: '#141414',
  surface2: '#1B1B1B',
  border: '#2A2A2A',
  textPrimary: '#F5F5F5',
  textSecondary: '#9A9A9A',
  textMuted: '#5C5C5C',
  volt: '#D4FF00',
  voltDim: '#9BBF00',
  voltDeep: '#4A5A10',
  success: '#D4FF00',
  warning: '#9BBF00',
  danger: '#5C5C5C',
} as const;

export type ColorToken = keyof typeof colors;
