## The idea

In bitmask DP, part of the state is **a subset**: "which of these items have been used?" An arbitrary subset of up to about 20 items fits in the bits of an int, where bit i is 1 exactly when item i is used. The state becomes something like `dp[mask][i]` ("having visited exactly the cities in mask, standing at city i"), and transitions set one more bit.

## When to use it

- **Small n**, roughly n ≤ 15–20: the constraints are as strong a hint as the wording.
- "Visit every X exactly once" (travelling salesman), "assign each of n workers to n jobs", permutation-flavoured searches.
- "Partition into k groups", "cover all the skills with the fewest people".

## How it works

- **2ⁿ subsets** stay tractable only for small n: n = 20 already gives about a million masks, and O(2ⁿ · n²) is about 4 × 10⁸.
- **Fill order:** adding a bit always makes a mask numerically larger, so looping `mask` from 0 upwards visits every subset after all its sub-subsets.
- **The algorithm over the state space can vary.** With equal step costs, run BFS over `(mask, node)` states; with weights, Dijkstra; with a plain recurrence, a loop. The state space stays the same.
- The bit operations (test, set, count) are in [bit tricks](lesson:bit-tricks); enumerating subsets as masks is a [bit pattern](lesson:bit-patterns).

## Java template

```java
int FULL = 1 << n;
for (int mask = 0; mask < FULL; mask++) {
    for (int i = 0; i < n; i++) {
        if ((mask & (1 << i)) == 0 || dp[mask][i] == INF) continue;   // state not reachable
        for (int j = 0; j < n; j++) {
            if ((mask & (1 << j)) != 0) continue;                      // j already used
            int next = mask | (1 << j);
            dp[next][j] = Math.min(dp[next][j], dp[mask][i] + cost(i, j));
        }
    }
}
```

## Worked examples

### The travelling salesman problem: the template

n cities and `cost[i][j]`; start and end at city 0, visiting every city exactly once, at minimum total cost.

- *State:* `dp[mask][i]` = the minimum cost of having visited exactly the cities in mask, standing at city i.
- *Transition:* from `(mask, i)`, go to any unvisited j, paying `cost[i][j]`.
- *Base case:* `dp[{0}][0] = 0`.
- *Answer:* `min over i ≠ 0 of dp[full][i] + cost[i][0]`, closing the loop.

```java
static int tsp(int[][] cost) {
    int n = cost.length;
    int FULL = 1 << n;
    int INF = Integer.MAX_VALUE / 2;
    int[][] dp = new int[FULL][n];
    for (int[] row : dp) Arrays.fill(row, INF);
    dp[1][0] = 0;
    for (int mask = 1; mask < FULL; mask++) {
        for (int i = 0; i < n; i++) {
            if ((mask & (1 << i)) == 0 || dp[mask][i] == INF) continue;
            for (int j = 0; j < n; j++) {
                if ((mask & (1 << j)) != 0) continue;           // already visited
                int newMask = mask | (1 << j);
                dp[newMask][j] = Math.min(dp[newMask][j], dp[mask][i] + cost[i][j]);
            }
        }
    }
    int best = INF;
    for (int i = 1; i < n; i++) {
        if (dp[FULL - 1][i] != INF) best = Math.min(best, dp[FULL - 1][i] + cost[i][0]);
    }
    return best;
}
```

The classic 4-city example, `{{0,10,15,20},{10,0,35,25},{15,35,0,30},{20,25,30,0}}`, gives 80 (0 → 1 → 3 → 2 → 0). Checking every permutation would be O(n!); this is O(2ⁿ · n²). Say it plainly if asked: TSP is NP-hard, and this DP is exact but exponential, not a polynomial algorithm in disguise.

### Partition to K Equal Sum Subsets (LC 698)

The total must divide by k; each bucket must reach `target = total / k`.

- *State:* `dp[mask]` = whether the elements in mask can be placed, in some order, into complete buckets plus one partly filled bucket, without ever overflowing a bucket.
- *Transition:* from a reachable mask, add an unused element if it fits in the current bucket: `(sum(mask) mod target) + nums[i] ≤ target`.

```java
static boolean canPartitionKSubsets(int[] nums, int k) {
    int total = 0;
    for (int num : nums) total += num;
    if (total % k != 0) return false;
    int target = total / k;
    int n = nums.length;
    for (int num : nums) if (num > target) return false;

    int[] maskSum = new int[1 << n];
    boolean[] dp = new boolean[1 << n];
    dp[0] = true;
    for (int mask = 0; mask < (1 << n); mask++) {
        if (!dp[mask]) continue;
        int used = maskSum[mask] % target;
        for (int i = 0; i < n; i++) {
            if ((mask & (1 << i)) != 0) continue;
            if (used + nums[i] > target) continue;
            int newMask = mask | (1 << i);
            if (!dp[newMask]) {
                dp[newMask] = true;
                maskSum[newMask] = maskSum[mask] + nums[i];
            }
        }
    }
    return dp[(1 << n) - 1];
}
```

`[4, 3, 2, 3, 5, 2, 1]` with k = 4 → true (target 5: `{4, 1}`, `{3, 2}`, `{3, 2}`, `{5}`). "`sum(mask)` is a multiple of target" is necessary but not sufficient; reachability through legal moves is what the DP checks.

