## The idea

Breadth-first search explores in expanding rings, like ripples in a pond. A queue holds the frontier: visit a node, then enqueue its unvisited neighbours before going any deeper. Because every node at distance 1 is processed before any node at distance 2, **the first time you reach a node, you've reached it by the fewest edges**. On an *unweighted* graph, BFS is shortest path.

## When to use it

Trigger phrases: "shortest path", "minimum number of steps / moves / transformations", "fewest", "level order", "nearest", "spread / infect / rot per minute", "degrees of separation".

- The graph must be **unweighted** (or every edge costs the same). With weights, use [Dijkstra](lesson:shortest-paths); with weights of only 0 and 1, use [0-1 BFS](lesson:multi-source-and-0-1-bfs).
- The graph may be **implicit**: grid cells, words one letter apart, lock combinations. You generate the neighbours as you go.

## How it works

- The queue's FIFO order forces level-by-level exploration: the queue only ever holds nodes from two consecutive levels.
- **Mark a node visited when you enqueue it**, not when you dequeue it. If you mark on dequeue, a node that three neighbours point at is enqueued three times: the queue can blow up to O(V²) entries, and shortest-path variants can record the wrong distance. This is the single most common BFS bug.
- To count distances, process the queue **one level at a time**: snapshot `q.size()` before the inner loop, because the queue grows while you drain it.

## Java template

```java
int bfs(int start, int target, List<List<Integer>> adj) {
    Queue<Integer> q = new ArrayDeque<>();
    boolean[] visited = new boolean[adj.size()];
    q.offer(start);
    visited[start] = true;          // ← mark when ENQUEUING
    int steps = 0;

    while (!q.isEmpty()) {
        int levelSize = q.size();   // ← snapshot BEFORE the inner loop
        for (int i = 0; i < levelSize; i++) {
            int node = q.poll();
            if (node == target) return steps;
            for (int nb : adj.get(node)) {
                if (!visited[nb]) {
                    visited[nb] = true;
                    q.offer(nb);
                }
            }
        }
        steps++;                    // one full ring processed
    }
    return -1;                      // unreachable
}
```

**Two lines carry all the difficulty:** the size snapshot (without it, levels blend together and `steps` is garbage) and marking on enqueue. If you don't need distances at all, drop the level loop.

## Worked examples

### Shortest path in a grid

The most common concrete form:

```java
private static final int[][] DIRS = {{1,0},{-1,0},{0,1},{0,-1}};

public int shortestPathInGrid(int[][] grid, int[] start, int[] end) {
    int rows = grid.length, cols = grid[0].length;
    boolean[][] visited = new boolean[rows][cols];
    Queue<int[]> q = new ArrayDeque<>();
    q.offer(start);
    visited[start[0]][start[1]] = true;
    int steps = 0;

    while (!q.isEmpty()) {
        int levelSize = q.size();
        for (int i = 0; i < levelSize; i++) {
            int[] cell = q.poll();
            int r = cell[0], c = cell[1];
            if (r == end[0] && c == end[1]) return steps;

            for (int[] d : DIRS) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;  // bounds
                if (visited[nr][nc] || grid[nr][nc] == 1) continue;          // seen / wall
                visited[nr][nc] = true;
                q.offer(new int[]{nr, nc});
            }
        }
        steps++;
    }
    return -1;
}
```

**Memorise the `DIRS` array idiom.** It replaces four copy-pasted blocks with one loop and eliminates the classic "copied `r+1` but forgot to change `c`" bug. For 8-directional movement use every `{dr, dc}` pair where not both are zero; for knight moves, the eight `{±1,±2}` / `{±2,±1}` pairs. More grid techniques are in [grids as graphs](lesson:grids-as-graphs).

**Encoding cells:** `int[]{r, c}` is clearest. If you need a `HashSet`, encode a cell as `r * cols + c` (a single int) rather than a string: much faster, and a detail interviewers notice.

### Word Ladder (LC 127): BFS on an implicit graph

The graph often isn't given: you *generate* neighbours. Here, the neighbours of a word are the dictionary words one letter different.

```java
public int ladderLength(String begin, String end, List<String> wordList) {
    Set<String> dict = new HashSet<>(wordList);
    if (!dict.contains(end)) return 0;

    Queue<String> q = new ArrayDeque<>();
    Set<String> visited = new HashSet<>();
    q.offer(begin);
    visited.add(begin);
    int level = 1;

    while (!q.isEmpty()) {
        int size = q.size();
        for (int i = 0; i < size; i++) {
            String word = q.poll();
            if (word.equals(end)) return level;
            char[] arr = word.toCharArray();
            for (int j = 0; j < arr.length; j++) {
                char original = arr[j];
                for (char c = 'a'; c <= 'z'; c++) {
                    if (c == original) continue;
                    arr[j] = c;
                    String next = new String(arr);
                    if (dict.contains(next) && visited.add(next)) q.offer(next);
                }
                arr[j] = original;          // restore before moving to next position
            }
        }
        level++;
    }
    return 0;
}
```

