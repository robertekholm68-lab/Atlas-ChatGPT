import { animations } from './animations'
import { colors } from './colors'
import { iconSizes } from './icons'
import { radius } from './radius'
import { spacing } from './spacing'
import { typography } from './typography'

export const theme = { colors, spacing, typography, radius, animations, iconSizes } as const
export type Theme = typeof theme
