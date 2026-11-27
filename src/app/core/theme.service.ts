import { computed, effect, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

/** localStorage key of the visitor's choice (TheSWEguide's key, so the choice carries over in name). */
export const THEME_STORAGE_KEY = 'theme';

const readChoice = (): Theme | null => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null;
  }
};

/**
 * Light and dark themes. The visitor's choice is remembered; until they choose, the system setting
 * is followed live. Pages built before the themes existed (Snake, login, the old dashboard) are
 * dark-only: their layouts call `forceDark` while they're shown. index.html sets the same theme
 * before the first paint, so pages never flash the wrong one.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly choice = signal<Theme | null>(readChoice());
  private readonly system = signal<Theme>(this.systemTheme());
  private readonly forced = signal(false);

  /** The theme the page shows now. */
  readonly theme = computed<Theme>(() => (this.forced() ? 'dark' : (this.choice() ?? this.system())));

  constructor() {
    const media = this.media();
    media?.addEventListener('change', () => this.system.set(this.systemTheme()));
    effect(() => {
      const theme = this.theme();
      const root = document.documentElement;
      root.setAttribute('data-theme', theme);
      root.style.colorScheme = theme;
    });
  }

  /** Switches between light and dark, and remembers the choice. */
  toggle(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.choice.set(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable: the choice lasts for this visit.
    }
  }

  /** Dark-only layouts set this while they're shown; the theme-aware shell clears it. */
  forceDark(on: boolean): void {
    this.forced.set(on);
  }

  private media(): MediaQueryList | null {
    return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  }

  private systemTheme(): Theme {
    return this.media()?.matches ? 'dark' : 'light';
  }
}
