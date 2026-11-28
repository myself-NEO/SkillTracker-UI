import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseInterviewScript } from '@content/hld/interview';
import { parseLldInterviewScript } from '@content/lld/interview';
import { hasProblemBody } from '@content/shared/loaders';
import { describe, expect, it } from 'vitest';
import { TRACKS } from '@lib/content/tracks';
import { appendLine, arrow, isFlowchart, nextId, nodeIds } from '@lib/diagrams/flowchart';
import {
  formatClock,
  hldPhaseLabel,
  hldPhaseReference,
  joinSections,
  lldImplementationReference,
  lldTypeItems,
  MOCK_KITS,
  type MockKit,
  unwrapSolution,
} from '@lib/interview/mock';

// The LLD and HLD mock interviews: their kits, the helpers the phase screens share, and the
// interview scripts of every written problem (the content build parses the same breakdowns).

const KITS = Object.entries(MOCK_KITS) as ['lld' | 'hld', MockKit][];

const breakdown = (topic: 'lld' | 'hld', slug: string) =>
  readFileSync(path.resolve(__dirname, '../../content', topic, 'problems', `${slug}.md`), 'utf8').replace(/\r\n?/g, '\n');

const written = (topic: 'lld' | 'hld') =>
  TRACKS[topic].problems.filter((problem) => hasProblemBody(topic, problem.slug)).map((problem) => problem.slug);

describe('mock interview kits', () => {
  it.each(KITS)('%s: phases run from the clarifying questions to the self-evaluation, each timed one with a budget and a guide', (_, kit) => {
    const ids = kit.phases.map((phase) => phase.id);
    expect(ids[0]).toBe('clarify');
    expect(ids.at(-1)).toBe('evaluation');
    expect(new Set(ids).size).toBe(ids.length);
    for (const minutes of [45, 60] as const) {
      const timed = ids.filter((id) => id !== 'evaluation');
      for (const id of timed) expect(kit.budgets[minutes][id], `${id} (${minutes} min)`).toBeGreaterThan(0);
      expect(timed.reduce((sum, id) => sum + kit.budgets[minutes][id], 0)).toBeLessThanOrEqual(minutes);
      for (const id of timed) expect(kit.guide[id]?.hints.length, id).toBeGreaterThan(0);
    }
  });

  it.each(KITS)('%s: the rubric has one entry per dimension', (_, kit) => {
    expect(kit.rubric.length).toBeGreaterThanOrEqual(6);
    expect(new Set(kit.rubric.map((dimension) => dimension.id)).size).toBe(kit.rubric.length);
  });

  it.each(KITS)('%s: questions asking the interviewer to decide get the "your call" reply', (_, kit) => {
    expect(kit.designChoice.test('Which database should I use?')).toBe(true);
    expect(kit.designChoice.test('Should we use a queue here?')).toBe(true);
    expect(kit.designChoice.test('How many users are there?')).toBe(false);
  });
});

describe('mock interview helpers', () => {
  it('joins breakdown sections under their titles, a level above their own subsections', () => {
    const sections = { A: 'Intro\n\n### Detail\n\ntext', B: '', C: 'More' };
    expect(joinSections(sections, ['A', 'B', 'C', 'Missing'])).toBe('### A\n\nIntro\n\n#### Detail\n\ntext\n\n### C\n\nMore');
  });

  it('drops a solution wrapper, so the revealed reference needs no second click', () => {
    expect(unwrapSolution('Before\n\n````solution title="Code"\n```java\nint x;\n```\n````\n')).toBe('Before\n\n```java\nint x;\n```\n');
    expect(unwrapSolution('No wrapper')).toBe('No wrapper');
  });

  it('formats the clock as minutes and seconds', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(65_400)).toBe('1:05');
    expect(formatClock(60 * 60_000)).toBe('60:00');
    expect(formatClock(-5)).toBe('0:00');
  });

  it('finds the nodes of a flowchart and the next free id', () => {
    const source = 'flowchart LR\n  C1[Client]:::client --> LB1[Load balancer]\n  LB1 -->|HTTP| S1 & S2\n  %% S9 is a comment\n  classDef x fill:#fff';
    expect(nodeIds(source)).toEqual(['C1', 'LB1', 'S1', 'S2']);
    expect(nextId(source, 'S')).toBe('S3');
    expect(nextId(source, 'DB')).toBe('DB1');
    expect(isFlowchart(source)).toBe(true);
    expect(isFlowchart('%% a note\ngraph TD\n  A --> B')).toBe(true);
    expect(isFlowchart('sequenceDiagram\n  A->>B: hi')).toBe(false);
  });

  it('adds lines to a diagram, starting a flowchart when it is empty', () => {
    expect(appendLine('', 'C1[Client]')).toBe('flowchart LR\n  C1[Client]\n');
    expect(appendLine('flowchart LR\n  A --> B\n\n', 'B --> C')).toBe('flowchart LR\n  A --> B\n  B --> C\n');
    expect(arrow('A', 'B')).toBe('A --> B');
    expect(arrow('A', 'B', ' reads | writes ')).toBe('A -->|reads / writes| B');
  });
});

describe.each(written('hld'))('HLD mock interview: %s', (slug) => {
  const script = parseInterviewScript(breakdown('hld', slug));

  it('has the brief, the interviewer’s answers, requirements to cover, deep dives and a checklist', () => {
    expect(script.prompt.trim()).not.toBe('');
    expect(script.clarifications.length).toBeGreaterThanOrEqual(5);
    expect(script.functional.length).toBeGreaterThan(0);
    expect(script.nonFunctional.length).toBeGreaterThan(0);
    expect(script.deepDives.length).toBeGreaterThan(0);
    expect(script.checklist.length).toBeGreaterThan(0);
    expect(hldPhaseReference(script, 'api')).toContain('### API design');
    expect(hldPhaseLabel(script, 'estimation')).toBe('Capacity estimation');
  });

  it('answers each of its clarifying questions when asked word for word', () => {
    script.clarifications.forEach((item, i) => {
      expect(MOCK_KITS.hld.matcher.matchClarification(item.question, script.clarifications)?.index, item.question).toBe(i);
    });
  });
});

describe.each(written('lld'))('LLD mock interview: %s', (slug) => {
  const script = parseLldInterviewScript(breakdown('lld', slug));

  it('has the brief, the interviewer’s answers, requirements, a class diagram, the core flow and a checklist', () => {
    expect(script.prompt.trim()).not.toBe('');
    expect(script.clarifications.length).toBeGreaterThanOrEqual(5);
    expect(script.requirements.flatMap((group) => group.items).length).toBeGreaterThan(0);
    expect(lldTypeItems(script).length).toBeGreaterThan(0);
    expect(script.design.length).toBeGreaterThan(0);
    expect(lldImplementationReference(script).markdown).toMatch(/^### Step \d+ — Implementation/);
    expect(script.followUps.length).toBeGreaterThan(0);
    expect(script.checklist.length).toBeGreaterThan(0);
  });

  it('answers each of its clarifying questions when asked word for word', () => {
    script.clarifications.forEach((item, i) => {
      expect(MOCK_KITS.lld.matcher.matchClarification(item.question, script.clarifications)?.index, item.question).toBe(i);
    });
  });
});
