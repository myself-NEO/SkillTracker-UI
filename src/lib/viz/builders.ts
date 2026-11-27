import type { Frame } from './types';
import { buildConsistentHashing } from './scenes/consistent-hashing/logic';
import { buildGcGenerations } from './scenes/gc-generations/logic';
import { buildHashmapPut } from './scenes/hashmap-put/logic';
import { buildLoadBalancer } from './scenes/load-balancer/logic';
import { buildObserver } from './scenes/observer/logic';
import { buildRequestJourney } from './scenes/request-journey/logic';
import { buildSlidingWindow } from './scenes/sliding-window/logic';

// Each scene's frames as a pure function of its parameters. The content validator uses these
// (a scrolly block needs one step per frame), and so do the tests; the players in ./players.ts
// wrap the same functions for the browser.

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each builder takes its own scene's parameters.
export const BUILDERS: Record<string, (params: any) => Frame<unknown>[]> = {
  'hashmap-put': buildHashmapPut,
  'sliding-window': buildSlidingWindow,
  'consistent-hashing': buildConsistentHashing,
  'load-balancer': buildLoadBalancer,
  observer: buildObserver,
  'gc-generations': buildGcGenerations,
  'request-journey': buildRequestJourney,
};
