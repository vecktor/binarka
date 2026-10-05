# Start prompt for the next session

Paste the block below as the first message of a new Claude Code session opened on this repository.

---

You are continuing **Бінарка** (Project Factory; TypeScript, Vite, vanilla DOM, Vitest). The course capstone was delivered on 2026-10-04 (signed tag `submission-2026-10-04`, pushed to `main`); we are now in a post-submission iteration on design and UX. Nothing in this iteration is signed as a requirement yet.

**Where to work:** branch `claude/next-session-handoff-8cd297` in worktree `.claude/worktrees/next-session-handoff-8cd297`. It is the slice-4 branch `claude/fwdays-slice4-rules-reset-de6481` (tip `406940d`) plus the design iterations 4 to 7 and reviews 2 to 4. The slice-4 branch could not be fast-forwarded from here, because it is checked out in `.claude/worktrees/git-https-to-ssh-ed7693`. That worktree has an uncommitted `trace/ledger.jsonl` hook change; ask the user before touching it. Never edit a worktree another session owns. Commits after `406940d` up to the review 3 commit are signed (re-signed on 2026-10-05 about 22:10, autonomy-log row 49; backup of the unsigned originals: `backup/design-unsigned-4b62294`). The iteration 6 commits were re-signed at about 22:43 (backup of the unsigned originals: `backup/design-unsigned-6ad6cf0`), and the iteration 7 commits at about 23:12 (backup `backup/design-unsigned-edb15c8`), so every commit after `406940d` is signed (check `%G?` for anything committed later). Nothing after `3777289` is pushed; `main` stays at `db76f02`.

