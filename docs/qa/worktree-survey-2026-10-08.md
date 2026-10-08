# Worktree and branch survey, 2026-10-08

A read-only survey of every worktree and local branch, asked for by the user before the accessibility line was merged
into `main` ("check if there are no leftovers which can potentially overlap in other worktrees that are still actual").
A subagent ran it with read-only git commands; nothing was fetched or written. The orchestrator re-checked the claims
marked **(re-verified)** with its own git commands before acting on them.

Reference points at the time: `main` = `db76f02` (annotated tag `submission-2026-10-04`, equal to `origin/main`); the
accessibility branch = `cf9352e`. The stash was empty.

## What the decisions of 2026-10-08 changed

- The survey proposed A-32 for the accessibility assumption, because A-28 to A-31 are taken on the UX line. The user
  chose to keep the accessibility ids as signed after the first renumbering (FR-59 to FR-65, A-28) and to let the UX line
  renumber when it is integrated (autonomy-log row 45).
- The user chose to take the product decision about the UX line's different page model when that line is integrated.

## Summary

| Worktree | Branch | HEAD | Uncommitted | vs `main` (behind/ahead) | Verdict |
|---|---|---|---|---|---|
| main checkout | `main` | `db76f02` | clean | 0/0 | reference |
| `heuristic-lovelace-5e57b4` | `claude/heuristic-lovelace-5e57b4` | `5dcab3c` | ledger lines | 0/53 | **active**: tip of the UX line |
| `amazing-satoshi-c7ab01` | `claude/amazing-satoshi-c7ab01` | `5dcab3c` | clean | 0/53 | **active**: same tip |
| `next-session-handoff-15b81c` | `claude/next-session-handoff-15b81c` | `488e0c0` | ledger lines | 0/30 | earlier point on the UX line |
| `next-session-handoff-8cd297` | `claude/next-session-handoff-8cd297` | `5497853` (= origin) | ledger lines | 0/28 | earlier point on the UX line |
| `git-https-to-ssh-ed7693` | `claude/fwdays-slice4-rules-reset-de6481` | `406940d` (origin `3777289`, local 3 ahead) | ledger lines | 0/13 | earlier point on the UX line |
| `ux-orchestrator-run` | `worktree-ux-orchestrator-run` | `358733c` | ledger lines | 0/35 | superseded: unsigned originals, tree equal to `276baa9` |
| `elastic-wilson-75882a` | `claude/bold-lalande-74a0ed` | `da31f60` (unsigned) | ledger lines | 0/1 | **active, small orphan**: a lesson file, autonomy row 41 and M16 |
| `slice4-handoff-archive-9f35e8` | detached | `a4ab3d5` | clean | 22/5 | contained in the accessibility branch |
| `practical-allen-938687` | `claude/fwdays-slice3-size-selector` | `cd90dca` | 3 untracked generated files | 22/0 | stale |
| `hopeful-wiles-0b69fe`, `fwdays-capstone-slices-5cecb3`, `binarka-p1-requirements-45688c`, `eloquent-galileo-3b321e`, `happy-lumiere-7930d0` | own branches | older | clean or ledger lines | behind only | stale: fully contained in `main` |

"Ledger lines" means only appended hook-run events in `trace/ledger.jsonl`. No worktree had uncommitted changes under
`src/`, `tests/`, `openspec/` or in the requirements, plan or autonomy log.

## The UX line (the main leftover)

**(re-verified)** One linear line on top of `db76f02`: 53 commits, all signed, 25 of them only local, tip `5dcab3c`.
Its own handoff says phases A to C are archived and phase D (`update-win-apostrophe`) is next.

**(re-verified)** It uses ids that `main` now uses for accessibility:

- FR-59 to FR-66: the hinted-cell marker, the confirmation dialog, page order, cells as `<button>` elements, cell
  `aria-label`, the idle line, the logo, pressing the current size does nothing;
- held NFR-9 to NFR-14 (usability) in `docs/requirements-held.md`;
- A-28 to A-31;
- autonomy rows 41 to 66 (41 to 56 are on the `origin` branches `claude/next-session-handoff-8cd297` and
  `claude/fwdays-slice4-rules-reset-de6481`) and mistake rows M16 to M19;
- plan section 4.7, "UX amendment, slices A to H".

**(re-verified)** It models the same page differently: every cell is a `<button>` Tab stop, the size control is a
`radiogroup` of `radio` buttons, the rules are a popover dialog that uses `id` attributes, and there is a confirmation
dialog. The accessibility requirements make the board one grid Tab stop, use a labelled `<select>`, keep the rules as a
block under the board, and forbid `id` attributes under the page root.

It changes 450 files against `main`, 21 of them also changed by the accessibility line, including
`src/ui/play-page.ts`, `src/ui/style.css`, `openspec/specs/play-page/spec.md` and `eslint.config.js` (a certain conflict:
the UX line edits the ignores line that ADR-0003 replaced).

## Needs similar treatment after the integration

1. **The UX line** (`5dcab3c`): first the product decision about cells, size control and rules; then renumber against
   the integrated `main` (FR-59 to FR-66, held NFR-9 to NFR-14, A-28 to A-31, autonomy rows 41 to 66, M16 to M19, plan
   section 4.7); then a real merge with conflicts in the shared files.
2. **`da31f60`** (`claude/bold-lalande-74a0ed`, unsigned): if it is kept, renumber its row 41 and M16, sign it and rebase
   it onto the integrated `main`; otherwise confirm that it is abandoned.
3. **Published UX rows**: `origin` already carries UX rows 41 to 56 and M16 to M17 on two branches; they clash with
   `main`'s rows 41 to 46 and M16 once `main` is pushed. Nothing to do inside this integration.
4. **Tags**: the accessibility tags `step-30-s4-a11y-*` are on `origin` and say `s4` for what is slice 6 on `main`.
   `main`'s own `step-00` to `step-25` and `step-30` to `step-41` tags are local only.
5. **Housekeeping**: hook residue in `trace/ledger.jsonl` in seven worktrees; three untracked generated files in
   `practical-allen-938687`; a stale `origin/HEAD` symbolic ref; six stale worktrees; eight superseded `backup/*`
   branches whose tips have the same trees as signed commits.
