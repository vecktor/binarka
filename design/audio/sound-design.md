# Бінарка: sound design (draft)

Status: **DESIGN DRAFT, not signed, not product scope.** Written 2026-10-09 about 12:30 (UTC+5:30) by the audio-designer agent. Nothing here changes `src/`, `tests/`, `openspec/` or `docs/`. Sound becomes product scope only after the user signs a requirements amendment (the drafts below use placeholder IDs) and a test-first slice builds it.

Based on `main` at `d4b83d3` (read with `git show`, not checked out): `src/ui/play-page.ts`, `src/ui/strings.ts`, `src/ui/style.css`, `src/engine/hint.ts`, `docs/requirements.md`, `docs/frontend-conventions.md`, `AGENTS.md`.

Files in this folder:

| File | What |
|---|---|
| `sound-design.md` | this document: verdict, cue sheet, recipes, port, toggle, draft requirements |
| `synth.ts` | the synth module: the port type, the cue rule `chooseCue`, the recipe table `CUE_RECIPES` (pure data), the Web Audio renderer and `createWebAudioPort`, plus an offline measuring helper |
| `prototype.html` + `prototype.ts` | the listening page: one button per cue, master volume, the proposed «Звук» toggle, three rapid-fire tests, a scene, a small playable board on the real engine, and an offline measurement table |
| `measurements-2026-10-09.json` | the numbers the measurement table produced (evidence for the budget claims below) |

## 1. Verdict

A small family of soft marimba-like taps in A major: a sine bar with a faint, fast-dying overtone at four times its pitch, low-pass filtered, with 5 ms or slower attacks and no buzzers. Only six moments make a sound (placing 0, placing 1, clearing, a new rule break, a hint that fills a cell, and the win), plus a tap when the player turns sound back on. Everything else stays silent, and no action ever plays more than one cue. Sound is on by default but nothing plays before the player's first tap, and a «Звук» toggle in the header turns it off for the rest of the visit.

## 2. Cue sheet

Notes are equal-tempered, A4 = 440 Hz. Gains are before the master gain (0.7). "Mallet" means: a sine at the note, plus a sine at 4× the note with its own shorter decay, both shaped by a linear attack from 0, an exponential decay to 0.0001 (−80 dB), then a 5 ms linear release to 0. Measured peaks are offline renders at 48 kHz through the master gain (`measurements-2026-10-09.json`).

