# Start prompt for the next session

Paste the block below as the first message of a new Claude Code session opened on this repository.

---

You are continuing **Бінарка** (Project Factory; TypeScript, Vite, vanilla DOM, Vitest). The course capstone was delivered on 2026-10-04 (signed tag `submission-2026-10-04`, pushed to `main`); we are now in a post-submission iteration on design and UX. Nothing in this iteration is signed as a requirement yet.

**Where to work:** branch `claude/fwdays-slice4-rules-reset-de6481`, in worktree `.claude/worktrees/git-https-to-ssh-ed7693` (or check it out in your own worktree; never edit a worktree another session owns: if `git status` shows changes you did not make, stop and ask). It has local commits after `fec972f` that are **not pushed and not signed yet**.

**Read first, in order:**
1. `AGENTS.md`
2. `docs/current-state.md` (Last Updated and Next task)
3. `docs/design/ux-decisions.md` (the user's 11 decisions)
4. `design/README.md` (the v0 design reference, its review and how to build it)
5. `docs/design/v0-followup-2.md` (what v0 was asked to change last)
6. `docs/autonomy-log.md`, rows 32 to 43 and mistakes M12 to M17
7. `docs/lessons/factory-enforces-artifacts-not-order.md`
8. `docs/requirements.md`
9. `openspec/specs/play-page/spec.md`

Run `date` first and before every time claim; the user is UTC+5:30 (Kyiv is 2:30 earlier).

**First job:** design iteration 3 in `design/v0/` was made by the previous session's agent (the v0 credits ran out), so it needs an independent check:
1. Build it (see `design/README.md`; pnpm 10 with `npm_config_manage_package_manager_versions=false`) and serve `design/v0/out` on 127.0.0.1:4173.
2. Show the user 375 px screenshots of `/`, `/rules/`, `/hint/`, `/win/` and `/confirm/` in light and dark.
3. Run the `vision-verify` workflow, or a fresh `vision-judge`, on the stills.
4. Fix only what the user or the judge confirms.

**Then:** draft the requirements amendment for the UX decisions with the requirements-analyst and wait for the user's explicit "signed" in chat before any spec, test or code. A design-fidelity NFR is declared only after `npm run check:visual` is proven runnable and seen failing. That needs the user's approval of Playwright, `pixelmatch` and `pngjs` first.

**Rules that bit us** (see the autonomy log):
- Probe GPG before a signed commit: `echo x | gpg --batch --pinentry-mode error -s -o /dev/null; echo $?`. If it isn't 0, commit with `--no-gpg-sign` and ask the user to cache the passphrase later (M6, M8, M16).
- Never claim an edit in a commit message unless the edit step exited 0; assert scripted replacements (M13 to M15).
- Tag only after a successful commit (M12).
- Use the dedicated agents (spec-writer, test-engineer, capability-implementer on Sonnet; review-gate workflow).
- Confirm red and green yourself.
- No push, PR, merge, dependency, hook, settings or `AGENTS.md` change without the user's word in chat.
