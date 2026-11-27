import type { TopicId } from '@lib/topics';

// The pages of each topic besides lessons and problems, in the order of the topic's tab bar.

export type SectionId = 'roadmap' | 'problems' | 'interview' | 'notes' | 'estimator' | 'notebook' | 'progress';

export interface TopicSection {
  id: SectionId;
  label: string;
  href: string;
}

const SECTIONS: Record<TopicId, [SectionId, string][]> = {
  java: [
    ['roadmap', 'Roadmap'],
    ['problems', 'Coding exercises'],
    ['interview', 'Interview prep'],
    ['notebook', 'Notebook'],
    ['progress', 'Progress'],
  ],
  dsa: [
    ['roadmap', 'Roadmap'],
    ['problems', 'Coding questions'],
    ['notes', 'Interview notes'],
    ['progress', 'Progress'],
  ],
  lld: [
    ['roadmap', 'Roadmap'],
    ['problems', 'Practice problems'],
    ['interview', 'Mock interviews'],
    ['notebook', 'Notebook'],
    ['progress', 'Progress'],
  ],
  hld: [
    ['roadmap', 'Roadmap'],
    ['problems', 'Practice problems'],
    ['interview', 'Mock interviews'],
    ['estimator', 'Estimator'],
    ['notebook', 'Notebook'],
    ['progress', 'Progress'],
  ],
};

export const topicSections = (topic: TopicId): TopicSection[] =>
  SECTIONS[topic].map(([id, label]) => ({ id, label, href: id === 'roadmap' ? `/${topic}` : `/${topic}/${id}` }));

/** Whether a topic has the section, e.g. only HLD has the estimator. */
export const hasSection = (topic: TopicId, id: SectionId) => SECTIONS[topic].some(([section]) => section === id);