### Shortest Path Visiting All Nodes (LC 847): BFS over states

An undirected connected graph; the shortest walk visiting every node, revisits allowed. The state is `(mask, node)`: the nodes visited so far, and where you stand. Every move costs 1, so BFS over states finds the answer, starting from every node at once:

```java
static int shortestPathLength(int[][] graph) {
    int n = graph.length;
    int FULL = (1 << n) - 1;
    Queue<int[]> queue = new ArrayDeque<>();
    boolean[][] visited = new boolean[1 << n][n];
    for (int i = 0; i < n; i++) {
        queue.offer(new int[]{1 << i, i});
        visited[1 << i][i] = true;
    }
    int steps = 0;
    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int s = 0; s < size; s++) {
            int[] curr = queue.poll();
            int mask = curr[0], node = curr[1];
            if (mask == FULL) return steps;
            for (int next : graph[node]) {
                int newMask = mask | (1 << next);
                if (!visited[newMask][next]) {
                    visited[newMask][next] = true;
                    queue.offer(new int[]{newMask, next});
                }
            }
        }
        steps++;
    }
    return -1;
}
```

The star graph `[[1,2,3],[0],[0],[0]]` needs 4 steps (1 → 0 → 2 → 0 → 3). With weighted edges you'd run [Dijkstra](lesson:shortest-paths) over the same state space.

## Complexity

| Problem | Time | Space |
|---|---|---|
| Travelling salesman | O(2ⁿ · n²) | O(2ⁿ · n) |
| Partition to K Equal Sum Subsets | O(2ⁿ · n) | O(2ⁿ) |
| Shortest Path Visiting All Nodes | O(2ⁿ · n · degree) | O(2ⁿ · n) |

## Variations

- **Smallest Sufficient Team (LC 1125):** the mask is the set of *skills* covered; `dp[mask]` is the smallest team covering it.
- **Assignment problems** (n workers, n jobs): `dp[mask]` = the best cost of assigning the jobs in mask to the first `bitCount(mask)` workers; the worker index comes from the popcount.
- **Can I Win (LC 464):** a game memoized over the mask of numbers already chosen.
- **Submask enumeration:** `for (int s = mask; s > 0; s = (s - 1) & mask)` visits every subset of a mask; over all masks that's O(3ⁿ), used when a state splits its set into two parts.

## Common mistakes

- **Sizing arrays with `(1 << n) − 1`** instead of `1 << n`: there are 2ⁿ masks, from 0 to 2ⁿ − 1.
- **Using bitmask DP when n is large**: correct, but hopeless beyond about 20–25.
- **Treating "the sum is a multiple of the target" as reachability** in K equal subsets.
- **Forgetting that the start city must be in the mask** (TSP starts from mask `1`, not 0).
- **Operator precedence**: `mask & 1 << i == 0` doesn't compile; write `(mask & (1 << i)) == 0`.

## Practice

Partition to K Equal Sum Subsets (LC 698), Shortest Path Visiting All Nodes (LC 847), Can I Win (LC 464), Smallest Sufficient Team (LC 1125), Find the Shortest Superstring (LC 943), Maximum Compatibility Score Sum (LC 1947).

## Key takeaways

- A bitmask encodes a subset of a small set; `dp[mask][…]` tracks which items are used.
- n ≤ 20 in the constraints is the giveaway.
- Looping masks upwards respects the dependencies: adding a bit makes the mask larger.
- The state space is fixed; the algorithm over it can be a loop, BFS or Dijkstra.
- TSP's DP is O(2ⁿ · n²): exact, exponential, and far better than n!.

## Knowledge check

```quiz
? What constraint most strongly suggests bitmask DP?
+ n at most about 20, with a "use each item once" or "visit everything" flavour
- n up to 10⁵
! 2ⁿ would be astronomically large.
- A sorted input
! Sorting doesn't suggest subsets.
- Negative numbers
! Signs don't matter here.
> 2²⁰ is about a million masks.

? Why can the masks be processed in increasing numeric order?
+ Every transition sets a bit, producing a larger mask, so a mask's predecessors are always smaller
- Because masks are sorted by popcount
! Numeric order isn't popcount order; it still works.
- Because the cities are numbered in order
! City labels don't matter.
- It only works for TSP
! It works for any DP that only adds bits.
> Adding a bit can only increase the number.

? Shortest Path Visiting All Nodes uses BFS over (mask, node). Why not just BFS over nodes?
+ Revisiting a node is allowed, so a node alone doesn't say which nodes have been seen; the mask completes the state
- Because BFS can't handle graphs
! BFS is the right algorithm; the state needs the mask.
- Because the graph is weighted
! Every edge costs 1.
- To make it faster
! The mask makes the state space larger, but correct.
> State = everything a subproblem needs.

? How large should the dp array be for n = 10 items?
+ 1 << 10 = 1024 masks
- 1023 masks
! Masks run from 0 to 1023: that's 1024 values.
- 10 masks
! That's one per item.
- 100 masks
! That's n².
> An off-by-one on 1 << n is a classic bug.
```
