## What it is

A **tree** is a hierarchical, non-linear data structure made of **nodes** connected by **edges**, where:
- There's exactly **one root** node (the top).
- Every node except the root has exactly **one parent**.
- There are **no cycles**: you can't follow edges and come back to where you started.

In graph terms, **a tree is a connected, acyclic graph**, so a tree with n nodes has exactly n − 1 edges. Every tree is a graph, but not every graph is a tree: graphs can have cycles, several components, or nodes reachable along more than one path.

**Real-world analogies:**
- A file system: folders contain files and folders, and each file has exactly one parent folder.
- An org chart: each employee has one manager, and a manager has several reports.
- The HTML DOM: every element has one parent and can have many children.
- A family tree, read as descent.

**Why trees matter for interviews:** trees are the most common topic after arrays and strings, because they make you practise **recursion**, **divide-and-conquer thinking** and **choosing the right traversal order**. Those skills transfer directly to graphs, dynamic programming and real systems: database indexes, file systems, routing tables, and the syntax trees inside compilers.

## Terminology

```
                 1              <- Root (Level 0)
               /   \
              2     3           <- Level 1
             / \      \
            4   5      6        <- Level 2 (all leaves)
```

| Term | Meaning |
|---|---|
| **Node** | A single element holding data (`1`, `2`, `3`…) |
| **Root** | The topmost node, with no parent (`1`) |
| **Edge** | The connection between a parent and a child |
| **Parent** | A node with at least one child (`2` is the parent of `4` and `5`) |
| **Child** | A node directly connected below another (`4` is a child of `2`) |
| **Sibling** | Nodes sharing the same parent (`4` and `5`) |
| **Leaf** | A node with no children (`4`, `5`, `6`) |
| **Internal node** | Any node with at least one child (`1`, `2`, `3`) |
| **Ancestor** | Any node on the path from the root to a given node (`1` and `2` are ancestors of `4`) |
| **Descendant** | Any node reachable going downward from a given node |
| **Subtree** | A node plus everything below it, treated as its own tree |
| **Depth of a node** | The number of edges from the **root** to that node (depth of `1` = 0, depth of `4` = 2) |
| **Height of a node** | The number of edges on the **longest path from that node down to a leaf** (height of `1` = 2; height of a leaf = 0) |
| **Height of the tree** | The height of the root |
| **Degree of a node** | The number of children it has |

**The #1 source of confusion: depth vs. height.**
- **Depth** is measured **top-down** (root → node).
- **Height** is measured **bottom-up** (node → deepest leaf).
- The depth of the root is always 0. The height of a leaf is always 0.
- Some textbooks count **nodes** instead of **edges**, giving a single-node tree height 1, not 0. **Clarify the convention with your interviewer**: it rarely changes the algorithm, just the +1 or −1 in your base case.

## How it works

A **binary tree** restricts every node to **at most 2 children**, conventionally called `left` and `right`. Each child is itself the root of a binary tree, and that recursive shape is why tree code is almost always recursive.

### Shapes of binary trees

```
Full Binary Tree                Complete Binary Tree
(every node has 0 or 2          (every level full except
 children -- never exactly 1)    last, filled left to right)

        1                              1
       / \                            / \
      2   3                          2   3
     / \                            / \  /
    4   5                          4  5 6


Perfect Binary Tree              Degenerate / Skewed Tree
(all internal nodes have 2       (each node has only 1 child --
 children, all leaves same       behaves like a linked list,
 depth)                           worst case for BSTs)

        1                              1
       / \                              \
      2   3                              2
     / \  / \                             \
    4  5 6   7                             3
                                             \
                                              4
```

Why this matters: most tree operations cost **O(h)**, where h is the height. In a balanced tree h is about log₂ n; in a **skewed tree** h is n − 1, so every "should be O(log n)" operation degrades to **O(n)**. That's the whole motivation for [self-balancing trees](lesson:balanced-trees).

### Representations

