## The idea

A **minimum spanning tree** (MST) connects every vertex of a weighted, undirected, connected graph with exactly V − 1 edges and no cycles, at the minimum possible total weight. Two greedy algorithms build one:
- **Kruskal:** sort all the edges by weight, and add each one unless its endpoints are already connected (checked with [union-find](lesson:union-find)).
- **Prim:** grow a single tree from a start node, always adding the cheapest edge that connects a new node to it (a min-heap, like Dijkstra).

## When to use it

- "Connect all the points, cities or houses at the minimum total cost."
- "The minimum cost to connect everything", "the least cable".
- Not for the shortest route between two nodes: an MST minimises the *total*, not any one path. That's [shortest paths](lesson:shortest-paths).

## How it works

**Why greedy is safe (the cut property):** split the vertices into any two groups; the cheapest edge crossing between them belongs to some minimum spanning tree. Kruskal's next edge is the cheapest that joins two different components, and Prim's is the cheapest that leaves the tree: both are cheapest edges across a cut.

**Prim versus Dijkstra:** almost identical machinery, but a different key. Dijkstra's heap key is the *distance from the source* (`dist[u] + w`); Prim's is the *weight of the one edge* that would connect the node to the tree (`w`). It's the whole difference in code, but a completely different guarantee (shortest paths versus the cheapest total connection). Say this out loud if asked: it's a common probe.

## Java template

```java
public int kruskalMST(int n, int[][] edges) {                  // edges[i] = {u, v, weight}
    Arrays.sort(edges, (a, b) -> Integer.compare(a[2], b[2])); // cheapest first
    UnionFind uf = new UnionFind(n);
    int totalWeight = 0, edgesUsed = 0;
    for (int[] edge : edges) {
        if (uf.union(edge[0], edge[1])) {                       // true only if it joins two components
            totalWeight += edge[2];
            if (++edgesUsed == n - 1) break;                    // a spanning tree has n - 1 edges
        }
    }
    return edgesUsed == n - 1 ? totalWeight : -1;               // -1: the graph is disconnected
}
```

`UnionFind` is the class from [union-find](lesson:union-find).

## Worked examples

### Prim's algorithm

```java
public int primMST(int n, List<List<int[]>> adj) {             // adj.get(u): {neighbour, weight}
    boolean[] inMST = new boolean[n];
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    pq.offer(new int[]{0, 0});                                  // {edge weight, node}: start at node 0
    int total = 0, count = 0;
    while (!pq.isEmpty() && count < n) {
        int[] top = pq.poll();
        int w = top[0], u = top[1];
        if (inMST[u]) continue;                                 // a stale, more expensive edge to u
        inMST[u] = true;
        total += w;
        count++;
        for (int[] e : adj.get(u)) {
            if (!inMST[e[0]]) pq.offer(new int[]{e[1], e[0]});    // key = the edge weight alone
        }
    }
    return count == n ? total : -1;                             // -1: the graph is disconnected
}
```

### Min Cost to Connect All Points (LC 1584): Prim with an array

Every pair of points is an edge (with the Manhattan distance as its weight), so the graph is complete: about n²/2 edges. Instead of building them, keep for each point the cheapest edge to the tree so far, and pick the next point with a linear scan. That's O(n²), better than any heap on a complete graph:

```java
public int minCostConnectPoints(int[][] points) {
    int n = points.length, total = 0;
    int[] best = new int[n];                 // cheapest edge from each point to the tree so far
    boolean[] inTree = new boolean[n];
    Arrays.fill(best, Integer.MAX_VALUE);
    best[0] = 0;
    for (int added = 0; added < n; added++) {
        int u = -1;
        for (int v = 0; v < n; v++) {
            if (!inTree[v] && (u == -1 || best[v] < best[u])) u = v;
        }
        inTree[u] = true;
        total += best[u];
        for (int v = 0; v < n; v++) {
            if (inTree[v]) continue;
            int d = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1]);
            if (d < best[v]) best[v] = d;
        }
    }
    return total;
}
```

### Optimize Water Distribution in a Village (LC 1168): a virtual node

Each house can dig its own well, or be piped to a neighbour. Add a virtual node 0, "the water source", with an edge to every house weighted by its well's cost. Then digging a well is just connecting to node 0, and the answer is a plain MST:

