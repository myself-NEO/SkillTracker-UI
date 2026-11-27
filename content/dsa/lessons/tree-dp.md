## The idea

In tree DP, the "index" is a **node**, and the fill order comes free from recursion: a post-order traversal resolves the children before their parent. Each call returns something about the subtree rooted at its node, built from what its children returned. Two refinements make it powerful:
- **Return several values** when the parent needs more than one fact, such as `{best if this node is used, best if it isn't}`.
- **Record the answer on the side** when it isn't what the parent needs, such as a path that bends at this node.

## When to use it

- "The maximum / minimum … in a tree" where a node's choice constrains its neighbours: no two adjacent nodes, cameras covering neighbours.
- Longest or best paths in a tree that can bend at any node.
- Any [recursive tree pattern](lesson:recursive-tree-patterns) where one returned number isn't enough.

## How it works

- **The [include/exclude pair](lesson:fibonacci-style-dp) from House Robber moves onto a tree:** a node's "neighbours" are its children, so each call returns the best total with the node taken, and the best without it.
- **What's returned versus what's recorded:** a path can only continue upwards through one child, so the returned value covers one branch, while the best path *bending* at the node (using both children) is recorded in a field. Diameter and Binary Tree Maximum Path Sum are the classic examples: see [recursive tree patterns](lesson:recursive-tree-patterns) and [paths and LCA](lesson:tree-paths-and-lca).
- **Several states per node:** when a node can be in more than two situations (uncovered, covered, holding a camera), return or track all of them.

## Java template

```java
int[] solve(TreeNode node) {                  // returns the facts the parent needs
    if (node == null) return BASE;            // the identity, e.g. {0, 0}
    int[] left = solve(node.left);
    int[] right = solve(node.right);
    // optionally record an answer that bends through this node, e.g. best = max(best, ...)
    return combine(node, left, right);
}
```

## Worked examples

### House Robber III (LC 337)

Houses form a binary tree, and you can't rob a node together with its parent or child. Each call returns a **pair**, `{robThis, skipThis}`:
- `robThis = node.val + skip(left) + skip(right)`: robbing this node forces both children to be skipped.
- `skipThis = max(rob(left), skip(left)) + max(rob(right), skip(right))`: skipping it lets each child choose freely.

```java
static int rob(TreeNode root) {
    int[] result = robHelper(root);
    return Math.max(result[0], result[1]);
}

static int[] robHelper(TreeNode node) {
    if (node == null) return new int[]{0, 0};
    int[] left = robHelper(node.left);
    int[] right = robHelper(node.right);
    int robThis = node.val + left[1] + right[1];
    int skipThis = Math.max(left[0], left[1]) + Math.max(right[0], right[1]);
    return new int[]{robThis, skipThis};
}
```

For `[3, 2, 3, null, 3, null, 1]` the answer is 7 (the root 3, plus the 3 and the 1 below). It's House Robber with "neighbour" meaning "child": spotting that gets you to the recurrence far faster than deriving it from scratch.

### Binary Tree Cameras (LC 968): three states

A camera covers its node, its parent and its children. Find the fewest cameras covering every node. Each node is in one of three states: **0** not covered, **1** covered without a camera, **2** holding a camera. Decide bottom-up: a leaf should never hold a camera when its parent could cover both.

```java
private int cameras;

public int minCameraCover(TreeNode root) {
    cameras = 0;
    if (state(root) == 0) cameras++;          // the root itself is still uncovered
    return cameras;
}

private int state(TreeNode node) {
    if (node == null) return 1;               // null counts as covered, so leaves don't need cameras for it
    int l = state(node.left), r = state(node.right);
    if (l == 0 || r == 0) {                   // a child is uncovered: only a camera here can cover it
        cameras++;
        return 2;
    }
    if (l == 2 || r == 2) return 1;           // a child's camera covers this node
    return 0;                                 // children covered, no camera nearby: let the parent cover it
}
```

The returned value is the node's state, and the answer (the camera count) is recorded on the side: the same returned-versus-recorded split as Diameter.

### Diameter and Maximum Path Sum, briefly

Both return the best **single-branch** value upwards (a height, or the best downward path sum, clamped at 0) and record the best **bending** value (both branches through the node) in a field. The most common bug is returning the bending value instead. Their full code is in [recursive tree patterns](lesson:recursive-tree-patterns) and [paths and LCA](lesson:tree-paths-and-lca).

## Complexity

Every example visits each node once: **O(n)** time, and O(h) recursion space for a tree of height h.

## Variations

- **Rerooting:** Sum of Distances in Tree (LC 834) computes an answer for every node as the root in O(n), with one post-order pass (subtree sizes and sums) and one pre-order pass that moves the root to each child.
- **General trees:** with an adjacency list instead of left/right, pass the parent to avoid walking back up, and loop over the children.
- **Maximum Product of Splitted Binary Tree (LC 1339):** one pass for the total, one to try each subtree sum s as a cut: `s · (total − s)`.
- **Knapsack on trees** ("choose k nodes, each needing its parent"): each node's return value is an array indexed by how many nodes are chosen in its subtree.

## Common mistakes

- **Returning the bending value** (both branches) to the parent, which double-counts paths.
- **One number where two states are needed:** House Robber III fails with a single "best" per node.
- **Forgetting the root's own state** after the post-order (Cameras: an uncovered root needs one more camera).
- **The wrong base case for `null`**: in Cameras it's "covered"; in House Robber III it's `{0, 0}`.
- **Recomputing subtrees** by calling the helper twice on the same child.

## Practice

House Robber III (LC 337), Binary Tree Cameras (LC 968), Diameter of Binary Tree (LC 543), Binary Tree Maximum Path Sum (LC 124), Maximum Product of Splitted Binary Tree (LC 1339), Sum of Distances in Tree (LC 834).

## Key takeaways

- Tree DP fills in post-order: children before parents, with no loop needed.
- Return everything the parent needs, often a pair or a few states, not just one number.
- Record answers that bend at a node in a field; return only what can extend upwards.
- House Robber III is House Robber with children as neighbours.
- Each node is processed once: O(n).

## Knowledge check

```quiz
? Why does House Robber III return a pair from each subtree?
+ The parent needs both the best total with the child robbed and without it, to respect the no-adjacent rule
- To return the left and right totals separately
! The pair is about robbing this node or not, not about sides.
- Because Java can't return two ints otherwise
! An array is just how the pair is carried.
- One number is enough
! With one number, the parent can't tell whether robbing itself is allowed.
> robThis uses the children's skip values.

? In Binary Tree Cameras, a node's child is uncovered (state 0). What must happen?
+ This node gets a camera: it's the only remaining node that can cover that child
- The child gets a camera
! The child's subtree is finished; only this node or the child itself could cover it, and this one covers more.
- Nothing; the parent will cover it
! The parent is two levels above the child.
- The whole subtree is recomputed
! Each node is decided once.
> Then this node reports state 2 to its parent.

? Diameter's helper returns a height, while the answer is a path length. Why not return the path length?
+ The parent can only extend one branch; a path bending at this node can't be extended further up
- Because heights are smaller
! Size isn't the reason.
- Because the path length needs the root
! The best path may not touch the root.
- It could return either
! Returning the bending length makes the parent double-count.
> Returned value ≠ recorded answer.

? What is the time complexity of these tree DPs?
+ O(n): each node is processed once in a post-order traversal
- O(n²)
! No node is recomputed.
- O(n log n)
! There's no sorting or halving.
- O(2ⁿ)
! That would be trying every subset of nodes.
> Space is O(h) for the recursion.
```
