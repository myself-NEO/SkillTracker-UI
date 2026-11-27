## What it is

A graph is `G = (V, E)`: a set of **vertices** (nodes) and a set of **edges** (connections between them). Everything else in this module is what you can compute once you have that structure.

Graphs matter so much in interviews because they model *relationships*, and almost every real system is relationships: web pages linking to each other, people following people, cities connected by roads, tasks depending on other tasks, servers talking to servers. If your problem involves "things" and "connections between things", it's a graph problem, whether or not the word "graph" appears in the statement.

That's the main reason people get stuck: **most graph problems don't announce themselves.** A 2D grid is a graph (cells are nodes, adjacency gives the edges). A list of word transformations is a graph. A build dependency list is a graph. Much of solving a graph question is noticing the graph hiding inside it: the [graphs recap](lesson:graphs-recap) is built around that skill.

## How it works

| Term | Meaning |
|---|---|
| Vertex / Node | A single entity in the graph |
| Edge | A connection between two vertices |
| Directed edge | One-way: `u → v` does not imply `v → u` |
| Undirected edge | Two-way: `u — v` implies both directions |
| Weighted edge | Carries a cost, distance or value |
| Unweighted edge | Every edge counts as cost 1 |
| Degree | The number of edges touching a vertex |
| In-degree / Out-degree | (Directed only) the edges coming into / going out of a vertex |
| Path | A sequence of vertices connected by edges |
| Simple path | A path that doesn't repeat any vertex |
| Cycle | A path that starts and ends at the same vertex |
| Connected graph | Every vertex is reachable from every other vertex (undirected) |
| Connected component | A maximal group of vertices all reachable from each other |
| DAG | Directed Acyclic Graph: directed, with no cycles |
| Strongly connected | (Directed only) every vertex can reach every other vertex, *following the edge directions* |
| Dense graph | E is close to V² (many edges for the number of vertices) |
| Sparse graph | E is close to V (few edges for the number of vertices) |
| Tree | A connected, acyclic, undirected graph with exactly V − 1 edges |

**A tree is just a special graph.** Every tree algorithm you already know (DFS, level-order BFS, recursion) is a graph algorithm. Graphs generalise trees by allowing cycles, several paths to the same node, and disconnection, which is exactly why graph traversals need a `visited` set that trees usually don't.

Two smaller terms: a **self-loop** is an edge from a node to itself, and a **multigraph** allows more than one edge between the same pair of nodes. Most interview problems rule both out, but asking whether the input could contain either is a legitimate clarifying question that shows you're thinking about edge cases.

## Build it from scratch

How you store the graph affects everything downstream, so make building it reflexive.

**Adjacency list**: for each node, a list of its neighbours. This is your default almost every time.

```java
// Unweighted, nodes 0..V-1
List<List<Integer>> adjList = new ArrayList<>();
for (int i = 0; i < V; i++) adjList.add(new ArrayList<>());
adjList.get(u).add(v);
adjList.get(v).add(u); // omit this line if the graph is directed

// Weighted: pair each neighbour with its edge weight
List<List<int[]>> weightedAdj = new ArrayList<>();   // int[]{neighbor, weight}

// Built directly from a raw edges array (the most common interview input format)
Map<Integer, List<Integer>> graph = new HashMap<>();
for (int[] edge : edges) {
    graph.computeIfAbsent(edge[0], k -> new ArrayList<>()).add(edge[1]);
    graph.computeIfAbsent(edge[1], k -> new ArrayList<>()).add(edge[0]); // omit for directed
}
```

It takes O(V + E) space: you only pay for edges that exist. Checking one edge costs O(degree), but what you almost always need is "all the neighbours of this node", which an adjacency list gives directly.

**Adjacency matrix**: a `V × V` grid where `matrix[i][j]` is 1 (or the weight) if the edge exists.

```java
int[][] adjMatrix = new int[V][V];
// adjMatrix[u][v] = 1;       // unweighted edge u -> v
// adjMatrix[u][v] = weight;  // weighted edge u -> v
```

It answers "is there an edge between u and v?" in O(1), but costs O(V²) space *however few edges exist*, which is wasteful for sparse graphs (most interview graphs are sparse).

**Edge list**: just the raw `int[][] edges` array, unprocessed.

```java
int[][] edges; // edges[i] = {u, v, weight}
```