```java
public int minCostToSupplyWater(int n, int[] wells, int[][] pipes) {
    List<int[]> edges = new ArrayList<>();
    for (int i = 0; i < n; i++) edges.add(new int[]{0, i + 1, wells[i]});   // a well = an edge to node 0
    for (int[] p : pipes) edges.add(p);
    return kruskalMST(n + 1, edges.toArray(new int[0][]));
}
```

## Complexity

| Algorithm | Time | Space |
|---|---|---|
| Kruskal | O(E log E), for the sort; union-find adds nearly O(E) | O(V) |
| Prim with a heap (lazy deletion) | O(E log E) ≈ O(E log V) | O(V + E) |
| Prim with an array | O(V²) | O(V) |

## Variations

- **Which one to write:** handed an edge list, Kruskal is less code; handed an adjacency list, Prim fits naturally; on a complete or very dense graph, the array version of Prim wins.
- **A maximum spanning tree:** sort the edges in descending order (or negate the weights).
- **Minimax paths:** in an MST, the path between two nodes has the smallest possible *largest* edge of any path between them. That solves "minimise the worst step" questions with Kruskal, as an alternative to Dijkstra's minimax variant.
- **Critical and pseudo-critical edges (LC 1489):** rebuild the MST without each edge (if the total rises, the edge is critical), and with each edge forced in (if the total is unchanged, it's at least pseudo-critical).

## Common mistakes

- **Using Dijkstra's key in Prim**, `dist[u] + w`, which builds a shortest-path tree, not an MST.
- **Not checking that the graph is connected**: fewer than V − 1 edges (or fewer than n nodes in Prim) means no spanning tree.
- **A subtracting comparator** that overflows with large weights: use `Integer.compare`.
- **Applying it to a directed graph**: directed versions (arborescences) need a different algorithm.
- **Forgetting the stale-entry skip** in Prim, which adds a node twice.

## Practice

Min Cost to Connect All Points (LC 1584), Connecting Cities With Minimum Cost (LC 1135), Optimize Water Distribution in a Village (LC 1168), Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree (LC 1489).

## Key takeaways

- An MST connects all the vertices with V − 1 edges at the minimum total weight.
- Kruskal: sort the edges, add each unless union-find says it closes a cycle.
- Prim: grow one tree with a min-heap keyed by the single connecting edge's weight.
- The cut property is why both greedy choices are safe.
- Use a virtual node to turn "build here or connect there" into a plain MST.

## Knowledge check

```quiz
? What's the only real code difference between Prim's algorithm and Dijkstra's?
+ The heap key: Prim uses the connecting edge's weight w, Dijkstra the distance from the source dist[u] + w
- Prim uses a stack instead of a heap
! Both use a min-heap.
- Prim needs union-find
! That's Kruskal.
- Dijkstra can't handle undirected graphs
! It can.
> Same machinery, different guarantee.

? Kruskal's algorithm adds an edge only when union(u, v) returns true. Why?
+ A false means u and v are already connected, so the edge would close a cycle
- Because the edges must be added in pairs
! Edges are added one at a time.
- Because union fails for heavy edges
! union doesn't look at weights.
- To keep the tree balanced
! Balance isn't a goal of an MST.
> A spanning tree has no cycles.

? Why is Prim with an array, O(V²), the best choice for Min Cost to Connect All Points?
+ The graph is complete, with about V²/2 edges, so any edge-based algorithm already costs at least that, plus a log factor
- Because heaps can't hold Manhattan distances
! They can hold any comparable value.
- Because Kruskal gives a different total
! Both give the same minimum total.
- Because the points are sorted
! They aren't.
> On dense graphs, scanning beats a heap.

? How does Optimize Water Distribution turn wells into an MST problem?
+ A virtual node 0 is the water source, and each well is an edge from it to its house, weighted by the well's cost
- By deleting the most expensive pipes
! That doesn't decide where wells go.
- By running Dijkstra from the cheapest well
! Shortest paths don't minimise the total.
- By digging a well at every house
! That ignores the cheaper pipes.
> Then the MST picks the cheapest mix of wells and pipes.
```
