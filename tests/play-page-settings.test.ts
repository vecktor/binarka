// Play page: the settings button, the settings panel and the theme control (add-theme-switch). One test per scenario of the delta spec
// openspec/changes/add-theme-switch/specs/play-page/spec.md, title = scenario name, from the requirements «Settings button and panel»,
// «Theme control», «Texts of the settings button, the settings panel and the theme control» and «Common rules for the theme and
// language options». Written FIRST (red): the page has no settings button, no settings panel and no theme control yet.
//
// jsdom has no popover behaviour and no layout (TC-13): the panel is opened through the stubbed showPopover() (A-44); where the panel is
// drawn and the 44 px sizes are layout (NFR-12, held NFR-14). The hooks [data-action="settings"], [data-section="settings"] and
// [data-action="settings-close"] are spec-made proxies confirmed against the signed review set (tasks 1.4). Exact texts are literals;
// this file never imports src/ui/strings.ts. Orchestrator decisions (autonomy-log row 124): F1 the button is named by aria-label with a
// decorative svg child; F2 the visible label «Тема» is plain text and not aria-hidden; A2 order of the ids is not pinned.
//
// @trace FR-68
// @trace FR-102
// @trace FR-117
// @trace NFR-9
// @trace NFR-5
// @trace FR-94
// @trace FR-59
// @trace FR-60
// @trace FR-62
import { describe, expect, it } from 'vitest';
import {
  BLANK_4,
  PAIR_ROW,
  SETTINGS_LABEL,
  THEME_CHOICES,
  THEME_KEY,
  THEME_LABEL,
  THEME_OPTION_LABELS,
  TITLE_TEXT,
  WIN_PUZZLE,
  boardSize,
  bySize,
  checkedTheme,
  chooseLevel,
  expectInDocumentOrder,
  fillFrom,
  fullState,
  hintMessage,
  installPageLifecycle,
  messageArea,
  mountFixture,
  mountOn,
  mountPage,
  openSettings,
  popoverLog,
  pressHint,
  pressKey,
  pressTheme,
  q,
  resetBoard,
  selectSize,
  settingsButton,
  settingsCloseButton,
  settingsPanel,
  solutionGrid,
  startNewPuzzle,
  themeControl,
  themeOption,
  themeOptions,
  winMessage,
} from './helpers/play-page';

installPageLifecycle();

const HEADINGS = 'h1, h2, h3, h4, h5, h6';
const CYRILLIC = /\p{Script=Cyrillic}/u;
const LATIN = /[A-Za-z]/;

const attributeNames = (el: Element): string[] => Array.from(el.attributes, (a) => a.name);
const idsUnder = (root: ParentNode): string[] => Array.from(root.querySelectorAll('[id]'), (e) => e.id).sort();

