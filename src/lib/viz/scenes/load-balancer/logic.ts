import type { Frame } from '@lib/viz/types';

// load-balancer: requests flowing through a round-robin balancer to a pool of servers, one of
// which fails its health check, is skipped, and later rejoins.

export interface LoadBalancerParams {
  servers: number;
  /** Which server (0-based) fails its health check part-way through. */
  failing: number;
}

export const LOAD_BALANCER_DEFAULTS: LoadBalancerParams = { servers: 3, failing: 1 };

export interface LbServer {
  name: string;
  healthy: boolean;
  served: number;
}

export interface LoadBalancerState {
  servers: LbServer[];
  /** The request just sent, and to which server. */
  routed?: { id: number; to: number };
  /** The request waiting at the balancer. */
  next: number;
  /** The server whose health just changed. */
  changed?: number;
}

const NAMES = ['A', 'B', 'C', 'D', 'E'];

export const buildLoadBalancer = ({ servers: count, failing }: LoadBalancerParams): Frame<LoadBalancerState>[] => {
  const frames: Frame<LoadBalancerState>[] = [];
  const servers: LbServer[] = Array.from({ length: count }, (_, i) => ({
    name: `Server ${NAMES[i]}`,
    healthy: true,
    served: 0,
  }));
  let request = 1;
  let turn = 0;
  const snapshot = (extra: Partial<LoadBalancerState> = {}): LoadBalancerState => ({
    servers: servers.map((server) => ({ ...server })),
    next: request,
    ...extra,
  });
  const route = () => {
    // Round robin over the healthy servers only.
    for (let tries = 0; tries < count; tries++) {
      const candidate = (turn + tries) % count;
      if (servers[candidate].healthy) {
        turn = candidate + 1;
        servers[candidate].served += 1;
        const id = request++;
        const skipped = tries > 0;
        frames.push({
          caption: skipped
            ? `Request ${id} skips ${servers[(candidate - 1 + count) % count].name}, which is out of the pool, and goes to ${servers[candidate].name}.`
            : `Request ${id} goes to ${servers[candidate].name}, the next server in turn.`,
          state: snapshot({ routed: { id, to: candidate } }),
        });
        return;
      }
    }
  };

  frames.push({
    caption: `Requests arrive at the load balancer. Round robin sends each one to the next healthy server in turn.`,
    state: snapshot(),
  });
  for (let i = 0; i < count + 1; i++) route();
  servers[failing].healthy = false;
  frames.push({
    caption: `${servers[failing].name} fails its health checks. The balancer takes it out of the pool; no client sees an error.`,
    state: snapshot({ changed: failing }),
  });
  for (let i = 0; i < count; i++) route();
  servers[failing].healthy = true;
  frames.push({
    caption: `${servers[failing].name} passes its health checks again and rejoins the pool.`,
    state: snapshot({ changed: failing }),
  });
  for (let i = 0; i < count; i++) route();
  return frames;
};
