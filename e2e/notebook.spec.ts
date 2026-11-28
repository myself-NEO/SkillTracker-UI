import { writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { resetNotebook, serverNotebook, signInWithToken, testAccountToken } from './backend';

// The revision notebook: its tools on lesson pages, the notebook page, and importing a backup.
// Each project's test account gets its notebook emptied first, so these run one after another.

test.describe('the notebook (needs the local backend)', () => {
  test.describe.configure({ mode: 'serial' });
  let token: string;

  test.beforeEach(async ({ page }, testInfo) => {
    const found = await testAccountToken(testInfo.project.name);
    test.skip(!found, 'Start SkillTracker-Srcv locally (docker compose up -d, then mvn spring-boot:run) to run these.');
    token = found!;
    await signInWithToken(page, token);
  });

  test('a bookmark, a note and saved code land in the notebook and the account', async ({ page }) => {
    await resetNotebook(token);
    await page.goto('/java/generics-basics');

    await page.getByRole('button', { name: 'Bookmark lesson' }).click();
    await expect(page.getByRole('button', { name: 'Bookmarked' })).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Save snippet to your notebook' }).first().click();
    await expect(page.getByRole('button', { name: 'Snippet saved to your notebook' })).toBeVisible();

    await page.getByRole('textbox', { name: /Write the idea in your own words/ }).fill('Erasure: generics are compile-time only.');
    await expect(page.getByText('Saved to your notebook')).toBeVisible();

    await page.goto('/java/notebook');
    const panel = page.getByRole('tabpanel');
    await page.getByRole('tab', { name: /Saved/ }).click();
    await expect(panel.getByRole('link', { name: 'Why Generics: Classes, Interfaces & Methods' })).toBeVisible();
    await page.getByRole('tab', { name: /Notes/ }).click();
    await expect(panel.getByText('Erasure: generics are compile-time only.')).toBeVisible();
    await page.getByRole('tab', { name: /Code/ }).click();
    await expect(panel.getByText('Java (Why Generics: Classes, Interfaces & Methods)')).toBeVisible();

    // Saved to the account a few seconds later.
    await expect.poll(async () => Object.keys((await serverNotebook(token)).notes ?? {}), { timeout: 15_000 }).toHaveLength(1);
  });

  test('a TheSWEguide backup is added to the account', async ({ page }, testInfo) => {
    await resetNotebook(token);
    const file = testInfo.outputPath('theswe-guide-backup-2026-11-01.json');
    writeFileSync(
      file,
      JSON.stringify({
        app: 'TheSWEguide',
        version: 1,
        exportedAt: '2026-11-01T10:00:00.000Z',
        progress: { lessons: {}, quizzes: {}, problems: {}, problemsAt: {}, visited: {}, resume: {}, answers: {} },
        notebook: {
          saved: {},
          difficult: {},
          revise: { 'lld:problem:parking-lot': 1_761_991_200_000 },
          questions: {},
          notes: {
            'imported-1': {
              id: 'imported-1',
              track: 'lld',
              title: 'Strategy vs State',
              body: 'Strategy swaps the **algorithm**; State swaps behaviour as the object changes.',
              topic: 'general',
              kind: 'tradeoff',
              createdAt: 1_761_991_200_000,
              updatedAt: 1_761_991_200_000,
            },
          },
          snippets: {},
          reviewed: {},
        },
      }),
    );

    await page.goto('/lld/notebook');
    page.once('dialog', (dialog) => dialog.accept());
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Import backup' }).click();
    await (await chooser).setFiles(file);
    await expect(page.locator('app-backup-controls').getByRole('status')).toHaveText('Backup imported. It’s being saved to your account.');

    const panel = page.getByRole('tabpanel');
    await expect(panel.getByRole('link', { name: /Parking Lot/ })).toBeVisible(); // on the revision list
    await page.getByRole('tab', { name: /Notes/ }).click();
    await expect(panel.getByText('Strategy swaps the algorithm; State swaps behaviour as the object changes.')).toBeVisible();

    await expect.poll(async () => Object.keys((await serverNotebook(token)).notes ?? {}), { timeout: 15_000 }).toEqual(['imported-1']);
  });
});