**`visited.add(next)` returns `false` if the word is already present**: one call does check-and-insert. A small idiom that cleans up a lot of BFS code. **Complexity:** O(N × L × 26), where N is the number of words and L the word length.

## Complexity

O(V + E) time and O(V) space for an explicit graph: every node is enqueued once and every edge examined once. On a grid, that's O(rows × cols).

## Variations

- **Visit order instead of distance.** Drop the level loop and append each polled node to a list: that's level-order traversal, as for [trees](lesson:level-order-patterns).
- **Stop one level early.** Check for the target when you *enqueue* a neighbour rather than when you poll it, and return the current distance + 1. It saves processing the target's whole level.
- **Bidirectional BFS.** Search from both ends at once, always expanding the smaller frontier, and stop when they meet. It turns O(b^d) into O(b^(d/2)) for branching factor b and distance d. Worth naming in Word Ladder even if you don't code it.
- **Many sources at once, or edges of cost 0 and 1:** [multi-source and 0-1 BFS](lesson:multi-source-and-0-1-bfs).
- **More implicit-graph problems:** Open the Lock (neighbours = turn one wheel), Jump Game III, Minimum Genetic Mutation, Sliding Puzzle (state = the board encoded as a string).

## Common mistakes

- **Marking visited on dequeue**, which enqueues nodes many times and can give wrong distances.
- **Not snapshotting the level size**, so the step count mixes levels.
- **Using BFS on a weighted graph.** Fewest edges isn't cheapest path; use Dijkstra.
- **Copy-pasted neighbour code** instead of a `DIRS` array, with one direction typed wrong.
- **Strings as cell keys** in a hash set; encode `r * cols + c` instead.

## Practice

Binary Tree Level Order Traversal (LC 102), Shortest Path in Binary Matrix (LC 1091), Number of Islands (LC 200), Open the Lock (LC 752), Word Ladder (LC 127), Minimum Genetic Mutation (LC 433), Jump Game III (LC 1306), Sliding Puzzle (LC 773).

## Key takeaways

- BFS explores in rings: the first time it reaches a node is by the fewest edges, so it's shortest path on unweighted graphs.
- Mark nodes visited when you enqueue them, not when you dequeue them.
- Snapshot the queue's size to process one level at a time when you need distances.
- Use a `DIRS` array for grid neighbours and an int key `r * cols + c` for hashing cells.
- O(V + E) time, O(V) space; use Dijkstra for weights and 0-1 BFS for weights of 0 and 1.

## Knowledge check

```quiz
? Why does BFS find shortest paths on an unweighted graph?
+ It processes every node at distance d before any node at distance d + 1, so the first visit uses the fewest edges
- It always follows the edge with the smallest weight
! On an unweighted graph every edge is the same; that's Dijkstra's rule anyway.
- It visits every path and keeps the shortest
! It visits each node once, not every path.
- Because the queue is sorted by distance
! FIFO order keeps distances in order without sorting.
> The queue only ever holds two consecutive levels.

? What goes wrong if BFS marks nodes visited when they're dequeued instead of enqueued?
+ The same node can be enqueued many times before it's processed, wasting work and risking wrong distances
- Nodes are never visited
! They're visited, just possibly more than once.
- The search becomes depth-first
! The queue still enforces breadth-first order.
- Nothing; both are equivalent
! Marking on enqueue is what prevents duplicates.
> Mark a node as soon as it's discovered.

? Why does the template take `int levelSize = q.size()` before the inner loop?
+ The queue grows while you drain it, so the snapshot fixes how many nodes belong to the current level
- Because `q.size()` is expensive to call
! It's O(1) for ArrayDeque.
- To avoid a ConcurrentModificationException
! Polling and offering inside the loop is allowed.
- It isn't needed when counting steps
! Without it, the steps counter mixes levels.
> Drop the level loop entirely if you don't need distances.

? A graph has edges with different positive weights. Is BFS the right tool for the cheapest path?
+ No: BFS minimises the number of edges, not their total weight; use Dijkstra
- Yes, if you start from the cheapest node
! The start node doesn't change what BFS minimises.
- Yes, if you sort each node's neighbours by weight
! Sorting neighbours doesn't make BFS weight-aware.
- Only if the graph has no cycles
! Cycles aren't the issue; the weights are.
> With only 0 and 1 weights, a deque-based 0-1 BFS also works.
```