| # | Event (where on `main`) | Sound | Recipe | Why |
|---|---|---|---|---|
| 1 | A non-given cell becomes **0** (click, Enter or Space): `onBoardClick` in `play-page.ts`, `next === 0` | `place0` | Mallet A4 440 Hz; attack 6 ms, no hold, decay 95 ms, release 5 ms → 106 ms; peak 0.30; overtone 1760 Hz × 0.22, decay 35 ms; low-pass 2800 Hz, Q 0.7. Measured peak −11.9 dBFS. | The most frequent sound, so it is short, soft and woody. The low bar is 0. |
| 2 | A non-given cell becomes **1**: `onBoardClick`, `next === 1` | `place1` | As `place0` at E5 659.26 Hz (overtone 2637 Hz). Measured −12.2 dBFS. | A perfect fifth above `place0`, so 0 and 1 differ clearly by ear and still sound like one instrument ("1 is up"). |
| 3 | A non-given cell becomes **empty**: `onBoardClick`, `next === null` | `clear` | Triangle, E4 329.63 Hz gliding down to D4 293.66 Hz over 50 ms; attack 5 ms, decay 60 ms, release 5 ms → 70 ms; peak 0.14; low-pass 1200 Hz, Q 0.7. Measured −20.7 dBFS. | The third step of the cycle must not feel dead, but taking a digit away is quieter and duller than placing one. |
| 4 | A **new rule break** appears: after a cell change or a hint fill, at least one cell has `aria-invalid="true"` that did not have it before (`refreshHighlights`) | `conflict` (replaces the action's own cue) | Triangle D4 293.66 Hz sagging a semitone to C#4 277.18 Hz over 220 ms, plus a sine an octave below (× 0.5, gain 0.35); attack **25 ms**, hold 90 ms, decay 140 ms, release 5 ms → 260 ms; peak 0.16; low-pass 900 Hz, Q 0.8. Measured −17.1 dBFS, quieter than a tap. | A muffled, falling "hmm", not a buzzer. The slow attack removes any percussive "wrong!" edge. It plays only when red **appears**, mirroring what the eye sees; adding to an already red line plays the normal tap. |
| 5 | A rule break **is fixed** (the last red cell goes) | silent | A candidate `resolve` is in the prototype only (mallet C#5, 213 ms, −20.7 dBFS) so the user can decide. | Less is more: the red disappearing is reward enough, and the click already made its own tap. |
| 6 | **Hint fills a cell**: hint button handler, `h.kind === 'fill'` | `hint` (unless #4 or #9 applies) | Two mallets: E5 659.26 Hz at 0 ms (peak 0.22, decay 170 ms) and A5 880 Hz at 80 ms (peak 0.20, decay 190 ms); attack 6 ms; overtones × 0.15, decay 50 ms; low-pass 3200 Hz → 281 ms. Measured −15.4 dBFS. | A rising fourth, "here is an idea". Shorter than 300 ms, so it finishes before or under the start of the hint sentence that a screen reader reads from `role="status"`. |
| 7 | **Hint fills nothing**: `h.kind === 'none'` (no rule applies) or `'broken'` (fix the red first) | silent | — | The sentence is the feedback. A sound here would either scold (broken) or say "nothing" twice, and it would sit on top of the screen reader reading the sentence. |
| 8 | Click, Enter or Space on a **given** cell (`givens[r][c] !== null`, early return) | silent | — | Nothing changes (FR-33). A "denied" sound would scold. |
| 9 | **Win**: the board goes from not solved to solved, by a click or by a hint fill (`updateWin`) | `win` (replaces every other cue of that action) | A major arpeggio of mallets: A4 at 0 ms, C#5 at 110 ms, E5 at 220 ms (peak 0.20, decay 520 ms, overtone × 0.18 decay 90 ms), A5 at 330 ms (peak 0.22, decay 880 ms, overtone × 0.18 decay 120 ms, plus a sine at 2× gain 0.08 for a faint glow); attack 6 ms; low-pass 3600 Hz → 1221 ms. Measured −13.3 dBFS. | The one moment of celebration: a small, warm chime that resolves on the tonic, under 1.5 s. It fires again only if the player unsolves and re-solves the board. |
| 10 | «Нова головоломка», a size change, «Скинути», «Так, почати», «Скасувати», the confirm dialog opening, the size already shown (FR-73), the «Правила» panel opening or closing, page load | silent | — | Navigation, not play. The board change is visible, the dialog is read by the screen reader, and nothing may play before the first gesture. |
| 11 | **Focus moves** (Tab, Shift+Tab) | silent | — | A sound on every Tab would mask the screen reader. |
| 12 | The «Звук» toggle is **turned on** | `soundOn` | Same recipe as `place1` (106 ms, −12.2 dBFS). | The player hears the level at once, so a too-loud phone is noticed on a button, not on the board. |
| 13 | The «Звук» toggle is **turned off** | silent, and every sounding cue is cut | 12 ms linear fade on each voice | Off means off, at once (a ringing win stops). |

### The cue rule (one action, at most one cue)

`chooseCue(action, before, after)` in `synth.ts` is the reference. For one action that changed the board:

1. A hint that filled nothing → no cue.
2. The board was not solved before and is solved after → `win`.
3. Some cell has `aria-invalid="true"` after the action and did not before → `conflict`.
4. Otherwise the action's own cue: `hint` for a hint fill; `place0`, `place1` or `clear` for the cell's new value.

A cleared cell can never start a new rule break (empty cells never count, FR-7), so `conflict` only follows a placed digit or a hint fill.

### Family and mixing

- One timbre (sine bar + 4× overtone, low-pass) for every cue except `clear` and `conflict`, which use a filtered triangle so they read as "softer, lower" while staying related.
- One key, A major. 0 is A4, 1 is E5, the hint rises E5 → A5, the win spells A C# E A, the "hmm" sits on D4 → C#4 (both in the key).
- Loudness order: `place` ≈ `win` > `hint` > `conflict` > `clear`. A rule break is never louder than a tap.
- Master gain 0.7 in one constant (`MASTER_GAIN`). Measured peaks run from −20.7 to −11.6 dBFS (rapid fire included), far below clipping.

### Fast input

Cues are on three channels: `input` (`place0`, `place1`, `clear`, `soundOn`), `feedback` (`conflict`, `hint`) and `win`. A new cue on a channel cuts the channel's previous voice with a 12 ms fade, so at most three voices ever sound. Measured: ten alternating taps 60 ms apart peak at −11.6 dBFS and 35 ms apart at −11.7 dBFS, against −11.9 dBFS for a single tap; a win cut at 100 ms is exactly 0 from 114 ms on.

### Determinism

Same cue name, same recipe: the recipes are constant data, scheduled from `ctx.currentTime`. No `Math.random`, no per-cell pitch variation (the 0 and 1 identity matters more than variety, and identical taps at −12 dBFS do not tire).

### Comfort and accessibility

- **Autoplay:** no `AudioContext` exists until the first `playCue` or `setMuted(false)`, and the page calls those only from click handlers (Enter and Space on a button are clicks). A suspended context is resumed there.
- **Screen readers:** no sound on focus; input cues are about 100 ms; the hint cue starts at the click and ends within 281 ms, around when a polite status announcement starts; the win chime (1.2 s) overlaps «Вітаємо, головоломку розвʼязано!», so it is kept at −13 dBFS with its energy mostly at 440–880 Hz, below the consonant band of speech. Not tested with a real screen reader.
- **`prefers-reduced-motion` does not quiet sound.** It is a motion preference; tying it to sound would silently take sound away from people who asked only for less animation, with no explanation on the page. The visible toggle is the control. (If the user decides otherwise: jsdom has no `window.matchMedia`, so the page must feature-detect it and tests must stub it.)
- **Sound-sensitive players:** one tap on «Звук» stops everything at once, and the off state lasts for the visit.

## 3. Audio port interface

Proposed file: `src/ui/audio.ts` (page layer; `src/engine/` never imports it, TC-7). `synth.ts` here is its reference implementation.

```ts
/** The seven cue names. Page tests assert on these strings. */
export type CueName = 'place0' | 'place1' | 'clear' | 'conflict' | 'hint' | 'win' | 'soundOn';

export interface AudioPort {
  /** True when the browser has an AudioContext constructor. Fixed for the life of the port. */
  readonly available: boolean;
  /** Ask for one cue. Never throws, never blocks, returns nothing. No-op when muted or unavailable. */
  playCue(name: CueName): void;
  /** true: cut every sounding cue (12 ms fade) and ignore playCue; false: re-arm. Never throws. */
  setMuted(muted: boolean): void;
}

/** No Web Audio: available false, both methods no-ops. */
export const silentAudioPort: AudioPort;

/**
 * Feature detection: options.AudioContext if the key is present (undefined = "no Web Audio"),
 * else globalThis.AudioContext ?? globalThis.webkitAudioContext. Constructs nothing.
 * The AudioContext is constructed lazily on the first playCue or setMuted(false).
 * If construction throws, the port stays silent for good and never throws.
 */
export function createWebAudioPort(options?: { AudioContext?: (new () => AudioContext) | undefined }): AudioPort;

// play-page.ts
export interface PlayPageOptions {
  seedSource?: () => number;
  generate?: (size: number, seed: number) => Puzzle;
  /** Default: createWebAudioPort(). In jsdom that port has available === false. */
  audio?: AudioPort;
}
```

**Who gates on mute:** the page. It keeps `soundOn` (the toggle's `aria-pressed`) and does **not** call `playCue` while sound is off. The port also ignores `playCue` while muted, as a second guard, but tests assert on the page's calls.

**Call contract (what a test can assert on the fake):**

- Mounting makes **no** port call (no `playCue`, no `setMuted`).
- Each board action with sound on makes **exactly one** `playCue` call with the name from the cue rule, or none for the silent events (#5, #7, #8, #10, #11).
- Turning the toggle off: exactly `setMuted(true)`, no `playCue`. Turning it on: `setMuted(false)` then `playCue('soundOn')`, in that order.
- While the toggle is off, no `playCue` call for any action.
- Calls happen synchronously inside the click handler (no timers, no promises), so a test can assert right after `.click()`.

**How a page test injects a fake:**

```ts
function fakeAudio(available = true): { port: AudioPort; calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    port: {
      available,
      playCue: (name) => { calls.push(`cue:${name}`); },
      setMuted: (muted) => { calls.push(`muted:${String(muted)}`); },
    },
  };
}

const { port, calls } = fakeAudio();
mountPlayPage(root, { audio: port, generate: () => fixedPuzzle, seedSource: () => 1 });
cell(1, 3).click();
expect(calls).toEqual(['cue:conflict']);
```

**Worked boards for red tests (4×4, rows and columns 1-based, `.` empty).** The injected `generate` returns `{ size: 4, givens, solution }`; the page does not check uniqueness.

| Case | Givens | Action | Expected calls |
|---|---|---|---|
| place 0, 1, clear | all empty | click (1,1) three times | `cue:place0`, `cue:place1`, `cue:clear` |
| conflict replaces place | row 1 `0 0 . .`, rest empty | click (1,3) once (becomes 0: three 0s) | `cue:conflict` |
| red already there | row 1 `0 0 . .`, rest empty | click (1,3) once, then (1,4) once | `cue:conflict`, then `cue:place0` (after the first click the count rule already marks all of row 1, so the second click adds no new red cell) |
| no new red | row 1 `0 0 0 .` (broken givens), rest empty | click (2,1) once | `cue:place0` ((2,1) does not turn red: column 1 holds 0,0 only) |
| hint fills | row 1 `0 0 . .`, rest empty | press «Підказка» | `cue:hint` (the pair rule fills (1,3) with 1) |
| hint none | all empty | press «Підказка» | no call |
| hint broken | row 1 `0 0 0 .`, rest empty | press «Підказка» | no call |
| win wins | solution `0 0 1 1 / 1 1 0 0 / 0 1 1 0 / 1 0 0 1` with (4,4) empty | click (4,4) twice | `cue:conflict` (row 4 becomes `1 0 0 0`), then `cue:win` |
| given cell | row 1 `0 . . .` | click (1,1) | no call |
| silent controls | any board with an entry | «Скинути» → «Так, почати»; «Нова головоломка» → «Так, почати»; «Поле 4×4» → «Так, почати»; «Правила» | no call |
| toggle | any | click «Звук», click (1,1)… , click «Звук» | `muted:true`, then nothing for the board click, then `muted:false`, `cue:soundOn` |
| unavailable | any | mount with `fakeAudio(false)` or no `audio` option | no `[data-action="sound"]` element; board clicks make no call and throw nothing |

The highlight sets behind these rows were computed with `main`'s engine (`findViolations`, `hint`, `isSolved` at `d4b83d3`, run with `tsx` on a copy in the session scratchpad), marking whole lines for the count rule as `refreshHighlights` does: row 1 `0 0 0 .` marks all of row 1; (4,4)=0 on the win board marks row 4 and column 4; the pair hint on row 1 `0 0 . .` fills (1,3) with 1. They were not run as page tests. The rule, not the table, is the contract.

**Port-level tests (the real `createWebAudioPort` in jsdom):** pass `{ AudioContext: Spy }` where `Spy` is a `vi.fn()` class; assert the spy is not constructed by `createWebAudioPort` or by mounting, is constructed once on the first `playCue`, and that `playCue` does not throw when `Spy` throws. Pass `{ AudioContext: undefined }` and assert `available === false`. Sound output itself is not unit-tested (jsdom has no audio).

## 4. Mute toggle

- **Element:** `<button type="button" data-action="sound" aria-pressed="true">Звук</button>`, a native toggle button (WAI-ARIA APG button pattern). No `aria-label`: the visible text «Звук» is the accessible name in both states (frontend conventions rule 10: a visible label beats an `aria-label`), and the state is `aria-pressed`. Screen readers say the name plus "pressed / not pressed" in their own language.
- **Labels per state:** sound on: text «Звук», `aria-pressed="true"`. Sound off: text «Звук», `aria-pressed="false"`. No `aria-label` in either state. The label does not change, so it never says the opposite of the state.
- **Visible state without colour alone:** on: filled background and a 2 px border; off: the word is struck through (`text-decoration: line-through`) with a dashed border. Same `:focus-visible` ring and 2.75rem minimum height as «Правила». (The prototype shows this styling.) A speaker icon would be clearer, but TC-14 allows only the logo as a graphic, so an icon needs a TC-14 amendment; text-only is proposed.
- **Placement:** in the header, right after «Правила» (header: title, «Правила», «Звук»). It is reachable before the board in Tab order and does not touch FR-59's cell order (cells after the size control, before «Підказка»). Not on the board and not among the game buttons, because it is a page setting, not a move.
- **Default at load:** **on** (`aria-pressed="true"`). Reasons: nothing plays until the player's first tap anyway (autoplay rule), the first sound is the softest kind (a 106 ms tap at −12 dBFS), and the toggle is visible in the header from the start. Each reload starts on again, because TC-12 forbids storing the choice. The cost: a player who wants silence turns it off on every visit (question 1).
- **No audio support:** when `audio.available` is false, the toggle is **not rendered**, and every cue call is a no-op. The game is the same as today. In jsdom with no `audio` option this is the default, so the existing play-page tests and FR-68 checks see today's DOM.
- **Keyboard:** native button, Enter and Space; no key handling added.

## 5. Draft requirements (placeholder IDs)

**DRAFT for the requirements-analyst and the user to sign. Placeholder IDs only; real FR and NFR numbers are assigned after the parallel requirements session finishes (BC-7: never renumber).** Format as `docs/requirements.md`.

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| FR-SND-1 | MVP | Sound | The play page takes an optional audio port `PlayPageOptions.audio` with `available: boolean`, `playCue(name)` and `setMuted(muted)`, where `name` is one of `place0`, `place1`, `clear`, `conflict`, `hint`, `win`, `soundOn`. Without the option the page uses a Web Audio port that is unavailable (`available === false`, no sound) when the browser has no `AudioContext`. Mounting makes no port call. | verify: local-verifiable (jsdom page test with a fake port; mount without the option throws nothing) |
| FR-SND-2 | MVP | Sound | With sound on, a change of a non-given cell by click, Enter or Space requests exactly one cue: `place0` when the cell becomes «0», `place1` when it becomes «1», `clear` when it becomes empty, unless FR-SND-4 or FR-SND-5 applies. A click on a given cell requests no cue. | verify: local-verifiable (jsdom, fake port) |
| FR-SND-3 | MVP | Sound | With sound on, pressing «Підказка» when the hint fills a cell requests exactly one cue, `hint`, unless FR-SND-4 or FR-SND-5 applies; when the hint fills no cell (the no-rule sentence of FR-25 or the broken-rule sentence of FR-26) it requests no cue. | verify: local-verifiable (jsdom, fake port) |
| FR-SND-4 | MVP | Sound | When a cell change or a hint fill gives at least one cell `aria-invalid="true"` that did not have it before, the action requests `conflict` instead of its own cue (unless FR-SND-5 applies). An action that adds no newly highlighted cell never requests `conflict`. | verify: local-verifiable (jsdom, fake port) |
| FR-SND-5 | MVP | Sound | When a cell change or a hint fill turns a board that was not solved into a solved one, the action requests exactly one cue, `win`, and no other. | verify: local-verifiable (jsdom, fake port) |
| FR-SND-6 | MVP | Sound | These request no cue: page load, «Нова головоломка», a size change, the size already shown (FR-73), «Скинути», opening the confirmation dialog, «Так, почати», «Скасувати», opening or closing «Правила», focus moves, and a highlight disappearing. | verify: local-verifiable (jsdom, fake port) |
| FR-SND-7 | MVP | Sound | When the port is available, the page header holds, after the «Правила» button, a `<button type="button" data-action="sound">` with the text «Звук», no `aria-label`, and `aria-pressed="true"` at every mount. When the port is unavailable, the page has no `[data-action="sound"]` element. | verify: local-verifiable (jsdom, fake port with `available` true and false) |
| FR-SND-8 | MVP | Sound | Pressing «Звук» (click, Enter or Space) flips `aria-pressed`. Turning it off calls `setMuted(true)` and requests no cue; turning it on calls `setMuted(false)` and then requests `soundOn`. While `aria-pressed="false"`, no action requests a cue. | verify: local-verifiable (jsdom, fake port, ordered call list) |
| FR-SND-9 | MVP | Sound | The sound choice is not stored: the page writes nothing to `localStorage`, `sessionStorage` or cookies for it, and a new mount starts with `aria-pressed="true"` whatever the previous mount had. | verify: local-verifiable (jsdom: storage spies, two mounts) |
| NFR-SND-1 | MVP | Sound | Every cue is synthesized at run time from oscillator, gain and filter nodes: no audio file, no network request, no new dependency. The recipe table is exported data; for every cue its declared length (the maximum, over every partial of every note, of note start + attack + hold + that partial's decay + 5 ms release) is at most 120 ms for `place0`, `place1`, `clear`, `soundOn`, at most 300 ms for `conflict` and `hint`, and at most 1500 ms for `win`; every attack is at least 5 ms; every note's peak bound (peak × sum of its partial gains) is at most 0.5; the master gain is one constant, at most 0.7. | verify: local-verifiable (Vitest over the exported recipe table; it checks the data, not the sound) |
| NFR-SND-2 | MVP | Sound | No `AudioContext` is constructed at module load, at mount or by creating the port; the first one is constructed inside the first `playCue` or `setMuted(false)` call (which the page makes only from click handlers). `playCue` and `setMuted` never throw, including when the `AudioContext` constructor throws. | verify: local-verifiable (jsdom: `createWebAudioPort({ AudioContext: spy })`) |
| NFR-SND-3 | MVP | Sound | The same cue name always plays the same recipe: the audio module uses no `Math.random`, and `src/engine/` imports nothing from the audio module (TC-7). | verify: local-verifiable (Vitest reading the source files) |
| NFR-SND-4 | MVP | Sound | With the default port in jsdom (no `AudioContext`) every existing play-page test passes unchanged, so the game is fully playable with no sound. | verify: local-verifiable (the existing suite, run with no `audio` option) |
| NFR-SND-5 | MVP | Sound | The cues are calm and warm, not arcade-like or scolding, and 0 and 1 are told apart by ear: the user listens to `design/audio/prototype.html` on headphones and on a phone speaker and signs off in chat. | verify: human sign-off. **No automated mechanism exists** (an eval-judge cannot hear), so under the declared-method lesson this row needs the user's explicit waiver of an automated check, recorded with the sign-off. |

**Amendments to signed rows that the toggle needs** (draft wording for the analyst):

- **FR-57:** "The page header holds a button `[data-action="rules"]` …" stays; add "and, when sound is available, the sound toggle of FR-SND-7 after it".
- **FR-68:** the header in the document order becomes "a header (the title, the «Правила» button and, when sound is available, the «Звук» button)".
- **FR-65:** add «Звук» to the list of page buttons that show a `:focus-visible` indicator.
- **NFR-5:** add «Звук» to the enumerated page texts.
- **NFR-9:** add FR-SND-7 and FR-SND-8 to the rows it covers (4.1.2 name, role and value: `aria-pressed`; 1.4.1: the struck-through off state).
- **TC-14:** add "audio files" to the out-of-scope assets and "page sounds are synthesized at run time with the Web Audio API" to make the zero-asset rule explicit.
- **TC-12:** add "the sound on/off choice is not stored" (already implied by "no persistence", stated so nobody adds it).
- **TC-13 / A-14:** sound output is not tested (jsdom has no audio); only the port calls and the recipe data are.
- **New assumption A-SND-1:** sound is on at each page load, because nothing plays before the first gesture and the toggle is visible.

## 6. Files written

- `design/audio/sound-design.md` (this file)
- `design/audio/synth.ts`
- `design/audio/prototype.html`
- `design/audio/prototype.ts`
- `design/audio/measurements-2026-10-09.json`

**To listen** (no config change; Vite serves any HTML file under its root). Run it from the root of the checkout that contains `design/audio/`, on a free port:

```bash
npx vite --port 5175 --strictPort
# open http://localhost:5175/design/audio/prototype.html
```

A Vite server started from another checkout that has no `design/audio/` answers the same URL with the game page instead (no sound at all), so check that the page title is «Бінарка sound prototype». Click anything first: the browser allows sound only after a gesture.

Checks run on the files: `npx tsc --ignoreConfig --noEmit --strict --noUncheckedIndexedAccess --noUnusedLocals --noUnusedParameters --target ES2022 --module ESNext --moduleResolution bundler --lib ES2022,DOM,DOM.Iterable --skipLibCheck design/audio/synth.ts design/audio/prototype.ts` exits 0; `npx eslint design/audio/` exits 0 (on `main`, `design/` is ignored by ESLint anyway).

## 7. What was not verified

- **Nobody has listened.** The agent cannot hear; the user's listening is the acceptance test (NFR-SND-5). The measurements prove lengths, peaks, clean onsets and the cut, not warmth.
- Only the Chromium of the Claude desktop built-in browser ran the prototype (page loaded with no console error; offline renders; a live `AudioContext` scheduled and cut a voice without an exception). Safari, Firefox, iOS and Android were not tried.
- Whether a phone's ring/silent switch mutes Web Audio was not checked; do not assume either way.
- How the cues sound on a small phone speaker (which drops most energy below about 300 Hz, so `conflict` and `clear` may be very faint there) was not checked.
- Overlap with real screen-reader speech (VoiceOver, TalkBack, NVDA) was not tested.
- The header fit with a third item («Звук») at 320 and 375 px was not checked.
- The worked test boards in §3 were checked against `main`'s engine functions, but not executed as page tests through `mountPlayPage`.
- The prototype's board uses this worktree's engine (`src/engine/`), which is older than `main`'s; the cue rule does not depend on the difference.

## 8. Questions for the user

1. Sound **on** by default at every load (proposed), or **off** until the player turns it on?
2. Should fixing the last rule break play the soft `resolve` cue (dashed button in the prototype), or stay silent (proposed)?
3. Is a text-only «Звук» toggle with a struck-through off state enough, or do you want a speaker icon (needs a TC-14 amendment for one more inline SVG)?
4. Should the sound requirements be MVP (as drafted) or Future?
5. After listening: is `conflict` gentle enough, and are `place0` and `place1` easy to tell apart on your phone speaker?
