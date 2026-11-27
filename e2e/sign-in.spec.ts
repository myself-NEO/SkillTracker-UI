import { expect, type Page, request, test } from '@playwright/test';

// Signing in end to end, through the local backend (http://localhost:8080) and its local database.
// One fixed account is reused across runs: the backend allows only 5 sign-ups per hour and 20 login
// attempts per 15 minutes from one address, so the account is checked once per worker, not per test.

const API = 'http://localhost:8080';
const ACCOUNT = { email: 'e2e-tester@example.com', password: 'correct-horse-42', fullName: 'E2E Tester' };

/** Whether the backend is up; if so, signs up the test account the first time (afterwards it exists). */
async function prepareBackend(): Promise<boolean> {
  const api = await request.newContext();
  try {
    if (!(await api.get(`${API}/api/health`, { timeout: 5_000 })).ok()) return false;
    const login = await api.post(`${API}/api/auth/login`, { data: { email: ACCOUNT.email, password: ACCOUNT.password } });
    if (login.ok()) return true;
    const registered = await api.post(`${API}/api/auth/register`, { data: ACCOUNT });
    // Another worker may have signed it up a moment ago.
    if (!registered.ok() && !(await registered.text()).includes('already exists')) {
      throw new Error(`Could not create the e2e account: ${registered.status()} ${await registered.text()}`);
    }
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Could not create')) throw error;
    return false;
  } finally {
    await api.dispose();
  }
}

async function signIn(page: Page, email = ACCOUNT.email, password = ACCOUNT.password) {
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: 'Access Prep Workspace' }).click();
}

test.describe('signing in (needs the local backend)', () => {
  test.beforeAll(async () => {
    test.skip(
      !(await prepareBackend()),
      'Start SkillTracker-Srcv locally (docker compose up -d, then mvn spring-boot:run) to run these.',
    );
  });

  test('an account signs in, lands on its topics, and signs out', async ({ page }) => {
    await page.goto('/login');
    // Typed in another case on purpose: the backend treats emails case-insensitively.
    await signIn(page, ACCOUNT.email.toUpperCase());

    await expect(page).toHaveURL(/\/learn$/);
    await expect(page.getByRole('heading', { level: 1, name: /one concept at a time/ })).toBeVisible();

    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'DSA', exact: true }).click();
    await expect(page).toHaveURL(/\/dsa$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Data Structures & Algorithms' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Cheat sheets' })).toBeVisible();

    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /Mock/ }).click();
    await expect(page).toHaveURL(/\/mock-interview$/);
    await expect(page.getByRole('heading', { name: 'Book a mock interview' })).toBeVisible();

    await page.getByRole('button', { name: 'Account' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole('button', { name: 'Log in to hone your skills' })).toBeVisible();
  });

  test('signing in returns to the page that asked for it', async ({ page }) => {
    await page.goto('/hld');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fhld$/);

    await signIn(page);

    await expect(page).toHaveURL(/\/hld$/);
    await expect(page.getByRole('heading', { level: 1, name: 'High-Level Design' })).toBeVisible();
  });

  test('a wrong password is refused', async ({ page }) => {
    await page.goto('/login');
    await signIn(page, ACCOUNT.email, 'not-the-password');

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
