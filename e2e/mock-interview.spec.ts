import { expect, test } from '@playwright/test';
import { clearProgress, resetMockInterview, serverInterviews, serverProgress, signInWithToken, testAccountToken } from './backend';

// The timed LLD and HLD mock interviews: an attempt from the list to the self-evaluation, kept with
// the account. Each test removes its problem's attempts first, so these run one after another.

test.describe('mock interviews (needs the local backend)', () => {
  test.describe.configure({ mode: 'serial' });
  let token: string;

  test.beforeEach(async ({ page }, testInfo) => {
    const found = await testAccountToken(testInfo.project.name);
    test.skip(!found, 'Start SkillTracker-Srcv locally (docker compose up -d, then mvn spring-boot:run) to run these.');
    token = found!;
    await resetMockInterview(token, 'hld:url-shortener');
    await clearProgress(token, { problems: { 'hld:url-shortener': null }, problemsAt: { 'hld:url-shortener': null } });
    await signInWithToken(page, token);
  });

  test('an HLD mock interview is asked, drafted, rated and kept in the attempts', async ({ page }) => {
    await page.goto('/hld/interview');
    const card = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'URL Shortener (Bitly)' }) });
    await card.getByRole('link', { name: 'Start interview' }).click();
    await expect(page).toHaveURL(/\/hld\/interview\/url-shortener$/);
    await expect(page.getByRole('heading', { level: 1, name: 'URL Shortener (Bitly)' })).toBeVisible();
    await page.getByRole('button', { name: 'Start the interview' }).click();

    // The interviewer answers from the problem's script, and leaves design choices to the candidate.
    const question = page.getByRole('textbox', { name: 'Ask the interviewer a clarifying question' });
    await question.fill('How many new links are created per day?');
    await question.press('Enter');
    const conversation = page.getByRole('list', { name: 'Conversation' });
    await expect(conversation).toContainText('scripted answer to');
    await expect(conversation).toContainText('100 million new links a month');
    await question.fill('Which database should I use?');
    await question.press('Enter');
    await expect(conversation).toContainText('That’s your call');
    await expect(page.getByText('You have asked about 1 of the 9 topics')).toBeVisible();

    // A draft is kept with the attempt, which survives a reload (the clock stops while the page is away).
    await page.getByRole('button', { name: 'Next: Requirements' }).click();
    const draft = page.getByRole('textbox', { name: 'Functional and non-functional requirements' });
    await draft.fill('Users can create a short link and are redirected with low latency.');
    await page.getByRole('button', { name: /^🔍 Reveal reference/ }).click();
    await expect(page.getByText(/^Functional requirements: \d \/ 3 covered$/)).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { level: 2, name: 'Define requirements' })).toBeVisible();
    await expect(draft).toHaveValue('Users can create a short link and are redirected with low latency.');
    await expect(page.getByText('Timer paused.')).toBeVisible();
    await page.getByRole('button', { name: 'Resume' }).click();

    // Every rubric dimension rated, the attempt is finished and kept.
    await page.getByRole('navigation', { name: 'Interview phases' }).getByRole('button', { name: /Evaluate/ }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Self-evaluation' })).toBeVisible();
    const finish = page.getByRole('button', { name: 'Finish interview' });
    await expect(finish).toBeDisabled();
    for (const group of await page.getByRole('radiogroup').all()) await group.getByRole('radio', { name: 'Strong' }).click();
    await finish.click();
    await expect(page.getByRole('status').filter({ hasText: 'Attempt saved.' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Your attempts (scrollable)' })).toContainText('100%');

    await page.getByRole('link', { name: 'All mock interviews' }).click();
    await expect(card).toContainText('1 attempt · best 100%');
    await expect(card).toContainText('Attempted');
    await expect(card.getByRole('link', { name: 'Try again' })).toBeVisible();

    await expect
      .poll(async () => ((await serverInterviews(token)).history?.['hld:url-shortener'] as { score: number }[] | undefined)?.map((a) => a.score), {
        timeout: 15_000,
      })
      .toEqual([100]);
    expect((await serverProgress(token)).problems?.['hld:url-shortener']).toBe('attempted');
  });

  test('a problem that does not exist has no mock interview', async ({ page }) => {
    await page.goto('/hld/interview/no-such-problem');
    await expect(page.getByRole('heading', { level: 1, name: 'This page doesn’t exist' })).toBeVisible();
  });

  test('the Mock Interview tab leads to the practice, and books and scores a session with a person', async ({ page }) => {
    await page.goto('/mock-interview');
    const practice = page.getByRole('region', { name: 'On your own' });
    await expect(practice.getByRole('link', { name: 'Interview questions' })).toHaveAttribute('href', '/java/interview');
    await expect(practice.getByRole('link', { name: 'Low-level design interviews' })).toHaveAttribute('href', '/lld/interview');
    await expect(practice.getByRole('link', { name: 'System design interviews' })).toHaveAttribute('href', '/hld/interview');

    // The account keeps every session it books, so this one has a name of its own.
    const interviewer = `E2E interviewer ${Date.now()}`;
    await page.getByLabel('Kind').selectOption({ label: 'Behavioral' });
    await page.getByLabel('Date').fill('2026-12-10');
    await page.getByLabel('Time').fill('18:00');
    await page.getByLabel('Interviewer').fill(interviewer);
    await page.getByRole('button', { name: 'Book interview' }).click();

    const upcoming = page.getByRole('region', { name: 'Upcoming' }).getByRole('listitem').filter({ hasText: interviewer });
    await expect(upcoming).toContainText('Behavioral');
    await upcoming.getByRole('button', { name: 'Record feedback' }).click();
    const dialog = page.getByRole('dialog', { name: 'How did it go?' });
    await dialog.getByTitle('3 out of 5').click();
    await expect(dialog.getByRole('radio', { name: '3 out of 5' })).toBeChecked();
    await dialog.getByLabel('What went well, and what to work on').fill('Clear stories; quantify the impact.');
    await dialog.getByRole('button', { name: 'Save feedback' }).click();
    await expect(dialog).toBeHidden();

    const scored = page.getByRole('region', { name: 'History' }).getByRole('listitem').filter({ hasText: interviewer });
    await expect(scored.getByRole('img', { name: 'Score 3 out of 5' })).toBeVisible();
    await expect(scored).toContainText('Clear stories; quantify the impact.');
  });
});