1. **Linked**: each node holds references to its children, as in `TreeNode` below. This is what you'll use almost all the time.
2. **Array**, for **complete** binary trees (especially [heaps](lesson:heap-basics)). For a node at index `i` (0-indexed):
   - left child → `2*i + 1`
   - right child → `2*i + 2`
   - parent → `(i - 1) / 2`

   This works *only* because a complete tree has no gaps: every level is filled left to right, so index arithmetic alone gives the shape.

### Types of trees

| Tree type | What it optimizes for | Real usage |
|---|---|---|
| **Binary tree** | General hierarchical data | Expression trees, decision trees |
| **[Binary search tree](lesson:binary-search-trees)** | Ordered data, fast search | In-memory ordered maps |
| **[AVL tree](lesson:balanced-trees)** | Guaranteed O(log n), with strict balance | Read-heavy in-memory lookups |
| **[Red-black tree](lesson:balanced-trees)** | O(log n), with cheaper rebalancing than AVL | `TreeMap` and `TreeSet` in Java, `std::map` in C++ |
| **B-tree / B+ tree** | Wide nodes, so few disk reads | Database and file-system indexes |
| **[Heap](lesson:heap-basics)** | Fast access to the min or max | Priority queues, scheduling, Dijkstra's algorithm |
| **[Trie](lesson:trie-basics)** | Fast prefix search over strings | Autocomplete, spell-checkers, IP routing |
| **[Segment tree](lesson:segment-tree)** | Range queries with updates | Interval problems, competitive programming |
| **[Fenwick tree](lesson:fenwick-tree)** | Prefix sums with updates, in less memory | The same, for simpler cases |
| **N-ary tree** | Nodes with any number of children | File systems, the DOM, category hierarchies |

## Build it from scratch

