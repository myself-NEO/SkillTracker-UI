import { describe, expect, it } from 'vitest';
import {
  EMPTY_NOTEBOOK,
  isSaved,
  lessonNote,
  NOTEBOOK_KEY,
  notebookUpdates as update,
  problemNote,
  sanitizeNotebook,
  savedKey,
} from '@lib/progress/notebook';

// The notebook model, ported from TheSWEguide with its storage key and entry keys, so its backups
// import unchanged (docs/plan.md, Phase 5).

const lessonItem = { kind: 'lesson' as const, track: 'hld' as const, ref: 'caching', title: 'Caching', context: 'Storage', topic: 'storage' };

describe('notebook model', () => {
  it("keeps TheSWEguide's storage key and key formats", () => {
    expect(NOTEBOOK_KEY).toBe('learning-notebook-v1');
    expect(savedKey('section', 'java', 'generics#bounds')).toBe('section:java:generics#bounds');
    const state = update.toggleDifficult(EMPTY_NOTEBOOK, 'java', 'generics', true, 5);
    expect(state.difficult).toEqual({ 'java:generics': 5 });
  });

  it('keeps well-formed entries and fills in what older backups leave out', () => {
    const state = sanitizeNotebook({
      saved: {
        a: { ...lessonItem, at: 1 },
        b: { kind: 'lesson', track: 'java', ref: 'oop' }, // no title, context, topic or time
        c: { kind: 'bogus', track: 'java', ref: 'x' },
        d: 'not an entry',
      },
      difficult: { 'java:oop': 3, 'java:bad': 'yesterday' },
      notes: {
        n1: { track: 'hld', body: 'text', title: 'T', topic: 'caching', createdAt: 1, updatedAt: 2, kind: 'tradeoff' },
        n2: { track: 'hld', title: 'No body' },
        n3: { track: 'hld', body: 'x', kind: 'rant', id: 'other-id' },
      },
      snippets: { s1: { track: 'java', code: 'int x;', language: 'java', title: 'X', topic: 'basics', createdAt: 4 } },
      questions: { 'java:q1': { draft: 'my answer', rating: 'missed', hints: 'two' } },
      reviewed: [],
      extra: true,
    });
    expect(Object.keys(state.saved)).toEqual(['a', 'b']);
    expect(state.saved['b']).toEqual({ kind: 'lesson', track: 'java', ref: 'oop', title: 'oop', context: '', topic: 'general', at: 0 });
    expect(state.difficult).toEqual({ 'java:oop': 3 });
    expect(Object.keys(state.notes)).toEqual(['n1', 'n3']);
    // The record key is the note's id; an unknown kind is dropped; the edit time defaults to the creation time.
    expect(state.notes['n3']).toEqual({ id: 'n3', track: 'hld', title: 'Untitled note', body: 'x', topic: 'general', createdAt: 0, updatedAt: 0 });
    expect(state.snippets['s1'].id).toBe('s1');
    expect(state.questions).toEqual({ 'java:q1': { draft: 'my answer', rating: 'missed' } });
    expect(state.reviewed).toEqual({});
    expect(sanitizeNotebook('nope')).toBe(EMPTY_NOTEBOOK);
  });

  it('keeps links only to pages of the app', () => {
    const state = sanitizeNotebook({
      saved: {
        ok: { ...lessonItem, ref: 'a', href: '/hld/caching#write-through' },
        js: { ...lessonItem, ref: 'b', href: 'javascript:alert(1)' },
        far: { ...lessonItem, ref: 'c', href: '//evil.example/x' },
      },
      snippets: { s: { track: 'hld', code: 'x', href: 'https://evil.example' } },
    });
    expect(state.saved['ok'].href).toBe('/hld/caching#write-through');
    expect(state.saved['js'].href).toBeUndefined();
    expect(state.saved['far'].href).toBeUndefined();
    expect(state.snippets['s'].href).toBeUndefined();
  });

  it('ignores a __proto__ key in stored data', () => {
    const state = sanitizeNotebook(JSON.parse('{"difficult": {"__proto__": 5, "java:oop": 1}}'));
    expect(Object.keys(state.difficult)).toEqual(['java:oop']);
    expect(Object.getPrototypeOf(state.difficult)).toBe(Object.prototype);
  });

  it('saves and removes bookmarks, and leaves the state alone when nothing changes', () => {
    const saved = update.toggleSaved(EMPTY_NOTEBOOK, lessonItem, undefined, 7);
    expect(isSaved(saved, 'lesson', 'hld', 'caching')).toBe(true);
    expect(saved.saved['lesson:hld:caching'].at).toBe(7);
    expect(isSaved(update.toggleSaved(saved, lessonItem, undefined, 8), 'lesson', 'hld', 'caching')).toBe(false);
    expect(update.toggleSaved(EMPTY_NOTEBOOK, lessonItem, false, 9)).toBe(EMPTY_NOTEBOOK);
  });

  it('flags for revision; flagging again stamps the flag again', () => {
    const flagged = update.toggleRevise(EMPTY_NOTEBOOK, 'lld', 'problem:parking-lot', true, 1);
    expect(flagged.revise).toEqual({ 'lld:problem:parking-lot': 1 });
    expect(update.toggleRevise(flagged, 'lld', 'problem:parking-lot', true, 2).revise['lld:problem:parking-lot']).toBe(2);
    expect(update.toggleRevise(flagged, 'lld', 'problem:parking-lot', undefined, 3).revise).toEqual({});
    expect(update.toggleRevise(EMPTY_NOTEBOOK, 'lld', 'x', false, 4)).toBe(EMPTY_NOTEBOOK);
  });

  it('puts a missed question on the revision list once', () => {
    const missed = update.rateQuestion(EMPTY_NOTEBOOK, 'java', 'q1', 'missed', 10);
    expect(missed.questions['java:q1']).toEqual({ rating: 'missed', ratedAt: 10 });
    expect(missed.revise).toEqual({ 'java:q1': 10 });
    expect(update.rateQuestion(missed, 'java', 'q1', 'missed', 20).revise).toEqual({ 'java:q1': 10 });
    expect(update.rateQuestion(EMPTY_NOTEBOOK, 'java', 'q1', 'got-it', 30).revise).toEqual({});
  });

  it('keeps a note’s creation time when it is edited', () => {
    const note = { id: 'n', track: 'lld' as const, title: 'Strategy', body: 'v1', topic: 'patterns', lesson: 'strategy' };
    const first = update.saveNote(EMPTY_NOTEBOOK, note, 100);
    const edited = update.saveNote(first, { ...note, body: 'v2' }, 200);
    expect(edited.notes['n']).toMatchObject({ body: 'v2', createdAt: 100, updatedAt: 200 });
    expect(lessonNote(edited, 'lld', 'strategy')?.id).toBe('n');
    expect(problemNote(edited, 'lld', 'strategy')).toBeUndefined();
    expect(update.deleteNote(edited, 'n').notes).toEqual({});
    expect(update.deleteNote(edited, 'missing')).toBe(edited);
  });

  it('adds, edits and deletes snippets', () => {
    const added = update.addSnippet(EMPTY_NOTEBOOK, { id: 's', track: 'hld', title: 'Flow', code: 'flowchart LR', language: 'mermaid', topic: 'general' }, 5);
    expect(added.snippets['s'].createdAt).toBe(5);
    expect(update.updateSnippet(added, 's', { title: 'Better' }).snippets['s'].title).toBe('Better');
    expect(update.updateSnippet(added, 'missing', { title: 'x' })).toBe(added);
    expect(update.deleteSnippet(added, 's').snippets).toEqual({});
  });

  it('marks revision items reviewed and due again', () => {
    const reviewed = update.markReviewed(EMPTY_NOTEBOOK, 'difficult:java:oop', true, 50);
    expect(reviewed.reviewed).toEqual({ 'difficult:java:oop': 50 });
    expect(update.markReviewed(reviewed, 'difficult:java:oop', false, 60).reviewed).toEqual({});
    expect(update.markReviewed(EMPTY_NOTEBOOK, 'x', false, 70)).toBe(EMPTY_NOTEBOOK);
  });

  it('resets one track and keeps the others', () => {
    let state = update.toggleSaved(EMPTY_NOTEBOOK, lessonItem, true, 1);
    state = update.toggleSaved(state, { ...lessonItem, track: 'java', ref: 'oop' }, true, 1);
    state = update.toggleDifficult(state, 'hld', 'caching', true, 1);
    state = update.markReviewed(state, 'difficult:hld:caching', true, 2);
    const reset = update.resetTrack(state, 'hld');
    expect(Object.keys(reset.saved)).toEqual(['lesson:java:oop']);
    expect(reset.difficult).toEqual({});
    expect(reset.reviewed).toEqual({});
  });
});
