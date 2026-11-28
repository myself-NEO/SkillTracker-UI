import { readFileSync } from 'node:fs';
import path from 'node:path';
import { LESSON_SECTIONS as DSA_LESSON_SECTIONS } from '@content/dsa/formats';
import { LESSON_SECTIONS, PROBLEM_SECTIONS } from '@content/hld/formats';
import { flattenLessons } from '@content/shared/curriculum';
import { describe, expect, it } from 'vitest';
import { TRACKS } from '@lib/content/tracks';
import { checkFence, checkLink, duplicates, sectionProblems, type SiteRoutes } from '../content/checks';
import { scanMarkdown } from '../content/markdown-scan';

const fence = (lang: string, value: string, meta = '') => ({ lang, value, meta, line: 1 });

describe('checkFence', () => {
  it('accepts well-formed widgets and code', () => {
    expect(checkFence(fence('quiz', '? Q\n- a\n+ b'))).toEqual({ errors: [], warnings: [] });
    expect(checkFence(fence('java', 'int x;', 'file="A.java" java="21"'))).toEqual({ errors: [], warnings: [] });
    expect(checkFence(fence('mermaid', 'flowchart LR\n  A --> B'))).toEqual({ errors: [], warnings: [] });
  });

  it('reports quiz questions without a correct option', () => {
    expect(checkFence(fence('quiz', '? Q1\n- a\n+ b\n\n? Q2\n- c\n- d')).errors).toEqual([
      'quiz: 1 of 2 questions have no correct (+) option',
    ]);
  });

  it('reports empty widgets, bad drills and bad Java versions', () => {
    expect(checkFence(fence('checklist', 'no items')).errors).toEqual(['checklist has no "- " items']);
    expect(checkFence(fence('drill', '? Q\n= ?')).errors).toEqual(['drill: No valid "=" answer for: Q']);
    expect(checkFence(fence('java', '', 'java="latest"')).errors).toEqual([
      'java="latest" must be a Java release number',
    ]);
  });

  it('warns about unknown languages and Mermaid types', () => {
    expect(checkFence(fence('kotlin', 'val x = 1')).warnings).toHaveLength(1);
    expect(checkFence(fence('mermaid', 'sketchDiagram\n  A')).warnings).toHaveLength(1);
  });
});

describe('checkLink', () => {
  const routes: SiteRoutes = {
    pages: new Set(['/', '/java', '/java/records', '/java/problems/lru-cache', '/java/notebook', '/hld/cdn']),
  };

  it('resolves lesson:, problem: and absolute links', () => {
    expect(checkLink('lesson:records', '/java', routes)).toBe('ok');
    expect(checkLink('problem:lru-cache', '/java', routes)).toBe('ok');
    expect(checkLink('/hld/cdn#caching', '/java', routes)).toBe('ok');
    expect(checkLink('/java/notebook', '/java', routes)).toBe('ok');
  });

  it('reports links to pages that do not exist, and relative links', () => {
    expect(checkLink('lesson:enums', '/java', routes)).toEqual({
      broken: '"lesson:enums" points to /java/enums, which is not a page of the site',
    });
    expect(checkLink('records', '/java', routes)).toHaveProperty('broken');
  });

  it('leaves external links and in-page anchors alone', () => {
    expect(checkLink('https://openjdk.org', '/java', routes)).toBe('external');
    expect(checkLink('#internal-working', '/java', routes)).toBe('anchor');
  });
});

