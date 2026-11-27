Most graph problems are a handful of algorithms applied to a graph you first had to notice. This recap gathers the signals, a step-by-step framework, the costs, the mistakes and the templates for the module.

## Recognizing the pattern

| Signal in the problem statement | Likely concept |
|---|---|
| "connections", "network", "friends", "provinces" | connected components: [DFS](lesson:depth-first-search) or [union-find](lesson:union-find) |
| "minimum steps or moves", "shortest path", with no weights | [BFS](lesson:breadth-first-search) |
| "minimum cost path", "cheapest", explicit weighted edges | [Dijkstra](lesson:shortest-paths), or Bellman-Ford if weights can be negative |
| "prerequisite", "X must come before Y", "build order" | [topological sort](lesson:topological-sort) |
| "can it be finished?", "circular dependency" | [cycle detection](lesson:cycle-detection) |
| "islands", "regions", any 2D grid with adjacency | [grid DFS or BFS](lesson:grids-as-graphs) |
| "connect all", "the minimum cost to connect everything" | a [minimum spanning tree](lesson:minimum-spanning-trees) |
| "two groups", "can be divided", "enemies or rivals" | a [bipartite check](lesson:bipartite-graphs) |
| "critical", "can't be removed without disconnecting" | [bridges and articulation points](lesson:graph-connectivity) |
| step-by-step transformations (words, states, board positions) | an implicit graph with [BFS](lesson:breadth-first-search) |
| connections arriving over time, "are these two connected now?" | [union-find](lesson:union-find) |

And the harder case: **hidden graphs.** A tree is a graph. A grid is a graph. A game board or a state machine is a graph (states are nodes, legal moves are edges). A build system's dependency chain is a graph. If a problem is about "things" and "relationships between things", even phrased as strings, numbers or a matrix, model it as a graph.

## Decision procedure

1. **Confirm it's a graph problem**, even (especially) when it's disguised as a grid, a set of strings or a list of dependencies.
2. **Pin down the properties:** directed or undirected? Weighted, and can weights be negative? Can it contain cycles? Is it guaranteed connected, or must you handle several components?
3. **Choose a representation** (default to an adjacency list) and build it explicitly as your *first* coding step, from whatever raw format you're given.
4. **Match the ask to an algorithm** with the table above.
5. **Handle the edge cases up front, out loud:** see the list below. Naming them before you code is a strong signal of experience.
6. **Code in a fixed order:** build the graph, initialise `visited`/`dist`/state arrays, run the algorithm, then extract and format the answer. Keeping these as separate, visible steps makes your code far easier to debug live.
7. **Dry-run on a tiny example** (3–5 nodes) before trusting the code. Almost all graph bugs live in visited-marking or the "did I loop over every component?" step, not in the core algorithm.
8. **State the complexity out loud**, in terms of V and E, and *why*.

### Complexity cheat sheet

| Algorithm | Time | Space | Notes |
|---|---|---|---|
| BFS | O(V + E) | O(V) | shortest path, unweighted |
| DFS | O(V + E) | O(V) | recursion depth up to V |
| Union-find (optimised) | about O(α(n)) per operation | O(V) | effectively O(1) |
| Topological sort | O(V + E) | O(V) | DAGs only |
| Dijkstra (binary heap) | O((V + E) log V) | O(V + E) | non-negative weights only |
| Bellman-Ford | O(V · E) | O(V) | handles negative weights |
| Floyd–Warshall | O(V³) | O(V²) | all pairs, small graphs only |
| Prim (heap) | O(E log V) | O(V + E) | MST; array version O(V²) for dense graphs |
| Kruskal | O(E log E) | O(V) | MST, from an edge list |
| Bipartite check | O(V + E) | O(V) | 2-colouring by BFS or DFS |
| Kosaraju's SCC | O(V + E) | O(V + E) | two DFS passes |
| Tarjan's SCC, bridges | O(V + E) | O(V) | one pass, low-link values |

## Edge cases to test

- An empty graph, or a single node with no edges.
- A disconnected graph: every "loop over all nodes" must be there.
- Self-loops and duplicate (parallel) edges, unless the problem rules them out.
- A directed graph read as undirected, or the reverse: check which way each edge points.
- Unreachable targets: return −1 rather than `Integer.MAX_VALUE`.
- Negative or zero weights: Dijkstra breaks on negatives.
- 1-indexed node labels, so arrays need size n + 1.
- Deep, chain-like graphs, where recursion can overflow the stack.

## Common mistakes

- **No visited set at all**: an infinite loop the moment the graph has a cycle.
- **Only traversing from node 0** and assuming that covers everything, which silently misses the other components. Loop over *all* nodes and skip the visited ones.
- **Parent-tracking cycle detection on a directed graph.** It doesn't work: you need [three colours](lesson:cycle-detection), and being able to explain *why* separates understanding from memorised code.
- **Marking visited on dequeue in BFS** instead of on enqueue: the same node can be queued many times, wasting work and sometimes recording the wrong distance.
- **Forgetting the stale-entry check in Dijkstra** (`if (d > dist[u]) continue;`), or trying to update a heap entry in place.
- **Deep recursion on a large, skewed graph**, without acknowledging the stack-overflow risk or the iterative fallback.
- **Mixing up in-degree and out-degree** in topological sort.
- **Assuming Dijkstra tolerates negative weights.** It fails silently, with a wrong answer.
- **Assuming there are no self-loops or duplicate edges** unless the problem says so: worth a five-second clarifying question.

