Trees reward a short checklist more than memorised solutions. This recap gathers the signals, the costs and the mistakes for the whole module.

## Recognizing the pattern

| The problem says… | Reach for |
|---|---|
| "sorted order", "k-th smallest", "validate" on a BST | inorder, or bounds passed down ([BSTs](lesson:binary-search-trees)) |
| height, size, sum, "is it balanced", "same", "symmetric", "invert" | combine the children's answers ([recursive patterns](lesson:recursive-tree-patterns)) |
| "longest path between any two nodes", "maximum path sum" | return one branch; record both at the peak |
| "root-to-leaf", "path sum", "all paths" | pass the remaining value down; backtrack the path ([paths and LCA](lesson:tree-paths-and-lca)) |
| "any downward path that sums to k" | prefix sums along the current path |
| "lowest common ancestor", "distance between two nodes" | LCA; check for a BST first |
| "level by level", zigzag, right side view, "connect siblings" | BFS with the size snapshot ([level order](lesson:level-order-patterns)) |
| "build the tree from these traversals", "serialize" | a shared index or queue, consumed in traversal order ([traversals](lesson:tree-traversals)) |
| "nearest key above or below", with inserts and deletes | `TreeMap` or `TreeSet` ([balanced trees](lesson:balanced-trees)) |
| a sum or minimum over a range, with updates | a [range-query structure](lesson:range-query-structures) |
| prefixes of strings | a [trie](lesson:trie-basics) |

## Decision procedure

A repeatable checklist: walk through it in order, out loud, in an interview.

**1. Clarify the tree type.**
Binary tree or BST? Balanced, or could it be skewed? Can values repeat? Can the tree be empty? Can a node have more than two children? These decide which techniques are even valid: a BST gives you ordering and LCA shortcuts; a plain binary tree doesn't.

**2. Identify what information you need.**
- **Sorted order**? → inorder (on a BST).
- Something to process **before** recursing? → preorder (top-down: pass context down).
- Children resolved **before** the parent? → postorder (bottom-up: combine results).
- **Level-by-level** structure? → BFS.

**3. Default to recursion, then consider the iterative or space-saving follow-up.**
Recursion is almost always the fastest to write correctly. Once it works, be ready for "can you do this iteratively?" or "can you avoid the O(h) stack?" (Morris traversal, for inorder).

**4. Nail the base case before writing anything else.**
For almost every recursive tree function: what do you return for `null`? Get this right, and the rest tends to follow.

**5. Decide what flows down and what flows up.**
- Flowing **down**: bounds for BST validation, the remaining sum in path problems, the depth so far.
- Flowing **up**: heights, counts, booleans like "is balanced", anything computed bottom-up.

**6. State the complexity unprompted, and compare it with the naive alternative.** For example: "a plain BST would be O(n) in the worst case here, since the input might arrive sorted, so I'd use a balanced tree."

### Complexity cheat sheet

**Traversals:** all of them are **O(n)** time. The space is O(h) for DFS (recursive, or with a stack), O(w) for BFS (w = the widest level), and O(1) for Morris traversal: see [traversals](lesson:tree-traversals).

| Structure | Search | Insert | Delete | Min / max |
|---|---|---|---|---|
| Balanced BST (AVL, red-black) | O(log n) | O(log n) | O(log n) | O(log n) |
| Skewed BST | O(n) | O(n) | O(n) | O(n) |
| Binary heap | O(n) | O(log n) | O(log n)† | O(1)† |
| Trie | O(m)* | O(m) | O(m) | — |

*† For the top element only: a min-heap's minimum, or a max-heap's maximum. \* m is the length of the key being searched, not the number of stored words.*

| Range structure | Build | Point update | Range query |
|---|---|---|---|
| [Segment tree](lesson:segment-tree) | O(n) | O(log n) | O(log n) |
| [Fenwick tree](lesson:fenwick-tree) | O(n) | O(log n) | O(log n), for prefix-based queries such as sums |
| [Sparse table](lesson:sparse-table-and-sqrt-decomposition) | O(n log n) | not supported | O(1), for min, max and gcd |

## Edge cases to test

- An empty tree (`root == null`).
- A single node.
- A fully skewed tree: it stress-tests every O(h) assumption, and deep recursion can overflow the stack.
- Duplicate values, if the problem allows them: BST algorithms must state which side equal keys go to.
- Negative values in path sums: no pruning when the running sum goes negative.
- Values at `Integer.MIN_VALUE` and `Integer.MAX_VALUE`: BST bounds, and sums that overflow `int`.
- For LCA: `p == q`, or one node being the other's ancestor.

## Common mistakes

