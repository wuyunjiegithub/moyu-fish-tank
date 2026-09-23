---
name: Serene Aquatic Companion
colors:
  surface: '#eefcff'
  surface-dim: '#cfdce0'
  surface-bright: '#eefcff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e8f6f9'
  surface-container: '#e3f0f4'
  surface-container-high: '#ddebee'
  surface-container-highest: '#d7e5e8'
  on-surface: '#111d20'
  on-surface-variant: '#3f484a'
  inverse-surface: '#263235'
  inverse-on-surface: '#e5f3f7'
  outline: '#6f797b'
  outline-variant: '#bec8ca'
  surface-tint: '#006874'
  primary: '#006671'
  on-primary: '#ffffff'
  primary-container: '#277f8b'
  on-primary-container: '#f7feff'
  inverse-primary: '#83d3e0'
  secondary: '#336668'
  on-secondary: '#ffffff'
  secondary-container: '#b7ecee'
  on-secondary-container: '#396c6e'
  tertiary: '#8c4938'
  on-tertiary: '#ffffff'
  tertiary-container: '#aa614e'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9feffc'
  primary-fixed-dim: '#83d3e0'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f57'
  secondary-fixed: '#b7ecee'
  secondary-fixed-dim: '#9cd0d2'
  on-secondary-fixed: '#002021'
  on-secondary-fixed-variant: '#174e50'
  tertiary-fixed: '#ffdbd2'
  tertiary-fixed-dim: '#ffb4a2'
  on-tertiary-fixed: '#3a0b02'
  on-tertiary-fixed-variant: '#723525'
  background: '#eefcff'
  on-background: '#111d20'
  surface-variant: '#d7e5e8'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.015em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style

This design system establishes a gentle, restorative desktop presence designed for passive companionship and mindful respite during demanding workdays. Merging the quiet fluidity of Apple’s Human Interface Guidelines with the material depth of Windows 11 Mica, the interface feels airy, organic, and physically unobtrusive. 

The aesthetic is built upon:
- **Soft Translucency & Frosted Layers**: Surfaces feel like frosted glass submerged in pure water, letting desktop wallpaper softly permeate without stealing attention.
- **Micro-tactility**: Interactive elements feature soft, cushioned volume rather than hard edges or high contrast lines.
- **Ambient Serenity**: Zero aggressive alerts, high-saturation accents, or sharp mechanical corners. The system promotes deep focus, passive micro-breaks, and emotional decompression.

## Colors

The palette draws directly from freshwater lakes, misted river rocks, and clean porcelain.

- **Primary (`#3A8E9A` - Deep Lake Cyan)**: Reserved for primary controls, active state indicators, and subtle focal elements. Calming, balanced, and readable against translucent layers.
- **Secondary (`#76A9AB` - Mist Azure)**: Used for secondary toggles, calm progress states, passive tags, and ambient atmospheric highlights.
- **Tertiary (`#E08E79` - Soft Coral)**: Used exceptionally sparingly for critical nudges, feeding reminders, and warm organic highlights. Softened to preserve a non-intrusive environment.
- **Neutral (`#536063` - River Slate)**: Serves as the primary anchor for text and structural glyphs, steering clear of stark pitch-black (`#000000`) to maintain a restful visual weight.
- **Atmospheric Backdrops & Containers**:
  - App Canvas / Base: `#F5F7F8` (Porcelain Slate) with 70–85% alpha for Mica/vibrancy emulation.
  - Card Surfaces: `#FFFFFF` at 65–85% alpha with subtle specular white inner rims.
  - Border Accents: `#FFFFFF` at 40% alpha on top borders and `#3A8E9A` at 8% alpha on bottom borders to create natural refracted light edges.

## Typography

The typography utilizes **Plus Jakarta Sans** throughout all typographic roles to preserve geometric clarity softened by rounded apertures and humanist terminals. 

- **Weight Discipline**: Restrict font weights primarily to `400` (Regular) and `500` (Medium). `600` (SemiBold) is reserved solely for primary section titles to prevent visual fatigue.
- **Reading Rhythm**: Generous line heights (`1.4` to `1.5`) preserve breathing room inside compact desktop floating widgets and popovers.
- **Optical Calm**: Character spacing uses slight negative tracking (`-0.02em` to `-0.01em`) on larger headers for a unified presence, while auxiliary labels receive open tracking (`+0.015em` to `+0.02em`) for effortless legibility at glanceable desktop sizes.

## Layout & Spacing

The layout is structured around an adaptive desktop floating panel architecture, shifting fluidly between a persistent mini-island / floating widget and an expanded companion view.

- **Component Grid & Rhythm**: 
  - Standard spacing operates on an 8-point structural base with 4-point micro-adjustments for compact desktop panels.
  - Floating accessory panels default to a minimum width of `280px` and scale up to `420px` for multi-aquarium management.
  - Compact companion HUDs utilize `space-sm` (`0.5rem`) internal element gaps, while settings and inspection views use `space-lg` (`1.25rem`) to create restful visual breaks.
