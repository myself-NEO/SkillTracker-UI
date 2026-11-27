## The idea

How you detect a cycle **depends entirely on whether the graph is directed or undirected**, and using the wrong method is the most common mistake here. So understand *why* they differ, not just the two recipes:
- **Undirected:** run DFS while remembering which node you arrived from. Reaching an already-visited node that **isn't** your parent means a second path to it: a cycle.
- **Directed:** colour each node white (untouched), gray (on the current DFS path) or black (finished). A cycle exists **if and only if** the DFS reaches a gray node.

## When to use it

- "Can all the courses be finished?", "is there a circular dependency?", deadlock detection: a cycle in a **directed** graph.
- "Is this graph a tree?", "find the edge that creates a cycle": a cycle in an **undirected** graph.
- "Which nodes can never reach a cycle?" (eventual safe states): the colouring's black nodes.

## How it works

**Why parent-tracking fails on directed graphs:** in a directed graph, reaching an already-visited node along a *different* path is completely normal. Take a diamond, A→B, A→C, B→D, C→D: D is reached twice, and there's no cycle.

**Why three colours work:** gray means "an ancestor of the node being explored right now". Reaching a gray node means there's a path from that ancestor down to here, *and* an edge from here back up to it: that's a cycle. Reaching a black node means "fully explored": in the diamond, D is black by the time C reaches it, so it's two paths converging, not a cycle.

## Java template

```java
public boolean hasCycleDirected(int n, Map<Integer, List<Integer>> graph) {
    int[] state = new int[n]; // 0 = white, 1 = gray, 2 = black
    for (int i = 0; i < n; i++) {
        if (state[i] == 0) {
            if (dfsDirectedCycle(i, graph, state)) return true;
        }
    }
    return false;
}

private boolean dfsDirectedCycle(int node, Map<Integer, List<Integer>> graph, int[] state) {
    state[node] = 1; // gray: currently in this DFS path
    for (int neighbor : graph.getOrDefault(node, List.of())) {
        if (state[neighbor] == 1) return true; // hit a gray node = back edge = cycle
        if (state[neighbor] == 0 && dfsDirectedCycle(neighbor, graph, state)) return true;
    }
    state[node] = 2; // black: fully explored, can never be part of a new cycle
    return false;
}
```

## Worked examples

### Undirected graphs: parent tracking

```java
public boolean hasCycleUndirected(int n, Map<Integer, List<Integer>> graph) {
    boolean[] visited = new boolean[n];
    for (int i = 0; i < n; i++) {
        if (!visited[i]) {
            if (dfsCycle(i, -1, graph, visited)) return true;
        }
    }
    return false;
}

private boolean dfsCycle(int node, int parent, Map<Integer, List<Integer>> graph, boolean[] visited) {
    visited[node] = true;
    for (int neighbor : graph.get(node)) {
        if (!visited[neighbor]) {
            if (dfsCycle(neighbor, node, graph, visited)) return true;
        } else if (neighbor != parent) {
            return true; // back edge to a non-parent, already-visited node
        }
    }
    return false;
}
```

### Course Schedule (LC 207)

`prerequisites[i] = [a, b]` means b must come before a: a directed edge b → a. All the courses can be finished exactly when that graph has no cycle:

```java
public boolean canFinish(int numCourses, int[][] prerequisites) {
    Map<Integer, List<Integer>> graph = new HashMap<>();
    for (int[] p : prerequisites) graph.computeIfAbsent(p[1], k -> new ArrayList<>()).add(p[0]);
    return !hasCycleDirected(numCourses, graph);
}
```

