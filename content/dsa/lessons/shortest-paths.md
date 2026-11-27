## The idea

[BFS](lesson:breadth-first-search) already finds shortest paths when every edge costs the same. Once weights enter the picture, choose by the weights and by the question:
- **Dijkstra** (non-negative weights, one source) is greedy: always expand the closest node not yet finalised, using a min-heap of best-known distances.
- **Bellman-Ford** (negative weights allowed) relaxes every edge, V − 1 times; a V-th round that still improves something reveals a negative cycle.
- **Floyd–Warshall** (all pairs, small graphs) is a DP over which intermediate nodes a path may use.

## When to use it

| Situation | Algorithm |
|---|---|
| Unweighted | BFS |
| Weights of only 0 and 1 | [0-1 BFS](lesson:multi-source-and-0-1-bfs) |
| Weighted, non-negative, single source | Dijkstra |
| Weighted, negative edges possible, or a limit on the number of edges | Bellman-Ford |
| All pairs, small graph | Floyd–Warshall |
| A known DAG | [topological order](lesson:topological-sort), then one O(V + E) relaxation pass |

Signals in the statement: "minimum cost path", "cheapest", "network delay", explicit weighted edges.

## How it works

- **Why Dijkstra is correct:** once a node is popped from the heap, its distance is *final*. Any other route to it would have to leave the finalised region through a node that's at least as far away (otherwise the heap would have offered that node first), and with non-negative weights a path can only get longer. **Negative weights break exactly this guarantee:** a node that looked farther could lead somewhere cheaper later, and the algorithm silently returns wrong answers.
- **Lazy deletion:** Java's `PriorityQueue` has no efficient decrease-key operation, so push a *new* entry every time a distance improves, and skip stale entries when they surface: `if (d > dist[u]) continue;`. That's the line people forget under pressure (the [PriorityQueue lesson](lesson:java-priorityqueue) explains the pattern).
- **Why Bellman-Ford takes V − 1 rounds:** a shortest path uses at most V − 1 edges, and after round i, every shortest path of up to i edges has been fully relaxed.
- **Why Floyd–Warshall's k loop must be outermost:** when the loop reaches k, `dist[i][j]` holds the shortest path using only the intermediates `{0, …, k−1}`, and allowing k as well is the DP step. With k inside, `dist[i][k]` and `dist[k][j]` wouldn't be final yet.

## Java template

```java
public int[] dijkstra(int n, List<List<int[]>> adj, int src) {   // adj: {neighbour, weight}
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    // {distance, node}, min-heap by distance
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    pq.offer(new int[]{0, src});

    while (!pq.isEmpty()) {
        int[] top = pq.poll();
        int d = top[0], u = top[1];
        if (d > dist[u]) continue;            // ← LAZY DELETION: stale entry, skip it

        for (int[] edge : adj.get(u)) {
            int v = edge[0], w = edge[1];
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.offer(new int[]{dist[v], v});   // push a NEW entry instead of updating
            }
        }
    }
    return dist;
}
```

## Worked examples

### Network Delay Time (LC 743)

A signal leaves node k; how long until every node has it? That's the largest shortest-path distance from k, or −1 if some node is unreachable:

```java
public int networkDelayTime(int[][] times, int n, int k) {
    List<List<int[]>> adj = new ArrayList<>();
    for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
    for (int[] t : times) adj.get(t[0]).add(new int[]{t[1], t[2]});
    int[] dist = dijkstra(n + 1, adj, k);                    // nodes are numbered from 1
    int worst = 0;
    for (int v = 1; v <= n; v++) {
        if (dist[v] == Integer.MAX_VALUE) return -1;          // this node never gets the signal
        worst = Math.max(worst, dist[v]);
    }
    return worst;
}
```

### Bellman-Ford, with negative-cycle detection

```java
// Shortest distances from src with negative edges allowed; null if a negative cycle is reachable.
public int[] bellmanFord(int n, int[][] edges, int src) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    for (int i = 0; i < n - 1; i++) {
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], w = edge[2];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
            }
        }
    }

    // one extra round: if anything still improves, distances would shrink forever
    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];
        if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) return null;
    }
    return dist;
}
```

It works straight from an edge list. Reach for it only when the problem allows negative weights, asks about a cycle that could shrink a cost forever (arbitrage), or limits the number of edges.

### Cheapest Flights Within K Stops (LC 787)

At most k stops means at most k + 1 flights: exactly k + 1 rounds of Bellman-Ford. Each round must relax from **last round's** distances, or a single round could chain several flights together:

```java
public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    for (int round = 0; round <= k; round++) {            // at most k stops = k + 1 flights
        int[] next = dist.clone();                         // relax from LAST round's values only
        for (int[] f : flights) {
            int u = f[0], v = f[1], price = f[2];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + price < next[v]) next[v] = dist[u] + price;
        }
        dist = next;
    }
    return dist[dst] == Integer.MAX_VALUE ? -1 : dist[dst];
}
```

Dijkstra also works if each state is (node, stops used), but plain Dijkstra on nodes alone gives wrong answers here: a cheaper route that uses more stops can block a dearer route with fewer.

### Floyd–Warshall: all pairs