- **Forgetting the null check** at the top of a recursive function: the most common cause of a `NullPointerException` mid-interview. Make it reflex.
- **Miscounting level-order boundaries**: snapshot `queue.size()` *before* the inner loop, never re-read it mid-loop (it changes as you enqueue).
- **Validating a BST by comparing each node only with its children** instead of carrying a range. This passes small examples and fails on a grandchild violation, which makes it a favourite interviewer trap.
- **Confusing height and depth conventions.** State yours before coding ("I'll treat a leaf as height 0") so you and the interviewer agree.
- **Not stating the time and space complexity unprompted**, and not comparing it with the naive alternative.
- **Jumping to code before confirming the tree type.** Thirty seconds of "is this a BST, can it be unbalanced, can values repeat?" saves a restart halfway through.
- **Forgetting to backtrack** in path problems (removing the last element after recursing), which silently corrupts every sibling path.
- **Assuming a balanced tree** when the problem never said so. If the interviewer doesn't specify, ask: your Big-O usually depends on it.

## Practice ladder

**Easy**
- Maximum Depth of Binary Tree (104)
- Same Tree (100)
- Symmetric Tree (101)
- Invert Binary Tree (226)
- Minimum Depth of Binary Tree (111)
- Path Sum (112)
- Diameter of Binary Tree (543)
- Convert Sorted Array to Binary Search Tree (108)
- Two Sum IV - Input is a BST (653)
- Range Sum of BST (938)

**Medium**
- Binary Tree Level Order Traversal (102)
- Binary Tree Zigzag Level Order Traversal (103)
- Validate Binary Search Tree (98)
- Kth Smallest Element in a BST (230)
- Lowest Common Ancestor of a Binary Tree (236)
- Lowest Common Ancestor of a Binary Search Tree (235)
- Construct Binary Tree from Preorder and Inorder Traversal (105)
- Path Sum II (113)
- Path Sum III (437)
- Binary Tree Right Side View (199)
- Populating Next Right Pointers in Each Node (116)
- Delete Node in a BST (450)
- Flatten Binary Tree to Linked List (114)
- Unique Binary Search Trees (96)

**Hard**
- Binary Tree Maximum Path Sum (124)
- Serialize and Deserialize Binary Tree (297)
- Recover Binary Search Tree (99)
- Vertical Order Traversal of a Binary Tree (987)
- Binary Tree Cameras (968)

Problems that mix trees with later modules have their own ladders: Implement Trie (208) and Word Search II (212) in the [tries recap](lesson:tries-recap); Range Sum Query - Mutable (307) and Count of Smaller Numbers After Self (315) in [range queries](lesson:range-query-structures); and Kth Largest Element in an Array (215) with [heaps](lesson:top-k-and-two-heaps).

## Key takeaways

- Clarify the tree first: binary tree or BST, balanced or not, duplicates or not.
- Pick the traversal by the information you need: inorder for sorted order, postorder for bottom-up, preorder for context passed down, BFS for levels.
- Write the `null` base case first, then decide what flows down and what flows up.
- Most tree work is O(n) time and O(h) space, and O(h) is O(n) for a skewed tree.
- For ordered lookups with updates, use `TreeMap`; for ranges, a range-query structure.

## Knowledge check

```quiz
? "Return the values visible from the right side of a binary tree." Which approach fits?
+ BFS level by level, keeping the last node of each level
- Inorder traversal
! Inorder gives sorted order on a BST, not visibility.
- Follow right children from the root
! A deeper left subtree can be visible below a short right one.
- Postorder, combining heights
! Heights don't tell you which node is visible.
> Or a DFS that visits right first and records the first node at each new depth.

? You need the k-th smallest value in a BST. Which traversal fits?
+ Inorder, stopping after k nodes
- Preorder
! Preorder doesn't visit in sorted order.
- Level order
! Levels aren't sorted.
- Postorder
! Postorder visits children before parents, not in sorted order.
> Inorder on a BST is sorted order.

? Why ask whether the tree is balanced before stating a complexity?
+ Most operations are O(h), and h ranges from about log n to n
- Because unbalanced trees use more memory per node
! The node size is the same.
- Because recursion only works on balanced trees
! It works, though deep recursion may overflow the stack.
- Because BFS needs a balanced tree
! BFS works on any tree.
> A skewed tree makes "O(log n)" operations O(n).

? A BST validator uses int bounds, starting from Integer.MIN_VALUE and Integer.MAX_VALUE as "no limit". Which input breaks it?
+ A node whose value is Integer.MAX_VALUE (or Integer.MIN_VALUE)
- An empty tree
! The null check returns true.
- A single node with value 0
! 0 is strictly inside the sentinels.
- A tree whose values are all equal
! That correctly fails the no-duplicates rule.
> Use nullable Long bounds so the extreme values are allowed.
```
