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

/** The stored choice; a missing, bad or unreadable value gives 'auto'. Nothing is rewritten or removed. */
export function readTheme(): ThemeChoice {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return isThemeChoice(value) ? value : 'auto';
  } catch {
    return 'auto';
  }
}

/** Store the choice; a failing storage is ignored (the choice still applies for the session). */
export function writeTheme(choice: ThemeChoice): void {
  try {
    window.localStorage.setItem(THEME_KEY, choice);
  } catch {
    // FR-115: silent by design
  }
}
