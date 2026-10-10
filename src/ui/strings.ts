// Every page text lives here, Ukrainian and English (NFR-5, per mode). Other src/ui modules import these and keep no Cyrillic literal.
// The Ukrainian exports keep their names and shapes; `EN` is the English table of the same shape and `textsFor` picks one (FR-111).

import type { LanguageChoice, ThemeChoice } from './preferences';

export const TITLE = 'Бінарка';

export const BUTTONS = {
  hint: 'Підказка',
  reset: 'Скинути',
  newPuzzle: 'Нова головоломка',
  rules: 'Правила',
  rulesClose: 'Зрозуміло',
} as const;

export const sizeLabel = (n: number): string => `Поле ${n}×${n}`;

export const SIZE_GROUP = 'Розмір поля';

export const CONFIRM = {
  text: 'Почати заново? Ваші ходи на цьому полі буде втрачено.',
  yes: 'Так, почати',
  no: 'Скасувати',
} as const;

const CELL = { row: 'Рядок', col: 'стовпець', empty: 'порожньо', given: 'задано', hint: 'підказка' } as const;

/** Accessible name of a cell: «Рядок R, стовпець C, V» plus «, задано» or «, підказка» (row and col are 1-based). */
export function cellLabel(row: number, col: number, value: 0 | 1 | null, given: boolean, hinted: boolean): string {
  const v = value === null ? CELL.empty : String(value);
  const suffix = given ? `, ${CELL.given}` : hinted ? `, ${CELL.hint}` : '';
  return `${CELL.row} ${row}, ${CELL.col} ${col}, ${v}${suffix}`;
}

export const RULES = {
  heading: 'Правила',
  items: [
    'Не більше двох однакових цифр поспіль у рядку чи стовпці.',
    'У кожному рядку та стовпці порівну нулів і одиниць.',
    'Усі рядки різні, і всі стовпці різні.',
  ],
} as const;

// Two non-breaking spaces (U+00A0) keep "0 і 1" together.
export const IDLE = 'Натискайте клітинки, щоб ставити 0\u00A0і\u00A01. Правила — кнопка «Правила» вгорі.';

// FR-41: the win text uses the modifier letter apostrophe U+02BC, not ASCII U+0027.
export const WIN = "Вітаємо, головоломку розвʼязано!";

// Summary button and setup sheet (FR-95, FR-96): `N×N · Name` with ordinary spaces around U+00B7.
export const SETUP = {
  prefix: 'Поле і складність: ',
  separator: ' · ',
  sheetLabel: 'Поле і складність',
  close: 'Закрити',
  start: 'Почати',
  cue: '▾',
} as const;

export const LEVEL_GROUP = 'Складність';

export const LEVELS = [
  { name: 'Розминка', description: 'Вистачає трьох простих правил: пара, між двома однаковими і підрахунок цифр.' },
  { name: 'Задачка', description: 'Додатково треба рахувати, де в рядку помістяться решта нулів чи одиниць.' },
  { name: 'Головоломка', description: 'Додатково треба порівнювати рядки і стовпці: двох однакових не буває.' },
  { name: 'Мозколамка', description: 'Додатково треба пробувати хід наперед: якщо правило порушиться, тут інша цифра.' },
] as const;

export const LEVEL_REASON_4X4 = 'Для поля 4×4 є лише рівень «Розминка».';

export const TECHNIQUES = {
  heading: 'Складніші прийоми',
  items: [
    'Баланс рядка: якщо в рядку є місце лише для одного нуля або однієї одиниці, а в клітинці вона дала б три однакові цифри поспіль, там стоїть інша цифра.',
    'Однакові рядки: якщо рядок збігається з повним рядком усюди, крім двох клітинок, ці дві клітинки протилежні до нього.',
    'Хід наперед: уявно поставте цифру; якщо за кілька кроків порушиться правило, у клітинці стоїть інша.',
  ],
} as const;

/** Visible text of the summary button: «6×6 · Розминка». */
export const summaryText = (n: number, level: number): string => `${n}×${n}${SETUP.separator}${LEVELS[level - 1]?.name ?? ''}`;

// Settings button, settings panel and theme control (FR-68, FR-102).
export const SETTINGS = {
  label: 'Налаштування',
  themeLabel: 'Тема',
  languageLabel: 'Мова',
  close: 'Закрити',
} as const;

export const THEME_OPTIONS = [
  { value: 'light', name: 'Світла' },
  { value: 'dark', name: 'Темна' },
  { value: 'auto', name: 'Як у системі' },
] as const satisfies readonly { value: ThemeChoice; name: string }[];

/** The two language options, each named in its own language and carrying its own `lang` (A-52); the same in both modes. */
export const LANGUAGE_OPTIONS = [
  { value: 'uk', name: 'Українська' },
  { value: 'en', name: 'English' },
] as const satisfies readonly { value: LanguageChoice; name: string }[];

