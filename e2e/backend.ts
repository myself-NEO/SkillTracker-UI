import { type Page, request } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// The local backend (http://localhost:8080, its local database) and the test accounts the
// signed-in tests use: one per Playwright project (desktop, mobile), since progress is saved to the
// account and the two projects run at the same time.
//
// The backend allows only 5 sign-ups per hour and 20 login attempts per 15 minutes from one
// address, so the accounts are signed in once, by the global setup, and their tokens are kept in
// e2e/.auth/tokens.json (git-ignored) and reused while they are valid.

export const API = 'http://localhost:8080';

const TOKENS_FILE = path.join(import.meta.dirname, '.auth', 'tokens.json');

/** The test account of a Playwright project (e.g. "e2e-desktop@example.com"). */
export const accountFor = (project: string) => ({
  email: `e2e-${project}@example.com`,
  password: 'correct-horse-42',
  fullName: `E2E ${project}`,
});

type Tokens = Record<string, string | null>;

const readTokens = (): Tokens => {
  try {
    return existsSync(TOKENS_FILE) ? (JSON.parse(readFileSync(TOKENS_FILE, 'utf8')) as Tokens) : {};
  } catch {
    return {};
  }
};

/** Whether a JWT is still good for the next hour (its `exp`, read without checking the signature). */
const fresh = (token: string | null | undefined): token is string => {
  try {
    const payload = JSON.parse(Buffer.from(token!.split('.')[1], 'base64url').toString());
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now() + 3_600_000;
  } catch {
    return false;
  }
};

/** Global setup: a token for each project's account (signing it up the first time); null without a backend. */
export async function signInTestAccounts(projects: string[]) {
  const tokens = readTokens();
  const api = await request.newContext();
  try {
    const up = (await api.get(`${API}/api/health`, { timeout: 5_000 }).catch(() => null))?.ok() ?? false;
    for (const project of projects) {
      if (!up) tokens[project] = null;
      else if (!fresh(tokens[project])) tokens[project] = await signIn(api, project);
    }
  } finally {
    await api.dispose();
  }
  mkdirSync(path.dirname(TOKENS_FILE), { recursive: true });
  writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

async function signIn(api: Awaited<ReturnType<typeof request.newContext>>, project: string): Promise<string> {
  const account = accountFor(project);
  const credentials = { email: account.email, password: account.password };
  let login = await api.post(`${API}/api/auth/login`, { data: credentials });
  if (!login.ok()) {
    const registered = await api.post(`${API}/api/auth/register`, { data: account });
    if (!registered.ok() && !(await registered.text()).includes('already exists')) {
      throw new Error(`Could not create the e2e account: ${registered.status()} ${await registered.text()}`);
    }
    login = await api.post(`${API}/api/auth/login`, { data: credentials });
  }
  if (!login.ok()) throw new Error(`Could not sign in the e2e account: ${login.status()} ${await login.text()}`);
  return (await login.json()).token as string;
}

/** The project's test account token from the global setup; null when the backend isn't running (tests skip). */
export async function testAccountToken(project: string): Promise<string | null> {
  return readTokens()[project] ?? null;
}

/** Opens the app already signed in as the test account (the token the app keeps in localStorage). */
export async function signInWithToken(page: Page, value: string) {
  await page.addInitScript((saved) => localStorage.setItem('sde_prep_token', saved), value);
}

/**
 * Removes progress a test is about to create from the account, so the test starts from the same
 * place every run (a merge patch: each key set to null is removed).
 */
export async function clearProgress(token: string, patch: Record<string, Record<string, null>>) {
  const api = await request.newContext();
  try {
    const response = await api.patch(`${API}/api/state/progress`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/merge-patch+json' },
      data: patch,
    });
    if (!response.ok()) throw new Error(`Could not reset the e2e account's progress: ${response.status()}`);
  } finally {
    await api.dispose();
  }
}

/** Empties the account's notebook, so a test starts from the same place every run. */
export async function resetNotebook(token: string) {
  const fields = ['saved', 'difficult', 'revise', 'questions', 'notes', 'snippets', 'reviewed'];
  const api = await request.newContext();
  try {
    const response = await api.patch(`${API}/api/state/notebook`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/merge-patch+json' },
      data: Object.fromEntries(fields.map((field) => [field, null])),
    });
    if (!response.ok()) throw new Error(`Could not reset the e2e account's notebook: ${response.status()}`);
  } finally {
    await api.dispose();
  }
}

/** One of the account's documents as the server has it. */
async function serverDocument(token: string, kind: 'progress' | 'notebook'): Promise<Record<string, Record<string, unknown>>> {
  const api = await request.newContext();
  try {
    const response = await api.get(`${API}/api/state`, { headers: { Authorization: `Bearer ${token}` } });
    return (await response.json()).documents?.[kind]?.data ?? {};
  } finally {
    await api.dispose();
  }
}

/** The account's progress document as the server has it. */
export const serverProgress = (token: string) => serverDocument(token, 'progress');

/** The account's notebook as the server has it. */
export const serverNotebook = (token: string) => serverDocument(token, 'notebook');
