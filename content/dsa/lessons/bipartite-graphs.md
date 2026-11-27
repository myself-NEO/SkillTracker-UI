## The idea

A graph is **bipartite** when its vertices split into two groups such that every edge joins the two groups, and no edge stays inside one. Equivalently, it can be **2-coloured** without two neighbours sharing a colour, or it contains **no odd-length cycle**.

To check, colour as you traverse: give each newly reached node the opposite colour of the node you came from. Finding a neighbour that already has the *same* colour is a contradiction, so the graph isn't bipartite.

## When to use it

- "Split into two groups", "two teams", "enemies or rivals can't be together", "is the graph bipartite?"
- Matching problems (workers to jobs, students to projects) start from a bipartite graph.

This lesson also collects the less common graph patterns worth knowing: cloning a graph, and walking every edge exactly once (Eulerian paths).

## How it works

- Flipping the colour across every edge is exactly an attempt to 2-colour the graph. If that ever forces a node to be both colours, no valid split exists: the two paths that reached it form an odd cycle.
- Loop over every node as a starting point, because each connected component must be coloured independently.

## Java template

```java
public boolean isBipartite(int[][] graph) {
    int n = graph.length;
    int[] color = new int[n]; // 0 = uncolored, 1 = color A, -1 = color B

    for (int i = 0; i < n; i++) {
        if (color[i] == 0) {
            if (!bfsColor(i, graph, color)) return false;
        }
    }
    return true;
}

private boolean bfsColor(int start, int[][] graph, int[] color) {
    Queue<Integer> queue = new ArrayDeque<>();
    queue.offer(start);
    color[start] = 1;

    while (!queue.isEmpty()) {
        int node = queue.poll();
        for (int neighbor : graph[node]) {
            if (color[neighbor] == 0) {
                color[neighbor] = -color[node]; // opposite color
                queue.offer(neighbor);
            } else if (color[neighbor] == color[node]) {
                return false; // same color as its own neighbor -> contradiction
            }
        }
    }
    return true;
}
```

This is Is Graph Bipartite? (LC 785) as written, with the graph given as an adjacency array.

## Worked examples

### Possible Bipartition (LC 886)

The same idea in a story: split n people (numbered from 1) into two groups, given pairs who dislike each other. Each dislike is an undirected edge; then colour, here with DFS:

```java
public boolean possibleBipartition(int n, int[][] dislikes) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
    for (int[] d : dislikes) {
        adj.get(d[0]).add(d[1]);
        adj.get(d[1]).add(d[0]);
    }
    int[] color = new int[n + 1];                                   // people are numbered from 1
    for (int i = 1; i <= n; i++) {
        if (color[i] == 0 && !paint(i, 1, adj, color)) return false;
    }
    return true;
}

private boolean paint(int node, int c, List<List<Integer>> adj, int[] color) {
    color[node] = c;
    for (int next : adj.get(node)) {
        if (color[next] == c) return false;                          // two enemies in one group
        if (color[next] == 0 && !paint(next, -c, adj, color)) return false;
    }
    return true;
}
```

### Clone Graph (LC 133)

Copy a connected graph. DFS while keeping a map from each original node to its copy. The map is what makes cycles safe: before recursing into a neighbour, check whether it already has a copy, and reuse it if so.

```java
public Node cloneGraph(Node node) {
    return clone(node, new HashMap<>());
}

private Node clone(Node node, Map<Node, Node> copies) {
    if (node == null) return null;
    Node copy = copies.get(node);
    if (copy != null) return copy;                    // already cloned: reuse it, which also stops cycles
    copy = new Node(node.val);
    copies.put(node, copy);                           // register BEFORE recursing into the neighbours
    for (Node next : node.neighbors) copy.neighbors.add(clone(next, copies));
    return copy;
}
```

## Complexity

The bipartite check and Clone Graph are both **O(V + E)** time and O(V) space: every node and edge is handled once.

## Variations

