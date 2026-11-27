## The idea

Two upgrades to [breadth-first search](lesson:breadth-first-search):

- **Multi-source BFS** seeds the queue with **all** the sources before the loop starts. BFS then expands all of them in lockstep, so every cell is reached first by its *nearest* source. One BFS replaces a BFS from every source.
- **0-1 BFS** handles edges that cost **0 or 1** with a deque: a 0-cost edge goes to the front (same distance), a 1-cost edge to the back (next distance). You get Dijkstra's answer without a priority queue.

## When to use it

**Multi-source BFS:** "all X spread simultaneously", "the nearest X for every cell", "minutes until everything is Y", "distance to the closest 0 / gate / water".

**0-1 BFS:** shortest paths where every edge costs 0 or 1: "the minimum number of obstacles to remove", "the minimum cost to make a valid path", "the minimum number of sign flips".

## How it works

**Multi-source.** Enqueue every source at distance 0. The queue now holds one big "level 0", and BFS's ring-by-ring expansion assigns each cell the distance to whichever source reaches it first, which is the nearest one. Running a BFS from each source separately would cost O(V·E) or worse; this is one O(V + E) pass.

**0-1 BFS.** Dijkstra needs a priority queue because distances can jump by any amount. When edges cost only 0 or 1, the frontier holds at most two distinct distances, d and d + 1. Putting d-cost moves at the front and (d + 1)-cost moves at the back keeps the deque sorted by distance automatically, so `pollFirst` always returns a closest node: Dijkstra's result in **O(V + E)** instead of O(E log V).

**Two ways to track distance:** a level-size loop, or a `dist[]` array. Pick one; using both is redundant. 0-1 BFS always uses `dist[]`, since a node can be improved after it's first seen.

## Java template

```java
// Multi-source: seed every source, then run ordinary BFS.
Queue<int[]> q = new ArrayDeque<>();
for (int[] source : sources) {
    q.offer(source);
    dist[source[0]][source[1]] = 0;          // every other cell starts at -1 (unvisited)
}
// ... standard BFS: a neighbour's distance is dist[cell] + 1 ...

// 0-1 BFS: a deque instead of a queue.
Deque<int[]> dq = new ArrayDeque<>();
// relax an edge of cost w (0 or 1): if dist[u] + w < dist[v], update dist[v], then
// w == 0 ? dq.offerFirst(v) : dq.offerLast(v);
```

## Worked examples

### Rotting Oranges (LC 994)

```java
public int orangesRotting(int[][] grid) {
    int rows = grid.length, cols = grid[0].length;
    Queue<int[]> q = new ArrayDeque<>();
    int fresh = 0;

    for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == 2) q.offer(new int[]{r, c});   // seed ALL rotten
            else if (grid[r][c] == 1) fresh++;
        }

    if (fresh == 0) return 0;          // ← edge case: nothing to rot
    int minutes = 0;

    while (!q.isEmpty() && fresh > 0) {
        int size = q.size();
        for (int i = 0; i < size; i++) {
            int[] cell = q.poll();
            for (int[] d : DIRS) {
                int nr = cell[0] + d[0], nc = cell[1] + d[1];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                if (grid[nr][nc] != 1) continue;
                grid[nr][nc] = 2;      // mark rotten = mark visited
                fresh--;
                q.offer(new int[]{nr, nc});
            }
        }
        minutes++;
    }
    return fresh == 0 ? minutes : -1;  // some fresh unreachable
}
```

**Note `while (!q.isEmpty() && fresh > 0)`**: without the `fresh > 0` guard you process one extra level after the last orange rots and return `minutes + 1`. Off-by-one central.

**Mutating the grid as the visited marker** saves O(n) space. Mention that you're modifying the input, and offer to copy it if that's unacceptable: interviewers care about side effects.

### 01 Matrix (LC 542): the distance to the nearest 0

```java
public int[][] updateMatrix(int[][] mat) {
    int rows = mat.length, cols = mat[0].length;
    int[][] dist = new int[rows][cols];
    Queue<int[]> q = new ArrayDeque<>();

    for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++) {
            if (mat[r][c] == 0) q.offer(new int[]{r, c});
            else dist[r][c] = -1;           // -1 = unvisited
        }

    while (!q.isEmpty()) {
        int[] cell = q.poll();
        for (int[] d : DIRS) {
            int nr = cell[0] + d[0], nc = cell[1] + d[1];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            if (dist[nr][nc] != -1) continue;                 // already has a distance
            dist[nr][nc] = dist[cell[0]][cell[1]] + 1;
            q.offer(new int[]{nr, nc});
        }
    }
    return dist;
}
```

Here no level loop is needed: storing the distance *in the array* is cleaner than counting levels.

### Minimum Obstacle Removal to Reach Corner (LC 2290): 0-1 BFS

Moving into an empty cell costs 0; moving into an obstacle costs 1 (you remove it).

