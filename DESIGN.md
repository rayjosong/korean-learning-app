# DESIGN.md

## Purpose

`DESIGN.md` is the canonical source of truth for how the Korean Learning App should look, feel, and behave in the user interface.

Agents working on user-facing features MUST read this document before changing UI. `docs/PRODUCT.md` defines product intent; this document translates that intent into concrete interaction and visual rules.

The canonical V0.1 experience is **desktop web first**. Mobile web should remain usable, but desktop UX must not be weakened merely to make every interaction identical on small screens.

## Design direction — Warm Korean Editorial

The product should feel like:

> A calm Korean media environment where the learner can deeply inspect anything, with a thoughtful tutor available only when needed.

Primary influences:

- **Claude** — warm editorial canvas, restrained humanist feel;
- **Notion** — compact contextual interactions and information density;
- **Spotify** — media-first hierarchy where content supplies most visual richness;
- **Apple** — subtraction, clarity, whitespace, and visual restraint.

This is an influence stack, not a mandate to clone any product.

Target feeling:

```text
Korean reading room
+ media player
+ contextual tutor
```

Not:

```text
generic SaaS dashboard
+ chatbot
+ gamified course
```

## UX model

The product has three explicit learning modes:

```text
WATCH  ->  STUDY  ->  REVIEW
```

They are parts of one loop:

```text
                    REAL KOREAN CONTENT
                           |
               +-----------+-----------+
               |                       |
             WATCH                   STUDY
               |                       |
        consume naturally      inspect deliberately
               |                       |
               +-----------+-----------+
                           |
                      LEARN PHRASE
                           |
                           v
                         REVIEW
                           |
                    original context
                           |
                           v
                    REAL KOREAN AGAIN
```

### Watch

Default mode. Optimize for continuous consumption.

Visible by default:
- video;
- timestamped Korean transcript;
- current playback state;
- quiet mode / assistance controls.

Do not permanently show English translation, grammar panels, vocabulary lists, AI chat, or large learning dashboards.

Clicking a transcript sentence pauses playback and opens a contextual sentence breakdown popover/overlay.

### Study

Deliberate sentence-by-sentence inspection using the same video/transcript session.

Give more space to:
- selected Korean sentence;
- natural meaning;
- meaningful phrase chunks;
- grammar and nuance on demand;
- learner-state actions.

### Review

Reuse original media context whenever available.

Preferred pattern:

```text
original video clip
      +
Korean sentence / phrase
      +
recall meaning
      +
reveal
      +
Again / Got it
```

Do not default to decontextualized flashcards when original context exists.

## Canonical interaction decisions

1. Opening a video defaults to **Watch**.
2. Watch shows **video + Korean transcript** by default.
3. Clicking a sentence **automatically pauses video playback**.
4. Watch explanation opens as a **contextual popup / overlay**, not a permanent third panel.
5. Learning is **phrase-first**, not morphology-first or isolated-word-first.
6. Grammar, nuance, morphology, and examples use progressive disclosure.
7. Assistance is **learner-driven**, not proactively interruptive.
8. `Learn this` saves immediately, shows a small confirmation, and keeps context.
9. Home mixes continue-learning, due reviews, and content rather than becoming a metrics dashboard.
10. Desktop is canonical for V0.1. Mobile-specific UX is KIV beyond functional responsiveness.

## Information architecture

Top-level navigation:

```text
Home   Library   Review   Progress   Settings
```

Do not create a top-level destination for every capability.

- **Home** answers “What should I do next?”
- **Library** holds content added/studied.
- **Review** is the contextual review queue.
- **Progress** shows comprehension-oriented progress.
- **Settings** holds AI provider, data, appearance, and assistance preferences.

### AI provider settings

Settings presents compact provider rows rather than a provider-branded chat surface. CLI rows show a current server-side status, the resolved executable path, an enabled control, and a model input. `Ready`, `Not installed`, and `Unavailable` describe installation/invocation state only; each row says that detection does not prove authentication and that the login belongs to the app-server OS user. Antigravity is labelled `Experimental` with `Detected - runtime disabled pending security verification` and is excluded from the model picker. The model picker groups enabled ready providers and stores a qualified `provider:model` reference.