The node class you'll reuse everywhere:

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}
```

The tree from the terminology diagram, built by hand:

```java
TreeNode root = new TreeNode(1);
root.left = new TreeNode(2);
root.right = new TreeNode(3);
root.left.left = new TreeNode(4);
root.left.right = new TreeNode(5);
root.right.right = new TreeNode(6);
```

LeetCode writes trees in **level order, with `null` for a missing child**: that tree is `[1, 2, 3, 4, 5, null, 6]`. To test solutions locally, build a tree from that format with a queue: each node taken from the queue claims the next two values as its children.

```java
static TreeNode fromLevelOrder(Integer[] values) {
    if (values.length == 0 || values[0] == null) return null;
    TreeNode root = new TreeNode(values[0]);
    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    int i = 1;
    while (!queue.isEmpty() && i < values.length) {
        TreeNode node = queue.poll();
        if (values[i] != null) {                          // left child
            node.left = new TreeNode(values[i]);
            queue.offer(node.left);
        }
        i++;
        if (i < values.length && values[i] != null) {     // right child
            node.right = new TreeNode(values[i]);
            queue.offer(node.right);
        }
        i++;
    }
    return root;
}
```

A `null` never enters the queue, so it never claims children: that's why the format needs no placeholders below a missing node.

## Java API

The JDK has no general-purpose binary tree class: in interviews you always write `TreeNode` yourself. What it has are trees inside its collections:

| Class | The tree inside | Use it for |
|---|---|---|
| `TreeMap<K, V>`, `TreeSet<E>` | a red-black tree | sorted keys, floor and ceiling lookups, range views: see [binary search trees](lesson:binary-search-trees) |
| `PriorityQueue<E>` | a binary heap stored in an array | repeatedly taking the smallest item: see [PriorityQueue](lesson:java-priorityqueue) |
| `HashMap<K, V>` | small red-black trees in crowded buckets | nothing directly: since Java 8, a bucket that grows past 8 entries (in a table of at least 64 buckets) becomes a tree, so heavy collisions cost O(log n) instead of O(n) |

## Operations and complexity

Facts that come up in nearly every complexity argument (counting height in edges):

| Fact | Value |
|---|---|
| Edges in a tree with n nodes | n − 1 |
| Most nodes at depth d of a binary tree | 2ᵈ |
| Nodes in a perfect binary tree of height h | 2ʰ⁺¹ − 1 |
| Height of a binary tree with n nodes | from ⌊log₂ n⌋ (complete) to n − 1 (skewed) |
| Leaves in a perfect binary tree | about half of all the nodes |

| Operation | Any binary tree | Binary search tree |
|---|---|---|
| Visit every node | O(n) time, O(h) space | O(n) time, O(h) space |
| Find a value | O(n): it could be anywhere | O(h): one root-to-leaf path |
| Insert a value | O(n), to find a free spot in level order | O(h) |

O(h) means O(log n) only when the tree is balanced; plan for O(n) unless the problem promises balance.

## Patterns

Almost every tree problem belongs to one of these families, each with its own lesson:
- **Pick a traversal order, then add logic**: [tree traversals](lesson:tree-traversals).
- **Combine the children's answers** (height, counts, balance, diameter): [recursive tree patterns](lesson:recursive-tree-patterns).
- **Carry a running value down a path**, or find where two nodes meet: [paths and LCA](lesson:tree-paths-and-lca).
- **Use the ordering** of a binary search tree: [binary search trees](lesson:binary-search-trees).
- **Work level by level** with a queue: [level-order patterns](lesson:level-order-patterns).

## Common mistakes

- **Mixing up depth and height**, or edge and node counting. State the convention before coding.
- **Forgetting the `null` check** at the top of a recursive function: the most common `NullPointerException` in tree code.
- **Assuming a binary tree is a BST.** Ordering is an extra promise; check the problem statement.
- **Assuming balance.** Unless the problem says so, the height can be n − 1: O(h) then means O(n), and deep recursion risks a `StackOverflowError`.
- **Using index arithmetic on a tree that isn't complete.** The `2i + 1` layout only works without gaps.

## Key takeaways

- A tree is a connected, acyclic graph: one root, one parent per node, n − 1 edges.
- Depth counts down from the root; height counts up from the deepest leaf. Say which convention you use.
- Most costs are O(h): about log n when balanced, n when skewed.
- Write `TreeNode` yourself; the JDK's trees live inside `TreeMap`, `TreeSet`, `PriorityQueue` and crowded `HashMap` buckets.
- Complete trees fit in an array, with children at `2i + 1` and `2i + 2`.

## Knowledge check

```quiz
? In the terminology diagram (1 at the root; 2 and 3 below it; 4 and 5 below 2; 6 below 3), what are the depth of node 4 and the height of node 1, counting edges?
+ Depth 2, height 2
- Depth 2, height 3
! Height counts edges down to the deepest leaf: 1 → 2 → 4 is 2 edges.
- Depth 3, height 2
! Depth counts edges from the root: 1 → 2 → 4 is 2 edges.
- Depth 1, height 2
! Node 4 is two edges below the root.
> Depth is measured down from the root, height up from the deepest leaf.

? Why does the array layout (children at 2i + 1 and 2i + 2) suit heaps but not general binary trees?
+ It only works for complete trees, with no gaps; a general tree would need many empty slots
- Arrays can't store objects
! They can; the problem is the gaps.
- Heaps are always perfect trees
! Heaps are complete, not necessarily perfect.
- The index arithmetic is too slow for large trees
! It's O(1).
> A skewed tree of n nodes would need about 2ⁿ slots.

? A binary search tree is built by inserting 1, 2, 3, …, n in that order. What does a search cost?
+ O(n): every node has only a right child, so the tree is a chain
- O(log n), because it's a BST
! O(log n) needs a balanced tree.
- O(1)
! It still has to walk down the tree.
- O(n log n)
! A single search walks one path.
> Sorted inserts produce a skewed tree; self-balancing trees fix this.

? Which JDK class is backed by a red-black tree?
+ TreeMap
- PriorityQueue
! PriorityQueue is a binary heap in an array.
- ArrayDeque
! ArrayDeque is a circular array.
- LinkedHashMap
! LinkedHashMap is a hash table with a linked list for ordering.
> TreeSet is too; HashMap uses small red-black trees only inside crowded buckets.
```
