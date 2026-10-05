# v0 follow-up 2

Paste everything below the line into the same v0 chat.

---

Thanks, iteration 2 builds and looks right at 375 px. Three changes, everything else unchanged (tokens, colours, board, cells, size picker, buttons, messages, confirm dialog, static export, system fonts, no external requests).

## 1. Rules move into a popover shown as a bottom sheet

Remove the `<details class="rules">` at the bottom of the page. Instead:

- Add a **«Правила» button** in the header, next to the title, always visible without scrolling. Use the native HTML Popover API, **no JavaScript** for opening or closing:

```html
<header class="page-header">
  <h1><!-- logo -->Бінарка</h1>
  <button type="button" class="rules-button" data-action="rules" popovertarget="rules">Правила</button>
</header>
```

- The rules live in a popover element (it can stay at the end of `#app` in the DOM):

```html
<div id="rules" popover class="rules" data-section="rules" aria-labelledby="rules-title">
  <h2 id="rules-title">Правила</h2>
  <ul>
    <li>
      <span class="rule-text">Не більше двох однакових цифр поспіль у рядку чи стовпці.</span>
      <span class="rule-example" aria-hidden="true"><span class="mini">0</span><span class="mini">0</span><span class="mini mini-answer">1</span></span>
    </li>
    <li>
      <span class="rule-text">У кожному рядку та стовпці порівну нулів і одиниць.</span>
      <span class="rule-example" aria-hidden="true"><span class="mini">0</span><span class="mini">1</span><span class="mini">0</span><span class="mini mini-answer">1</span></span>
    </li>
    <li>
      <span class="rule-text">Усі рядки різні, і всі стовпці різні.</span>
      <span class="rule-example" aria-hidden="true"><span class="mini">0</span><span class="mini">1</span><span class="mini">1</span><span class="mini">0</span><span class="mini-sep">≠</span><span class="mini">1</span><span class="mini">0</span><span class="mini">0</span><span class="mini">1</span></span>
    </li>
  </ul>
  <button type="button" class="rules-close" popovertarget="rules" popovertargetaction="hide">Зрозуміло</button>
</div>
```

- **Phones (below 48rem):** style the popover as a **bottom sheet**: anchored to the bottom edge, full width, at most about 60% of the viewport height, rounded top corners, scrolls inside if needed. The board must stay visible above it.
- **Wider screens:** a centred panel, about 26rem wide.
- **Backdrop** via `[popover]::backdrop`, lighter than the confirm dialog's (this is help, not a warning). Esc and a tap outside close it (native `popover="auto"` behaviour); «Зрозуміло» closes it too.
- **Mini examples:** small cells that look like the board's cells (same tokens, smaller). `.mini-answer` is the cell the rule decides, marked the same way as `.cell-hinted` (dashed border plus italic), not by colour alone.
- **Route `/rules/`** shows the page with the popover open (opened on load, the way `/confirm/` opens its dialog).
- `.rules-button`: a quiet secondary style with a visible `:focus-visible`, at least 44 px tall, and it must not wrap the title on a 320 px screen.

## 2. A quiet placeholder line in the message area

When neither `[data-message="hint"]` nor `[data-message="win"]` has text, the message area shows a quiet line instead of an empty band. Add it as a third element **before** the two messages:

```html
<div class="messages" aria-live="polite">
  <p class="message message-idle" data-message="idle">Натискайте клітинки, щоб ставити 0 і 1. Правила — кнопка «Правила» вгорі.</p>
  <p class="message" data-message="hint"></p>
  <p class="message message-win" data-message="win"></p>
</div>
```

- Hide `.message-idle` **with CSS only** whenever another message has text, e.g. `.messages:has([data-message="hint"]:not(:empty), [data-message="win"]:not(:empty)) .message-idle { display: none; }`.
- Its style is calm and muted: no background box, `--ink-muted` text, centred, at most two lines at 375 px.
- Visible on `/` and `/confirm/`; hidden on `/hint/` and `/win/`.

## 3. Rework the logo's inner mark

The word inside the sun is not readable at phone size. **Remove the word «БІНАРКА» from the logo**: the title next to it already says it. Keep the sun and the ring of alternating "0" rings and "1" bars. Inside the circle, draw a **2×2 mini board** instead: four small rounded squares with the digits `1 0 / 0 1`, drawn as shapes (no `<text>`), in `--primary-ink` on the `--primary` circle.

- It must stay legible at 40 px and look good at 56–64 px.
- Keep `aria-hidden="true"` and `focusable="false"` on the SVG, and keep it free of any font dependency.
- If the 2×2 board is too busy at 40 px, use the single bold digits "01" as shapes instead, and tell me which you chose and why.

## Please send back

- The new zip, and the build/serve commands if they changed.
- A note on browser support for the Popover API and `:has()` (current Chrome, Safari, Firefox; anything older is fine to ignore).
