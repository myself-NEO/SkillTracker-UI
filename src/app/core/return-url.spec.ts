import { safeReturnUrl, SIGNED_IN_HOME } from './return-url';

describe('safeReturnUrl', () => {
  it('keeps a path inside the app, with its query and fragment', () => {
    expect(safeReturnUrl('/java')).toBe('/java');
    expect(safeReturnUrl('/dsa/heaps?x=1#top-k')).toBe('/dsa/heaps?x=1#top-k');
  });

  it('falls back to the hub for anything else', () => {
    for (const value of [null, undefined, '', 'java', 'https://example.com', '//example.com', '/\\example.com', '/login', '/login?returnUrl=%2Fjava']) {
      expect(safeReturnUrl(value)).toBe(SIGNED_IN_HOME);
    }
  });
});
