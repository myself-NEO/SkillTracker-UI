import { expect, test } from '@playwright/test';
import { clearProgress, serverProgress, signInWithToken, testAccountToken } from './backend';

// Reading: lessons, practice problems, cheat sheets and search. Signed in with the project's test
// account's token (see backend.ts), so these need the local backend running too.

test.describe('reading (needs the local backend)', () => {
  let token: string;

  test.beforeEach(async ({ page }, testInfo) => {
    const found = await testAccountToken(testInfo.project.name);
    test.skip(!found, 'Start SkillTracker-Srcv locally (docker compose up -d, then mvn spring-boot:run) to run these.');
    token = found!;
    await signInWithToken(page, token);
  });

  test('a lesson opens from its roadmap, moves between sections, and can be marked complete', async ({ page }) => {
    await clearProgress(token, { lessons: { 'java:introduction-to-java': null } });
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

  test('progress is saved to the account and shows in another browser', async ({ page, browser }) => {
    await clearProgress(token, { lessons: { 'java:jdk-jre-jvm': null } });
    await page.goto('/java/jdk-jre-jvm');
    await page.getByRole('button', { name: 'Mark as complete' }).click();
    // Sent a few seconds later.
    await expect.poll(async () => (await serverProgress(token)).lessons?.['java:jdk-jre-jvm'], { timeout: 15_000 }).toBeTruthy();

    const elsewhere = await browser.newContext();
    try {
      const other = await elsewhere.newPage();
      await signInWithToken(other, token);
      await other.goto('/java/jdk-jre-jvm');
      await expect(other.getByRole('button', { name: 'Completed' })).toBeVisible();
    } finally {
      await elsewhere.close();
    }
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
    await clearProgress(token, { problems: { 'lld:parking-lot': null }, problemsAt: { 'lld:parking-lot': null } });
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

  test('a knowledge check is passed by answering every question correctly', async ({ page }) => {
    await page.goto('/hld/aggregation-discovery');
    const check = page.getByRole('region', { name: 'Knowledge check' });
    await check.scrollIntoViewIfNeeded();
    const questions = check.getByRole('group');
    for (let i = 0; i < (await questions.count()); i++) {
      const question = questions.nth(i);
      const options = question.getByRole('radio');
      for (let o = 0; o < (await options.count()); o++) {
        await options.nth(o).check();
        if (await question.getByText('Correct', { exact: true }).isVisible()) break;
        await expect(question.getByText('Not quite — try another option.')).toBeVisible();
      }
    }
    await expect(check.getByText('Knowledge check passed')).toBeVisible();
  });

  test('the estimator recalculates as assumptions change', async ({ page }) => {
    await page.goto('/hld/estimator');
    await expect(page.getByRole('heading', { level: 1, name: 'Back-of-the-envelope estimator' })).toBeVisible();
    const perDay = page.locator('[data-output="requests-per-day"] dd').first();
    await expect(perDay).toHaveText('100M');
    await page.getByRole('textbox', { name: 'Requests per day' }).fill('1B');
    await expect(perDay).toHaveText('1B');
  });

  test('the gallery opens an animation that steps frame by frame', async ({ page }) => {
    await page.goto('/visualize');
    await page.getByRole('link', { name: 'HashMap.put, step by step' }).click();
    await expect(page).toHaveURL(/\/visualize\/hashmap-put$/);
    const player = page.locator('figure[data-viz="stepper"]');
    await expect(player.getByText(/^Step 1 of \d+$/)).toBeVisible();
    await player.getByRole('button', { name: 'Next step' }).click();
    await expect(player.getByText(/^Step 2 of \d+$/)).toBeVisible();
  });

  test('a scroll-driven animation in a lesson follows the text being read', async ({ page }) => {
    await page.goto('/java/garbage-collection-basics');
    const explainer = page.locator('section[data-viz="scrolly"]');
    await expect(explainer).toBeVisible();
    await explainer
      .locator('[data-step]')
      .nth(3)
      .evaluate((step) => step.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(explainer.locator('figcaption')).toContainText('4 / 6');
  });

  test('pages not ported yet say so', async ({ page }) => {
    await page.goto('/java/progress');
    await expect(page.getByRole('heading', { level: 1, name: 'This page is on its way' })).toBeVisible();
    await page.goto('/java/no-such-lesson');
    await expect(page.getByRole('heading', { level: 1, name: 'This page doesn’t exist' })).toBeVisible();
  });
});
