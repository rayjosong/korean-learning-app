# Korean Reading Room Design System

A reusable system extracted from the Korean Reading Room source project. It preserves the source font and original interactive artifacts while making the visual rules and reusable UI available for review.

## Product Overview

The source product is a Korean-learning reading room. Its core surfaces are the daily study route, the source-media reading desk, selectable Korean transcript, phrase drawer, library, and contextual review.

### Product overview

Korean Reading Room helps a learner work from an actual source instead of isolated vocabulary. Its primary surfaces are Today, Reading Desk, Library, Review, Progress, and Settings. Core capabilities include continuing a source clip, choosing a transcript sentence, reading a phrase breakdown, adding a phrase to review, and returning to the same source context later. The interface is intentionally calm: progress is evidence of return, not a score to chase.

## Source Context

The source evidence is the preserved `korean-reading-room.html` and `korean-reading-room-v2.html` artifacts, `brand-spec.md`, and `assets/PretendardVariable.woff2`. The source establishes a Korean-first media-learning product rather than a generic education dashboard.

## Start here

- Read [DESIGN.md](DESIGN.md) for the system rules.
- Open [preview/index.html](preview/index.html) for focused visual review cards.
- Open [ui_kits/app/index.html](ui_kits/app/index.html) for the applied kit.
- Inspect [korean-reading-room-v2.html](korean-reading-room-v2.html) for the preserved, high-signal source example.

## Package Contents

- `colors_and_type.css` — reusable tokens and font binding.
- `assets/` — preserved Pretendard Variable source asset.
- `preview/` — focused system review cards and manifest.
- `ui_kits/app/` — applied learning interface kit with component examples.
- `context/provenance.md` — evidence and extraction boundaries.

## Preview manifest

- `preview/colors-primary.html` — semantic colour palette.
- `preview/typography-specimens.html` — Korean and English hierarchy.
- `preview/spacing-tokens.html` — spacing rhythm.
- `preview/radius-shadows.html` — control shape and elevation.
- `preview/components-buttons.html` — actions and selected transcript row.
- `preview/brand-assets.html` — preserved Pretendard source font.
- `preview/applied-surfaces.html` — links to the applied kit and original source.

## Preserved Assets and Build Artifacts

`assets/PretendardVariable.woff2` is retained from the source project. `build/` is available for future runtime icon artifacts; no source runtime icons, logos, or imagery were present to preserve.

## Reuse Guide

Load `colors_and_type.css`, then follow `DESIGN.md`. Review the relevant focused preview, use the applied kit as the behaviour reference, and retain `assets/PretendardVariable.woff2` for Korean typography. The original source examples at the workspace root remain the highest-signal implementation reference.

## Review Workflow

Start with `preview/colors-primary.html` and `preview/typography-specimens.html`, then inspect `preview/components-buttons.html`. Use `ui_kits/app/index.html` to test selection and save interactions, and compare the results with `korean-reading-room-v2.html`.
