import { describe, expect, it } from 'vitest';
import { parseChecklist, parseDrills, parseQuiz } from '@lib/widgets/formats';
import { transformUrl } from '@lib/markdown/links';

describe('parseQuiz', () => {
  const source = [
    '? What is 2 + 2?',
    '- 3',
    '! Off by one',
    '+ 4',
    '> Basic arithmetic.',
    '',
    '? A question without a correct option',
    '- a',
    '- b',
  ].join('\n');

  it('reads prompts, options, reasons and explanations', () => {
    const [question] = parseQuiz(source);
    expect(question).toEqual({
      prompt: 'What is 2 + 2?',
      options: [
        { text: '3', correct: false, reason: 'Off by one' },
        { text: '4', correct: true },
      ],
      explanation: 'Basic arithmetic.',
    });
  });

  it('drops questions that have no correct option', () => {
    expect(parseQuiz(source)).toHaveLength(1);
  });
});

describe('parseChecklist', () => {
  it('reads "- " items with or without task boxes', () => {
    expect(parseChecklist('- one\n- [ ] two\n- [x] three\nnot an item')).toEqual(['one', 'two', 'three']);
  });
});

describe('parseDrills', () => {
  it('reads answers, tolerances and solutions', () => {
    const { questions, errors } = parseDrills('? Requests per second?\n= 1157/s\n~ 1.5\n> 100M / 86,400');
    expect(errors).toEqual([]);
    expect(questions[0]).toMatchObject({ prompt: 'Requests per second?', answer: 1157, tolerance: 1.5 });
  });

  it('reports questions without a usable answer', () => {
    expect(parseDrills('? Broken\n= no number here').errors).toEqual(['No valid "=" answer for: Broken']);
  });
});

describe('transformUrl', () => {
  it('resolves lesson: and problem: links within the track', () => {
    expect(transformUrl('lesson:records', '/java')).toBe('/java/records');
    expect(transformUrl('problem:lru-cache', '/java')).toBe('/java/problems/lru-cache');
  });

  it('keeps safe URLs and drops dangerous ones', () => {
    expect(transformUrl('https://openjdk.org', '/java')).toBe('https://openjdk.org');
    expect(transformUrl('/hld/cdn#caching', '/java')).toBe('/hld/cdn#caching');
    expect(transformUrl('javascript:alert(1)', '/java')).toBe('');
  });
});
