## The idea

Three connectivity questions share one DFS technique:
- **Strongly connected components** (SCCs), in **directed** graphs: maximal sets of nodes where every node can reach every other, following the edge directions.
- **Bridges**, in undirected graphs: edges whose removal disconnects the graph.
- **Articulation points** (cut vertices): nodes whose removal disconnects it.

The technique is **low-link values**: during DFS, record when each node is discovered (`disc`) and the earliest discovery time its subtree can reach back to (`low`). Comparing the two answers all three questions.

## When to use it

- "Critical connections", "which link failures disconnect the network?": bridges.
- "Which servers are single points of failure?": articulation points.
- "Groups where everyone can reach everyone", collapsing cycles in a dependency graph into single nodes: SCCs.

These are less common in typical interviews than the earlier graph topics, but they show up in "critical dependency" framings, and in compilers and build systems.

## How it works

**Kosaraju's algorithm (SCCs), in three steps, easiest to explain live:**
1. DFS the original graph, pushing each node onto a stack when it **finishes** (the same finish-time idea as [DFS topological sort](lesson:topological-sort)).
2. Reverse every edge.
3. Pop nodes one at a time; for each unvisited one, DFS the **reversed** graph. Each DFS tree is exactly one SCC.

Processing nodes in decreasing finish time on the reversed graph means each new DFS starts in an SCC that no unvisited SCC can reach in the reversed graph, so it can't spill into another SCC. The mechanical steps are simple; the proof is the part to understand and state, rather than re-derive live.

**Tarjan's algorithm (SCCs), in one pass:** `low[node]` is the lowest discovery time reachable from the node's subtree, including through one back edge to a node still on the stack. A node is the **root of an SCC** exactly when `low[node] == disc[node]`: nothing below it reaches any further back.

**Bridges:** in an undirected graph, a tree edge `(u, v)` (v discovered from u) is a bridge exactly when `low[v] > disc[u]`: nothing in v's subtree can get back to u, or above it, except through this edge.

**Articulation points:** a non-root u is one when some DFS child v has `low[v] >= disc[u]`; the DFS root is one when it has two or more DFS children.

## Java template

The low-link update, shared by all three:

```java
disc[u] = low[u] = timer++;
for (int v : neighbours(u)) {
    if (disc[v] == -1) {                 // a tree edge: explore it, then take the child's low-link
        dfs(v);
        low[u] = Math.min(low[u], low[v]);
    } else {                             // a back edge (for SCCs: only to a node still on the stack)
        low[u] = Math.min(low[u], disc[v]);
    }
}
```

## Worked examples

### Kosaraju's algorithm

```java
public List<List<Integer>> kosaraju(int n, Map<Integer, List<Integer>> graph) {
    Deque<Integer> stack = new ArrayDeque<>();
    boolean[] visited = new boolean[n];

    for (int i = 0; i < n; i++) {
        if (!visited[i]) fillOrder(i, graph, visited, stack);
    }

    Map<Integer, List<Integer>> reversed = reverseGraph(n, graph);

    Arrays.fill(visited, false);
    List<List<Integer>> sccs = new ArrayList<>();
    while (!stack.isEmpty()) {
        int node = stack.pop();
        if (!visited[node]) {
            List<Integer> component = new ArrayList<>();
            dfsCollect(node, reversed, visited, component);
            sccs.add(component);
        }
    }
    return sccs;
}

private void fillOrder(int node, Map<Integer, List<Integer>> graph, boolean[] visited, Deque<Integer> stack) {
    visited[node] = true;
    for (int neighbor : graph.getOrDefault(node, List.of())) {
        if (!visited[neighbor]) fillOrder(neighbor, graph, visited, stack);
    }
    stack.push(node);
}

private Map<Integer, List<Integer>> reverseGraph(int n, Map<Integer, List<Integer>> graph) {
    Map<Integer, List<Integer>> reversed = new HashMap<>();
    for (int i = 0; i < n; i++) reversed.put(i, new ArrayList<>());
    for (int u : graph.keySet()) {
        for (int v : graph.get(u)) {
            reversed.get(v).add(u); // flip the direction
        }
    }
    return reversed;
}

private void dfsCollect(int node, Map<Integer, List<Integer>> graph, boolean[] visited, List<Integer> component) {
    visited[node] = true;
    component.add(node);
    for (int neighbor : graph.getOrDefault(node, List.of())) {
        if (!visited[neighbor]) dfsCollect(neighbor, graph, visited, component);
    }
}
```

