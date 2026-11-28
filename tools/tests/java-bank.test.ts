import { describe, expect, it } from 'vitest';
import { INTERVIEW_TOPICS } from '@content/java/interview';
import { BANK_TOPICS, bankProgress, bankTopic, kindLabel, practised, TRICKY } from '@lib/interview/java-bank';
import { inlineCodeParts } from '@lib/markdown/inline-code';
import { EMPTY_NOTEBOOK, notebookUpdates } from '@lib/progress/notebook';

// The Java interview question bank's helpers.

describe('Java question bank', () => {
  it('has its topics, then the tricky questions', () => {
    expect(BANK_TOPICS.map((topic) => topic.id)).toEqual([...INTERVIEW_TOPICS.map((topic) => topic.id), 'tricky']);
    expect(bankTopic('tricky')).toBe(TRICKY);
    expect(bankTopic('collections')?.title).toBe('Collections');
    expect(bankTopic('nope')).toBeUndefined();
    expect(kindLabel('output')).toBe('Output prediction');
  });

  it('counts what was practised and how it went', () => {
    let notebook = notebookUpdates.updateQuestion(EMPTY_NOTEBOOK, 'java', 'a', { draft: 'my answer' });
    notebook = notebookUpdates.updateQuestion(notebook, 'java', 'b', { draft: '   ' }); // a blank draft isn't practice
    notebook = notebookUpdates.updateQuestion(notebook, 'java', 'c', { revealedAt: 5 });
    notebook = notebookUpdates.rateQuestion(notebook, 'java', 'c', 'missed', 6);
    notebook = notebookUpdates.rateQuestion(notebook, 'lld', 'a', 'got-it', 7); // another track
    expect(practised(notebook, 'a')).toBe(true);
    expect(practised(notebook, 'b')).toBe(false);
    expect(bankProgress(notebook, ['a', 'b', 'c', 'd'])).toEqual({ practised: 2, gotIt: 0, partial: 0, missed: 1 });
  });

  it("shows a title's inline code as code", () => {
    expect(inlineCodeParts('Why is `String` immutable?')).toEqual([
      { code: false, text: 'Why is ' },
      { code: true, text: 'String' },
      { code: false, text: ' immutable?' },
    ]);
    expect(inlineCodeParts('`a` or `b`')).toEqual([
      { code: true, text: 'a' },
      { code: false, text: ' or ' },
      { code: true, text: 'b' },
    ]);
    expect(inlineCodeParts('No code, and a lone ` backtick')).toEqual([{ code: false, text: 'No code, and a lone ` backtick' }]);
  });
});
