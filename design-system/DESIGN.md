# Korean Reading Room Design System

## Product context

Korean Reading Room is a calm learning workspace for studying Korean through source media and transcripts. It keeps the source, sentence context, vocabulary, and review in one editorial reading desk.

## Visual foundations

The system is warm, restrained, and editorial. A pale paper canvas and bright white sheets create room for Korean text; fine lines organise content without turning the interface into a dashboard. Persimmon signals the current learning action or selected item. Pretendard carries both Korean and English, with Korean content set larger and earlier in the reading order.

## Color

Use the six semantic tokens in `colors_and_type.css`. `--accent` is reserved for progress, selection, and the primary action; `--accent-deep` is the primary button fill. Sage only confirms saved or healthy states. Do not introduce gradients or competing brand colours.

## Typography

Use Pretendard Variable for display and body. Display text is 620 weight, tight tracking, and 1.08–1.2 line height. Korean transcript lines are 20px/1.45 at 590 weight; translations and supporting English are 13–16px and muted. Timestamps use the mono stack.

## Spacing and shape

Base spacing is 4px: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 70. Reading surfaces rely on 1px hairlines, 6–7px control radii, and square or nearly square editorial sheets. Use the soft shadow only for floating white sheets and drawers.

## Layout

Desktop uses a 272px persistent rail and a centred content column with a 48px page gutter. The reading desk uses a fluid source/transcript column plus a 330px sticky phrase drawer. At 900px and below, the rail becomes a horizontal scrollable nav and all content stacks into one column. Never squeeze Korean transcript text into a fixed narrow column.

## Components

- **Navigation:** quiet text buttons; the active item becomes ink-filled with white type.
- **Primary button:** persimmon-deep fill, white text, 46px minimum height.
- **Secondary button:** transparent surface, hairline border, 44px minimum height.
- **Text action:** unboxed persimmon-deep text, with underline on hover.
- **Transcript row:** timestamp, Korean sentence, then translation; selected rows receive a persimmon inset rule and pale accent wash.
- **Editorial sheet:** white surface, subtle shadow, optional 3px persimmon top rule for a due-review cue.
- **Progress:** 4px rule with persimmon completion.

## Motion and interaction

Use 160ms ease transitions for colour and a 1px lift only on primary buttons. Every focusable element gets a 3px persimmon focus ring with 3px offset. Hover preserves or improves text contrast. Respect `prefers-reduced-motion` by removing animation and transition. Save the active screen in `localStorage` when a multi-view prototype is used.

## Voice

Write with quiet encouragement. Prioritise Korean names and sentences; English clarifies rather than leads. Avoid gamified pressure, streak language, inflated achievement claims, and dense dashboard jargon.

## Anti-patterns

- Do not use purple gradients, pill-heavy cards, or decorative icon clusters.
- Do not use more than one solid action per local action group.
- Do not turn progress into performance pressure or fabricate learner data.
- Do not use low-contrast muted text for interactive hover states.
- Do not replace source context with disconnected flashcards.
