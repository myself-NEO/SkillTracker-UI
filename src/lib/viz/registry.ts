import type { TopicId } from '@lib/topics';
import type { VizMode } from './types';
import { SLIDING_WINDOW_CODE } from './scenes/sliding-window/logic';

// Every animation scene: what it shows, where it is embedded, and how it can be played. The
// gallery (/visualize) and the content validator read this list; the parameter schemas are in
// ./schemas.ts and the players (browser code) in ./players.ts.

export interface SceneInfo {
  id: string;
  title: string;
  summary: string;
  topic: TopicId;
  /** The lesson the scene is embedded in. */
  lesson: string;
  /** Modes it can be played in; the first is the default. */
  modes: VizMode[];
  /** Code shown beside the scene, with frames pointing at its lines. */
  code?: { label: string; language: string; source: string };
}

export const SCENES: SceneInfo[] = [
  {
    id: 'hashmap-put',
    title: 'HashMap.put, step by step',
    summary: 'Hash spreading, the bucket index, chaining on a collision, and how a resize splits each chain.',
    topic: 'java',
    lesson: 'hashmap-internals',
    modes: ['stepper'],
  },
  {
    id: 'sliding-window',
    title: 'Sliding window: the largest sum of k elements',
    summary: 'The fixed-size window slides one element at a time: add the new element, drop the old one.',
    topic: 'dsa',
    lesson: 'sliding-window',
    modes: ['stepper'],
    code: { label: 'maxSumSubarray (Java)', language: 'java', source: SLIDING_WINDOW_CODE },
  },
  {
    id: 'consistent-hashing',
    title: 'Consistent hashing on a ring',
    summary:
      'Keys go to the first node clockwise; a joining or leaving node moves only its own arc, and virtual nodes even the arcs out.',
    topic: 'hld',
    lesson: 'consistent-hashing',
    modes: ['stepper'],
  },
  {
    id: 'load-balancer',
    title: 'Round robin with health checks',
    summary:
      'Requests spread across a pool in turn; a server that fails its health checks is skipped until it recovers.',
    topic: 'hld',
    lesson: 'load-balancers',
    modes: ['loop', 'stepper'],
  },
  {
    id: 'observer',
    title: 'Observer: one event, many listeners',
    summary: 'A subject publishes events to whoever is subscribed; listeners come and go without the subject changing.',
    topic: 'lld',
    lesson: 'observer',
    modes: ['loop', 'stepper'],
  },
  {
    id: 'gc-generations',
    title: 'Generational garbage collection',
    summary:
      'Allocation in Eden, minor collections copying survivors, promotion to the old generation, and a major GC.',
    topic: 'java',
    lesson: 'garbage-collection-basics',
    modes: ['scrolly', 'stepper'],
  },
  {
    id: 'request-journey',
    title: 'The journey of one HTTPS request',
    summary:
      'DNS, the TCP and TLS handshakes, the load balancer, the app server, the cache and the database, with the time each takes.',
    topic: 'hld',
    lesson: 'http-lifecycle',
    modes: ['scrolly', 'stepper'],
  },
];

export const sceneInfo = (id: string | undefined) => SCENES.find((scene) => scene.id === id);
