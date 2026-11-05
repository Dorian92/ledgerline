# Step plans

One file per roadmap step: `docs/plans/<NN>-<slug>.md`. Every plan uses this structure:

1. **Goal**: one paragraph.
2. **Depends on / user actions**: steps and U-ids.
3. **Read first**: docs sections that are normative for this step.
4. **Scope**: what to build, with file paths, signatures and behavior.
5. **Out of scope**: things that must not be built in this step.
6. **Tests**: concrete cases that must exist.
7. **Acceptance criteria**: bounded and checkable.
8. **Gates**: commands to run (see `docs/testing-strategy.md`).
9. **Visual check** (UI steps): screens, states, and what to compare against the mockup.
10. **Review checklist**: step-specific items, in addition to the general checklist in `docs/workflow.md`.
11. **Risks / notes**.

Plans are contracts. If a plan is wrong, follow `docs/workflow.md` → "When the plan is wrong or incomplete".
