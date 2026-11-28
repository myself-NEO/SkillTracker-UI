import { describe, expect, it } from 'vitest';
import {
  backupFileName,
  backupSummary,
  makeBackup,
  mergeInterviews,
  mergeNotebook,
  mergeProgress,
  readBackup,
} from '@lib/progress/backup';
import { EMPTY_INTERVIEWS } from '@lib/progress/interviews';
import { EMPTY_NOTEBOOK } from '@lib/progress/notebook';
import { EMPTY_PROGRESS } from '@lib/progress/progress';

// Backups in TheSWEguide's format (version 1), and how one is added to the account.

/** A backup as TheSWEguide's "Export backup" writes it. */
const theSweGuideBackup = {
  app: 'TheSWEguide',
  version: 1,
  exportedAt: '2026-10-01T09:00:00.000Z',
  progress: { ...EMPTY_PROGRESS, lessons: { 'java:oop': 100 } },
  notebook: {
    ...EMPTY_NOTEBOOK,
    notes: { n1: { id: 'n1', track: 'hld', title: 'CAP', body: 'Pick two', topic: 'general', createdAt: 1, updatedAt: 1 } },
  },
  interviews: { ...EMPTY_INTERVIEWS, checklists: { 'hld:lesson:estimation': { a: 5 } } },
};

describe('backup files', () => {
  it('reads a TheSWEguide backup, sanitized', () => {
    const result = readBackup(JSON.stringify(theSweGuideBackup));
    expect(result.ok).toBe(true);
    if (result.ok !== true) return;
    expect(result.backup.progress?.lessons).toEqual({ 'java:oop': 100 });
    expect(result.backup.notebook?.notes['n1'].title).toBe('CAP');
    expect(result.backup.interviews?.checklists).toEqual({ 'hld:lesson:estimation': { a: 5 } });
  });

  it('reads a backup from before mock interviews (no interviews part)', () => {
    const { interviews: _, ...older } = theSweGuideBackup;
    const result = readBackup(JSON.stringify(older));
    expect(result.ok && result.backup.interviews).toBeUndefined();
    expect(result.ok && result.backup.progress).toBeTruthy();
  });

  it('refuses files that are not backups, and backups from a newer version', () => {
    expect(readBackup('not json')).toEqual({ ok: false, reason: 'invalid' });
    expect(readBackup('[1, 2]')).toEqual({ ok: false, reason: 'invalid' });
    expect(readBackup(JSON.stringify({ interviews: {} }))).toEqual({ ok: false, reason: 'invalid' });
    expect(readBackup(JSON.stringify({ ...theSweGuideBackup, version: 2 }))).toEqual({ ok: false, reason: 'newer' });
  });

  it('writes the same format, and names the file with the local date', () => {
    const now = new Date(2026, 10, 28, 1, 30); // 28 Nov, 01:30 local time
    const backup = makeBackup({ progress: EMPTY_PROGRESS, notebook: EMPTY_NOTEBOOK, interviews: EMPTY_INTERVIEWS }, now);
    expect(backup).toMatchObject({ version: 1, exportedAt: now.toISOString(), progress: EMPTY_PROGRESS });
    expect(Object.keys(backup)).toEqual(['app', 'version', 'exportedAt', 'progress', 'notebook', 'interviews']);
    expect(backupFileName(now)).toBe('neolevelup-backup-2026-11-28.json');
    expect(readBackup(JSON.stringify(backup)).ok).toBe(true);
  });

  it('says what a backup holds', () => {
    const result = readBackup(JSON.stringify(theSweGuideBackup));
    expect(result.ok && backupSummary(result.backup)).toBe('1 lesson completed, 1 note');
    expect(backupSummary({})).toBe('nothing yet');
  });
});

describe('adding a backup to the account', () => {
  it('keeps everything in the account and adds what the backup has', () => {
    const mine = { ...EMPTY_PROGRESS, lessons: { 'java:oop': 10 }, visited: { 'java:oop': 10 } };
    const theirs = { ...EMPTY_PROGRESS, lessons: { 'java:strings': 20 } };
    expect(mergeProgress(mine, theirs).lessons).toEqual({ 'java:oop': 10, 'java:strings': 20 });
    expect(mergeProgress(mine, theirs).visited).toEqual({ 'java:oop': 10 });
  });

  it('keeps the more recently changed of two versions of an item', () => {
    const mine = {
      ...EMPTY_PROGRESS,
      problems: { 'lld:atm': 'completed' as const, 'lld:elevator': 'attempted' as const },
      problemsAt: { 'lld:atm': 50, 'lld:elevator': 10 },
      resume: { lld: { slug: 'solid', at: 50 } },
    };
    const theirs = {
      ...EMPTY_PROGRESS,
      problems: { 'lld:atm': 'attempted' as const, 'lld:elevator': 'completed' as const },
      problemsAt: { 'lld:atm': 40, 'lld:elevator': 30 },
      resume: { lld: { slug: 'strategy', at: 60 } },
    };
    const merged = mergeProgress(mine, theirs);
    expect(merged.problems).toEqual({ 'lld:atm': 'completed', 'lld:elevator': 'completed' });
    expect(merged.problemsAt).toEqual({ 'lld:atm': 50, 'lld:elevator': 30 });
    expect(merged.resume['lld'].slug).toBe('strategy');
  });

  it('merges notebooks item by item', () => {
    const note = (body: string, updatedAt: number) => ({ id: 'n', track: 'hld' as const, title: 'T', body, topic: 'general', createdAt: 1, updatedAt });
    const mine = { ...EMPTY_NOTEBOOK, notes: { n: note('newer', 20) }, revise: { 'hld:q1': 5 } };
    const theirs = { ...EMPTY_NOTEBOOK, notes: { n: note('older', 10) }, revise: { 'hld:q1': 9, 'hld:q2': 1 } };
    const merged = mergeNotebook(mine, theirs);
    expect(merged.notes['n'].body).toBe('newer');
    expect(merged.revise).toEqual({ 'hld:q1': 9, 'hld:q2': 1 });
  });

  it('treats keys that objects inherit, like "constructor", as ordinary keys', () => {
    const note = { id: 'constructor', track: 'hld' as const, title: 'T', body: 'kept', topic: 'general', createdAt: 1, updatedAt: 1 };
    const merged = mergeNotebook(EMPTY_NOTEBOOK, { ...EMPTY_NOTEBOOK, notes: { constructor: note } });
    expect(JSON.parse(JSON.stringify(merged)).notes).toEqual({ constructor: note });
  });

  it('keeps every finished mock interview once, and every checklist tick', () => {
    const attempt = (completedAt: number) => ({
      completedAt,
      minutes: 45 as const,
      elapsedMs: 1,
      score: 50,
      ratings: {},
      clarifyCoverage: 0,
      hintsUsed: 0,
    });
    const mine = { ...EMPTY_INTERVIEWS, history: { 'hld:chat': [attempt(1), attempt(3)] }, checklists: { p: { a: 1 } } };
    const theirs = { ...EMPTY_INTERVIEWS, history: { 'hld:chat': [attempt(2), attempt(3)] }, checklists: { p: { a: 4, b: 2 } } };
    const merged = mergeInterviews(mine, theirs);
    expect(merged.history['hld:chat'].map((a) => a.completedAt)).toEqual([1, 2, 3]);
    expect(merged.checklists).toEqual({ p: { a: 4, b: 2 } });
  });
});