### Tarjan's algorithm

```java
private int timer = 0;

public List<List<Integer>> tarjanSCC(int n, Map<Integer, List<Integer>> graph) {
    int[] disc = new int[n];
    int[] low = new int[n];
    boolean[] onStack = new boolean[n];
    Arrays.fill(disc, -1);
    Deque<Integer> stack = new ArrayDeque<>();
    List<List<Integer>> sccs = new ArrayList<>();

    for (int i = 0; i < n; i++) {
        if (disc[i] == -1) {
            tarjanDFS(i, graph, disc, low, onStack, stack, sccs);
        }
    }
    return sccs;
}

private void tarjanDFS(int node, Map<Integer, List<Integer>> graph, int[] disc, int[] low,
                        boolean[] onStack, Deque<Integer> stack, List<List<Integer>> sccs) {
    disc[node] = low[node] = timer++;
    stack.push(node);
    onStack[node] = true;

    for (int neighbor : graph.getOrDefault(node, List.of())) {
        if (disc[neighbor] == -1) {
            tarjanDFS(neighbor, graph, disc, low, onStack, stack, sccs);
            low[node] = Math.min(low[node], low[neighbor]);
        } else if (onStack[neighbor]) {
            low[node] = Math.min(low[node], disc[neighbor]); // back edge to a node still being processed
        }
    }

    if (low[node] == disc[node]) { // root of an SCC
        List<Integer> component = new ArrayList<>();
        int w;
        do {
            w = stack.pop();
            onStack[w] = false;
            component.add(w);
        } while (w != node);
        sccs.add(component);
    }
}
```

In practice: be able to write Kosaraju's from memory (it's easier to narrate step by step), and understand Tarjan's well enough to recognise when a problem wants it. Its low-link idea reappears unchanged for bridges.

### Critical Connections in a Network (LC 1192): bridges

```java
private int timer = 0;

public List<List<Integer>> findBridges(int n, Map<Integer, List<Integer>> graph) {
    int[] disc = new int[n];
    int[] low = new int[n];
    Arrays.fill(disc, -1);
    List<List<Integer>> bridges = new ArrayList<>();

    for (int i = 0; i < n; i++) {
        if (disc[i] == -1) {
            bridgeDFS(i, -1, graph, disc, low, bridges);
        }
    }
    return bridges;
}

private void bridgeDFS(int node, int parent, Map<Integer, List<Integer>> graph,
                        int[] disc, int[] low, List<List<Integer>> bridges) {
    disc[node] = low[node] = timer++;

    for (int neighbor : graph.getOrDefault(node, List.of())) {
        if (neighbor == parent) continue; // skip the edge straight back to where we came from

        if (disc[neighbor] == -1) {
            bridgeDFS(neighbor, node, graph, disc, low, bridges);
            low[node] = Math.min(low[node], low[neighbor]);

            if (low[neighbor] > disc[node]) {
                bridges.add(Arrays.asList(node, neighbor));
            }
        } else {
            low[node] = Math.min(low[node], disc[neighbor]);
        }
    }
}
```

This is LC 1192 end to end, once the connection list is turned into an adjacency map.

## Complexity

Kosaraju, Tarjan and the bridge and articulation-point searches are all **O(V + E)** time and O(V) extra space (Kosaraju also stores the reversed graph, O(V + E)).

## Variations

