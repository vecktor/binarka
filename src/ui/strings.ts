// Every Ukrainian page text lives here (NFR-5). Other src/ui modules import these and keep no Cyrillic literal.

export const TITLE = 'Бінарка';

export const BUTTONS = {
  hint: 'Підказка',
  reset: 'Скинути',
  newPuzzle: 'Нова головоломка',
  rules: 'Правила',
  rulesClose: 'Зрозуміло',
} as const;

export const sizeLabel = (n: number): string => `Поле ${n}×${n}`;

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

// ASCII apostrophe until slice D changes it.
export const WIN = "Вітаємо, головоломку розв'язано!";
