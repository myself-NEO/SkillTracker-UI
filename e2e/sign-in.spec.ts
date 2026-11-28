import { expect, type Page, test } from '@playwright/test';
import { accountFor, testAccountToken } from './backend';

// Signing in end to end, through the local backend (http://localhost:8080) and its local database.

/** This project's test account (backend.ts). */
const account = () => accountFor(test.info().project.name);

async function signIn(page: Page, email = account().email, password = account().password) {
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: 'Access Prep Workspace' }).click();
}

test.describe('signing in (needs the local backend)', () => {
  test.beforeAll(async ({}, testInfo) => {
    test.skip(
      !(await testAccountToken(testInfo.project.name)),
      'Start SkillTracker-Srcv locally (docker compose up -d, then mvn spring-boot:run) to run these.',
    );
  });

  test('an account signs in, lands on its topics, and signs out', async ({ page }) => {
    await page.goto('/login');
    // Typed in another case on purpose: the backend treats emails case-insensitively.
    await signIn(page, account().email.toUpperCase());

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
    await signIn(page, account().email, 'not-the-password');

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
