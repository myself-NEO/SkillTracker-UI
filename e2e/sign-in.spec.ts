import { APIRequestContext, expect, request, test } from '@playwright/test';

// Signing in end to end, through the local backend (http://localhost:8080) and its local database.
// One fixed account is reused across runs: the backend allows only 5 sign-ups per hour per IP.

const API = 'http://localhost:8080';
const ACCOUNT = { email: 'e2e-tester@example.com', password: 'correct-horse-42', fullName: 'E2E Tester' };

async function backendIsUp(): Promise<boolean> {
  const api = await request.newContext();
  try {
    return (await api.get(`${API}/api/health`, { timeout: 5_000 })).ok();
  } catch {
    return false;
  } finally {
    await api.dispose();
  }
}

/** Signs up the test account the first time; afterwards it already exists. */
async function ensureAccount(api: APIRequestContext): Promise<void> {
  const login = await api.post(`${API}/api/auth/login`, { data: { email: ACCOUNT.email, password: ACCOUNT.password } });
  if (login.ok()) {
    return;
  }
  const registered = await api.post(`${API}/api/auth/register`, { data: ACCOUNT });
  // Another worker may have signed it up a moment ago.
  if (!registered.ok() && !(await registered.text()).includes('already exists')) {
    throw new Error(`Could not create the e2e account: ${registered.status()} ${await registered.text()}`);
  }
}

test.describe('signing in (needs the local backend)', () => {
  test.beforeAll(async () => {
    test.skip(!(await backendIsUp()), 'Start SkillTracker-Srcv locally (docker compose up -d, then mvn spring-boot:run) to run these.');
  });

  test('an account signs in, reaches the dashboard, and signs out', async ({ page, request: api }) => {
    await ensureAccount(api);

    await page.goto('/login');
    // Typed in another case on purpose: the backend treats emails case-insensitively.
    await page.getByPlaceholder('you@example.com').fill(ACCOUNT.email.toUpperCase());
    await page.getByPlaceholder('••••••••').fill(ACCOUNT.password);
    await page.getByRole('button', { name: 'Access Prep Workspace' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('link', { name: 'Roadmaps' })).toBeVisible();

    await page.getByRole('link', { name: 'Roadmaps' }).click();
    await expect(page).toHaveURL(/\/roadmaps$/);

    await page.getByTitle('Sign Out').click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole('button', { name: 'Log in to hone your skills' })).toBeVisible();
  });

  test('a wrong password is refused', async ({ page, request: api }) => {
    await ensureAccount(api);

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill(ACCOUNT.email);
    await page.getByPlaceholder('••••••••').fill('not-the-password');
    await page.getByRole('button', { name: 'Access Prep Workspace' }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
