// Every Ukrainian page text lives here (NFR-5). Other src/ui modules import these and keep no Cyrillic literal.

import type { ThemeChoice } from './preferences';

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
  close: 'Закрити',
} as const;

export const THEME_OPTIONS = [
  { value: 'light', name: 'Світла' },
  { value: 'dark', name: 'Темна' },
  { value: 'auto', name: 'Як у системі' },
] as const satisfies readonly { value: ThemeChoice; name: string }[];