- **Articulation points**, with the rule from How it works:

  ```java
  private void cutDFS(int u, int parent, List<List<Integer>> adj, int[] disc, int[] low, boolean[] isCut) {
      disc[u] = low[u] = timer++;
      int children = 0;
      for (int v : adj.get(u)) {
          if (v == parent) continue;
          if (disc[v] == -1) {
              children++;
              cutDFS(v, u, adj, disc, low, isCut);
              low[u] = Math.min(low[u], low[v]);
              if (parent != -1 && low[v] >= disc[u]) isCut[u] = true;   // v can't get above u
          } else {
              low[u] = Math.min(low[u], disc[v]);
          }
      }
      if (parent == -1 && children > 1) isCut[u] = true;              // a root with two subtrees
  }
  ```

- **The condensation:** collapse each SCC into a single node, and the result is a DAG. Many "reachability with cycles" problems become topological-sort or DP problems on it.
- **Parallel edges:** skipping the parent *by node id* is right for simple graphs. With several edges between the same two nodes, skip only the specific edge you arrived on (by edge id), or a genuine second edge back to the parent is wrongly ignored.
- **Very large graphs:** all of these are recursive; on deep graphs, Java's stack can overflow, so iterative versions with explicit stacks are the production answer.

## Common mistakes

- **Using `disc[neighbor]` versus `low[neighbor]` in the wrong place:** after a tree edge, take the child's `low`; for a back edge, take the neighbour's `disc`.
- **In Tarjan's SCC, updating `low` from nodes not on the stack**: those belong to SCCs that are already finished.
- **Bridges: `>=` instead of `>`** (that's the articulation-point test, for nodes).
- **Forgetting the root's special rule** for articulation points: it needs two DFS children.
- **Running SCC algorithms on undirected graphs**, where plain connected components are the answer.

## Practice

Critical Connections in a Network (LC 1192), Minimum Number of Days to Disconnect Island (LC 1568), Longest Cycle in a Graph (LC 2360).

## Key takeaways

- Low-link values: `disc` when a node is found, `low` as the earliest discovery time its subtree can reach.
- Kosaraju: finish order, reverse the edges, then DFS in reverse finish order; each tree is an SCC.
- Tarjan: a node with `low == disc` is the root of an SCC, popped off a stack.
- A tree edge (u, v) is a bridge when `low[v] > disc[u]`; u is a cut vertex when `low[v] >= disc[u]` (roots need two children).
- Everything here is O(V + E).

## Knowledge check

```quiz
? Tree edge (u, v) in an undirected DFS has low[v] = 7 and disc[u] = 5. Is it a bridge?
+ Yes: low[v] > disc[u], so nothing in v's subtree reaches u or above except through this edge
- No: low[v] must equal disc[u]
! Equality would mean a back edge reaches u itself.
- Only if u is the root
! The root rule is for articulation points.
- It depends on the edge's weight
! Bridges ignore weights.
> Bridge test: low[v] > disc[u].

? What are Kosaraju's three steps?
+ DFS recording finish order, reverse every edge, then DFS the reversed graph in reverse finish order
- BFS from every node, then union the results
! That finds undirected components, not SCCs.
- Topologically sort, then reverse the order
! A graph with SCCs has cycles, so it has no topological order.
- Tarjan's algorithm run twice
! Kosaraju is a separate algorithm.
> Each DFS tree in the last step is one SCC.

? In Tarjan's SCC algorithm, when is a node the root of an SCC?
+ When low[node] == disc[node]: nothing in its subtree reaches further back
- When it has no outgoing edges
! A node with outgoing edges can still be a root.
- When it's discovered first
! Only the first SCC found starts that way.
- When low[node] > disc[node]
! low can't exceed disc.
> The root pops its whole SCC off the stack.

? When is the DFS root an articulation point?
+ When it has two or more DFS children
- Always
! A root with one subtree can be removed safely.
- When low[root] == disc[root]
! That's true of every root.
- Never
! A root joining two subtrees is a cut vertex.
> Its children can only reach each other through it.
```
