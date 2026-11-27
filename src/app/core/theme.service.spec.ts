import { TestBed } from '@angular/core/testing';
import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  let systemDark = false;
  const root = document.documentElement;

  beforeEach(() => {
    localStorage.clear();
    systemDark = false;
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('dark') && systemDark,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const create = () => {
    const service = TestBed.inject(ThemeService);
    TestBed.tick();
    return service;
  };

  it('follows the system setting until the visitor chooses', () => {
    systemDark = true;
    const theme = create();
    expect(theme.theme()).toBe('dark');
    expect(root.getAttribute('data-theme')).toBe('dark');
  });

  it('remembers the choice and applies it to the page', () => {
    const theme = create();
    expect(theme.theme()).toBe('light');
    theme.toggle();
    TestBed.tick();
    expect(theme.theme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(root.style.colorScheme).toBe('dark');
  });

  it('starts from a saved choice', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(create().theme()).toBe('dark');
  });

  it('shows the dark-only pages dark whatever the choice, and restores it after', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    const theme = create();
    theme.forceDark(true);
    TestBed.tick();
    expect(root.getAttribute('data-theme')).toBe('dark');
    theme.forceDark(false);
    TestBed.tick();
    expect(root.getAttribute('data-theme')).toBe('light');
  });
});
