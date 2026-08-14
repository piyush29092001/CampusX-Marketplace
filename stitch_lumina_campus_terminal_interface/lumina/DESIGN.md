---
name: LUMINA_
colors:
  surface: '#fcf8ff'
  surface-dim: '#dbd8e5'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#efecf9'
  surface-container-high: '#eae6f3'
  surface-container-highest: '#e4e1ee'
  on-surface: '#1b1b24'
  on-surface-variant: '#464555'
  inverse-surface: '#302f39'
  inverse-on-surface: '#f2effc'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4b45e2'
  primary: '#250fc2'
  on-primary: '#ffffff'
  primary-container: '#4038d8'
  on-primary-container: '#c5c3ff'
  inverse-primary: '#c2c1ff'
  secondary: '#5452b6'
  on-secondary: '#ffffff'
  secondary-container: '#9795fe'
  on-secondary-container: '#2c268d'
  tertiary: '#712200'
  on-tertiary: '#ffffff'
  tertiary-container: '#983100'
  on-tertiary-container: '#ffb8a0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c2c1ff'
  on-primary-fixed: '#0c006a'
  on-primary-fixed-variant: '#3124cb'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0e006a'
  on-secondary-fixed-variant: '#3c389d'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59b'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#812800'
  background: '#fcf8ff'
  on-background: '#1b1b24'
  surface-variant: '#e4e1ee'
typography:
  headline-lg:
    fontFamily: Space Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Space Mono
    fontSize: 18px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Space Mono
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Space Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  metadata:
    fontFamily: Space Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: '1.4'
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  container-max: 1280px
---

## Brand & Style
The design system embodies a high-fidelity retro-futuristic aesthetic, drawing inspiration from technical terminals and 1980s/90s mainframe interfaces. The personality is precise, utilitarian, and intellectually sharp—tailored for a premium college marketplace where efficiency meets a distinct academic subculture. 

The visual style is a modernized "Technical Brutalism." It rejects contemporary soft SaaS trends in favor of sharp corners, thin technical lines, and high-contrast information density. The interface feels like a sophisticated tool, utilizing an underscore cursor motif and terminal-style metadata to emphasize the "LUMINA_" identity.

## Colors
The palette is rooted in a "Paper White" high-contrast foundation. The primary background uses an off-white paper tone to reduce eye strain while maintaining a vintage computer hardware feel. 

- **Primary Accent (Electric Indigo):** Reserved for primary actions, active states, and terminal cursors.
- **Secondary Accent (Deep Indigo):** Used for hover states and interactive depth.
- **Neutral/Borders:** A deep navy-black provides the structural "skeleton" of the UI.
- **Dotted Grid:** A subtle pattern should be applied to the `background_primary` layer using `#17172A` at 5% opacity, with 24px spacing.

## Typography
This design system utilizes **Space Mono** exclusively to maintain a cohesive technical identity. 

- **Case Logic:** All navigation, labels, and buttons must use `text-transform: uppercase`. Body copy remains sentence case for legibility.
- **Hierarchy:** Use the `label-caps` role for categories and system status. Use `metadata` for timestamps, SKU numbers, and seller stats.
- **The Underscore:** Every major headline should be followed by a trailing underscore `_` in the primary indigo color to reinforce the brand's digital terminal roots.

## Layout & Spacing
The layout follows a strict **Fixed Grid** model. The interface should feel like a blueprint or a technical schematic.

- **Grid:** 12-column desktop grid with 24px gutters.
- **Borders as Spacers:** Elements are separated by 1px solid borders (`#17172A`). 
- **Padding:** Internal component padding should follow a 4px scale (8px, 16px, 24px, 32px). 
- **Responsive Behavior:** On mobile, the 12-column grid collapses to a 4-column grid. Borders remain 1px regardless of screen size to maintain the "fine-lined" technical aesthetic.

## Elevation & Depth
In this design system, depth is achieved through **Hard Layering** rather than soft shadows.

- **Level 0 (Background):** Primary background with dotted grid.
- **Level 1 (Cards/Sheets):** White background, 1px solid border. 
- **Interactive Elevation:** When an element is hovered, it does not lift with a shadow. Instead, it utilizes a "Hard Shadow" (4px offset, 0px blur, `#17172A`) or a background color shift to the primary accent.
- **Dividers:** Use 1px horizontal and vertical lines to delineate sections within a single surface.

## Shapes
The shape language is strictly **Geometric and Sharp**. 

- **Radius:** All corners are 0px. This applies to buttons, cards, input fields, and tags.
- **Icons:** Use stroke-based icons with 1.5px or 2px weights. Avoid filled/rounded icon sets. Icons should feel like CAD drawings or technical symbols.

## Components

### Buttons
- **Primary:** Black or Indigo background, white text, uppercase, 0px radius.
- **Ghost:** Transparent background, 1px black border, black text. On hover, fills with Indigo.
- **Terminal Button:** Features a small trailing square or underscore icon.

### Cards
- **Product Card:** White background, 1px solid border. Images should have a 1px bottom border separating them from the text content. Metadata (price, location) is displayed in `label-caps` typography.

### Input Fields
- **Text Input:** 1px solid border, rectangular. Placeholder text in `metadata` style. On focus, the border-weight remains 1px but changes color to Indigo, and a blinking cursor underscore is simulated.

### Chips & Tags
- **Status Tags:** Rectangular blocks with a 1px border. Use "Inverted" styles (Indigo background/white text) for high-priority status like "NEW" or "SOLD".

### The "Command" Bar
- A persistent search/action bar at the top or bottom of the screen that mimics a command-line interface, using a `>` prompt prefix.