/** The shape of the table of page texts: the Ukrainian exports above and the English table `EN` both have it. */
export interface PageTexts {
  TITLE: string;
  BUTTONS: { hint: string; reset: string; newPuzzle: string; rules: string; rulesClose: string };
  sizeLabel: (n: number) => string;
  SIZE_GROUP: string;
  CONFIRM: { text: string; yes: string; no: string };
  cellLabel: (row: number, col: number, value: 0 | 1 | null, given: boolean, hinted: boolean) => string;
  RULES: { heading: string; items: readonly string[] };
  IDLE: string;
  WIN: string;
  SETUP: { prefix: string; separator: string; sheetLabel: string; close: string; start: string; cue: string };
  LEVEL_GROUP: string;
  LEVELS: readonly { name: string; description: string }[];
  LEVEL_REASON_4X4: string;
  TECHNIQUES: { heading: string; items: readonly string[] };
  summaryText: (n: number, level: number) => string;
  SETTINGS: { label: string; themeLabel: string; languageLabel: string; close: string };
  THEME_OPTIONS: readonly { value: ThemeChoice; name: string }[];
}

const UK: PageTexts = {
  TITLE,
  BUTTONS,
  sizeLabel,
  SIZE_GROUP,
  CONFIRM,
  cellLabel,
  RULES,
  IDLE,
  WIN,
  SETUP,
  LEVEL_GROUP,
  LEVELS,
  LEVEL_REASON_4X4,
  TECHNIQUES,
  summaryText,
  SETTINGS,
  THEME_OPTIONS,
};

const EN_LEVELS = [
  { name: 'Warm-up', description: 'Three simple rules are enough: pairs, gaps between equal digits and counting.' },
  { name: 'Teaser', description: 'Also count where the remaining zeros or ones can still fit in a line.' },
  { name: 'Puzzler', description: 'Also compare rows and columns: no two of them can be the same.' },
  { name: 'Brain-twister', description: 'Also try a move ahead: if a rule breaks, the other digit goes here.' },
] as const;

const EN_CELL = { row: 'Row', col: 'column', empty: 'empty', given: 'given', hint: 'hinted' } as const;

// The English table: the same shape as the Ukrainian exports (the parity test compares the leaves). No apostrophe in any text.
export const EN: PageTexts = {
  TITLE: 'Binarka',
  BUTTONS: { hint: 'Hint', reset: 'Reset', newPuzzle: 'New puzzle', rules: 'Rules', rulesClose: 'Got it' },
  sizeLabel: (n) => `Grid ${n}×${n}`,
  SIZE_GROUP: 'Grid size',
  CONFIRM: { text: 'Start over? Your moves on this board will be lost.', yes: 'Yes, start over', no: 'Cancel' },
  cellLabel: (row, col, value, given, hinted) => {
    const v = value === null ? EN_CELL.empty : String(value);
    const suffix = given ? `, ${EN_CELL.given}` : hinted ? `, ${EN_CELL.hint}` : '';
    return `${EN_CELL.row} ${row}, ${EN_CELL.col} ${col}, ${v}${suffix}`;
  },
  RULES: {
    heading: 'Rules',
    items: [
      'No more than two equal digits side by side in a row or column.',
      'Every row and every column has as many zeros as ones.',
      'All rows are different, and all columns are different.',
    ],
  },
  // Two non-breaking spaces (U+00A0) keep "0 and 1" together; the quotes are U+201C and U+201D.
  IDLE: 'Press the cells to place 0\u00A0and\u00A01. For the rules, use the \u201CRules\u201D button at the top.',
  WIN: 'Congratulations, puzzle solved!',
  SETUP: { prefix: 'Grid and difficulty: ', separator: ' · ', sheetLabel: 'Grid and difficulty', close: 'Close', start: 'Start', cue: '▾' },
  LEVEL_GROUP: 'Difficulty',
  LEVELS: EN_LEVELS,
  LEVEL_REASON_4X4: 'The 4×4 grid has only the \u201CWarm-up\u201D level.',
  TECHNIQUES: {
    heading: 'Harder techniques',
    items: [
      'Line balance: if a line has room for only one more 0 or only one more 1, and putting it in a cell would make three equal digits side by side, that cell holds the other digit.',
      'Matching lines: if a line matches a complete line everywhere except two cells, those two cells are the opposite of it.',
      'Look ahead: imagine a digit in a cell; if a rule breaks within a few steps, the cell holds the other digit.',
    ],
  },
  summaryText: (n, level) => `${n}×${n} · ${EN_LEVELS[level - 1]?.name ?? ''}`,
  SETTINGS: { label: 'Settings', themeLabel: 'Theme', languageLabel: 'Language', close: 'Close' },
  THEME_OPTIONS: [
    { value: 'light', name: 'Light' },
    { value: 'dark', name: 'Dark' },
    { value: 'auto', name: 'System' },
  ],
};

/** The table of page texts of a language. */
export function textsFor(language: LanguageChoice): PageTexts {
  return language === 'en' ? EN : UK;
}