- **Adaptive Canvas**:
  - Floating Companion Mode: Frameless window with custom drag regions, pinned margins of `1.25rem` from desktop screen boundaries, and smooth magnetic snap behavior to screen corners.
  - Detached Mini Mode: Collapses into an ultra-compact pill dock (`48px` to `64px` height) where spacing shrinks to `space-xs` and `space-sm`.

## Elevation & Depth

Visual hierarchy uses frosted optical layers rather than high-contrast cast shadows.

- **Substrate (Backdrop Blur)**: Surfaces float above native desktop windows using `backdrop-filter: blur(24px) saturate(180%)`. 
- **Layer Stacking**:
  - **Level 0 (Desktop Canvas)**: Raw translucent sheet (`rgba(245, 247, 248, 0.72)`).
  - **Level 1 (Cards & Modules)**: `rgba(255, 255, 255, 0.75)` with an ultra-soft ambient shadow: `0 4px 20px -2px rgba(58, 142, 154, 0.08)`.
  - **Level 2 (Popovers, Tooltips & Context Menus)**: `rgba(255, 255, 255, 0.92)` paired with `0 12px 32px -4px rgba(35, 65, 70, 0.12)`.
- **Refractive Edges (Ghost Rim)**: In place of stark 1px solid borders, cards and buttons employ an inner specular border: `inset 0 1px 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(118, 169, 171, 0.15)`. This creates a tactile, clean glass edge that renders seamlessly across both light and dark desktop wallpapers.

## Shapes

The design system adopts smooth, pill-shaped geometry (`roundedness: 3`) reflecting organic river pebbles polished by flowing water.

- **Micro Controls & Badges**: Fully pill-shaped (`border-radius: 9999px`) for quick tactile recognition and low visual friction.
- **Cards & Modals**: Soft compound radii (`rounded-2xl` at `1.25rem` to `rounded-3xl` at `1.75rem`) that soften panel corners and remove visual severity.
- **Nested Hierarchy**: Child containers nestled inside cards preserve visual harmony by reducing their corner radius by `0.375rem` (e.g., a `1.5rem` card houses `1.125rem` internal interactive elements).

## Components

### Buttons
- **Primary**: Solid gradient transition from `#3A8E9A` to `#4A9DA9`, white text, fully rounded pill (`9999px`), subtle top highlight (`inset 0 1px 0 rgba(255,255,255,0.3)`), and faint cyan glow shadow on hover (`0 4px 14px rgba(58,142,154,0.25)`).
- **Secondary / Ghost**: Semi-transparent surface (`rgba(255, 255, 255, 0.6)`), neutral text (`#536063`), crisp hairline outline (`rgba(118, 169, 171, 0.2)`). Hover triggers an opacity rise to `rgba(255, 255, 255, 0.85)` with smooth 150ms spring transitions.
- **Icon / Micro-Buttons**: Circular pills (`32px × 32px`), zero border, soft hover wash (`rgba(58, 142, 154, 0.08)`).

### Cards & Tank Containers
- Built on `backdrop-filter: blur(20px)` with `rgba(255, 255, 255, 0.75)` fill.
- Smooth `24px` (`1.5rem`) corner rounding.
- Specular top rim highlight to suggest light catching on glass.
- Internal padding calibrated at `space-lg` (`1.25rem`).

### Chips & Fish Status Pills
- Pill shape (`border-radius: 9999px`) with vertical padding of `4px` and horizontal padding of `10px`.
- Background tint: `rgba(118, 169, 171, 0.12)`, font role: `label-sm`, color: `#3A8E9A`.
- Active or interacting chips gain a milk-white background with a soft drop shadow (`0 2px 6px rgba(0,0,0,0.04)`).

### Input Fields & Sliders
- **Inputs**: Shallow rounded container (`rounded-xl`), background `rgba(255, 255, 255, 0.65)`, border `1px solid rgba(118, 169, 171, 0.2)`. On focus: dynamic glow of `0 0 0 3px rgba(58, 142, 154, 0.15)` with background turning milk-white.
- **Sliders (Water Temperature / Bubble Flow / Ambience)**: Track height `6px`, soft gray-cyan fill (`rgba(118, 169, 171, 0.2)`), active fill `#3A8E9A`. Thumb is a solid white circular pill (`18px`) with an ambient drop shadow and `2px` cyan core.

### Checkboxes & Toggle Switches
- **Toggles (Feed / Ambient Sounds)**: Pill track (`40px × 22px`). Inactive: `rgba(83, 96, 99, 0.15)`; active: `#3A8E9A`. Thumb is a pure white circle (`18px`) that glides horizontally with an organic spring curve.
- **Checkboxes**: Softly rounded squares (`6px` radius), transitioning cleanly from low-contrast bordered white to solid `#3A8E9A` checkmark on activation.

### Lists & Companion Menus
- Flat stacked items inside card containers separated by invisible gaps (`space-xs`) rather than hard divider lines.
- Hover state applies an edge-to-edge curved pill highlight (`rgba(58, 142, 154, 0.06)`).
- Metadata labels render in `body-sm` using muted neutral `#7E8C8F`.