```java
public int minimumObstacles(int[][] grid) {
    int rows = grid.length, cols = grid[0].length;
    int[][] dist = new int[rows][cols];
    for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
    dist[0][0] = grid[0][0];

    Deque<int[]> dq = new ArrayDeque<>();
    dq.offerFirst(new int[]{0, 0});

    while (!dq.isEmpty()) {
        int[] cell = dq.pollFirst();
        int r = cell[0], c = cell[1];
        if (r == rows - 1 && c == cols - 1) return dist[r][c];

        for (int[] d : DIRS) {
            int nr = r + d[0], nc = c + d[1];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            int cost = grid[nr][nc];                   // 0 or 1
            if (dist[r][c] + cost < dist[nr][nc]) {
                dist[nr][nc] = dist[r][c] + cost;
                if (cost == 0) dq.offerFirst(new int[]{nr, nc});
                else           dq.offerLast(new int[]{nr, nc});
            }
        }
    }
    return dist[rows - 1][cols - 1];
}
```

**Say this in the interview:** *"Since all edge weights are 0 or 1, I can replace Dijkstra's priority queue with a deque: 0-weight edges go to the front, 1-weight edges to the back. That keeps the deque monotonic in distance and drops the log factor."* That sentence alone reads as senior.

## Complexity

O(rows × cols) time and space for the grid versions, or O(V + E) in general, for both multi-source BFS and 0-1 BFS. Dijkstra on the same 0-1 graph would be O(E log V).

## Variations

- **More multi-source problems:** Walls and Gates, Map of Highest Peak (LC 1765), As Far from Land as Possible (LC 1162).
- **Shortest Bridge (LC 934):** find the first island with a DFS, then run a multi-source BFS outward from all of its cells until you reach the second island.
- **Minimum Cost to Make at Least One Valid Path in a Grid (LC 1368):** following a cell's arrow costs 0; changing it costs 1. A textbook 0-1 BFS.
- **General weights:** when costs vary beyond 0 and 1, use [Dijkstra](lesson:shortest-paths).

## Common mistakes

- **Running a BFS from every source**, which multiplies the work by the number of sources.
- **Processing one extra level** after the goal is reached (Rotting Oranges without the `fresh > 0` guard), which returns one too many.
- **Forgetting the "nothing to do" case**: no fresh oranges means 0 minutes, not −1.
- **Marking 0-1 BFS nodes as final when they're first seen.** A node can be reached again more cheaply through a 0-cost edge; relax with `dist[]` instead.
- **Modifying the input grid without saying so.**

## Practice

Rotting Oranges (LC 994), 01 Matrix (LC 542), As Far from Land as Possible (LC 1162), Map of Highest Peak (LC 1765), Shortest Bridge (LC 934), Minimum Obstacle Removal to Reach Corner (LC 2290), Minimum Cost to Make at Least One Valid Path in a Grid (LC 1368).

## Key takeaways

- Multi-source BFS seeds every source before the loop, so each cell is reached first by its nearest source: one O(V + E) pass.
- Track distance with a level loop or a `dist` array, not both.
- 0-1 BFS uses a deque: 0-cost moves to the front, 1-cost moves to the back.
- The deque stays sorted by distance, which gives Dijkstra's answer in O(V + E).
- In 0-1 BFS, relax distances with `dist[]`: a node can improve after it's first seen.

## Knowledge check

```quiz
? "For every cell, find the distance to the nearest 0." Why seed the queue with every 0 at once?
+ BFS then expands from all of them together, so each cell is reached first by its nearest 0, in one pass
- To sort the cells by distance
! Nothing is sorted; the ring order does the work.
- Because BFS needs at least two sources
! BFS works from one source; multiple seeds solve a different question.
- To avoid using a visited array
! You still need to know which cells have a distance.
> One multi-source BFS replaces a BFS from every 0.

? Rotting Oranges loops `while (!q.isEmpty() && fresh > 0)`. What happens without `fresh > 0`?
+ It processes one more level after the last orange rots and returns one minute too many
- It never terminates
! The queue empties eventually.
- It misses some oranges
! Every reachable orange still rots.
- Nothing changes
! The extra level adds an extra minute.
> Stop as soon as there's nothing left to rot.

? In 0-1 BFS, where does a node reached by a 0-cost edge go, and why?
+ To the front of the deque, because it's at the same distance as the node being processed
- To the back of the deque, like any new node
! That would put it behind nodes that are farther away.
- Into a separate priority queue
! The deque replaces the priority queue.
- Nowhere; 0-cost edges are skipped
! They're free moves and must be explored.
> Front for the same distance, back for distance + 1 keeps the deque sorted.

? Why is 0-1 BFS faster than Dijkstra on a graph with 0 and 1 weights?
+ The deque stays sorted by distance without a heap, so each operation is O(1) instead of O(log V)
- It visits fewer nodes
! It visits the same nodes; each step is just cheaper.
- It ignores the 0-cost edges
! It processes them first.
- It doesn't need a distance array
! It does need dist[] to relax edges.
> O(V + E) instead of O(E log V).
```
