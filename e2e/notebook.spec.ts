import { writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { clearProgress, resetNotebook, serverNotebook, serverProgress, signInWithToken, testAccountToken } from './backend';

// The revision notebook (its tools on lesson pages, the notebook page, importing a backup) and DSA's
// coding questions, which keep their flags and notes in the notebook too. Each test empties the
// project's test account's notebook first, so these run one after another.

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

  test("a coding question's status, flag and note are kept, and the note is in DSA's interview notes", async ({ page }) => {
    await resetNotebook(token);
    await clearProgress(token, { problems: { 'dsa:lc-1': null }, problemsAt: { 'dsa:lc-1': null } });
    await page.goto('/dsa/problems/arrays-hashing');

    const row = page.locator('#lc-1');
    await row.getByRole('combobox', { name: 'Status of 1. Two Sum' }).selectOption('completed');
    await row.getByRole('button', { name: /Revisit/ }).click();
    await expect(row.getByRole('button', { name: /Revisit/ })).toHaveAttribute('aria-pressed', 'true');
    await row.getByRole('button', { name: /Notes/ }).click();
    await row.getByRole('textbox', { name: /My notes/ }).fill('One pass with a hash map: value → index.');
    await expect(row.getByText('Saved', { exact: true })).toBeVisible();
    await expect(page.locator('header').getByText('1', { exact: true })).toBeVisible(); // "1 / 156 solved"

    await page.getByRole('navigation', { name: 'DSA pages' }).getByRole('link', { name: 'Interview notes' }).click();
    const note = page.locator('article[data-note="problem"]');
    await expect(note.getByRole('link', { name: /1\. Two Sum/ })).toHaveAttribute('href', 'https://leetcode.com/problems/two-sum/');
    await expect(note.getByText('Solved')).toBeVisible();
    await expect(note.getByText('One pass with a hash map: value → index.')).toBeVisible();

    await expect.poll(async () => (await serverProgress(token)).problems?.['dsa:lc-1'], { timeout: 15_000 }).toBe('completed');
    await expect.poll(async () => Object.keys((await serverNotebook(token)).revise ?? {}), { timeout: 15_000 }).toEqual(['dsa:lc-1']);
  });
});