**Read first, in order:**
1. `AGENTS.md`
2. `docs/current-state.md` (Last Updated and Next task)
3. `docs/design/review-4-design-reviewer.md` (the latest design review; its questions are answered as decisions 26–29)
4. `docs/design/ux-decisions.md` (the user's 17 decisions)
5. `design/README.md` (iterations 4 and 5, their measurements and known limits)
6. `docs/autonomy-log.md`, rows 32 to 55 and mistakes M12 to M17
7. `docs/lessons/factory-enforces-artifacts-not-order.md`
8. `docs/requirements.md`
9. `openspec/specs/play-page/spec.md`

Run `date` first and before every time claim; the user is UTC+5:30 (Kyiv is 2:30 earlier).

**The design review loop is closed.** Four independent reviews were run, and iterations 4–7 applied them. The user froze `design/v0-screenshots/review-set-5/` as the pixel reference (decision 30; see `design/README.md`, "Pixel reference: frozen"). Do not change the design or that set without the user's word. If the user asks for a design change, follow these steps and make a new set:
1. Agree the change with the user and record it as a decision in `docs/design/ux-decisions.md`.
2. Apply them in `design/v0/`. Build with pnpm 10: `npm_config_manage_package_manager_versions=false pnpm build` in `design/v0` (run `pnpm install --frozen-lockfile` the same way first if `node_modules` is missing).
3. Add the agreed sizes to `design/tools/capture-review-set.sh` (it already has 4×4 and 1024×768).
4. Serve `design/v0/out` on 127.0.0.1:4173 and capture **twice** into the scratchpad (`capture-review-set.sh <dir>`, about 5 minutes per run). Compare `shasum` output; any difference is a harness defect to fix first. Copy the set into a new `review-set-6/` with its `SHA1SUMS`.
5. Measure the touch targets and fit in the built-in browser (each page in an iframe of the given size), as in `design/README.md`.
6. If the user wants another look, run review 4: a fresh Opus agent told to read and follow `.claude/agents/design-reviewer.md`, read-only, with the brief of review 3 updated (material: the latest `review-set-N/`). Save its report verbatim with your spot-checks, and report its verdict to the user.

**First job now: draft the requirements amendment for the UX decisions.** The user asked for it on 2026-10-05 at about 23:15 and chose to start it in a new session.

**Process.** This is the same as the slice 4 and NFR-6 amendments (autonomy-log rows 32 and 38–39):
1. Dispatch the requirements-analyst (Sonnet) to draft exact FR/NFR/A/TC wording. It reads `docs/requirements.md`, `docs/design/ux-decisions.md` (decisions 1–30), `design/README.md` and `openspec/specs/play-page/spec.md`.
2. Show the user the draft in chat. Number every new or changed item, and give each a verification method that already has a mechanism, or mark it as waiting for a dependency approval (declared-method-needs-mechanism).
3. Wait for the user's explicit "signed". Only then edit `docs/requirements.md` and `docs/mvp-capability-plan.md`, and plan the slices.
4. No spec, test or code before "signed".

**Scope** (decision → requirement impact, from `docs/design/ux-decisions.md`):
- 1: FR-57 and A-26. The rules become a «Правила» header button opening a native popover: a bottom sheet on phones, a centred panel from 48rem. The `<details>` goes away; the rule texts stay.
- 2 and 12: the DOM order becomes header with «Правила» → size picker → board → buttons → message area. New NFR: the board, buttons and message fit on one 375×812 screen at 6×6.
- 3: a new hinted-cell FR (`cell-hinted` until the next board action); FR-39's scenarios gain the marker.
- 4: FR-42, FR-43 and FR-58 ask for confirmation only when the board has player entries, in a native `<dialog>`. The texts «Почати заново? Ваші ходи на цьому полі буде втрачено.», «Так, почати» and «Скасувати» come under NFR-5.
- 5: a new NFR for non-colour cues (violations, givens, entries, the hinted cell).
- 6: FR-43 and A-24. The size control becomes a segmented control: three buttons «Поле 4×4», «Поле 6×6», «Поле 8×8», `role="radiogroup"`. The size-selector tests change deliberately.
- 7: FR-27 moves from Future to MVP (every puzzle solvable with the pair, sandwich and count rules). This is a generator slice; NFR-1 to NFR-3 timing must still hold.
- 8: A-20 is replaced by keyboard and screen-reader requirements: cells as `<button>`s with Ukrainian `aria-label`s, and visible focus. `check-a11y` needs Playwright and `@axe-core/playwright`.
- 9: the placeholder line «Натискайте клітинки, щоб ставити 0 і 1. Правила — кнопка «Правила» вгорі.» under NFR-5. «0 і 1» uses non-breaking spaces.
- 10: the logo (TC-14): the 2×2 mini board «1 0 / 0 1» drawn as shapes, legible at 40 px.
- 13, 20 and 22: a touch-target NFR. 4×4 and 6×6 cells and all controls are at least 44×44 CSS px everywhere. 8×8 cells may be smaller (at least 24 px) on phones and on screens too short for 44 px. Below the floor the page scrolls.
- 14: FR-41's win message uses the Ukrainian apostrophe: «Вітаємо, головоломку розвʼязано!» (U+02BC). The tests that pin the ASCII apostrophe change deliberately.
- 16, 21 and the other layout decisions: no separate FR. The design-fidelity NFR covers them.
- 25 and 30: a **design-fidelity NFR** against the frozen reference `design/v0-screenshots/review-set-5/`, with decision 25's capture conditions (reduced motion, framed window focused, pointer off the page, viewport crop). Declare it **only after** `npm run check:visual` is proven runnable and seen failing against today's page (declared-method-needs-mechanism).
- Ask the user whether motion that respects `prefers-reduced-motion` should be a requirement or stay design-only.

**Dependency approvals to ask for early** (each one is the user's word in chat):
- Playwright, `pixelmatch` and `pngjs`, for `check:visual`;
- `@axe-core/playwright`, for `check-a11y`.

Without them, the fidelity, non-colour-cue and keyboard NFRs cannot get a mechanism and must wait.

**Rules that bit us** (see the autonomy log):
- Probe GPG before a signed commit: `echo x | gpg --batch --pinentry-mode error -s -o /dev/null; echo $?`. If it isn't 0, commit with `--no-gpg-sign` and ask the user to cache the passphrase later (M6, M8, M16).
- Never claim an edit in a commit message unless the edit step exited 0; assert scripted replacements (M13 to M15).
- Tag only after a successful commit (M12).
- Use the dedicated agents (spec-writer, test-engineer, capability-implementer on Sonnet; review-gate workflow).
- Confirm red and green yourself.
- No push, PR, merge, dependency, hook, settings or `AGENTS.md` change without the user's word in chat.