## Practice ladder

Work through these roughly in order; each group builds on the previous one.

- **Traversal basics:** Number of Islands (200), Flood Fill (733), Max Area of Island (695), Surrounded Regions (130)
- **Connected components:** Number of Provinces (547), Number of Connected Components in an Undirected Graph (323)
- **Cycle detection:** Course Schedule (207), Redundant Connection (684), Graph Valid Tree (261)
- **Topological sort:** Course Schedule II (210), Alien Dictionary (269), Minimum Height Trees (310)
- **Union-find:** Accounts Merge (721), Number of Islands II (305), Satisfiability of Equality Equations (990)
- **BFS shortest paths:** Rotting Oranges (994), Word Ladder (127), 01 Matrix (542), Shortest Path in Binary Matrix (1091)
- **Weighted shortest paths:** Network Delay Time (743), Path With Minimum Effort (1631), Cheapest Flights Within K Stops (787), Swim in Rising Water (778)
- **Minimum spanning trees:** Min Cost to Connect All Points (1584), Connecting Cities With Minimum Cost (1135)
- **Bipartite:** Is Graph Bipartite? (785), Possible Bipartition (886)
- **SCCs and bridges:** Critical Connections in a Network (1192)
- **Cloning and state spaces:** Clone Graph (133), Word Ladder II (126)

## Copy-paste templates

If you remember nothing else before an interview, be able to reproduce these four: nearly everything in the module is a variation on one of them.

```java
// BFS
Queue<Integer> queue = new ArrayDeque<>();
Set<Integer> visited = new HashSet<>();
queue.offer(start);
visited.add(start);
while (!queue.isEmpty()) {
    int node = queue.poll();
    for (int neighbor : graph.getOrDefault(node, List.of())) {
        if (!visited.contains(neighbor)) {
            visited.add(neighbor);
            queue.offer(neighbor);
        }
    }
}
```

```java
// DFS (recursive)
void dfs(int node, Map<Integer, List<Integer>> graph, Set<Integer> visited) {
    visited.add(node);
    for (int neighbor : graph.getOrDefault(node, List.of())) {
        if (!visited.contains(neighbor)) dfs(neighbor, graph, visited);
    }
}
```

```java
// Union-Find core
int find(int x) {
    if (parent[x] != x) parent[x] = find(parent[x]);
    return parent[x];
}
boolean union(int x, int y) {
    int rx = find(x), ry = find(y);
    if (rx == ry) return false;
    parent[rx] = ry;
    return true;
}
```

```java
// Dijkstra core loop
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));   // {dist, node}
pq.offer(new int[]{0, src});
while (!pq.isEmpty()) {
    int[] top = pq.poll();
    int d = top[0], u = top[1];
    if (d > dist[u]) continue;
    for (int[] edge : graph.get(u)) {
        int nd = d + edge[1];
        if (nd < dist[edge[0]]) {
            dist[edge[0]] = nd;
            pq.offer(new int[]{nd, edge[0]});
        }
    }
}
```

The quick union-find core omits union by rank; add it (as in the [union-find lesson](lesson:union-find)) when the input can be large.

## Key takeaways

- Most graph problems are disguised: notice the nodes and the relationships first.
- Pin down directed or undirected, weighted or not, cyclic or not, connected or not, before choosing an algorithm.
- Build the adjacency list as a separate first step, and loop over every node for every component.
- BFS for unweighted shortest paths, Dijkstra for non-negative weights, topological sort for dependencies, union-find for connectivity over time.
- State the complexity in V and E, and dry-run on a tiny graph before trusting the code.

## Knowledge check

```quiz
? "Given flights with prices, find the cheapest route from A to B." Which algorithm?
+ Dijkstra: weighted, non-negative, single source
- BFS
! BFS ignores the prices.
- Topological sort
! There's no dependency order here.
- A minimum spanning tree
! An MST minimises the total of all edges, not one route.
> Add a stops dimension if the number of flights is limited.

? "Can all the courses be completed, given the prerequisites?" Which approach?
+ Detect a cycle in the directed prerequisite graph, with Kahn's algorithm or three-colour DFS
- Count the connected components
! Components don't capture direction.
- Parent-tracking DFS
! That's for undirected graphs.
- A bipartite check
! Two-colouring is a different question.
> Kahn's algorithm placing fewer than n courses means a cycle.

? A solution counts islands correctly on the examples but misses some islands on hidden tests. What's the likely bug?
+ It starts the search from only one cell, or stops after the first island, instead of looping over every cell
- It uses DFS instead of BFS
! Either works for counting islands.
- The grid is too large for an int
! The size isn't the problem.
- It marks visited too early
! Marking early is correct.
> Loop over everything; skip what's visited.

? "Which network cables are critical: removing any one disconnects some servers?" What are you looking for?
+ Bridges, found with low-link values
- Articulation points
! Those are nodes, not cables.
- Strongly connected components
! Cables in a network are undirected.
- The minimum spanning tree
! MST edges aren't necessarily critical.
> An edge (u, v) is a bridge when low[v] > disc[u].
```
