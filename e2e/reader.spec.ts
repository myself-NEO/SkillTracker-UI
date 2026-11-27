import { expect, test } from '@playwright/test';
import { signInWithToken, testAccountToken } from './backend';

// Reading: lessons, practice problems, cheat sheets and search. Signed in with the shared test
// account's token (see backend.ts), so these need the local backend running too.

test.describe('reading (needs the local backend)', () => {
  test.beforeEach(async ({ page }) => {
    const token = await testAccountToken();
    test.skip(!token, 'Start SkillTracker-Srcv locally (docker compose up -d, then mvn spring-boot:run) to run these.');
    await signInWithToken(page, token!);
  });

  test('a lesson opens from its roadmap, moves between sections, and can be marked complete', async ({ page }) => {
    await page.goto('/java');
    await page.getByRole('link', { name: /Introduction to Java & Platform Independence/ }).first().click();

    await expect(page).toHaveURL(/\/java\/introduction-to-java$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Introduction to Java & Platform Independence' })).toBeVisible();
    await expect(page).toHaveTitle('Introduction to Java & Platform Independence · Java · NeoLevelUP');

    await page.getByRole('button', { name: 'Mark as complete' }).click();
    await expect(page.getByRole('button', { name: 'Completed' })).toHaveAttribute('aria-pressed', 'true');
    // Undone, so the next run starts the same way.
    await page.getByRole('button', { name: 'Completed' }).click();

    await page.getByRole('navigation', { name: 'Previous and next' }).getByRole('link', { name: /Next/ }).click();
    await expect(page).toHaveURL(/\/java\/jdk-jre-jvm$/);
  });

  test('a lesson link to another page opens it inside the app', async ({ page }) => {
    await page.goto('/hld/aggregation-discovery');
    // Diagrams are drawn once they come near the viewport.
    const diagram = page.locator('app-lesson-body figure[data-diagram]').first();
    await diagram.scrollIntoViewIfNeeded();
    await expect(diagram).toHaveAttribute('data-diagram', 'ready', { timeout: 15_000 });
    await page.locator('app-lesson-body a[href^="/hld/"]').first().click();
    await expect(page).toHaveURL(/\/hld\/servers-latency$/);
    await expect(page.getByRole('heading', { level: 1, name: /Server Counts/ })).toBeVisible();
  });

  test('the practice library filters, and a problem records its status', async ({ page }) => {
    await page.goto('/lld/problems');
    await page.getByRole('searchbox').fill('parking');
    await page.getByRole('link', { name: /Parking Lot/ }).first().click();

    await expect(page).toHaveURL(/\/lld\/problems\/parking-lot$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Design a Parking Lot' })).toBeVisible();
    const status = page.getByRole('radiogroup', { name: 'Your status' });
    await status.getByRole('radio', { name: 'Completed' }).click();
    await expect(status.getByRole('radio', { name: 'Completed' })).toHaveAttribute('aria-checked', 'true');
    await status.getByRole('radio', { name: 'Not started' }).click();
  });

  test('search finds a lesson and opens it', async ({ page }) => {
    await page.goto('/learn');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('combobox', { name: /Search lessons/ }).fill('sliding window');
    await expect(page.getByRole('option').first()).toContainText('Sliding Window');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/dsa\/sliding-window$/);
  });

  test('pages not ported yet say so', async ({ page }) => {
    await page.goto('/java/notebook');
    await expect(page.getByRole('heading', { level: 1, name: 'This page is on its way' })).toBeVisible();
    await page.goto('/java/no-such-lesson');
    await expect(page.getByRole('heading', { level: 1, name: 'This page doesn’t exist' })).toBeVisible();
  });
});
