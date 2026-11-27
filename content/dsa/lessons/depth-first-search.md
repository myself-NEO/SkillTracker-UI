## The idea

**Depth-first search** goes as deep as possible along one branch before backing up to try the next. It's a natural fit for recursion (the call stack does the bookkeeping), though it can also be written with an explicit stack. Run from one node, it visits exactly the nodes reachable from it, which makes it the tool for components, paths and cycles.

## When to use it

- **Connected components**: "how many groups", "provinces", "islands".
- **Reachability and paths**: "is there a path from A to B?", "list every path".
- **Cycle detection** and **topological sort** ([cycles](lesson:cycle-detection), [topological sort](lesson:topological-sort)).
- Any problem with a backtracking flavour on a graph.

For the **shortest** path in an unweighted graph, use [BFS](lesson:breadth-first-search) instead: DFS finds *a* path, not the shortest one.

## How it works

- Mark the node visited, then recurse into each unvisited neighbour. The `visited` set is what stops cycles from looping forever.
- **The iterative version** replaces the call stack with a `Deque`. With a plain stack, the same unvisited neighbour can be pushed by several earlier nodes before it's processed, so the iterative version checks "already visited?" when it **pops**, and discards the duplicates there. (BFS marks on enqueue instead. You *can* mark on push, with slightly different bookkeeping; pick one convention and stick to it.)
- **BFS and DFS visit in different orders.** Take this graph, with adjacency lists `1: [2,3]`, `2: [1,4]`, `3: [1,5]`, `4: [2,6]`, `5: [3,6]`, `6: [4,5]`:

```text
        1
       / \
      2   3
      |   |
      4   5
       \ /
        6
```

- **BFS from 1:** visit 1 → enqueue 2, 3 → visit 2, 3 → enqueue 4, 5 → visit 4, 5 → enqueue 6 → visit 6. Order: **1, 2, 3, 4, 5, 6**.
- **DFS from 1** (recursive, neighbours in list order): 1 → 2 → 4 → 6 → 5 (6's unvisited neighbour) → 3 (5's unvisited neighbour), then back to 1. Order: **1, 2, 4, 6, 5, 3**.

BFS fans out level by level; DFS commits to one branch all the way down before backing up. Tracing this by hand is how you sanity-check graph code on a whiteboard.

## Java template

```java
public void dfs(int node, Map<Integer, List<Integer>> graph, Set<Integer> visited, List<Integer> order) {
    visited.add(node);
    order.add(node);

    for (int neighbor : graph.getOrDefault(node, List.of())) {
        if (!visited.contains(neighbor)) {
            dfs(neighbor, graph, visited, order);
        }
    }
}
```

## Worked examples

### Iterative DFS, with an explicit stack

```java
public List<Integer> dfsIterative(int start, Map<Integer, List<Integer>> graph) {
    List<Integer> order = new ArrayList<>();
    Set<Integer> visited = new HashSet<>();
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(start);

    while (!stack.isEmpty()) {
        int node = stack.pop();
        if (visited.contains(node)) continue; // note: check/mark visited on POP here
        visited.add(node);
        order.add(node);

        for (int neighbor : graph.getOrDefault(node, List.of())) {
            if (!visited.contains(neighbor)) {
                stack.push(neighbor);
            }
        }
    }
    return order;
}
```

It visits the neighbours in the reverse of their list order (the last one pushed is popped first); push them in reverse if you need the recursive order exactly.

### Connected components (LC 323, LC 547)

Loop over every vertex. Whenever you hit an unvisited one, it belongs to a component you haven't counted yet: run DFS from it to mark the whole component, and count one.

```java
public int countComponents(int n, int[][] edges) {
    Map<Integer, List<Integer>> graph = new HashMap<>();
    for (int i = 0; i < n; i++) graph.put(i, new ArrayList<>());
    for (int[] edge : edges) {
        graph.get(edge[0]).add(edge[1]);
        graph.get(edge[1]).add(edge[0]);
    }

    boolean[] visited = new boolean[n];
    int count = 0;

    for (int i = 0; i < n; i++) {
        if (!visited[i]) {
            count++;
            dfsMark(i, graph, visited);
        }
    }
    return count;
}

private void dfsMark(int node, Map<Integer, List<Integer>> graph, boolean[] visited) {
    visited[node] = true;
    for (int neighbor : graph.get(node)) {
        if (!visited[neighbor]) dfsMark(neighbor, graph, visited);
    }
}
```

