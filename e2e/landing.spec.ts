import { expect, test } from '@playwright/test';

// The public pages: these need no backend.

test('the landing page is the Snake game', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.locator('canvas[aria-label="Snake game board"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start game' })).toBeVisible();
});

test('"Log in to hone your skills" opens the login page', async ({ page }) => {
  await page.goto('/home');

  await page.getByRole('button', { name: 'Log in to hone your skills' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
});

test('pages behind the login send signed-out visitors to the login page, remembering the page', async ({ page }) => {
  await page.goto('/java');
  await expect(page).toHaveURL(/\/login\?returnUrl=%2Fjava$/);

  await page.goto('/learn');
  await expect(page).toHaveURL(/\/login$/);
});

test('unknown pages send signed-out visitors to the game', async ({ page }) => {
  await page.goto('/no-such-page');

  await expect(page).toHaveURL(/\/home$/);
});

test('the game stays dark when the learning pages are set to light', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'light'));
  await page.goto('/home');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('a deep link loads the app instead of a 404', async ({ page }) => {
  const response = await page.goto('/login');

  expect(response?.status()).toBe(200);
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
});
