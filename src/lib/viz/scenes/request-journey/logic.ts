import type { Frame } from '@lib/viz/types';

// request-journey: one HTTPS request from the browser to the data and back, hop by hop, with a
// running estimate of where the time goes. Seven frames, one per step of the scroll-driven
// explainer in the HTTP lifecycle lesson.

export interface RequestJourneyParams {
  /** Round-trip time between the browser and the data centre, in milliseconds. */
  rttMs: number;
  /** Whether the cache has the answer (skips the database). */
  cacheHit: boolean;
}

export const REQUEST_JOURNEY_DEFAULTS: RequestJourneyParams = { rttMs: 30, cacheHit: false };

export const HOPS = ['Browser', 'DNS resolver', 'Load balancer', 'App server', 'Cache', 'Database'] as const;
export type Hop = (typeof HOPS)[number];

/** What the time was spent on: looking up the name, crossing the network, or working on servers. */
export type TimeKind = 'dns' | 'network' | 'server';

export interface JourneyState {
  /** The hops this frame is about. */
  active: Hop[];
  /** Hops the request has already passed through. */
  visited: Hop[];
  /** Milliseconds spent so far, by phase. */
  spent: { label: string; ms: number; kind: TimeKind }[];
  returning?: boolean;
}

export const buildRequestJourney = ({ rttMs, cacheHit }: RequestJourneyParams): Frame<JourneyState>[] => {
  const spent: JourneyState['spent'] = [];
  const add = (label: string, ms: number, kind: TimeKind) => spent.push({ label, ms, kind });
  const frame = (caption: string, active: Hop[], visited: Hop[], returning = false): Frame<JourneyState> => ({
    caption,
    state: { active, visited, spent: spent.map((part) => ({ ...part })), returning },
  });

  const frames: Frame<JourneyState>[] = [];
  add('DNS', 20, 'dns');
  frames.push(
    frame(
      'DNS: the browser asks a resolver for the name and gets the load balancer’s IP address.',
      ['Browser', 'DNS resolver'],
      ['Browser'],
    ),
  );
  add('TCP', rttMs, 'network');
  frames.push(
    frame(
      'TCP: a three-way handshake with the load balancer costs one round trip.',
      ['Browser', 'Load balancer'],
      ['Browser', 'DNS resolver'],
    ),
  );
  add('TLS', rttMs, 'network');
  frames.push(
    frame(
      'TLS 1.3: one more round trip agrees the keys; the load balancer terminates TLS.',
      ['Browser', 'Load balancer'],
      ['Browser', 'DNS resolver'],
    ),
  );
  add('Request', rttMs / 2, 'network');
  add('LB → app', 1, 'server');
  frames.push(
    frame(
      'The request reaches the load balancer, which forwards it over a pooled connection to a healthy app server.',
      ['Load balancer', 'App server'],
      ['Browser', 'DNS resolver', 'Load balancer'],
    ),
  );
  add('Cache', 1, 'server');
  frames.push(
    frame(
      cacheHit
        ? 'The app server checks the cache: a hit, answered in about a millisecond.'
        : 'The app server checks the cache first: a miss.',
      ['App server', 'Cache'],
      ['Browser', 'DNS resolver', 'Load balancer', 'App server'],
    ),
  );
  if (!cacheHit) add('Database', 10, 'server');
  frames.push(
    frame(
      cacheHit
        ? 'With a hit, the database is never touched.'
        : 'On the miss it queries the database, then fills the cache for the next request.',
      cacheHit ? ['App server'] : ['App server', 'Database'],
      ['Browser', 'DNS resolver', 'Load balancer', 'App server', 'Cache'],
    ),
  );
  add('Response', rttMs / 2, 'network');
  frames.push(
    frame(
      'The response travels back the same way. Most of the time went to round trips, not to the servers.',
      ['Browser', 'Load balancer', 'App server'],
      [...HOPS],
      true,
    ),
  );
  return frames;
};
