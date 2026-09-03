# Applied UI Kit

`index.html` is a working, compact learning desk that uses the shared design-system tokens. Component references live in `components/` and show navigation, transcript rows, and review actions.

> Reuse guide: this applied UI kit documents its structure, component files, usage workflow, design notes, and source basis for future Korean Reading Room surfaces.

## Structure

- `index.html` — source player, transcript selection, phrase drawer, and saved-state interaction.
- `components/navigation.html` — rail-navigation reference.
- `components/transcript-row.html` — selected transcript-row reference.
- `components/review-action.html` — contextual review-action reference.

## Component Files

The component files are intentionally small references for navigation, transcript selection, and contextual review. `index.html` fetches all three files as its modular component catalogue while keeping the applied interface runnable as one page.

## Usage Workflow

Load `../../colors_and_type.css`, retain the source → transcript → phrase relationship, then adapt the component examples to the page. Use the original `korean-reading-room-v2.html` for the broader source basis and interaction flow. Keep actions to one solid primary per group and use visible focus treatment.

## How to Use

Open `index.html`, select a transcript row, then use the save action to inspect the phrase drawer feedback. Reuse the visual tokens first, then the component shape and interaction pattern.

## Design Notes

The kit uses the preserved warm-paper canvas, white editorial surfaces, persimmon selected state, and Korean-first type hierarchy. It deliberately avoids dashboard density and detached flashcard flows.

## Source Basis

The kit is derived from `korean-reading-room-v2.html`, `brand-spec.md`, and the preserved Pretendard Variable font asset. The source includes the wider library, review, progress, and settings views beyond this compact applied desk.

## Source Context

The kit is a focused representation of the source Korean-learning application, preserving its warm editorial canvas, source context, and low-pressure review voice.

## Reuse Guide

Build a new surface from the outer frame inward: start with the paper canvas and left rail, place the media or primary reading area first, then place transcript context beside or below it, and reserve a white elevated drawer for the currently selected phrase. Keep list rows on hairlines rather than in individual cards. At the compact breakpoint, stack the source, transcript, and drawer; let navigation scroll horizontally instead of wrapping into a crowded grid.

Use `components/navigation.html` when a learning surface needs location and mode selection. Use `components/transcript-row.html` whenever a sentence is selectable and must expose a selected state. Use `components/review-action.html` only when the learner can take a clear next step. Keep the supplied component files as references and adapt their markup inside the applied surface; do not turn them into disconnected gallery widgets.

## Component Usage

Navigation uses quiet text controls: the current destination is ink-filled and all other destinations stay muted until hover. A transcript row contains a mono timestamp, Korean sentence, and progressive English translation. When selected, it gains a 3px persimmon inset rule and pale accent wash; do not depend on colour alone, because the inset and stronger hierarchy communicate selection too. The review action groups one 46px primary button with an optional 44px secondary button.

For implementation naming, `App` means the applied reading desk, `Sidebar` means the persistent learning rail, and `PreviewCard` means the elevated phrase or review sheet. These aliases describe the three reusable structural roles without changing the Korean Reading Room’s source vocabulary.

## Accessibility and responsive behaviour

All controls retain visible focus rings and meet 44px minimum targets. Korean sentence text must never be clipped or forced onto an overly narrow column. At 800px, navigation becomes horizontally scrollable and the source, transcript, and phrase drawer stack in reading order. Respect reduced-motion preferences and use only the source system’s brief, high-contrast interaction feedback.

## Integration checklist

1. Load `colors_and_type.css` before local styles.
2. Preserve `data-od-id` markers for named applied-kit regions.
3. Keep persimmon to selected states, progress, and one primary action.
4. Test sentence selection, source playback state, save confirmation, keyboard focus, and compact stacking.
