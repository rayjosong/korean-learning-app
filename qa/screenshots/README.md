# QA screenshots

Implementation agents must save screenshots for user-visible changes under:

`qa/screenshots/<backlog-id>/`

For example:

`qa/screenshots/17-mixed-review-modes/review-session.png`

Use stable, descriptive filenames. Capture the meaningful states needed to review the change, such as the initial state, the successful interaction, loading/error/empty states, or responsive behavior when relevant.

Screenshots are review evidence, not a substitute for automated tests. Link every captured image from the pull request's **QA screenshots** section and briefly describe the flow or state shown. If screenshots are not applicable, explain why in the PR instead of creating placeholder images.
