# ASKR Design Rules

This document contains the implementation rules for the ASKR user interface.

Whenever there is a conflict between implementation and styling, these rules take precedence.

---

# Design Philosophy

ASKR should feel:

- Premium
- Calm
- Intelligent
- Fast
- Minimal
- Professional

Avoid visual clutter.

Whitespace is intentional.

Numbers are heroes.

---

# Color Palette

Primary Accent

Volt
#D4FF00

Volt Dim
#9BBF00

Volt Deep
#4A5A10

Background

Ink
#0A0A0A

Surface 1
#141414

Surface 2
#1B1B1B

Border
#2A2A2A

Text

Bone
#F5F5F5

Text 2
#9A9A9A

Text 3
#5C5C5C

---

# 90/10 Rule

Volt is never used as the dominant color.

Volt is reserved for:

- Primary CTA
- Progress
- Active state
- Key metric
- Important data

Never use Volt:

- for paragraphs
- as background
- for large surfaces
- excessively

---

# Typography

Display

Archivo Expanded Bold

Use for:

- Hero numbers
- Main metrics
- Large headings

UI

Inter

Use for:

- Navigation
- Buttons
- Cards
- Body text

Data

JetBrains Mono

Use for:

- Timers
- Labels
- Reps
- Weight
- Calories
- Statistics

Minimum UI font size:

12px

---

# Spacing

Use a 4pt grid.

Allowed spacing:

4
8
12
16
24
32
48

Do not invent new spacing values unless required.

---

# Cards

Surface:

Surface 1

Border:

1px
#2A2A2A

Shadow:

None

Radius:

16–20px

Padding:

16–20px

Gap:

12px

---

# Buttons

Primary

Volt background

Ink text

12px radius

Secondary

Surface 2

Bone text

1px border

Ghost

Transparent

Border only

---

# Hover

Hover changes:

Surface 1

↓

Surface 2

Never add shadows.

---

# Selected State

Selected components may use:

Volt border

Subtle Volt Deep inner glow

No other state may use Volt border.

---

# Disabled State

40% opacity

Text 3

Never change hue.

---

# Charts

Charts should use:

Volt line

Volt Deep fill

No grid

Minimal axes

Dark background

---

# Icons

Icons should be simple.

Outline style preferred.

No decorative effects.

---

# Motion

Duration:

150ms

Easing:

ease-out

Animations should feel responsive rather than playful.

---

# Dashboard Principles

The dashboard should answer:

1. How am I today?
2. What should I do?
3. How am I progressing?

Recovery is the highest priority.

AI Coach is the second highest priority.

---

# Component Priority

Every screen should have:

One primary CTA.

One dominant metric.

Clear visual hierarchy.

---

# General Rules

No gradients.

No heavy shadows.

No glassmorphism.

No skeuomorphism.

No decorative glow.

Minimalism wins.

Consistency wins over creativity.