## Canonical desktop screens

ASCII layouts are hierarchy references, not exact pixel specs.

### Home — desktop

```text
+--------------------------------------------------------------------------+
| Korean                     Home  Library  Review  Progress  Settings       |
+--------------------------------------------------------------------------+
|                                                                          |
|  안녕하세요.                                                              |
|                                                                          |
|  Continue learning                                                       |
|  +--------------------------------------------------------------------+  |
|  | [thumbnail]  성시경 먹을텐데                                        |  |
|  |              12:43 / 24:18                                         |  |
|  |              Continue ->                                           |  |
|  +--------------------------------------------------------------------+  |
|                                                                          |
|  8 phrases ready for review                              Review ->        |
|  Review them in the videos where you found them.                         |
|                                                                          |
|  Recommended / recent content                                            |
|  [thumbnail]          [thumbnail]          [thumbnail]                    |
|  title                title                title                          |
|                                                                          |
+--------------------------------------------------------------------------+
```

Do not turn Home into a grid of KPI cards.

### Watch — desktop

```text
+--------------------------------------------------------------------------+
| Korean                     Home  Library  Review  Progress  Settings       |
+--------------------------------------+-----------------------------------+
|                                      |                                   |
|                                      |  TRANSCRIPT                       |
|            YOUTUBE VIDEO             |                                   |
|                                      |  12:38                            |
|                                      |  오늘 진짜 날씨가 좋네요.          |
|                                      |                                   |
|                                      |  12:43                            |
|                                      |  그래서 그냥 걸어가려고요.         |
|                                      |                                   |
|                                      |  12:49                            |
|                                      |  근데 생각보다 멀어요.             |
|                                      |                                   |
+--------------------------------------+-----------------------------------+
|  Watch   Study                                    Assistance: Guided  v   |
+--------------------------------------------------------------------------+
```

Video and transcript dominate.

### Watch — sentence selected

Selection pauses playback and opens an anchored explanation while preserving transcript context.

```text
+--------------------------------------+-----------------------------------+
|                                      |                                   |
|            VIDEO PAUSED              |  오늘 진짜 날씨가 좋네요.          |
|                                      |                                   |
|                                      |  +-----------------------------+  |
|                                      |  | 그래서 그냥 걸어가려고요.    |  |
|                                      |  |                             |  |
|                                      |  | So I'm just going to walk   |  |
|                                      |  | there.                      |  |
|                                      |  |                             |  |
|                                      |  | 그래서       so / therefore |  |
|                                      |  | 그냥         just / simply  |  |
|                                      |  | 걸어가려고요 planning to walk|  |
|                                      |  |                             |  |
|                                      |  | Grammar · Nuance · Examples |  |
|                                      |  |                  Learn this |  |
|                                      |  +-----------------------------+  |
|                                      |                                   |
|                                      |  근데 생각보다 멀어요.             |
+--------------------------------------+-----------------------------------+
```

Closing returns to Watch. Resuming playback may close/de-emphasize the overlay.

### Study — desktop

```text
+--------------------------------------------------------------------------+
| Korean                     Home  Library  Review  Progress  Settings       |
+-------------------------------+------------------------------------------+
|                               |                                          |
|          VIDEO                |  CURRENT SENTENCE                        |
|                               |                                          |
|                               |  그래서 그냥 걸어가려고요.               |
+-------------------------------+                                          |
|                               |  So I'm just going to walk there.        |
| Nearby transcript             |                                          |
|                               |  PHRASES                                 |
| 이전 문장                     |                                          |
| -> 그래서 그냥 걸어가려고요. |  그래서          so / therefore          |
| 다음 문장                     |  그냥            just / simply           |
|                               |  걸어가려고요    planning to walk there  |
|                               |                                          |
|                               |  Grammar · Nuance · More examples        |
|                               |                                          |
|                               |  I know this              Learn this     |
+-------------------------------+------------------------------------------+
|  Watch   Study                                    Assistance: Guided  v   |
+--------------------------------------------------------------------------+
```

Study may devote persistent space to explanation because the learner explicitly chose deliberate study.

### Review — desktop