describe('Settings button and panel', () => {
  it('Settings button and panel at mount', () => {
    const root = mountFixture(PAIR_ROW);
    const button = settingsButton(root);
    const panel = settingsPanel(root);

    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('aria-label')).toBe(SETTINGS_LABEL);
    expect(panel.id, 'the panel has a non-empty id').not.toBe('');
    expect(button.getAttribute('popovertarget'), 'the button names the panel by its id').toBe(panel.id);
    for (const name of ['aria-haspopup', 'aria-expanded', 'tabindex']) {
      expect(button.hasAttribute(name), `the settings button carries no ${name}`).toBe(false);
    }
    expect(button.childNodes, 'the button holds exactly one child node: the svg, no text node').toHaveLength(1);
    const gear = button.children[0];
    expect(gear?.tagName.toLowerCase(), 'its only child is an svg').toBe('svg');
    expect(gear?.getAttribute('aria-hidden')).toBe('true');

    expect(panel.hasAttribute('popover'), 'the panel has the popover attribute').toBe(true);
    expect(panel.getAttribute('popover')).toBe('auto');
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-label')).toBe(SETTINGS_LABEL);
    expect(panel.hasAttribute('aria-labelledby')).toBe(false);
    expect(panel.closest('header'), 'the panel is not inside the header').toBeNull();
    expect(panel.closest('[data-board]'), 'the panel is not inside the board').toBeNull();
    expect(messageArea(root).contains(panel), 'the panel is not inside the message area').toBe(false);
    expectInDocumentOrder([messageArea(root), panel, q(root, '[data-dialog="confirm"]')]);

    const children = Array.from(panel.children);
    expect(children, 'the panel holds, in order: a label, the theme control, the close button').toHaveLength(3);
    expect(children[0]?.textContent).toBe(THEME_LABEL);
    expect(children[0]?.tagName.toLowerCase(), 'the label is a plain-text element, not a label element').not.toBe('label');
    expect(children[1]).toBe(themeControl(root));
    expect(children[2]).toBe(settingsCloseButton(root));
  });

  it('The close button', () => {
    const root = mountFixture(PAIR_ROW);
    const close = settingsCloseButton(root);
    expect(close.tagName).toBe('BUTTON');
    expect(close.getAttribute('type')).toBe('button');
    expect(close.textContent).toBe('Закрити');
    expect(close.getAttribute('popovertarget')).toBe(settingsPanel(root).id);
    expect(close.getAttribute('popovertargetaction')).toBe('hide');
    expect(close.hasAttribute('tabindex')).toBe(false);
  });

  it('The panel opens and closes with no script', () => {
    const root = mountFixture(PAIR_ROW);
    pressHint(root); // some state worth keeping: a hint sentence, a hinted cell
    const aria = (): (string | null)[] => Array.from(root.querySelectorAll('[aria-checked]'), (e) => e.getAttribute('aria-checked'));
    const before = { state: fullState(root), aria: aria(), hint: hintMessage(root), win: winMessage(root) };
    const calls = popoverLog.length;

    settingsButton(root).click();
    settingsCloseButton(root).click();

    expect(popoverLog.length, 'no showPopover, hidePopover or togglePopover call: the browser opens and closes it').toBe(calls);
    expect(fullState(root)).toEqual(before.state);
    expect(aria()).toEqual(before.aria);
    expect(hintMessage(root)).toBe(before.hint);
    expect(winMessage(root)).toBe(before.win);
  });

  it('The header order is the title, the settings button, «Правила»', () => {
    const root = mountFixture(PAIR_ROW);
    const header = q(root, 'header');
    const heading = Array.from(header.querySelectorAll(HEADINGS)).find((h) => h.textContent === TITLE_TEXT);
    expect.assert(heading !== undefined, 'the header holds the heading «Бінарка»');
    const gear = settingsButton(root);
    const rules = q(root, '[data-action="rules"]');
    expectInDocumentOrder([heading, gear, rules]);
    expect(header.contains(gear)).toBe(true);
    expect(header.contains(rules)).toBe(true);
  });

  it('Two mounts stay independent', () => {
    const rootA = mountOn(document.createElement('div'));
    const rootB = mountOn(document.createElement('div'));
    const panelA = settingsPanel(rootA);
    const panelB = settingsPanel(rootB);
    expect(panelA.id).not.toBe('');
    expect(panelB.id).not.toBe('');
    expect(panelA.id, 'the two panels have different ids').not.toBe(panelB.id);
    expect(settingsButton(rootA).getAttribute('popovertarget')).toBe(panelA.id);
    expect(settingsCloseButton(rootA).getAttribute('popovertarget')).toBe(panelA.id);
    expect(settingsButton(rootB).getAttribute('popovertarget')).toBe(panelB.id);
    expect(settingsCloseButton(rootB).getAttribute('popovertarget')).toBe(panelB.id);
  });

  describe('The panel survives every action', () => {
    // each action from a freshly mounted page, confirmed where asked
    const ACTIONS: [string, (root: HTMLElement) => void, () => HTMLElement][] = [
      ['a hint', (root) => { pressHint(root); }, () => mountFixture(PAIR_ROW)],
      [
        'a win',
        (root) => { fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE)); expect(winMessage(root), 'premise: the puzzle is won').not.toBe(''); },
        () => mountFixture(WIN_PUZZLE),
      ],
      ['«Скинути»', (root) => { resetBoard(root); }, () => mountFixture(PAIR_ROW)],
      ['«Нова головоломка»', (root) => { startNewPuzzle(root); }, () => mountFixture(PAIR_ROW)],
      [
        'a size and a level',
        (root) => { selectSize(root, 4); chooseLevel(root, 1); expect(boardSize(root), 'premise: the 4x4 board is shown').toBe(4); },
        () => mountPage({ seedSource: () => 1, generate: (size, seed, level) => bySize({ 6: PAIR_ROW, 4: BLANK_4 })(0, size, seed, level) }),
      ],
      ['a theme press', (root) => { pressTheme(root, 'dark'); }, () => mountFixture(PAIR_ROW)],
    ];

    for (const [name, act, build] of ACTIONS) {
      it(`after ${name} there is one settings panel, the same element, with the same three children`, () => {
        const root = build();
        const panel = settingsPanel(root);
        const children = Array.from(panel.children);
        expect(children).toHaveLength(3);
        act(root);
        const after = settingsPanel(root);
        expect(after, 'the same element as at mount').toBe(panel);
        expect(Array.from(after.children), 'the same three children').toEqual(children);
      });
    }
  });
});

