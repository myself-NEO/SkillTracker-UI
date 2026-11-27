## The idea

DP works on any graph whose transitions form a **DAG** (a directed graph with no cycles): process the nodes so every node comes after all the nodes it depends on, and compute each state once. Memoized DFS does that automatically, and a [topological order](lesson:topological-sort) does it with a loop.

It shows up two ways:
- **The input is secretly a DAG**: a grid where you may only move to a strictly larger value, or one-way edges with no cycles. The first job is convincing yourself there are no cycles, because that's what makes memoization safe.
- **A budget dimension layered onto nodes**: "at most k stops", "the number of shortest paths". The state becomes (node, extra).

## When to use it

- "The longest path" where movement follows a strict order (increasing values, a DAG of tasks).
- "How many ways / paths from A to B" in a DAG.
- A shortest-path question with an extra constraint or count: at most k edges, the number of shortest routes.

## How it works

- **Check for cycles first.** Memoized DFS on a cyclic transition graph either loops forever or caches values that depend on themselves. If cycles are possible, use [shortest-path algorithms](lesson:shortest-paths) or explicit [cycle detection](lesson:cycle-detection) instead.
- **Memoized DFS:** `dp(v)` depends on `dp` of v's successors; the recursion visits them first, and the cache makes every node O(1) after its first visit.
- **Order matters for in-place updates.** With a step budget, each round must read the **previous** round's values, or one round can chain several edges. That's the same "which snapshot am I reading?" question as [0/1 knapsack's](lesson:knapsack-dp) backward loop.

## Java template

```java
int dp(int v) {
    if (memo[v] != UNSET) return memo[v];
    int best = BASE;                          // the answer if v has no successors
    for (int next : successors(v)) {
        best = combine(best, dp(next));       // max for longest paths, + for counting
    }
    return memo[v] = best;
}
```

## Worked examples

### Longest Increasing Path in a Matrix (LC 329)

The longest strictly increasing path in a grid, moving up, down, left or right.

**The DAG insight comes first.** Draw an edge from each cell to every neighbour with a *strictly greater* value. A cycle would need values that increase all the way around and return to the start, which is impossible. So although the grid looks like an undirected graph, the moves that matter form a DAG, and memoized DFS is safe.

- *State:* `dp[i][j]` = the longest increasing path **starting** at `(i, j)`.
- *Recurrence:* `1 + max over strictly greater neighbours of dp[neighbour]`, or 1 at a local maximum.

```java
static int[][] memo;
static int[][] matrix;
static int rows, cols;
static int[] dr = {-1,1,0,0}, dc = {0,0,-1,1};

static int longestIncreasingPath(int[][] inputMatrix) {
    matrix = inputMatrix;
    rows = matrix.length; cols = matrix[0].length;
    memo = new int[rows][cols];
    int best = 0;
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < cols; j++)
            best = Math.max(best, dfs(i, j));
    return best;
}

static int dfs(int i, int j) {
    if (memo[i][j] != 0) return memo[i][j];
    int best = 1;
    for (int d = 0; d < 4; d++) {
        int ni = i + dr[d], nj = j + dc[d];
        if (ni >= 0 && ni < rows && nj >= 0 && nj < cols && matrix[ni][nj] > matrix[i][j]) {
            best = Math.max(best, 1 + dfs(ni, nj));
        }
    }
    memo[i][j] = best;
    return best;
}
```

`[[9,9,4],[6,6,8],[2,1,1]]` gives 4 (1 → 2 → 6 → 9). Each cell is computed once, so it's O(m · n), where an unmemoized DFS from every cell would explode exactly like [naive Fibonacci](lesson:what-is-dynamic-programming). Say the "no cycles" argument out loud before coding: it's what justifies the whole approach.

### Number of Ways to Arrive at Destination (LC 1976)

Count the shortest routes from node 0 to node n − 1 (weights positive, answer modulo 10⁹ + 7). Run [Dijkstra](lesson:shortest-paths), and carry a DP alongside the distances: `ways[v]` = the number of shortest routes to v. The edges that lie on shortest paths form a DAG, and Dijkstra pops nodes in an order that respects it.

```java
public int countPaths(int n, int[][] roads) {
    final int MOD = 1_000_000_007;
    List<List<int[]>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (int[] r : roads) {
        adj.get(r[0]).add(new int[]{r[1], r[2]});
        adj.get(r[1]).add(new int[]{r[0], r[2]});
    }
    long[] dist = new long[n];
    long[] ways = new long[n];
    Arrays.fill(dist, Long.MAX_VALUE);
    dist[0] = 0;
    ways[0] = 1;
    PriorityQueue<long[]> pq = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
    pq.offer(new long[]{0, 0});
    while (!pq.isEmpty()) {
        long[] top = pq.poll();
        long d = top[0];
        int u = (int) top[1];
        if (d > dist[u]) continue;                              // stale entry
        for (int[] e : adj.get(u)) {
            int v = e[0];
            long nd = d + e[1];
            if (nd < dist[v]) {                                 // a strictly shorter route: reset the count
                dist[v] = nd;
                ways[v] = ways[u];
                pq.offer(new long[]{nd, v});
            } else if (nd == dist[v]) {                         // another shortest route: add its ways
                ways[v] = (ways[v] + ways[u]) % MOD;
            }
        }
    }
    return (int) ways[n - 1];
}
```

When u is popped, every shortest route into it has already been counted (all its shortest-path predecessors are strictly closer, so they were popped first), so `ways[u]` is final before it's passed on.

### At most k stops

Cheapest Flights Within K Stops (LC 787) is a DP over (node, edges used): k + 1 rounds of Bellman-Ford relaxation, each reading the previous round's snapshot. It's worked through in [shortest paths](lesson:shortest-paths).

## Complexity

| Problem | Time | Space |
|---|---|---|
| Longest Increasing Path | O(m · n) | O(m · n) |
| Number of Ways to Arrive | O(E log E) | O(V + E) |
| Cheapest Flights Within K Stops | O(k · E) | O(V) |

## Variations

- **The longest path in any DAG:** relax the edges in topological order with `max` instead of `min`. (In a general graph with cycles, the longest simple path is NP-hard.)
- **Counting paths in a DAG:** `paths(v) = Σ paths(next)`, with `paths(target) = 1`.
- **All Paths From Source to Target (LC 797)** lists the paths themselves, by [DFS with backtracking](lesson:depth-first-search).
- **Parallel Courses III (LC 2050):** the earliest finish time of each course is the longest path into it, in topological order.

## Common mistakes

- **Memoizing over transitions that might form a cycle**: prove the graph is acyclic first.
- **Using `0` as "unset"** when 0 is a valid answer: here every path has length at least 1, so 0 works; otherwise use −1.
- **Reading the current round's values** in a step-budget DP, which lets one round use several edges.
- **Resetting `ways` on equal distances** instead of adding: only a strictly shorter route resets the count.
- **Integer overflow** in distances or counts: use `long`, and the modulus.

## Practice

Longest Increasing Path in a Matrix (LC 329), Number of Ways to Arrive at Destination (LC 1976), Cheapest Flights Within K Stops (LC 787), Parallel Courses III (LC 2050), Count All Possible Routes (LC 1575), a DP over (city, fuel left).

## Key takeaways

- DP on a graph is safe when the transitions form a DAG: check for cycles first.
- Memoized DFS computes each node once, in an order that respects the dependencies.
- A strict ordering (increasing values) is a common hidden reason a graph is a DAG.
- Extra dimensions (stops used, the number of shortest routes) ride along with the nodes.
- In-place updates need care: read the previous round's snapshot.

## Knowledge check

```quiz
? Why is memoized DFS safe in Longest Increasing Path in a Matrix?
+ Edges only go to strictly greater values, so the moves can't form a cycle: they form a DAG
- Because the grid is small
! Size doesn't make memoization safe.
- Because DFS never revisits a cell
! It revisits cells; memoization answers instantly.
- Memoization is always safe
! With cycles, a value could depend on itself.
> Say the no-cycle argument before coding.

? In Number of Ways to Arrive at Destination, what happens when a route of exactly the current shortest distance reaches v?
+ ways[v] += ways[u]: it's another shortest route
- ways[v] = ways[u]
! That's for a strictly shorter route, which resets the count.
- Nothing; only shorter routes matter
! Equal-length routes are exactly what's being counted.
- dist[v] is updated
! The distance doesn't change.
> Shorter resets, equal adds.

? In a step-budget DP like Cheapest Flights, why read from the previous round's snapshot?
+ So each round extends paths by exactly one edge; reading updated values could chain several edges in one round
- To save memory
! The snapshot costs memory.
- Because the graph is undirected
! The flights are directed.
- It makes no difference
! It can return a cheaper price that uses too many stops.
> The same question as 0/1 knapsack's direction.

? Can you find the longest simple path in a general graph with cycles using this DP?
+ No: in general it's NP-hard; the DP needs a DAG
- Yes, with memoization
! Memoized values would depend on the path taken.
- Yes, with Dijkstra and max instead of min
! Dijkstra's argument fails for longest paths.
- Yes, after removing self-loops
! Longer cycles remain.
> In a DAG, relax in topological order with max.
```
