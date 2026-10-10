// The English page texts of the requirement «English page text» (openspec/changes/add-english-version/specs/play-page/spec.md), written out as
// literals: the appendix wording of the signed amendment as refined by the audit (autonomy-log rows 119 and 121). Tests never import
// src/ui/strings.ts (an exact-text assertion against the module's own constants would be a tautology); this file is the test side of the table.
// Curly quotes are U+201C and U+201D and the two spaces inside "0 and 1" are U+00A0, written as escapes, never as literal characters.

import { expect } from 'vitest';
import { allCells, dialogOf, levelButtons, levelControl, languageControl, languageOptions, q, rulesPanel, settingsPanel, sheetOf, sizeButtons, summaryButton, textWithoutHidden, themeControl, themeOptions } from './play-page';

export const EN_TITLE = 'Binarka';
export const EN_HINT_LABEL = 'Hint';
export const EN_RESET_LABEL = 'Reset';
export const EN_NEW_LABEL = 'New puzzle';
export const EN_RULES_LABEL = 'Rules';
export const EN_RULES_CLOSE_LABEL = 'Got it';
export const EN_SIZE_GROUP_LABEL = 'Grid size';
export const EN_CONFIRM_TEXT = 'Start over? Your moves on this board will be lost.';
export const EN_CONFIRM_YES = 'Yes, start over';
export const EN_CONFIRM_NO = 'Cancel';
export const EN_RULES_ITEMS = [
  'No more than two equal digits side by side in a row or column.',
  'Every row and every column has as many zeros as ones.',
  'All rows are different, and all columns are different.',
];
export const EN_IDLE_TEXT = 'Press the cells to place 0\u00A0and\u00A01. For the rules, use the \u201CRules\u201D button at the top.';
export const EN_WIN_MESSAGE = 'Congratulations, puzzle solved!';
export const EN_SHEET_LABEL = 'Grid and difficulty';
export const EN_SUMMARY_PREFIX = 'Grid and difficulty: ';
export const EN_CLOSE_LABEL = 'Close';
export const EN_START_LABEL = 'Start';
export const EN_LEVEL_GROUP_LABEL = 'Difficulty';
export const EN_LEVEL_NAMES = ['Warm-up', 'Teaser', 'Puzzler', 'Brain-twister'];
export const EN_LEVEL_DESCRIPTIONS = [
  'Three simple rules are enough: pairs, gaps between equal digits and counting.',
  'Also count where the remaining zeros or ones can still fit in a line.',
  'Also compare rows and columns: no two of them can be the same.',
  'Also try a move ahead: if a rule breaks, the other digit goes here.',
];
export const EN_REASON_4X4 = 'The 4×4 grid has only the \u201CWarm-up\u201D level.';
export const EN_TECHNIQUES_HEADING = 'Harder techniques';
export const EN_TECHNIQUES_ITEMS = [
  'Line balance: if a line has room for only one more 0 or only one more 1, and putting it in a cell would make three equal digits side by side, that cell holds the other digit.',
  'Matching lines: if a line matches a complete line everywhere except two cells, those two cells are the opposite of it.',
  'Look ahead: imagine a digit in a cell; if a rule breaks within a few steps, the cell holds the other digit.',
];
export const EN_SETTINGS_LABEL = 'Settings';
export const EN_THEME_LABEL = 'Theme';
export const EN_THEME_OPTION_LABELS = ['Light', 'Dark', 'System'];
export const EN_LANGUAGE_LABEL = 'Language';

export const enSizeLabel = (n: number): string => `Grid ${n}×${n}`;
export const enSummaryLabel = (n: number, level: number): string => `${n}×${n} · ${EN_LEVEL_NAMES[level - 1] ?? '?'}`;
/** The English cell name: "Row R, column C, V" plus ", given" or ", hinted" (V is "empty", 0 or 1). */
export const enCellLabel = (row: number, col: number, value: string, suffix: '' | 'given' | 'hinted' = ''): string =>
  `Row ${row}, column ${col}, ${value === '' ? 'empty' : value}${suffix === '' ? '' : `, ${suffix}`}`;

// ---------------------------------------------------------------------------------------------------------
// The English page, read from the DOM (the table of «English page text»)
// ---------------------------------------------------------------------------------------------------------

/**
 * Asserts that every text and accessible name of the page in `root` is the English column of the table, in place: the header, the buttons,
 * the rules panel and the techniques, the idle line, the size and level controls of the sheet, the summary, the confirmation dialog, the
 * settings panel and both option groups, the board's name and every cell's name. `size` and `level` are those of the board shown. The
 * hint and win regions are not read (a test that shows one reads it itself).
 */