```text
+--------------------------------------------------------------------------+
| Review                                                        8 left     |
+--------------------------------------------------------------------------+
|                                                                          |
|                    +--------------------------+                          |
|                    |                          |                          |
|                    |      ORIGINAL CLIP       |                          |
|                    |          5 sec           |                          |
|                    |                          |                          |
|                    +--------------------------+                          |
|                                                                          |
|                       그래서 그냥 걸어가려고요.                           |
|                                                                          |
|                         What does this mean?                             |
|                                                                          |
|                              Reveal                                      |
|                                                                          |
+--------------------------------------------------------------------------+
```

After reveal:

```text
그래서 그냥 걸어가려고요.

“So I'm just going to walk there.”

Source context may appear here when useful.

[Again]                                               [Got it]
```

### Progress — desktop

```text
+--------------------------------------------------------------------------+
| Progress                                                                 |
+--------------------------------------------------------------------------+
|                                                                          |
|  Your Korean                                                             |
|                                                                          |
|  Recent improvement                                                      |
|  +--------------------------------------------------------------------+  |
|  | You watched this video 6 weeks ago.                                |  |
|  |                                                                    |  |
|  | Then: 47% understood          Now: 79% understood                  |  |
|  +--------------------------------------------------------------------+  |
|                                                                          |
|  Learning                                                               |
|  48 phrases learning · 131 known · review trend                          |
|                                                                          |
|  Content studied                                                         |
|  ...                                                                     |
+--------------------------------------------------------------------------+
```

Metrics support comprehension; they are not the emotional center.

## Mobile web — KIV reference

Mobile web should remain functional, but V0.1 UX is desktop-first. Do not force identical composition.

A plausible future Watch structure:

```text
+------------------------+
| VIDEO                  |
+------------------------+
| current sentence       |
| 지금 뭐 하고 있어?    |
+------------------------+
| transcript             |
|                        |
| 오늘은...              |
| 그래서...              |
| 그런데...              |
|                        |
+------------------------+
```

Sentence explanation may become a bottom sheet:

```text
+------------------------+
| Explanation            |
|                        |
| 지금 뭐 하고 있어?    |
| What are you up to?    |
|                        |
| phrase breakdown       |
| Grammar · Nuance       |
|                        |
|           Learn this   |
+------------------------+
```

These are exploratory references, not V0.1 acceptance criteria.

## Assistance levels

Expose a quiet control:

```text
Assistance: Full | Guided | Immersion
```

Default: **Guided**.

### Full
- Korean remains primary;
- translation is easier to reveal;
- phrase help is readily available;
- explanations may be fuller after interaction.

### Guided
- Korean first;
- English appears after interaction;
- concise explanation first;
- grammar / nuance / examples on demand.

### Immersion
- Korean-only by default;
- minimal English;
- help requires intentional action;
- no proactive difficulty interruption.

Assistance changes presentation, not learner knowledge state or provider configuration.

## Phrase-first interaction

Teach meaningful chunks.

Prefer:

```text
생각보다
than expected
```

and:

```text
뭐 하고 있어?
what are you up to?
```

rather than immediately decomposing every sentence into isolated morphemes.

Dictionary forms and morphology are supporting depth. Do not render every token as a visible button.

## Progressive disclosure

Default hierarchy:

```text
Korean sentence

Natural meaning

Meaningful phrase breakdown

Grammar · Nuance · More examples
```

Natural meaning comes before literal meaning. Never dump all grammar, nuance, morphology, examples, and AI explanation at once.

## Learner-state actions

`Learn this` / `I know this` live where the relevant phrase is being inspected.

Saving should be immediate. Preferred feedback:

```text
✓ Added to review
```

Do not interrupt with deck, tags, scheduling, or difficulty forms.

## Visual atmosphere

Feel:
- warm;
- focused;
- thoughtful;
- quiet;
- contemporary;
- slightly editorial;
- comfortable during long sessions.

Avoid:
- childish/cute-first styling;
- corporate dashboard styling;
- cyberpunk/neon;
- aggressive dark UI;
- heavy gamification.

## Color system

### Light theme

