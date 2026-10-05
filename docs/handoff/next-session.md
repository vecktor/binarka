# Start prompt for the next session

Paste the block below as the first message of a new Claude Code session opened on this repository.

---

You are continuing **Бінарка** (Project Factory; TypeScript, Vite, vanilla DOM, Vitest). The course capstone was delivered on 2026-10-04 (signed tag `submission-2026-10-04`, pushed to `main`); we are now in a post-submission iteration on design and UX. Nothing in this iteration is signed as a requirement yet.

**Where to work:** branch `claude/next-session-handoff-8cd297` in worktree `.claude/worktrees/next-session-handoff-8cd297`. It is the slice-4 branch `claude/fwdays-slice4-rules-reset-de6481` (tip `406940d`) plus the design iterations 4 to 6 and reviews 2 and 3. The slice-4 branch could not be fast-forwarded from here, because it is checked out in `.claude/worktrees/git-https-to-ssh-ed7693`. That worktree has an uncommitted `trace/ledger.jsonl` hook change; ask the user before touching it. Never edit a worktree another session owns. Commits after `406940d` up to the review 3 commit are signed (re-signed on 2026-10-05 about 22:10, autonomy-log row 49; backup of the unsigned originals: `backup/design-unsigned-4b62294`). The iteration 6 commits are **unsigned** (GPG probe exit 2 at about 22:38); re-sign them when the user has cached the passphrase. Nothing after `3777289` is pushed; `main` stays at `db76f02`.

**Read first, in order:**
1. `AGENTS.md`
2. `docs/current-state.md` (Last Updated and Next task)
3. `docs/design/review-3-design-reviewer.md` (the latest design review, with its three questions)
4. `docs/design/ux-decisions.md` (the user's 17 decisions)
5. `design/README.md` (iterations 4 and 5, their measurements and known limits)
6. `docs/autonomy-log.md`, rows 32 to 51 and mistakes M12 to M17
7. `docs/lessons/factory-enforces-artifacts-not-order.md`
8. `docs/requirements.md`
9. `openspec/specs/play-page/spec.md`

Run `date` first and before every time claim; the user is UTC+5:30 (Kyiv is 2:30 earlier).

**First job: close the design review loop.**
1. Review 3's questions are answered (decisions 22–25) and iteration 6 applies them (`design/README.md`, `review-set-4/`). Ask the user whether to freeze `review-set-4` as the pixel reference or run review 4 first; if anything changes, continue with the steps below.
2. Apply them in `design/v0/`. Build with pnpm 10: `npm_config_manage_package_manager_versions=false pnpm build` in `design/v0` (run `pnpm install --frozen-lockfile` the same way first if `node_modules` is missing).
3. Add the agreed sizes to `design/tools/capture-review-set.sh` (it already has 4×4 and 1024×768).
4. Serve `design/v0/out` on 127.0.0.1:4173 and capture **twice** into the scratchpad (`capture-review-set.sh <dir>`, about 5 minutes per run). Compare `shasum` output; any difference is a harness defect to fix first. Copy the set into a new `review-set-5/` with its `SHA1SUMS`.
5. Measure the touch targets and fit in the built-in browser (each page in an iframe of the given size), as in `design/README.md`.
6. If the user wants another look, run review 4: a fresh Opus agent told to read and follow `.claude/agents/design-reviewer.md`, read-only, with the brief of review 3 updated (material: `review-set-4/`). Save its report verbatim with your spot-checks, and report its verdict to the user.

**Then:** draft the requirements amendment for the UX decisions with the requirements-analyst and wait for the user's explicit "signed" in chat before any spec, test or code. A design-fidelity NFR is declared only after `npm run check:visual` is proven runnable and seen failing. That needs the user's approval of Playwright, `pixelmatch` and `pngjs` first.

**Rules that bit us** (see the autonomy log):
- Probe GPG before a signed commit: `echo x | gpg --batch --pinentry-mode error -s -o /dev/null; echo $?`. If it isn't 0, commit with `--no-gpg-sign` and ask the user to cache the passphrase later (M6, M8, M16).
- Never claim an edit in a commit message unless the edit step exited 0; assert scripted replacements (M13 to M15).
- Tag only after a successful commit (M12).
- Use the dedicated agents (spec-writer, test-engineer, capability-implementer on Sonnet; review-gate workflow).
- Confirm red and green yourself.
- No push, PR, merge, dependency, hook, settings or `AGENTS.md` change without the user's word in chat.
