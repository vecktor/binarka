# Parallel G2 plan: brief for the prep session (2026-10-11)

The user asked (autonomy-log row 171) to run the next G2 blocks in parallel sessions:
- one serial **prep session** settles the requirements and the change folders;
- then **three sessions** run at the same time, each in its own worktree.

This file is the prep session's brief. AGENTS.md and the rules of `docs/handoff/next-session.md` still apply: signed commits, the trailers, red first, the review gate only with the user's yes, and merging and pushing only on the user's word.

## Starting state

- `main` = `origin/main` (row 171 or later).
- G2 run 9: 84 of 170 at 0.98 (`docs/qa/g2/check-visual-run-9.txt`).
- Blocks 1 to 3 and `add-violation-cause` are archived.
- The header claims G3; G1 and G3 are signed (`docs/qa/sign-offs/`).
- No open corrections.

## The streams

| Stream | Session | Scope | Owns |
|---|---|---|---|
| P | prep (serial, first) | the amendments, the shared panel shell, the change folders of A and B | `docs/requirements.md` edits; the folders |
| A | parallel | **rules panel** (G2 block) | the rules panel's CSS and behaviour |
| B | parallel | **setup sheet** (G2 block) | the setup sheet's CSS |
| C | parallel | **process**: the PD-4 and PD-5 proposals, ADRs 0006 to 0008 | `docs/qa/improvements/`, `docs/adr/`; no `src/` |

The settings panel and the confirmation dialog are a second wave, after A and B merge.

## P: the prep session

### 1. Amendment drafts

Draft one amendment per block, each in `docs/handoff/<block>-amendment-draft-<date>.md`, in the style of the earlier drafts. Each draft gets a fresh auditor, then the user signs both in one sitting. Nothing under `src/` changes before the signatures.

**Rules panel (A):**
- The desktop size and placement. `docs/mvp-capability-plan.md` marks it "design only, SD-Q9", so it now needs requirement text. From 48rem the design (`design/v0/app/binarka.css`, the `@media (min-width: 48rem)` blocks with `.rules, .setup`) has:
  - width `calc(var(--column) + 1rem)`;
  - top 6rem;
  - `max-height: calc(100dvh - 7rem)`;
  - a `min-height` that covers through the messages;
  - the panel shadow.
  
  Today the product's panel is 28rem wide and keeps the phone rule `max-height: 55dvh` (`src/ui/style.css:636, 660-671`), so on a desktop its contents scroll. The user showed this in chat on 2026-10-11.
