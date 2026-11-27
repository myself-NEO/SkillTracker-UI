## What it is

**Union-find**, or **disjoint set union** (DSU), keeps elements in groups and answers two questions in nearly constant time, without re-traversing a graph:
- **find:** which group is this element in?
- **union:** merge the groups of these two elements.

That makes it the tool for connectivity that changes over time: edges arrive one by one, and after each one you need to know whether two nodes are connected.

## How it works

Each group is a tree, stored as a `parent` array; the root names the group. Every element starts as its own parent (a group of one), and `union` points one root at the other.

- **Path compression:** `find` walks up to the root and, on the way back, points every node it passed *directly* at the root, so the next `find` on any of them is nearly instant.
- **Union by rank:** `union` attaches the shorter tree under the taller one, so trees stay flat instead of degenerating into long chains.

Together these give amortized **O(α(n))** per operation, where α is the inverse Ackermann function. For any n you will ever meet, α(n) ≤ 4, so this is effectively O(1). Either trick alone already gives O(log n).

## Build it from scratch

```java
class UnionFind {
    int[] parent;
    int[] rank;
    int count;                                   // the number of groups

    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        count = n;
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    public int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]); // path compression: point straight at the root
        }
        return parent[x];
    }

    public boolean union(int x, int y) {
        int rootX = find(x), rootY = find(y);
        if (rootX == rootY) return false; // already connected -> this edge would form a cycle

        if (rank[rootX] < rank[rootY]) {
            parent[rootX] = rootY;
        } else if (rank[rootX] > rank[rootY]) {
            parent[rootY] = rootX;
        } else {
            parent[rootY] = rootX;
            rank[rootX]++;
        }
        count--;                         // two groups became one
        return true;
    }
}
```

## Java API

The JDK has no union-find; you write the class above. For elements that aren't 0..n−1 (emails, strings, coordinates), map each one to an index with a `HashMap` first, or keep the parent links in a `Map<T, T>`.

## Operations and complexity

| Operation | Plain trees | With path compression and union by rank |
|---|---|---|
| `find` | O(n) worst case: a long chain | O(α(n)), effectively O(1) |
| `union` | O(n) | O(α(n)) |
| Build for n elements | O(n) | O(n) |
| Space | O(n) | O(n) |

## Patterns

### Redundant Connection (LC 684): cycle detection for free

`union` returning `false` means the two nodes were already connected, so the new edge closes a cycle:

```java
public int[] findRedundantConnection(int[][] edges) {
    UnionFind uf = new UnionFind(edges.length + 1);
    for (int[] edge : edges) {
        if (!uf.union(edge[0], edge[1])) {
            return edge; // the edge that closes a cycle
        }
    }
    return new int[0];
}
```

### Counting components

Union every edge; `count` is then the number of connected components (Number of Provinces, LC 547; Number of Connected Components, LC 323). It's the [DFS answer](lesson:depth-first-search) without recursion, and it keeps working when edges keep arriving.

### Satisfiability of Equality Equations (LC 990)

Union every pair of variables joined by `==`; then any `!=` between two variables in the same group is a contradiction:

```java
public boolean equationsPossible(String[] equations) {
    UnionFind uf = new UnionFind(26);
    for (String e : equations) {
        if (e.charAt(1) == '=') uf.union(e.charAt(0) - 'a', e.charAt(3) - 'a');
    }
    for (String e : equations) {
        if (e.charAt(1) == '!' && uf.find(e.charAt(0) - 'a') == uf.find(e.charAt(3) - 'a')) return false;
    }
    return true;
}
```

### More uses

- **Accounts Merge (LC 721):** union the emails within each account, then group the emails by root.
- **Number of Islands II (LC 305):** add land cells one at a time, union each with its land neighbours, and read `count` after each addition: online connectivity.
- **Kruskal's MST** checks "would this edge make a cycle?" with union-find: see [minimum spanning trees](lesson:minimum-spanning-trees).

## Common mistakes

- **Comparing `parent[x] == parent[y]`** instead of `find(x) == find(y)`: parents aren't roots until compression has run.
- **Forgetting path compression and union by rank**, which leaves O(n) chains and quadratic total time.
- **Recursion depth in `find`** before the trees are compressed: write `find` iteratively if a chain could be very long.
- **Off-by-one sizing** for 1-indexed nodes: LC 684 numbers nodes from 1, hence `edges.length + 1`.
- **Using union-find for directed reachability**: it models undirected connectivity only.

## Key takeaways

- Union-find answers "same group?" and "merge groups" in effectively O(1), with path compression and union by rank.
- `union` returning false means the edge closes a cycle.
- A `count` field gives the number of components at any moment.
- It shines when connections arrive over time; map non-integer elements to indexes first.
- It's undirected only: use DFS colouring or Kahn's algorithm for directed graphs.

## Knowledge check

```quiz
? What does union(x, y) returning false tell you?
+ x and y were already in the same group, so this edge closes a cycle
- x or y doesn't exist
! Both are valid elements.
- The union failed because the ranks were equal
! Equal ranks are handled by raising one.
- The groups were merged
! It returns true when it merges.
> That's Redundant Connection in one line.

? Why does find point each node it passes directly at the root?
+ Path compression: later finds on those nodes take one step, keeping the trees flat
- To count the nodes in the group
! Counting needs a separate size array.
- To change which group the nodes belong to
! They stay in the same group; only the shortcuts change.
- It's required for union to work
! union works without it, just more slowly.
> With union by rank, operations become O(α(n)).

? Why compare find(x) == find(y), and not parent[x] == parent[y]?
+ A node's parent isn't necessarily the root; only roots identify groups
- Because parent can be null
! It's an int array.
- Because find is faster
! It's the correctness that matters.
- They're always equal
! Two nodes in one group can have different parents.
> Always compare roots.

? Can union-find tell you whether node A can reach node B by following directed edges?
+ No: it models undirected connectivity, merging groups regardless of direction
- Yes, with path compression
! Compression doesn't add direction.
- Yes, if you union in edge order
! The order doesn't encode direction.
- Only for acyclic graphs
! Direction is still lost.
> Use DFS or BFS for directed reachability.
```
