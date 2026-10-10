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

/** The current choice: a session-only value first, else the stored one; a missing, bad or unreadable value gives 'auto'. Nothing is
 * rewritten or removed. */
export function readTheme(): ThemeChoice {
  try {
    const value = sessionValues.get(THEME_KEY) ?? window.localStorage.getItem(THEME_KEY);
    return isThemeChoice(value) ? value : 'auto';
  } catch {
    return 'auto';
  }
}

/** Store the choice; when the storage fails, the choice is kept for the session only (FR-115) and nothing is retried. */
export function writeTheme(choice: ThemeChoice): void {
  try {
    window.localStorage.setItem(THEME_KEY, choice);
    sessionValues.delete(THEME_KEY);
  } catch {
    sessionValues.set(THEME_KEY, choice); // FR-115: silent by design
  }
}