[Kahn's algorithm](lesson:topological-sort) answers the same question by counting how many nodes it can place.

### Find Eventual Safe States (LC 802)

A node is safe when every path from it ends at a terminal node, which means it can never reach a cycle. In the colouring, those are exactly the nodes that finish black:

```java
public List<Integer> eventualSafeNodes(int[][] graph) {
    int n = graph.length;
    int[] state = new int[n];                              // 0 white, 1 gray, 2 black (safe)
    List<Integer> safe = new ArrayList<>();
    for (int i = 0; i < n; i++) {
        if (isSafe(i, graph, state)) safe.add(i);
    }
    return safe;
}

private boolean isSafe(int node, int[][] graph, int[] state) {
    if (state[node] != 0) return state[node] == 2;        // gray: on or leading to a cycle
    state[node] = 1;
    for (int next : graph[node]) {
        if (!isSafe(next, graph, state)) return false;    // the node stays gray: unsafe
    }
    state[node] = 2;
    return true;
}
```

## Complexity

**O(V + E)** time for both methods (each node and edge is handled once), and O(V) space for the states and the recursion.

## Variations

- **Union-find for undirected graphs:** add the edges one at a time; an edge whose endpoints are already connected closes a cycle. It's often cleaner when the question asks for that specific redundant edge (Redundant Connection, LC 684): see [union-find](lesson:union-find).
- **Graph Valid Tree (LC 261):** an undirected graph is a tree exactly when it has n − 1 edges and is connected (equivalently, connected with no cycle).
- **Parallel edges:** with two edges between the same pair, parent-tracking by node id misses the cycle they form; track the edge you arrived on instead.
- **Kahn's algorithm** detects a directed cycle without recursion: fewer than n nodes placed means a cycle.

## Common mistakes

- **Parent-tracking on a directed graph**, which reports cycles in harmless diamonds.
- **Two colours instead of three** in a directed graph: without "black", every converging path looks like a cycle.
- **Forgetting to mark the node black** when its DFS finishes.
- **Checking only from node 0**: a cycle in another component is missed.
- **Deep recursion** on large graphs: use Kahn's algorithm or an explicit stack.

## Practice

Course Schedule (LC 207), Find Eventual Safe States (LC 802), Redundant Connection (LC 684), Graph Valid Tree (LC 261), Detect Cycles in 2D Grid (LC 1559).

## Key takeaways

- Undirected: a visited neighbour that isn't your parent closes a cycle.
- Directed: white, gray, black; reaching a gray node is a cycle, reaching a black one isn't.
- Parent-tracking fails on directed graphs: a diamond reaches a node twice without a cycle.
- Loop over every node so cycles in every component are found.
- Union-find and Kahn's algorithm are the non-recursive alternatives.

## Knowledge check

```quiz
? Edges A→B, A→C, B→D, C→D. Does parent-tracking (built for undirected graphs) report a cycle, and is there one?
+ It reports one, but there isn't: D is reached twice through two paths, which is normal in a directed graph
- It reports none, and there's none
! When C reaches D, D is visited and isn't C's parent.
- It reports one, and there is one
! No path leads back to a node already on it.
- It can't run on directed graphs
! It runs; it just gives the wrong answer.
> Directed graphs need three colours.

? In three-colour DFS, what does reaching a gray node mean?
+ The node is an ancestor on the current path, so this edge closes a cycle
- The node is finished and safe
! That's black.
- The node is unvisited
! That's white.
- The graph is disconnected
! Colours don't say anything about components.
> Gray = on the current DFS path.

? Why does each node turn black when its DFS finishes, instead of going back to white?
+ So later paths that reach it know it's fully explored and can't lead back into a cycle, without exploring it again
- To free memory
! The state array stays the same size.
- Black means it's on a cycle
! Black means it's finished, with no cycle through it found.
- It makes no difference
! Going back to white would re-explore it: exponential time on diamond-shaped graphs.
> Black nodes are dead ends for cycle purposes.

? In Course Schedule, prerequisites[i] = [a, b] means b before a. Which edge goes into the graph?
+ b → a
- a → b
! That reverses every dependency; cycle detection still works, but the order would come out backwards.
- Both directions
! That would make every edge a 2-cycle.
- No edge; it's a pair to count
! The pairs are the graph's edges.
> Edges point from the prerequisite to the course that needs it.
```