```text
Canvas             #FAF9F5
Surface Subtle     #F6F2EA
Surface            #EFE9DE
Surface Elevated   #FFFFFF
Primary Ink        #191816
Secondary Ink      #484641
Muted Ink          #75716A
Hairline           #E5DFD5
Hairline Strong    #D5CEC2
```

### Brand accent — muted persimmon

```text
Primary            #C7654C
Primary Hover      #B75943
Primary Soft       #F4E1DA
On Primary         #FFFFFF
```

Use sparingly for selected state, primary action, focus, and learning state.

### Secondary semantic accent — jade

```text
Jade               #4F8373
Jade Soft          #E2EEE9
```

Use quietly for known/success states.

### Warm highlight

```text
Highlight           #F4E8B8
Highlight Soft      #FAF4DA
```

Useful for current transcript playback and temporary annotation.

### State inks (AA text variants)

Small state text needs ≥4.5:1 on light surfaces, so the same families have darker text inks:

```text
Primary Deep        #9C4630  persimmon emphasis text and labels
Jade Deep           #3E6A5C  success / known text
Error               #A03722  error text
Warning             #8A6510  warning / needs-review text
```

Solid primary buttons use Primary Hover #B75943 under white text to keep AA contrast.

Never make this a Korean-flag red/blue theme.

## Learning-state presentation

Color is supporting information only.

- Unknown: default text; do not mark aggressively.
- Selected: Primary Soft plus a non-color indicator where needed.
- Learning: restrained persimmon.
- Known: restrained jade only when state needs to be communicated.
- Needs review: muted warm amber.

Never paint every known word green.

## Typography

Korean readability has priority over novelty.

### Canonical family

Use **`Pretendard Variable` across both Korean and Latin/UI text on core product surfaces**. This is the canonical product typeface for the Warm Korean Editorial direction.

The implementation MUST load the actual webfont. Declaring `Pretendard` or `Pretendard Variable` in a CSS fallback list without loading it is not sufficient because different machines can otherwise render materially different Korean typography.

Preferred consistent fallback stack:

```text
"Pretendard Variable", Pretendard,
-apple-system, BlinkMacSystemFont, system-ui,
Roboto, "Helvetica Neue", "Segoe UI",
"Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic",
sans-serif
```

Prefer a locally bundled/self-hosted font or a version-pinned official webfont source. Do not use an unpinned remote font URL.

Do not pair a separate Inter/Geist UI family with Pretendard by default. Pretendard should carry both Hangul and Latin so mixed strings, phrase breakdowns, navigation, and transcript UI feel like one system rather than two adjacent typefaces.

A restrained serif may appear in occasional editorial headings outside core study surfaces, never transcript/phrase controls.

### Baseline sizes and weights

Canonical targets:

```text
Korean study sentence  26px / 550 / 1.60
Transcript             18px / 475 / 1.70
Translation            15–16px / 400–450 / Secondary Ink
UI body                15–16px / 450–550 / ~1.55
Headings               650–720; avoid blunt 800-heavy hierarchy
```

Variable-weight values are intentional. If a fallback font cannot render the exact weight, use the nearest sensible static weight without making Korean visually heavier than necessary.

Korean must remain visually primary beside English.

## Spacing

4px-based scale:

```text
4  8  12  16  24  32  48  64  96
```

Prefer whitespace over containers.

## Radius

```text
Small        6px
Default      8px
Large       12px
Extra Large 16px
Pill         9999px
```

Avoid oversized generic-SaaS rounding.

## Depth

Prefer, in order:
1. whitespace;
2. background contrast;
3. hairline borders;
4. shadow when necessary.

Shadows belong mainly to temporary overlays, popovers, and modals.

## Cards

Cards are not the default layout primitive.

Use when an object truly has a boundary: content item, review item, settings group. Do not card every transcript sentence, metric, explanation, or action.

## Actions

Primary: one strong contextual action such as `Continue`, `Learn this`, `Review`.

Secondary: neutral surface/border such as `I know this`, `Skip`.

Tertiary: quiet text/ghost controls such as `Grammar · Nuance · Examples · Explain`.

## Transcript behavior

Transcript is first-class UI. Each line may include timestamp, Korean sentence, playback/learning state.

