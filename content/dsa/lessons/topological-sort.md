## The idea

A **topological order** lists the nodes of a directed graph so that, for every edge `u → v`, `u` comes before `v`: task scheduling with prerequisites. It exists exactly when the graph is a **DAG** (directed and acyclic).

**Kahn's algorithm:** a node with in-degree 0 has no unmet prerequisites, so it's safe to output now. Output it, then "remove" it by decrementing the in-degree of everything it points to; any neighbour that drops to 0 has just become safe too.

## When to use it

- "Course schedule", "build order", "dependencies", "prerequisites", "can everything be finished?"
- "Detect a cycle in a directed graph": a topological sort that can't place every node has found one.
- Deriving an order from comparisons: "alien dictionary".
- Processing a DAG so every node comes after all its predecessors: [DAG shortest paths](lesson:shortest-paths), [DP on graphs](lesson:dp-on-graphs).

## How it works

- `indegree[v]` is how many prerequisites `v` still has. Zero means it's ready.
- Each node enters the queue exactly once, when its in-degree reaches 0, and each edge is processed once: **O(V + E)**.
- **Cycle detection comes free.** A node on a cycle never reaches in-degree 0, so if fewer than n nodes come out, there's a cycle. That one check is why Course Schedule I and II share almost identical code: one algorithm answers both "give me an order" and "is there a cycle?".
- **The DFS alternative:** push each node onto a stack when its DFS *finishes*, after all its descendants. A node can only finish once everything reachable from it has finished, so popping the stack gives a topological order.

## Java template

```java
public int[] topoSort(int n, int[][] edges) {   // edges[i] = {from, to}
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    int[] indegree = new int[n];

    for (int[] e : edges) {
        adj.get(e[0]).add(e[1]);
        indegree[e[1]]++;
    }

    Queue<Integer> q = new ArrayDeque<>();
    for (int i = 0; i < n; i++) if (indegree[i] == 0) q.offer(i);

    int[] order = new int[n];
    int idx = 0;
    while (!q.isEmpty()) {
        int node = q.poll();
        order[idx++] = node;
        for (int next : adj.get(node)) {
            if (--indegree[next] == 0) q.offer(next);   // decrement, enqueue when free
        }
    }

    return idx == n ? order : new int[0];   // idx < n ⇒ cycle ⇒ no valid order
}
```

## Worked examples

### Course Schedule II (LC 210)

`prerequisites[i] = [a, b]` means b must come first, so the edge is b → a. Build the edges that way, then run the template: an empty array means a cycle, so no valid order.

```java
public int[] findOrder(int numCourses, int[][] prerequisites) {
    int[][] edges = new int[prerequisites.length][];
    for (int i = 0; i < prerequisites.length; i++) {
        edges[i] = new int[] { prerequisites[i][1], prerequisites[i][0] };   // prerequisite -> course
    }
    return topoSort(numCourses, edges);
}
```

### The DFS version: finish-time order

```java
public int[] topologicalSortDFS(int n, Map<Integer, List<Integer>> graph) {
    boolean[] visited = new boolean[n];
    Deque<Integer> stack = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        if (!visited[i]) dfsTopo(i, graph, visited, stack);
    }

    int[] result = new int[n];
    for (int i = 0; i < n; i++) result[i] = stack.pop();
    return result;
}

private void dfsTopo(int node, Map<Integer, List<Integer>> graph, boolean[] visited, Deque<Integer> stack) {
    visited[node] = true;
    for (int neighbor : graph.getOrDefault(node, List.of())) {
        if (!visited[neighbor]) dfsTopo(neighbor, graph, visited, stack);
    }
    stack.push(node); // pushed only after every descendant is already pushed
}
```

This version assumes the graph is a DAG. To detect cycles as well, use the [three colours](lesson:cycle-detection) instead of a plain `visited` array.

### Alien Dictionary (LC 269)

The words are sorted in an unknown alphabet: recover the letter order. Building the graph is the hard part; the sort itself is standard. Compare each pair of adjacent words: the first position where they differ gives one edge, and nothing after it says anything.

