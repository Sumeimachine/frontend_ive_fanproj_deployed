---
name: "Dive Into IVE PH"
description: "Concert cinematic: dark, photographic and expressive, made for Philippine DIVEs."
colors:
  stage-black: "#0a0a0e"
  stage-white: "#f6f3f5"
  stage-muted: "#b5afb8"
  stage-pink: "#ef9cc2"
  stage-pink-hover: "#f5bad7"
  button-ink: "#151017"
  photo-frame: "#111015"
  viewer-surface: "#121217"
  stage-line: "rgba(246, 243, 245, 0.16)"
  shell-line: "rgba(255, 255, 255, 0.14)"
  gallery-line: "#ffffff24"
typography:
  display:
    fontFamily: "Oswald, sans-serif"
    fontSize: "clamp(5rem, 9.2vw, 9.5rem)"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  gallery-display:
    fontFamily: "Oswald, Arial Narrow, sans-serif"
    fontSize: "clamp(60px, 7.8vw, 122px)"
    fontWeight: 500
    lineHeight: 1.03
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Oswald, sans-serif"
    fontSize: "clamp(3rem, 5vw, 5.5rem)"
    fontWeight: 500
    lineHeight: 1.13
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "clamp(14px, 1.1vw, 17px)"
    lineHeight: 1.8
  navigation:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.6
    letterSpacing: "0.16em"
rounded:
  photo: "2px"
  control: "3px"
  viewer: "4px"
spacing:
  compact: "8px"
  item: "16px"
  cluster: "24px"
  group: "32px"
  section-desktop: "112px"
  section-mobile: "75px"
components:
  button-primary:
    backgroundColor: "{colors.stage-pink}"
    textColor: "{colors.button-ink}"
    rounded: "{rounded.control}"
    padding: "16px 22px"
  button-primary-hover:
    backgroundColor: "{colors.stage-pink-hover}"
  button-join:
    backgroundColor: "transparent"
    textColor: "{colors.stage-white}"
    padding: "0 19px"
  navigation-link:
    textColor: "{colors.stage-muted}"
    typography: "{typography.navigation}"
  navigation-link-current:
    textColor: "{colors.stage-white}"
  photo-filter:
    backgroundColor: "transparent"
    textColor: "{colors.stage-muted}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  photo-filter-selected:
    backgroundColor: "{colors.stage-pink}"
    textColor: "#191018"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  photo-viewer:
    backgroundColor: "{colors.viewer-surface}"
    textColor: "{colors.stage-white}"
    rounded: "{rounded.viewer}"
---

# Design System: Dive Into IVE PH

## Overview

**Creative North Star: "Concert cinematic"**

The user approved a premium redesign with darker surfaces, immersive imagery and more motion on September 17, 2026. Near-black space frames real IVE photography; tall display type gives the page the presence of a concert title, while restrained pink accents guide attention.

This document records the implemented Home, navigation shell and photo gallery in the authoritative frontend at D:/SidePROJECTS/IVE/frontend_ive_fanproj_deployed. It is a non-commercial fan project. Existing account, utility and administrator pages keep their established functional components until a relevant task updates them.

**Key Characteristics:**

- Full-frame photography with visible attribution.
- Condensed display type paired with quiet, legible interface text.
- Generous spacing, fine dividing lines and restrained corners.
- Expressive motion with a still alternative and optional 3D.

Source of truth: [Home.css](src/pages/Home.css), [MainLayout.css](src/layouts/MainLayout.css), [PhotoJournal.css](src/components/PhotoJournal.css), [font declarations](src/index.css) and [Chakra theme](src/main.tsx). The YAML records extracted values; the sidecar supplies motion, depth, breakpoints and standalone component examples. Its synthesized tonal ramps are previews, not additional production colors.

## Colors

### Primary

Stage Pink marks key actions, selected filters, the active navigation underline and important words. The lighter hover value belongs to the primary action. Button Ink provides a dark label against the accent.

### Neutral

Stage Black is the continuous canvas. Stage White carries headings and primary content; Stage Muted supports context and attribution. Photo Frame and Viewer Surface provide subtle tonal separation. Stage, Shell and Gallery Line preserve the actual boundary values in their respective components.

**The Photography Rule.** Keep GrantSor photographs in their original color and complete frame; atmosphere belongs around the image.

## Typography