DFS from any node visits *exactly* the nodes reachable from it, which in an undirected graph is its whole component. The outer loop makes sure you don't stop after the first component when the graph is disconnected. Number of Provinces (LC 547) is the same thing on an adjacency matrix. [Union-find](lesson:union-find) solves it too; "can you do it another way?" is a common follow-up.

## Complexity

**O(V + E)** time: every vertex is visited once and every edge examined once (twice in an undirected graph, once from each end). **O(V)** space for the visited set and the recursion or the explicit stack.

## Variations

- **All Paths From Source to Target (LC 797):** in a DAG, DFS with a path list and backtracking lists every path; no visited set is needed, because there are no cycles.

  ```java
  public List<List<Integer>> allPathsSourceTarget(int[][] graph) {
      List<List<Integer>> paths = new ArrayList<>();
      List<Integer> path = new ArrayList<>(List.of(0));
      walk(0, graph, path, paths);
      return paths;
  }

  private void walk(int node, int[][] graph, List<Integer> path, List<List<Integer>> paths) {
      if (node == graph.length - 1) {
          paths.add(new ArrayList<>(path));
          return;
      }
      for (int next : graph[node]) {
          path.add(next);
          walk(next, graph, path, paths);
          path.remove(path.size() - 1);      // backtrack
      }
  }
  ```

- **Finish times:** recording a node when its DFS *finishes* (after all its descendants) gives a [topological order](lesson:topological-sort) and drives [Kosaraju's SCC algorithm](lesson:graph-connectivity).
- **Find if Path Exists in Graph (LC 1971):** DFS from the source and check whether the destination was visited.

## Common mistakes

- **No visited set**: infinite recursion the moment the graph has a cycle.
- **Traversing only from node 0**, which misses every other component. Loop over all the nodes.
- **Deep recursion on a large, skewed graph.** A near-linear chain of 10⁴ or more nodes can overflow Java's default stack: know the iterative version, and mention it even if you write the recursive one.
- **Mixing visited conventions** in iterative DFS: mark on pop (and skip duplicates), or mark on push, but not half of each.
- **Using DFS for the shortest path** in an unweighted graph: that's BFS.

## Practice

Find if Path Exists in Graph (LC 1971), Number of Provinces (LC 547), Number of Connected Components in an Undirected Graph (LC 323), All Paths From Source to Target (LC 797), Keys and Rooms (LC 841), Clone Graph (LC 133).

## Key takeaways

- DFS goes deep along one branch before backing up; recursion or an explicit stack holds the path.
- Mark nodes visited, or cycles loop forever.
- Loop over every node to cover every component.
- It runs in O(V + E) time and O(V) space.
- It finds *a* path, not the shortest one; deep recursion needs the iterative fallback in Java.

## Knowledge check

```quiz
? For the example graph (1: [2,3], 2: [1,4], 3: [1,5], 4: [2,6], 5: [3,6], 6: [4,5]), what order does recursive DFS from 1 visit?
+ 1, 2, 4, 6, 5, 3
- 1, 2, 3, 4, 5, 6
! That's BFS: level by level.
- 1, 3, 5, 6, 4, 2
! That follows the neighbour lists in reverse order.
- 1, 2, 4, 3, 5, 6
! DFS continues from 4 to 6 before backing up.
> DFS commits to one branch before backing up.

? Why does the iterative DFS check visited when popping, not only when pushing?
+ The same node can be pushed by several neighbours before it's processed; the pop-time check discards the duplicates
- Because the stack is unordered
! A stack is last-in, first-out.
- To visit nodes in BFS order
! The order stays depth-first.
- It doesn't need any visited check
! Without one, cycles loop forever.
> Mark on pop, or mark on push, consistently.

? countComponents loops over every node, not just node 0. Why?
+ DFS from one node only reaches its own component; a disconnected graph has others
- To visit each node twice
! visited makes sure each node is processed once.
- Because node 0 might not exist
! Nodes 0..n−1 always exist in this problem.
- It's an optimisation
! It's needed for correctness.
> Each unvisited node found by the loop starts a new component.

? A recursive DFS on a 100,000-node chain throws StackOverflowError. What's the fix?
+ Use the iterative version with an explicit Deque
- Use a HashSet instead of a boolean array
! The visited structure isn't what overflows.
- Sort the adjacency lists
! Order doesn't change the depth.
- Run BFS from every node
! That's correct for traversal, but far more work than needed.
> Java's default stack can't hold that many frames.
```
