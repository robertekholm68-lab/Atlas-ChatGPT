export const radius = {
  button: '12px',
  card: '16px',
  cardLarge: '20px',
  modal: '20px',
  pill: '999px',
} as const;

export type RadiusToken = keyof typeof radius;
