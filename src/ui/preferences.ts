// The stored theme preference (FR-113 to FR-115, TC-12). localStorage only; every access is guarded, so a blocked or broken storage
// never stops the page. The key and the two page colours are duplicated by hand in the head step of index.html (a test pins them).

export type ThemeChoice = 'light' | 'dark' | 'auto';

export const THEME_KEY = 'binarka.theme';
/** --color-page of the light and of the dark token set of style.css (also in the head step of index.html). */
export const THEME_COLOR_LIGHT = '#f9fafb';
export const THEME_COLOR_DARK = '#1a1714';

export const THEME_CHOICES: readonly ThemeChoice[] = ['light', 'dark', 'auto'];

function isThemeChoice(value: unknown): value is ThemeChoice {
  return (THEME_CHOICES as readonly unknown[]).includes(value);
}

/** Values whose write failed, by key: they hold for the rest of the page session (FR-115) and win over the stored value. A later write
 * that succeeds removes the entry. */
const sessionValues = new Map<string, string>();

/** Forget the session-only values, as a page reload does. jsdom cannot reload the page, so the test lifecycle calls this between tests. */
export function forgetSessionPreferences(): void {
  sessionValues.clear();
}

/** The current value of a key: a session-only value first, else the stored one; a missing, bad or unreadable value gives the fallback.
 * Nothing is rewritten or removed. */
function readChoice<T extends string>(key: string, valid: (value: unknown) => value is T, fallback: T): T {
  try {
    const value = sessionValues.get(key) ?? window.localStorage.getItem(key);
    return valid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

/** Store a value; when the storage fails, it is kept for the session only (FR-115) and nothing is retried. */
function writeChoice(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
    sessionValues.delete(key);
  } catch {
    sessionValues.set(key, value); // FR-115: silent by design
  }
}

/** The current theme choice; a missing, bad or unreadable value gives 'auto'. */
export function readTheme(): ThemeChoice {
  return readChoice(THEME_KEY, isThemeChoice, 'auto');
}

/** Store the theme choice (FR-115 when the storage fails). */
export function writeTheme(choice: ThemeChoice): void {
  writeChoice(THEME_KEY, choice);
}

export type LanguageChoice = 'uk' | 'en';

export const LANGUAGE_KEY = 'binarka.language';

function isLanguageChoice(value: unknown): value is LanguageChoice {
  return value === 'uk' || value === 'en';
}

/** The current language; a missing, bad or unreadable value gives Ukrainian (FR-114). */
export function readLanguage(): LanguageChoice {
  return readChoice(LANGUAGE_KEY, isLanguageChoice, 'uk');
}

/** Store the language (FR-115 when the storage fails). */
export function writeLanguage(choice: LanguageChoice): void {
  writeChoice(LANGUAGE_KEY, choice);
}