Oswald is the display family; Manrope is the body and interface family. Both are self-hosted Latin variable WOFF2 fonts with font-display swap. Files, retained SIL licenses and provenance are in [public/fonts](public/fonts/README.md). Oswald supports weights 200–700 and Manrope 200–800.

Use the display role for the homepage title, gallery-display for the archive title, and headline for home sections. Uppercase display treatments carry presence without applying all caps to paragraphs. Body copy uses relaxed leading and relatively short measures: the home hero is limited to 32ch, the moments copy to 36ch. Navigation is compact; gallery labels use tracking and uppercase. Source captions range from 9px to 12px in the current implementation and must remain readable against the dark surface.

## Layout

The shell has an 88px sticky desktop header and a 72px mobile header below 800px. Its inner container reaches 1680px. The hero uses a 1800px maximum and 5vw side gutters; normal home sections use a 1600px maximum and 112px vertical spacing, reduced to 75px below 801px.

The home hero becomes a single column at 800px. Member portraits progress from six columns to three at 1000px, then two at 600px. The archive container reaches 1440px with 48px desktop gutters, reducing to 32px at 1100px and 20px at 600px. Its portrait grid moves from three columns to two at 1100px, then one at 600px. The feature caption moves beneath its image at 760px.

These are component-specific breakpoints, not a single interchangeable scale. Keep headings, filter controls and source links in ordinary document flow; preserve wrapping and keyboard access.

## Elevation & Depth

Most surfaces stay flat and separate through spacing, tone and fine borders. The home feature photograph uses a soft structural shadow (0 28px 70px rgba(0,0,0,0.28)) and small pink edge markers. The sticky header uses a nearly opaque dark background with 16px backdrop blur. The gallery viewer uses a dark overlay and 8px blur.

Motion supplies a second layer of depth: gentle hero parallax, subtle stage lighting and member reveals. The home Pause motion control, operating-system reduced-motion preference and reduced-data preference stop the home’s ambient movement. The gallery disables entry movement for reduced motion; the app also uses MotionConfig reducedMotion="user". The member universe is lazy-loaded only after its explicit open action and receives the motion preference. Essential member links remain in the normal HTML grid.

## Shapes

Corners are modest: photo frames use 2px, primary buttons and filters 3px, and the viewer 4px. Thin rectangular rules organize the page. The circular account initial and reward dot are existing exceptions with a specific identity or status role.

## Components

### Buttons and links

The filled pink action has a 52px minimum height, bold compact type and a subtle 0.98 press scale. The shell join action is an outlined rectangle with a 42px desktop minimum height. Text links retain their arrow, underline or clear placement. Visible keyboard focus uses a 2px pink outline with a 5–6px offset; do not remove it to simplify the appearance.

### Navigation

Desktop links use muted text, turning white when current; a pink 2px underline marks the active destination. Explore and the account menu preserve their existing routes and role checks. Below 800px, the drawer exposes large Oswald destinations and the remaining links in a compact grid. Keep the skip link and focus return.

### Member portraits and experience rows

The member grid uses existing member assets with their established 480:679 presentation and a small pointer-hover enlargement. This crop treatment does not apply to GrantSor photography. Community destinations use spacious text rows divided by fine rules; the hover state adds a subtle darker panel tone.

### Photo archive and viewer

GrantSor images use width: 100% and height: auto; the viewer contains the complete image within its height limit. Preserve watermarks, photographer links, linked original-post credits and permission context. The current photos document the July 12, 2024 Manila fansign.

Member filters have a 44px minimum target height and a pink selected state. The count is announced politely. Opening a photo preserves trapped modal focus, left/right navigation, Escape dismissal and focus return. Prefer light border or control feedback over recoloring or cropping photographs.

### Existing forms

Account and utility forms retain the Chakra outline controls and their established focus, error and disabled behavior in the application theme. They are not newly redefined by the cinematic homepage patterns.

## Do's and Don'ts

### Do:

- Do use Oswald for display roles and Manrope for reading and controls.
- Do retain complete GrantSor frames, original color, watermarks and linked attribution.
- Do honor reduced motion and keep the optional 3D universe behind an explicit action.
- Do preserve working routes, keyboard access and responsive content flow.
- Do distinguish the cinematic visual direction from the actual date and type of each photographed event.

### Don't:

- Don't imply this is an official IVE or Starship project.
- Don't call the Manila fansign photographs concert coverage or invent event dates.
- Don't place decorative overlays over a photographer’s watermark.
- Don't replace existing functional behavior when adding a visual pattern.