```java
static final int INF = Integer.MAX_VALUE / 2;     // INF + INF still fits in an int

public int[][] floydWarshall(int n, int[][] dist) {
    // dist[i][j]: the edge weight if there is one, 0 on the diagonal, INF otherwise
    for (int k = 0; k < n; k++) {                  // the intermediate node: MUST be the outermost loop
        for (int i = 0; i < n; i++) {
            if (dist[i][k] == INF) continue;       // no path from i to k
            for (int j = 0; j < n; j++) {
                if (dist[k][j] == INF) continue;   // no path from k to j
                if (dist[i][k] + dist[k][j] < dist[i][j]) dist[i][j] = dist[i][k] + dist[k][j];
            }
        }
    }
    return dist;
}
```

**Watch the sentinel:** "no edge" as `Integer.MAX_VALUE` overflows the moment two are added. After the run, any `dist[i][i] < 0` means a negative cycle. It's only practical for small graphs (roughly V ≤ 400–500).

## Complexity

| Algorithm | Time | Space |
|---|---|---|
| Dijkstra, binary heap with lazy deletion | O(E log E) ≈ O(E log V) | O(V + E) |
| Bellman-Ford | O(V · E) | O(V) |
| Floyd–Warshall | O(V³) | O(V²) |
| A DAG, relaxing in topological order | O(V + E) | O(V) |

With lazy deletion the heap can hold up to E entries. An indexed heap with decrease-key keeps at most V; a Fibonacci heap gives O(E + V log V) in theory, but loses to the constant factors in practice.

## Variations

- **Shortest paths in a DAG:** [topologically sort](lesson:topological-sort) it, then relax the edges in that order in one O(V + E) pass. No heap is needed, because every node's predecessors come first. Negative weights are fine too.
- **Minimax paths:** in Path With Minimum Effort (LC 1631), a path's cost is its *largest* step, so relax with `max(dist[u], step)` instead of a sum; Dijkstra's argument still holds. Swim in Rising Water (LC 778) is the same idea.
- **Extra state:** "with at most k stops", "having collected these keys": make the state (node, extra), and run the same algorithm over states.
- **A\*** is Dijkstra plus a heuristic estimate of the remaining distance; name it for point-to-point searches on maps and grids.

## Common mistakes

- **Running Dijkstra with negative weights.** It fails silently: no exception, just a wrong answer.
- **Forgetting the stale-entry check**, or trying to update an entry in place in the `PriorityQueue`.
- **A subtracting comparator**, `(a, b) -> a[0] - b[0]`, which overflows for large distances: use `Integer.compare`.
- **Adding a weight to `Integer.MAX_VALUE`**: guard "unreachable" before relaxing, or use `MAX_VALUE / 2`.
- **Putting k anywhere but the outermost loop** in Floyd–Warshall.
- **Relaxing in place** in Cheapest Flights, which lets one round use several flights.

## Practice

Network Delay Time (LC 743), Path With Minimum Effort (LC 1631), Cheapest Flights Within K Stops (LC 787), Swim in Rising Water (LC 778), Find the City With the Smallest Number of Neighbors at a Threshold Distance (LC 1334), Number of Ways to Arrive at Destination (LC 1976).

## Key takeaways

- Unweighted: BFS. Non-negative weights: Dijkstra. Negative weights or a cap on the number of edges: Bellman-Ford. All pairs on a small graph: Floyd–Warshall.
- Dijkstra finalises each node when it's popped; negative weights break that.
- In Java, push improved distances as new heap entries and skip the stale ones.
- Bellman-Ford runs V − 1 rounds; an improvement in round V means a negative cycle.
- Floyd–Warshall's intermediate-node loop is outermost; use a sentinel that can't overflow.

## Knowledge check

```quiz
? Why does Dijkstra fail with negative edge weights?
+ It finalises a node when it's popped, but a negative edge could later give a cheaper route to it
- Because the priority queue can't hold negative numbers
! It can; the reasoning is what breaks.
- Because it would loop forever
! It terminates, with wrong answers.
- It doesn't fail; it just runs more slowly
! It can return distances that are too large.
> Use Bellman-Ford when weights can be negative.

? What does `if (d > dist[u]) continue;` do in Dijkstra?
+ It skips a stale heap entry, left over from before u's distance improved
- It stops the search early
! It skips one entry; the loop continues.
- It detects negative cycles
! Dijkstra doesn't detect cycles.
- It breaks ties between equal distances
! Ties aren't the issue; outdated entries are.
> Java's PriorityQueue has no decrease-key, so duplicates are pushed and filtered.

? Why must Floyd–Warshall's k loop be the outermost?
+ When it reaches k, every dist[i][j] must already be the best path using intermediates 0..k−1; with k inside, those values aren't final yet
- For cache efficiency
! It's about correctness.
- Because k is the source node
! k is the intermediate node.
- The order doesn't matter
! Other orders can return non-shortest distances.
> It's a DP over the allowed intermediate nodes.

? In Cheapest Flights Within K Stops, why relax each round from a copy of the previous round's distances?
+ So each round adds at most one flight; relaxing in place could chain several flights in one round and break the stop limit
- To save memory
! The copy costs memory.
- Because Bellman-Ford requires a copy
! Plain Bellman-Ford relaxes in place; the stop limit is what needs the copy.
- To avoid negative cycles
! Prices are non-negative here.
> k stops means exactly k + 1 rounds.
```