describe('Theme control', () => {
  it('Theme control structure and default', () => {
    // localStorage is empty (the lifecycle clears it) and the stubs install no matchMedia
    const root = mountFixture(PAIR_ROW);
    const controls = root.querySelectorAll('[data-control="theme"]');
    expect(controls, 'exactly one theme control in the root').toHaveLength(1);
    const control = themeControl(root);
    expect(settingsPanel(root).contains(control), 'it is inside the settings panel').toBe(true);
    expect(control.getAttribute('role')).toBe('radiogroup');
    expect(control.getAttribute('aria-label')).toBe(THEME_LABEL);
    expect(control.hasAttribute('aria-labelledby')).toBe(false);
    expect(control.hasAttribute('id')).toBe(false);

    const buttons = Array.from(control.querySelectorAll('button'));
    expect(buttons, 'exactly three buttons').toHaveLength(3);
    buttons.forEach((button, i) => {
      expect(button.getAttribute('type')).toBe('button');
      expect(button.getAttribute('role')).toBe('radio');
      expect(button.textContent).toBe(THEME_OPTION_LABELS[i]);
      expect(button.getAttribute('data-theme-option')).toBe(THEME_CHOICES[i]);
      for (const name of ['aria-label', 'aria-labelledby', 'tabindex', 'disabled']) {
        expect(button.hasAttribute(name), `option ${i + 1} carries no ${name}`).toBe(false);
      }
    });
    expect(buttons.map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true']);
  });

  it('The control follows its visible label in the settings panel', () => {
    const root = mountFixture(PAIR_ROW);
    const control = themeControl(root);
    const label = control.previousElementSibling;
    expect(label, 'an element immediately precedes the theme control').not.toBeNull();
    expect(label?.parentElement).toBe(settingsPanel(root));
    expect(label?.textContent).toBe(THEME_LABEL);
    expect(label?.tagName.toLowerCase(), 'it is not a label element').not.toBe('label');
    expect(label?.closest('[aria-hidden="true"]'), 'decision F2: the visible label is not aria-hidden').toBeNull();
    expect(control.closest('[data-board]')).toBeNull();
    expect(messageArea(root).contains(control)).toBe(false);
    expect(control.closest('header')).toBeNull();
  });

  it('The stored choice is checked at mount', () => {
    localStorage.setItem(THEME_KEY, 'dark');
    const root = mountFixture(PAIR_ROW);
    expect(checkedTheme(root)).toBe('dark');
    expect(themeOptions(root).map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    expect(localStorage.getItem(THEME_KEY), 'localStorage still holds exactly the same value').toBe('dark');
    expect(localStorage.length).toBe(1);
  });

  it('The group is named by its aria-label and no label element exists', () => {
    const root = mountFixture(PAIR_ROW);
    expect(root.querySelectorAll('label'), 'the root contains no label element').toHaveLength(0);
    expect(root.querySelectorAll('[for]'), 'and no for attribute').toHaveLength(0);
    expect(themeControl(root).getAttribute('aria-label')).toBe(THEME_LABEL);
  });
});

describe('Texts of the settings button, the settings panel and the theme control', () => {
  it('The theme texts are Ukrainian', () => {
    const root = mountFixture(PAIR_ROW);
    // everything the gear and the panel show or expose: every non-blank text node (aria-hidden ones too, so a hidden «Тема»
    // cannot slip through) and the aria-label, title, alt and label attributes of every element inside them
    const collected: string[] = [];
    for (const host of [settingsButton(root), settingsPanel(root)]) {
      for (const el of [host, ...Array.from(host.querySelectorAll('*'))]) {
        for (const name of ['aria-label', 'title', 'alt', 'label']) {
          const value = el.getAttribute(name);
          if (value !== null) collected.push(value);
        }
      }
      const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) {
        if ((n as Text).data.trim() !== '') collected.push((n as Text).data);
      }
    }
    for (const text of [SETTINGS_LABEL, THEME_LABEL, ...THEME_OPTION_LABELS, 'Закрити']) {
      expect(collected, `the collection contains «${text}»`).toContain(text);
    }
    for (const text of collected) {
      expect(CYRILLIC.test(text), `"${text}" has Cyrillic letters`).toBe(true);
      expect(LATIN.test(text), `"${text}" has no Latin letters`).toBe(false);
    }
  });
});

describe('Common rules for the theme and language options', () => {
  it('The options are native buttons in the tab order', () => {
    const root = mountFixture(PAIR_ROW);
    openSettings(root);
    const options = themeOptions(root);
    expect(options).toHaveLength(3);
    for (const option of options) {
      expect(option.tagName).toBe('BUTTON');
      expect(option.getAttribute('type')).toBe('button');
      expect(option.getAttribute('role')).toBe('radio');
      for (const name of ['tabindex', 'aria-label', 'disabled']) expect(option.hasAttribute(name), `no ${name}`).toBe(false);
      for (const key of ['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'Tab', 'Escape']) {
        for (const event of [pressKey(option, key), pressKey(option, key, { shiftKey: true })]) {
          expect(event.defaultPrevented, `a key event "${key}" on an option is not default-prevented`).toBe(false);
        }
      }
    }
    expect(themeOption(root, 'dark').getAttribute('aria-checked'), 'a key event changes nothing').toBe('false');
  });

  it('No id is added', () => {
    const root = mountFixture(PAIR_ROW);
    const control = themeControl(root);
    expect(control.hasAttribute('id')).toBe(false);
    for (const option of themeOptions(root)) expect(attributeNames(option)).not.toContain('id');
    const panel = settingsPanel(root);
    const ids = idsUnder(root);
    expect(ids, 'the settings panel has the fifth id of the mount').toContain(panel.id);
    expect(ids, 'five ids per mount in all').toHaveLength(5);
    expect(Array.from(panel.querySelectorAll('[id]')), 'nothing inside the settings panel has an id').toHaveLength(0);
  });
});