describe('sectionProblems and duplicates', () => {
  it('reports missing sections, then sections out of order', () => {
    expect(sectionProblems(['A', 'C'], ['A', 'B', 'C']).missing).toEqual(['B']);
    expect(sectionProblems(['A', 'X', 'C', 'B'], ['A', 'B', 'C']).outOfOrder).toEqual(['C']);
    expect(sectionProblems(['A', 'Extra', 'B'], ['A', 'B'])).toEqual({ missing: [], outOfOrder: [] });
  });

  it('finds repeated values', () => {
    expect(duplicates(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b']);
  });
});

describe('scanMarkdown', () => {
  it('finds links and widgets inside reveal blocks, with their lines, but not their headings', () => {
    const scanned = scanMarkdown(
      ['## Section', '', '````hint title="Hint"', '## Not a section', 'See [records](lesson:records).', '````'].join(
        '\n',
      ),
    );
    expect(scanned.headings.map((h) => h.text)).toEqual(['Section']);
    expect(scanned.links).toEqual([{ url: 'lesson:records', line: 5 }]);
    expect(scanned.fences.map((f) => f.lang)).toEqual(['hint']);
  });

  it('sees <details> blocks as the reveal blocks they render as', () => {
    expect(scanMarkdown('<details><summary>Answer</summary>Yes</details>').fences[0].lang).toBe('solution');
  });
});

describe('HLD section contracts', () => {
  const hldLessons = flattenLessons(TRACKS.hld).map(({ lesson }) => lesson);
  const sectionsOf = (file: string) =>
    scanMarkdown(readFileSync(path.join('content', 'hld', file), 'utf8'))
      .headings.filter((h) => h.depth === 2)
      .map((h) => h.text);

  it('are declared by the imported lessons', () => {
    expect(hldLessons.filter((lesson) => lesson.format).length).toBeGreaterThan(100);
  });

  it('are followed by every HLD lesson and problem', () => {
    for (const lesson of hldLessons.filter((l) => l.format && !l.comingSoon)) {
      expect(
        sectionProblems(
          sectionsOf(`lessons/${lesson.slug}.md`),
          LESSON_SECTIONS[lesson.format as keyof typeof LESSON_SECTIONS],
        ),
        lesson.slug,
      ).toEqual({ missing: [], outOfOrder: [] });
    }
    for (const problem of TRACKS.hld.problems) {
      expect(sectionProblems(sectionsOf(`problems/${problem.slug}.md`), PROBLEM_SECTIONS), problem.slug).toEqual({
        missing: [],
        outOfOrder: [],
      });
    }
    // Reads and parses every HLD file; allow for a busy machine running the other content tests.
  }, 30_000);

  it('catch a lesson that loses a required section', () => {
    const lesson = hldLessons.find((l) => l.format === 'concept')!;
    const body = readFileSync(path.join('content', 'hld', 'lessons', `${lesson.slug}.md`), 'utf8');
    const tampered = scanMarkdown(body.replace('## Failure scenarios', '## Failure modes'))
      .headings.filter((h) => h.depth === 2)
      .map((h) => h.text);
    expect(sectionProblems(tampered, LESSON_SECTIONS.concept).missing).toEqual(['Failure scenarios']);
  });
});

describe('DSA section contracts', () => {
  const dsaLessons = flattenLessons(TRACKS.dsa).map(({ lesson }) => lesson);
  const sectionsOf = (slug: string) =>
    scanMarkdown(readFileSync(path.join('content', 'dsa', 'lessons', `${slug}.md`), 'utf8'))
      .headings.filter((h) => h.depth === 2)
      .map((h) => h.text);

  it('are followed by every DSA lesson that declares a format', () => {
    const formatted = dsaLessons.filter((lesson) => lesson.format);
    expect(formatted.length).toBeGreaterThan(0);
    for (const lesson of formatted) {
      const required = DSA_LESSON_SECTIONS[lesson.format as keyof typeof DSA_LESSON_SECTIONS];
      expect(required, `${lesson.slug} has an unknown format`).toBeDefined();
      expect(sectionProblems(sectionsOf(lesson.slug), required), lesson.slug).toEqual({ missing: [], outOfOrder: [] });
    }
    // Reads and parses every formatted DSA lesson, like the HLD check above.
  }, 30_000);

  it('end every formatted lesson with key takeaways and a knowledge check quiz', () => {
    for (const lesson of dsaLessons.filter((l) => l.format)) {
      const body = readFileSync(path.join('content', 'dsa', 'lessons', `${lesson.slug}.md`), 'utf8');
      const check = body.slice(body.indexOf('## Knowledge check'));
      expect(
        scanMarkdown(check).fences.map((fence) => fence.lang),
        lesson.slug,
      ).toContain('quiz');
    }
  });
});