- **Eulerian paths** visit every *edge* exactly once (unlike Hamiltonian paths, which visit every *node* once and are NP-complete in general). An undirected graph has an Eulerian circuit exactly when every vertex has even degree, and an Eulerian path when exactly 0 or 2 vertices have odd degree. Reconstruct Itinerary (LC 332) builds one with Hierholzer's algorithm: DFS that uses up edges, adding each airport to the front of the route as its DFS *finishes*:

  ```java
  public List<String> findItinerary(List<List<String>> tickets) {
      Map<String, PriorityQueue<String>> next = new HashMap<>();
      for (List<String> t : tickets) {
          next.computeIfAbsent(t.get(0), k -> new PriorityQueue<>()).add(t.get(1));
      }
      LinkedList<String> route = new LinkedList<>();
      visit("JFK", next, route);
      return route;
  }

  private void visit(String airport, Map<String, PriorityQueue<String>> next, LinkedList<String> route) {
      PriorityQueue<String> out = next.get(airport);
      while (out != null && !out.isEmpty()) visit(out.poll(), next, route);   // use each ticket once
      route.addFirst(airport);                                               // add on the way back out
  }
  ```

  The priority queues pick the alphabetically smallest destination first, as the problem asks; adding airports as they finish handles dead ends correctly.
- **Word Ladder** is BFS on a graph that's never built up front: see [breadth-first search](lesson:breadth-first-search).
- **Colouring with more than two colours** is NP-hard in general; interview versions are a small backtracking search: see [backtracking](lesson:backtracking-template).
- **Course Schedule I and II** are one algorithm with two return types: see [topological sort](lesson:topological-sort).

## Common mistakes

- **Colouring only from node 0**, which misses every other component.
- **Using 0 both as a colour and as "uncoloured"**: use 1 and −1 for the colours.
- **Adding only one direction** of an undirected relation such as a dislike.
- **Registering the clone after recursing** in Clone Graph, which recurses forever around a cycle.
- **Building the itinerary greedily, front to back**: it can walk into a dead end too early. Add airports as their DFS finishes.

## Practice

Is Graph Bipartite? (LC 785), Possible Bipartition (LC 886), Clone Graph (LC 133), Reconstruct Itinerary (LC 332), Valid Arrangement of Pairs (LC 2097).

## Key takeaways

- Bipartite = 2-colourable = no odd cycle.
- Colour by traversal, flipping the colour across each edge; a same-coloured neighbour is a contradiction.
- Loop over every node so each component is checked.
- Clone a graph with a map from originals to copies, registered before recursing.
- Eulerian paths use every edge once; Hierholzer's algorithm adds nodes as their DFS finishes.

## Knowledge check

```quiz
? Which graph is NOT bipartite?
+ A triangle: three nodes, each connected to the other two
- A square: four nodes in a cycle
! An even cycle alternates colours.
- A tree
! Every tree is 2-colourable by depth.
- A graph with no edges
! Any split works.
> Odd cycles can't be 2-coloured.

? Why does the bipartite check loop over every node as a starting point?
+ Each connected component must be coloured on its own; one traversal only covers one component
- To check each node twice
! Coloured nodes are skipped.
- Because BFS needs a different start each time
! One start covers its whole component.
- It's an optimisation
! It's needed for correctness on disconnected graphs.
> The same loop as counting components.

? In Clone Graph, why put the new copy into the map before recursing into the neighbours?
+ A cycle leads back to the node; finding its copy in the map stops the recursion and reuses it
- To keep the neighbours sorted
! Order doesn't matter.
- Because HashMap needs it first
! The map works in any order.
- It makes no difference
! Registering afterwards recurses forever around a cycle.
> The map doubles as the visited set.

? When does an undirected connected graph have an Eulerian circuit?
+ When every vertex has an even degree
- When every vertex has an odd degree
! Odd degrees leave dead ends.
- When it's bipartite
! Bipartiteness is unrelated.
- When it has no cycles
! A circuit is itself a cycle.
> With exactly two odd-degree vertices, there's an Eulerian path instead.
```
