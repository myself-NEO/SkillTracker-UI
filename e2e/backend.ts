import { type Page, request } from '@playwright/test';

// The local backend (http://localhost:8080, its local database) and the one test account the
// signed-in tests share. The backend allows only 5 sign-ups per hour and 20 login attempts per
// 15 minutes from one address, so each worker signs in once through the API and reuses the token.

export const API = 'http://localhost:8080';
export const ACCOUNT = { email: 'e2e-tester@example.com', password: 'correct-horse-42', fullName: 'E2E Tester' };

let token: string | null | undefined;

/**
 * The test account's token, signing it up the first time; null when the backend isn't running
 * (the signed-in tests then skip themselves).
 */
export async function testAccountToken(): Promise<string | null> {
  if (token !== undefined) return token;
  const api = await request.newContext();
  try {
    if (!(await api.get(`${API}/api/health`, { timeout: 5_000 }).catch(() => null))?.ok()) return (token = null);
    const credentials = { email: ACCOUNT.email, password: ACCOUNT.password };
    let login = await api.post(`${API}/api/auth/login`, { data: credentials });
    if (!login.ok()) {
      const registered = await api.post(`${API}/api/auth/register`, { data: ACCOUNT });
      // Another worker may have signed it up a moment ago.
      if (!registered.ok() && !(await registered.text()).includes('already exists')) {
        throw new Error(`Could not create the e2e account: ${registered.status()} ${await registered.text()}`);
      }
      login = await api.post(`${API}/api/auth/login`, { data: credentials });
    }
    if (!login.ok()) throw new Error(`Could not sign in the e2e account: ${login.status()}`);
    return (token = (await login.json()).token as string);
  } finally {
    await api.dispose();
  }
}

/** Opens the app already signed in as the test account (the token the app keeps in localStorage). */
export async function signInWithToken(page: Page, value: string) {
  await page.addInitScript((saved) => localStorage.setItem('sde_prep_token', saved), value);
}
