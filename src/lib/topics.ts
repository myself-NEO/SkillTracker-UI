import type { TrackId } from '@content/shared/types';

// The four topics TheSWEguide covers, in the order the homepage shows them. Each topic is one
// learning track of the content (content/<topic>/index.ts).

export type TopicId = TrackId;

export const TOPIC_IDS = ['java', 'dsa', 'lld', 'hld'] as const satisfies readonly TopicId[];

export const isTopicId = (value: string): value is TopicId => (TOPIC_IDS as readonly string[]).includes(value);

export interface Topic {
  id: TopicId;
  /** Full name, e.g. "Low-Level Design". */
  title: string;
  /** Short label for navigation, e.g. "LLD". */
  shortTitle: string;
  /** One sentence for the topic's card on the homepage. */
  blurb: string;
}

export const TOPICS: readonly Topic[] = [
  {
    id: 'java',
    title: 'Java',
    shortTitle: 'Java',
    blurb: 'From your first program to JVM internals, concurrency and modern Java.',
  },
  {
    id: 'dsa',
    title: 'Data Structures & Algorithms',
    shortTitle: 'DSA',
    blurb: 'The data structures and patterns behind every coding interview, with Java templates.',
  },
  {
    id: 'lld',
    title: 'Low-Level Design',
    shortTitle: 'LLD',
    blurb: 'Object-oriented design, SOLID, design patterns and classic machine-coding problems.',
  },
  {
    id: 'hld',
    title: 'High-Level Design',
    shortTitle: 'HLD',
    blurb: 'Distributed systems: scaling, caching, messaging, storage and full system design walkthroughs.',
  },
];