Current playback state should be visible but subtle. Hover may reveal secondary seek/bookmark controls. Selection pauses playback and opens explanation.

## AI-specific UI

AI is a capability, not the visual identity.

Prefer:

```text
Explain this
Why did they say it this way?
More natural examples
What's the nuance?
```

not provider-branded `Ask OpenAI` buttons.

Provider configuration and the local-persistence security notice belong in Settings. AI output should use normal product typography/contextual surfaces, not default chat bubbles.

## Media principle

Use authentic thumbnails, video frames, creator identity, and Korean text for richness. The interface frames content rather than competing with it.

## Motion

Use restrained 150–220ms ease-out motion for selection, popovers, and expanding detail. Avoid bouncing, confetti, decorative loops, and excessive springs.

## Dark theme

Dark mode may be supported but should remain warm:

```text
Canvas             #181715
Surface            #201F1C
Surface Elevated   #292724
Primary Ink        #F6F1E8
Secondary Ink      #C7C1B8
Muted              #918B82
Hairline           #38352F
```

It is an alternative theme, not the brand identity.

## Accessibility

- WCAG AA contrast where applicable;
- visible keyboard focus;
- controls usable without hover;
- 44px mobile touch targets for primary actions;
- learning state never communicated by color alone;
- transcript keyboard navigation where practical;
- selected and currently playing sentences distinguishable.

## Icons

Use one restrained family such as Lucide. Icons are functional, not decoration beside every label.

## Loading and errors

Preserve layout with calm skeletons. Errors are understandable and actionable. Technical adapter details may sit behind `Details` rather than becoming the primary message.

## Component vocabulary

Prefer domain components:

```text
<VideoStudyLayout />
<Transcript />
<TranscriptLine />
<SentenceBreakdownPopover />
<KoreanSentence />
<KoreanPhrase />
<Translation />
<SentenceExplanation />
<GrammarExplanation />
<NuanceExplanation />
<LearningState />
<LearnPhraseAction />
<ReviewClip />
<ContentCard />
<ProgressComparison />
<AssistanceControl />
```

Generic `<Card />`, `<Button />`, `<Popover />` primitives may exist underneath but should not be the only product vocabulary.

## Component library

Tailwind, shadcn/ui, and Radix are implementation tools, not the design language. Adapt defaults to project tokens/rules before they become canonical UI.

## Korean cultural influence

Use subtly through warm paper neutrals, muted persimmon/jade, Korean-first typography, generous negative space, and contemporary Korean editorial sensibility.

Avoid flag motifs, random decorative Hangul, stereotypical traditional patterns, K-pop neon clichés, or ornamental East Asian styling without meaning.

## Anti-patterns

Do not:
- create generic SaaS KPI dashboards;
- turn every section into a card;
- use many competing brand colors;
- make the product childish;
- use terminal/developer-tool aesthetics;
- make AI visually dominant;
- expose translations more prominently than Korean;
- show all explanatory depth simultaneously;
- introduce navigation items for every feature;
- weaken desktop solely for mobile parity.

## Agent rules for user-facing work

Before implementation:
1. read `docs/PRODUCT.md`;
2. read this `DESIGN.md`;
3. identify the surface/mode: Home, Watch, Study, Review, Progress, Settings;
4. reuse domain-specific UI patterns;
5. preserve Korean-first hierarchy and progressive disclosure.

Do not casually introduce new brand colors/fonts/spacing, top-level navigation, learning modes, gamification, provider-branded AI UI, or unrelated broad redesigns.

## Agent visual self-review

Before finishing user-facing work, ask:

```text
Is Korean the first thing my eye sees?
Does authentic content dominate the screen?
Is this the correct mode for this interaction?
Could anything visible be removed?
Is advanced explanation hidden until requested?
Did I accidentally create a SaaS dashboard?
Did I introduce unnecessary cards?
Are translations subordinate to Korean?
Does AI feel contextual rather than bolted on?
Would this remain comfortable during a 60-minute study session?
Does this still feel like Warm Korean Editorial?
```

## One-sentence test

> **Does this feel like a beautiful place to spend an hour understanding real Korean?**