```java
public String alienOrder(String[] words) {
    Map<Character, Set<Character>> adj = new HashMap<>();
    Map<Character, Integer> indegree = new HashMap<>();
    for (String w : words) {
        for (char c : w.toCharArray()) {
            adj.putIfAbsent(c, new HashSet<>());
            indegree.putIfAbsent(c, 0);
        }
    }
    for (int i = 0; i + 1 < words.length; i++) {
        String a = words[i], b = words[i + 1];
        if (a.length() > b.length() && a.startsWith(b)) return "";       // "abc" before "ab": invalid
        for (int j = 0; j < Math.min(a.length(), b.length()); j++) {
            char x = a.charAt(j), y = b.charAt(j);
            if (x != y) {
                if (adj.get(x).add(y)) indegree.merge(y, 1, Integer::sum);  // count each edge once
                break;                                                     // only the first difference counts
            }
        }
    }
    StringBuilder order = new StringBuilder();
    Deque<Character> queue = new ArrayDeque<>();
    for (char c : indegree.keySet()) if (indegree.get(c) == 0) queue.offer(c);
    while (!queue.isEmpty()) {
        char c = queue.poll();
        order.append(c);
        for (char next : adj.get(c)) {
            if (indegree.merge(next, -1, Integer::sum) == 0) queue.offer(next);
        }
    }
    return order.length() == indegree.size() ? order.toString() : "";      // a cycle: no valid order
}
```

## Complexity

**O(V + E)** time and space for both Kahn's algorithm and the DFS version. Alien Dictionary adds O(total characters) to compare the words.

## Variations

- **Level by level:** process the queue one level at a time (a `levelSize` loop) to get the *minimum number of semesters* when independent courses can be taken together (Parallel Courses, LC 1136).
- **The alphabetically smallest order:** swap the `ArrayDeque` for a `PriorityQueue`. The queue's ordering policy is a parameter.
- **Minimum Height Trees (LC 310):** repeatedly trim the leaves of an undirected tree, like Kahn's algorithm on degrees; the last one or two nodes left are the centres.
- **Shortest and longest paths in a DAG:** relax the edges in topological order, in O(V + E): see [shortest paths](lesson:shortest-paths) and [DP on graphs](lesson:dp-on-graphs).

## Common mistakes

- **Reversing the edge direction**: decide which way "must come before" points, and build every edge that way.
- **Mixing up in-degree and out-degree**: Kahn's algorithm decrements the in-degree of each node's *targets*.
- **Forgetting the `idx == n` check**, and returning a partial order when there's a cycle.
- **Using the plain DFS version on a graph that may have cycles**: it produces an order anyway. Add the gray colour.
- **Adding duplicate edges twice** (Alien Dictionary): each duplicate inflates an in-degree that never reaches 0.

## Practice

Course Schedule (LC 207), Course Schedule II (LC 210), Find All Possible Recipes from Given Supplies (LC 2115), Parallel Courses (LC 1136), Minimum Height Trees (LC 310), Alien Dictionary (LC 269), Sequence Reconstruction (LC 444).

## Key takeaways

- A topological order puts every edge's source before its target; it exists exactly for DAGs.
- Kahn's algorithm repeatedly removes in-degree-0 nodes; fewer than n placed means a cycle.
- The DFS version pushes nodes when they finish, and pops them in topological order.
- A level-by-level drain counts the minimum number of rounds; a priority queue gives the smallest order.
- In Alien Dictionary, only the first differing letter of adjacent words gives an edge.

## Knowledge check

```quiz
? Kahn's algorithm places only 4 of 6 nodes. What does that mean?
+ The graph has a cycle: the nodes on it never reach in-degree 0
- The graph is disconnected
! Disconnected DAGs still sort completely.
- Two nodes have no edges
! Isolated nodes have in-degree 0 and are placed first.
- The queue was too small
! The queue grows as needed.
> idx < n ⇒ no valid order.

? Why does the DFS version push a node only after all its descendants?
+ Then everything a node must come before is already lower on the stack, so popping gives a valid order
- To visit the nodes in BFS order
! The order is by finish time, not by level.
- To detect cycles
! The plain version doesn't detect cycles.
- It pushes before the descendants
! Pushing first would put the node after its descendants when popped.
> Reverse finish order is a topological order.

? Alien Dictionary compares "wrt" and "wrf". Which edge does it add?
+ t → f: the first position where they differ
- w → w
! Equal letters say nothing about the order.
- r → r and t → f
! Equal letters add no edge.
- f → t
! "wrt" comes first, so t comes before f.
> Only the first difference counts.

? How do you get the minimum number of semesters to finish every course?
+ Run Kahn's algorithm level by level: each level is one semester
- Count the nodes with in-degree 0
! That's only the first semester.
- Use DFS finish times
! Finish times give an order, not the number of rounds.
- Sort the courses by number
! Course numbers don't reflect dependencies.
> Parallel Courses (LC 1136).
```