- The filled «Зрозуміло» (the design's primary fill).
- **The panel opens at its top** (bug of row 137; the user placed it in this block on 2026-10-11). Suspected cause: the autofocus of «Зрозуміло» (A-20) scrolls the panel to its end. Keep the focus rule; for example, focus with `preventScroll`. The block writes a test first.
- The dark rules shots fell in run 8 because of the panel mismatch (`docs/qa/visual-diff/README.md`, Run 8). Also explain the soft-dim drop of `768-dark-rules`.

**Setup sheet (B):**
- The level-description indent.
- The idle line under the sheet at 1366×650.
- `--color-option-border` at 1.98:1, a known failure that "the sheet block proposes" (A-57 appendix). It needs a proposal the user signs.
- The `--color-shadow-sunken` inset of the unavailable level.
- Explain the soft-dim drop of `768-dark-setup-four`.

### 2. The shared panel shell (recommended: a small serial slice in P, before A and B)

These A-57 "later" tokens are used by the rules panel, the setup sheet, the settings panel and the dialog alike:
- `--color-surface-raised`
- `--color-overlay-border`
- `--color-shadow-panel`
- `--color-shadow-sheet`

The rule "every declared token is bound by a rule" stops one block from declaring them for the others. If A and B each declared them, both would edit the same declarations and the token-count tests (27 today: `tests/play-page-helpers.test.ts:462, 1432`, `tests/play-page-cause-stylesheet.test.ts:206`). They would conflict on every merge.

So P runs one small slice, `update-panel-shell`. It declares the four tokens and binds them to the panel fill, border and shadow of the rules panel, the setup sheet, the settings panel and the dialog at once (paint only, no geometry). It goes through the usual path: red, port, battery, review, archive, merged into `main` before A and B start.

If the user prefers not to, the alternative is that A declares the four tokens, B waits for A's merge to bind them, and B rebases.

### 3. The split, fixed in writing

Write it into both folders' `design.md`:
- **Tokens:** A has none of its own beyond the shell (to be confirmed by the draft). B has `--color-option-border` and `--color-shadow-sunken`. `--color-violation-ink` («Так, почати») belongs to the dialog block in the second wave.
- **Requirements:** each MODIFIED requirement of `openspec/specs/play-page/spec.md` belongs to exactly one folder. Where both blocks would modify the same requirement (for example «Borders, cues and focus rings have enough contrast» or «The main column takes the design palette»), assign it to one folder; the other folder's need is met by an ADDED requirement or waits for the first to merge.
- **Design freezes:** `quality/design-paint.json` and `design-geometry.json` are refrozen by at most one stream at a time. If both need new cases, A goes first and B rebases.

### 4. The change folders

Write both change folders in parallel, one spec-writer each. Each folder gets a fresh spec-compliance-auditor and must pass `openspec validate --strict`. Commit them in P.

The red tests belong to A and B, not to P.

## Rules for the parallel sessions

- **Worktrees:** each session in its own worktree from `main` after P merges. The branch names say the stream: `claude/<name>-rules`, `-setup`, `-process`.
- **Captures take turns.** `check:visual` (4173), `scripts/visual-block.mjs` (4174, 4176, 4177) and the freeze scripts (4177) bind fixed ports, and every worktree uses the same ports. Two captures at once crash (this was COR-2's cause).
  - Before a capture, take the lock: create `/tmp/binarka-capture.lock` with `mkdir`, which fails if it exists. Write the session name into it, and remove it after the run and the port check.
  - If the lock exists, wait; do not delete another session's lock. Ask the user if it is older than 30 minutes.
  - Stop only orphans of your own worktree (`lsof -nP -iTCP:<port> -sTCP:LISTEN`, then check the process's working directory).
- **Logs:**
  - A parallel session does not edit `docs/autonomy-log.md`, `docs/current-state.md` or `docs/handoff/next-session.md`. It keeps `docs/qa/<slice>/session-log.md` (date, time UTC+5:30, what happened, the user's words, evidence).
  - The session that merges into `main` copies its log into autonomy-log rows, numbered after the last row on `main` at that moment, and updates current-state and next-session.
- **Merging:**
  - The first finished slice merges into `main` on the user's word.
  - The other rebases onto `main` (expected conflicts: `src/ui/style.css`, the baseline spec after the first archive, the token-count tests if a token moved, the freeze files), re-runs its whole battery and a fresh `check:visual`, and then merges on the user's word.
  - C has no product code and can merge at any time.
- **The user is the shared resource:** signatures, GPG unlocks, review-gate yeses, merges. Batch questions; prefer the question form.

## C: the process stream

- **PD-4:** the capture path (`scripts/check-visual-parity-adapters.mjs` and `scripts/visual-block.mjs`) leaves orphaned `vite preview` children on 4173 to 4177. Fix it by killing the process group. Consider also making the ports configurable (an environment variable), so parallel sessions need no lock; that is a design choice for the user.
- **PD-5:** `qa-verify` and `gate:status` run `scripts/check-visual-fidelity.mjs` without `CHECK_VISUAL_FIDELITY_ADAPTERS=scripts/check-visual-parity-adapters.mjs`. They then rewrite the 170 `docs/qa/visual-diff/*/report.json` with a different verdict.
- Each PD gets `docs/qa/improvements/PD-<n>-<slug>.md` and a red proof (as PD-1 to PD-3). The locked files (`factory-lock.json`) change only after the user approves each one, with a `Refs: PD-<n>` commit.
- **ADRs,** for the user's review:
  - 0006: the given cue is font weight (palette decision 4);
  - 0007: translucent colours as tokens (palette decision 7);
  - 0008: a backdrop is checked as a composite (backdrop decision 2).
  
  The sources are the archived `design.md` files of `2026-10-10-update-page-palette` and `2026-10-11-update-page-backdrop`. Palette decision 11 is not written (the user's choice).

## Done when

- A and B are archived and merged, and run N of `check:visual` shows the rules and setup shots moved up, with no other shot falling without explanation.
- C's PDs are approved or declined by the user, and the ADRs are accepted or changed.
- Then the second wave (settings panel, dialog) is planned the same way.