You rarely traverse an edge list directly, but [Kruskal's MST](lesson:minimum-spanning-trees) (which sorts all the edges) and [Bellman-Ford](lesson:shortest-paths) (which relaxes all the edges every round) work straight from it.

## Java API

The JDK has no graph type; you assemble one from collections:

| Building block | Use it for |
|---|---|
| `List<List<Integer>>` | an adjacency list when the nodes are 0..n−1 |
| `Map<Integer, List<Integer>>` with `computeIfAbsent` | sparse or non-contiguous node ids, or string nodes (`Map<String, List<String>>`) |
| `List<List<int[]>>`, or a `record Edge(int to, int weight)` | weighted edges |
| `boolean[]` or `Set<Integer>` | the visited set |
| `ArrayDeque` | the BFS queue, or an explicit DFS stack |
| `PriorityQueue` | Dijkstra and Prim |

## Operations and complexity

| | Adjacency list | Adjacency matrix | Edge list |
|---|---|---|---|
| Space | O(V + E) | O(V²) | O(E) |
| Is (u, v) an edge? | O(degree(u)) | O(1) | O(E) |
| All neighbours of u | O(degree(u)) | O(V) | O(E) |
| Add an edge | O(1) | O(1) | O(1) |
| Best for | most problems (sparse graphs) | small, dense graphs | Kruskal, Bellman-Ford |

**The decision:** default to an adjacency list. Reach for a matrix only when the graph is small and dense and you need O(1) edge checks, and for an edge list only when the algorithm calls for it.

## Patterns

**How graphs show up as input:** an explicit `edges` array (build the adjacency list as your first coding step, always), a 2D grid ([grids as graphs](lesson:grids-as-graphs)), or relationships you derive from strings or rules, such as Word Ladder. You'll rarely be handed a ready-made adjacency list: building it is part of the problem, and it's worth doing as a clean, separate first step rather than improvising it mid-traversal.

**The rest of this module:**
- **Traversal:** [depth-first search](lesson:depth-first-search) here, and [breadth-first search](lesson:breadth-first-search) in the queues module.
- **Grids, cycles and ordering:** [grids as graphs](lesson:grids-as-graphs), [cycle detection](lesson:cycle-detection), [topological sort](lesson:topological-sort).
- **Connectivity:** [union-find](lesson:union-find), and [SCCs and bridges](lesson:graph-connectivity).
- **Weighted graphs:** [shortest paths](lesson:shortest-paths), [minimum spanning trees](lesson:minimum-spanning-trees).
- **Two-colouring and more:** [bipartite graphs](lesson:bipartite-graphs).

## Common mistakes

- **Forgetting the reverse edge** for an undirected graph, or adding one for a directed graph.
- **Missing nodes with no edges**: with a `Map`, a node that never appears in `edges` has no entry. Pre-fill every node, or read with `getOrDefault(node, List.of())`.
- **Mixing up 0- and 1-indexed nodes**: many problems number nodes from 1, so allocate `n + 1` lists.
- **Building the graph inside the traversal** instead of as a separate first step.
- **An adjacency matrix for a large sparse graph**: 10⁵ nodes means 10¹⁰ cells.

## Key takeaways

- A graph is vertices plus edges; directed or undirected, weighted or not, possibly with cycles and several components.
- Most graph problems are disguised: grids, word transformations, dependencies, state machines.
- Default to an adjacency list (O(V + E) space); use a matrix for small dense graphs and an edge list for Kruskal and Bellman-Ford.
- A tree is a connected acyclic graph; general graphs need a visited set.
- Build the adjacency list explicitly as your first coding step.

## Knowledge check

```quiz
? A graph has 100,000 nodes and 200,000 edges. Which representation fits?
+ An adjacency list: O(V + E) space, about 300,000 entries
- An adjacency matrix
! That's 10¹⁰ cells for a sparse graph.
- An edge list, for every traversal
! Finding a node's neighbours in an edge list costs O(E).
- It doesn't matter at this size
! The matrix wouldn't fit in memory.
> Sparse graphs want adjacency lists.

? Why do graph traversals need a visited set when tree traversals usually don't?
+ Graphs can have cycles and several paths to the same node, so without it a traversal can loop forever or repeat work
- Because graphs are larger than trees
! Size isn't the reason.
- Because graph nodes have no values
! Values don't matter here.
- They don't need one if the graph is undirected
! An undirected edge is itself a two-node cycle back to the parent.
> A tree has exactly one path between any two nodes.

? Which algorithms work directly from an edge list?
+ Kruskal's MST and Bellman-Ford
- DFS and BFS
! They need each node's neighbours quickly.
- Dijkstra and Prim
! They expand neighbours, so they want an adjacency list.
- Topological sort
! Kahn's algorithm walks each node's outgoing edges.
> Kruskal sorts every edge; Bellman-Ford relaxes every edge each round.

? You build Map<Integer, List<Integer>> from the edges, and graph.get(node) throws NullPointerException. Why?
+ That node has no edges, so it never got an entry; pre-fill every node or use getOrDefault
- The edges array is empty
! Then every lookup would fail, not one node's.
- HashMap can't hold lists
! It can.
- The graph has a cycle
! Cycles don't cause missing keys.
> Isolated nodes are easy to forget.
```
