import type { Router } from '@angular/router';

/**
 * A click inside rendered Markdown (a lesson body, a note): a link to another page of this app, or
 * to a #section of this page, goes through the router instead of reloading the app. Returns
 * whether it took the click. Links to other sites, and clicks with a modifier key, are left alone.
 */
export function routeLinkClick(event: MouseEvent, router: Router): boolean {
  const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if (link.target && link.target !== '_self') return false; // other sites open in a new tab
  const href = link.getAttribute('href') ?? '';
  if (href.startsWith('#') && href.length > 1) {
    // A section of this page. (With <base href="/">, the browser would otherwise leave the page.)
    event.preventDefault();
    const url = router.parseUrl(router.url);
    url.fragment = decodeFragment(href.slice(1));
    void router.navigateByUrl(url);
    return true;
  }
  if (href.startsWith('/') && !href.startsWith('//')) {
    event.preventDefault();
    void router.navigateByUrl(href);
    return true;
  }
  return false;
}

/** A fragment as written in a link; a malformed escape (possible in a learner's note) is kept as is. */
const decodeFragment = (fragment: string) => {
  try {
    return decodeURIComponent(fragment);
  } catch {
    return fragment;
  }
};
