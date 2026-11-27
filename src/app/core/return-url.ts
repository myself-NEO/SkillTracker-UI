/** Where a signed-in visitor lands by default: the hub of all topics. */
export const SIGNED_IN_HOME = '/learn';

/**
 * The page to open after signing in: `returnUrl` when it is a path inside this app, otherwise the
 * hub. Anything else (another site, `//host`, the login page itself) falls back to the hub.
 */
export function safeReturnUrl(returnUrl: string | null | undefined): string {
  if (!returnUrl || !returnUrl.startsWith('/') || returnUrl.startsWith('//') || returnUrl.includes('\\')) {
    return SIGNED_IN_HOME;
  }
  const path = returnUrl.split(/[?#]/)[0];
  return path === '/login' ? SIGNED_IN_HOME : returnUrl;
}