export function expectEnglishPage(root: HTMLElement, size = 6, level = 1): void {
  expect(document.title, 'document.title').toBe(EN_TITLE);
  expect(q(root, 'h1').textContent, 'the heading in the header').toBe(EN_TITLE);
  expect(q(root, '[data-action="hint"]').textContent.trim(), 'the hint button').toBe(EN_HINT_LABEL);
  expect(q(root, '[data-action="reset"]').textContent.trim(), 'the reset button').toBe(EN_RESET_LABEL);
  expect(q(root, '[data-action="new"]').textContent.trim(), 'the new puzzle button').toBe(EN_NEW_LABEL);
  expect(q(root, '[data-action="rules"]').textContent.trim(), 'the rules button').toBe(EN_RULES_LABEL);
  expect(q(root, '[data-message="idle"]').textContent, 'the idle line').toBe(EN_IDLE_TEXT);

  const panel = rulesPanel(root);
  expect(q(panel, 'h2').textContent, 'the rules heading').toBe(EN_RULES_LABEL);
  expect(Array.from(panel.querySelectorAll(':scope > ul > li'), (li) => textWithoutHidden(li).trim()), 'the three rules').toEqual(EN_RULES_ITEMS);
  expect(q(panel, 'h3').textContent, 'the techniques heading').toBe(EN_TECHNIQUES_HEADING);
  expect(Array.from(q(panel, '[data-section="techniques"]').querySelectorAll('li'), (li) => li.textContent.trim()), 'the three techniques').toEqual(EN_TECHNIQUES_ITEMS);
  expect(q(panel, 'button').textContent.trim(), 'the rules close button').toBe(EN_RULES_CLOSE_LABEL);

  const sizeGroup = q(root, '[data-control="size"]');
  expect(sizeGroup.getAttribute('aria-label'), 'the size group name').toBe(EN_SIZE_GROUP_LABEL);
  expect(sizeButtons(root).map((b) => b.textContent), 'the size options').toEqual([4, 6, 8].map(enSizeLabel));

  const sheet = sheetOf(root);
  expect(sheet.getAttribute('aria-label'), 'the sheet label').toBe(EN_SHEET_LABEL);
  expect(q(sheet, '[data-action="setup-start"]').textContent, 'the start button').toBe(EN_START_LABEL);
  expect(q(sheet, '[data-action="setup-close"]').textContent, 'the sheet close button').toBe(EN_CLOSE_LABEL);
  expect(levelControl(root).getAttribute('aria-label'), 'the level group name').toBe(EN_LEVEL_GROUP_LABEL);
  expect(levelButtons(root).map((b) => [b.children[0]?.textContent, b.children[1]?.textContent]), 'the level names and descriptions').toEqual(
    EN_LEVEL_NAMES.map((name, i) => [name, EN_LEVEL_DESCRIPTIONS[i]]),
  );
  const reason = q(root, '[data-level-reason]');
  if (size === 4) expect(reason.textContent, 'the 4×4 reason').toBe(EN_REASON_4X4);
  else expect(reason.textContent, 'the reason is empty at 6×6 and 8×8').toBe('');

  const summary = summaryButton(root);
  expect(summary.children[0]?.textContent, 'the hidden prefix of the summary').toBe(EN_SUMMARY_PREFIX);
  expect(summary.children[1]?.textContent, 'the visible summary').toBe(enSummaryLabel(size, level));

  const dialog = dialogOf(root);
  expect(dialog.textContent, 'the confirmation text').toContain(EN_CONFIRM_TEXT);
  expect(q(dialog, '[data-confirm="yes"]').textContent, 'the yes button').toBe(EN_CONFIRM_YES);
  expect(q(dialog, '[data-confirm="no"]').textContent, 'the no button').toBe(EN_CONFIRM_NO);

  const settings = settingsPanel(root);
  expect(q(root, '[data-action="settings"]').getAttribute('aria-label'), 'the settings button name').toBe(EN_SETTINGS_LABEL);
  expect(settings.getAttribute('aria-label'), 'the settings panel name').toBe(EN_SETTINGS_LABEL);
  expect(themeControl(root).previousElementSibling?.textContent, 'the visible label above the theme group').toBe(EN_THEME_LABEL);
  expect(themeControl(root).getAttribute('aria-label'), 'the theme group name').toBe(EN_THEME_LABEL);
  expect(themeOptions(root).map((b) => b.textContent), 'the theme options').toEqual(EN_THEME_OPTION_LABELS);
  expect(languageControl(root).previousElementSibling?.textContent, 'the visible label above the language group').toBe(EN_LANGUAGE_LABEL);
  expect(languageControl(root).getAttribute('aria-label'), 'the language group name').toBe(EN_LANGUAGE_LABEL);
  expect(languageOptions(root).map((b) => b.textContent), 'each language option is named in its own language').toEqual(['Українська', 'English']);
  expect(q(settings, '[data-action="settings-close"]').textContent, 'the settings close button').toBe(EN_CLOSE_LABEL);

  expect(q(root, '[data-board]').getAttribute('aria-label'), 'the board name').toBe(enSizeLabel(size));
  const cells = allCells(root);
  expect(cells, 'premise: the board has its cells').toHaveLength(size * size);
  for (const cell of cells) {
    const given = cell.getAttribute('data-given') === 'true';
    const hinted = cell.classList.contains('cell-hinted');
    const expected = enCellLabel(Number(cell.getAttribute('data-row')), Number(cell.getAttribute('data-col')), cell.textContent, given ? 'given' : hinted ? 'hinted' : '');
    expect(cell.getAttribute('aria-label'), `the name of cell ${cell.getAttribute('data-row') ?? ''},${cell.getAttribute('data-col') ?? ''}`).toBe(expected);
  }
}
