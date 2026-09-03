---
name: korean-reading-room-ui
description: Build calm Korean-learning interfaces that preserve source context and use the Korean Reading Room system.
user-invocable: true
---

# Korean Reading Room UI Skill

## What is inside

`colors_and_type.css` contains the tokens and font binding. `DESIGN.md` contains the visual rules. `ui_kits/app/` is an applied reference; `preview/` contains focused review pages.

## Source context

The package comes from a Korean reading desk that combines source media, a selectable transcript, phrase detail, and low-pressure review.

## When to use

Use for Korean-learning, reading, transcript, and source-context interfaces. Do not use it for gamified education dashboards or unrelated marketing pages.

## How to use

1. Load `colors_and_type.css` before component styles.
2. Use the layout, type, colour, and interaction rules in `DESIGN.md`.
3. Keep Korean primary and English progressive.
4. Use persimmon only for the selected state, progress, or one primary action.
5. Prefer hairline-organised lists and white editorial sheets to dashboard cards.
6. Preserve 44px minimum control targets and visible focus states.
7. Test the compact layout at 900px; reading content must stack without horizontal scrolling.

## Design-system highlights

Warm paper surfaces, Korean-first hierarchy, hairline list structures, and one restrained persimmon action colour define this system.
