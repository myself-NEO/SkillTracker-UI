## The idea

Most tree algorithms share one shape: answer the question for each child's subtree, then combine those answers with the current node.

```java
ReturnType solve(TreeNode node) {
    if (node == null) return /* base case value */;

    ReturnType leftResult = solve(node.left);
    ReturnType rightResult = solve(node.right);

    return /* combine leftResult, rightResult, and node.val */;
}
```

It's [the recursive leap of faith](lesson:recursion-fundamentals) applied to trees. Don't try to trace every recursive call in your head: that's how you get stuck. Ask two questions instead:

1. **What does this function promise to return, for ANY node I call it on?** (For example, "the height of the subtree rooted at this node".)
2. **If I already had correct answers for `node.left` and `node.right`, how would I combine them into the answer for `node`?**

If you can answer both, you can write the function without simulating the recursion.

## When to use it

Any question about a property of the tree or its subtrees: height, size, sum, maximum, "is it balanced", "are these two trees the same", diameter, inversion. Then decide which way the information flows:

- **Bottom-up (postorder-style):** children compute something and hand it up to the parent. Height, diameter, "is balanced", subtree sums.
- **Top-down (preorder-style):** the parent hands *context* down to its children. The bounds a node must satisfy ([BST validation](lesson:binary-search-trees)), the remaining sum ([path sums](lesson:tree-paths-and-lca)), the depth so far.

A large fraction of tree problems are just: *"Is this bottom-up or top-down? What's the base case? What do I combine, or what do I pass down?"*

## How it works

- **The base case** is almost always `node == null`, and it returns the identity of the combination: 0 for counts, sums and heights; `true` for "every node satisfies…"; `Integer.MIN_VALUE` for a maximum.
- **One pass, two answers.** Sometimes what the parent needs isn't the final answer: diameter needs the children's *heights*, but the answer is a *path length*. Return what the parent needs, and record the real answer in a field as you go.
- **Sentinels short-circuit.** Returning −1 for "unbalanced" lets one `int` carry both a height and a failure, and lets the failure stop the work early.

## Java template

```java
// Bottom-up: combine what the children return.
int bottomUp(TreeNode node) {
    if (node == null) return 0;                  // the identity of the combination
    int left = bottomUp(node.left);
    int right = bottomUp(node.right);
    return combine(node.val, left, right);
}

// Top-down: pass context from the parent.
void topDown(TreeNode node, int context) {
    if (node == null) return;
    // use context at this node, for example to update an answer field
    topDown(node.left, next(context, node));
    topDown(node.right, next(context, node));
}
```

## Worked examples

These "warm-up" problems all follow the bottom-up pattern, and interviewers use them to check that you understand recursion before moving to harder problems.

### Maximum depth (LC 104)

```java
int height(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(height(root.left), height(root.right));
}
```
This counts nodes on the longest path, so a single-node tree has height 1. If your interviewer wants edges, return `-1` for `null` instead of `0`.

### Minimum depth (LC 111)

Careful: this is **not** just "the opposite of max depth". A node with only one child isn't a leaf, so the missing side mustn't win the `min`:

```java
int minDepth(TreeNode root) {
    if (root == null) return 0;
    if (root.left == null) return 1 + minDepth(root.right);
    if (root.right == null) return 1 + minDepth(root.left);
    return 1 + Math.min(minDepth(root.left), minDepth(root.right));
}
```

### Counting nodes and leaves

```java
int countNodes(TreeNode root) {
    if (root == null) return 0;
    return 1 + countNodes(root.left) + countNodes(root.right);
}

int countLeaves(TreeNode root) {
    if (root == null) return 0;
    if (root.left == null && root.right == null) return 1;
    return countLeaves(root.left) + countLeaves(root.right);
}
```

### Diameter of a binary tree (LC 543)

**The problem:** find the length (in edges) of the longest path between *any* two nodes. The path doesn't need to pass through the root.

**The trap:** the longest path that bends at a node is `leftHeight + rightHeight`, but the *overall* answer might bend deep inside the tree, not at the root. The fix: compute heights recursively, and update a running maximum *as a side effect* along the way.

```java
class Solution {
    int diameter = 0;

    public int diameterOfBinaryTree(TreeNode root) {
        height(root);
        return diameter;
    }

    private int height(TreeNode node) {
        if (node == null) return 0;
        int leftHeight = height(node.left);
        int rightHeight = height(node.right);
        diameter = Math.max(diameter, leftHeight + rightHeight);   // update global answer
        return 1 + Math.max(leftHeight, rightHeight);              // return height, as promised
    }
}
```
This "compute one thing, but update a separate answer along the way" pattern is one of the highest-value tree patterns: it comes back in [Binary Tree Maximum Path Sum](lesson:tree-paths-and-lca) and in [tree DP](lesson:tree-dp).

### Is the tree height-balanced? (LC 110)

A tree is balanced if, for every node, the heights of its left and right subtrees differ by at most 1.

**Naive approach:** call `height()` at every node, which is O(n²) in the worst case (a skewed tree).
**Better approach:** compute height and balance together, short-circuiting with a sentinel value:

```java
class Solution {
    public boolean isBalanced(TreeNode root) {
        return checkHeight(root) != -1;
    }

    private int checkHeight(TreeNode node) {
        if (node == null) return 0;
        int leftHeight = checkHeight(node.left);
        if (leftHeight == -1) return -1;                 // left subtree already unbalanced -- bail out
        int rightHeight = checkHeight(node.right);
        if (rightHeight == -1) return -1;
        if (Math.abs(leftHeight - rightHeight) > 1) return -1;
        return 1 + Math.max(leftHeight, rightHeight);
    }
}
```
This is O(n): each node is visited once, and `-1` propagates up as soon as an imbalance is found anywhere.

### Same tree and symmetric tree (LC 100, LC 101)

```java
boolean isSameTree(TreeNode p, TreeNode q) {
    if (p == null && q == null) return true;
    if (p == null || q == null) return false;
    return p.val == q.val
        && isSameTree(p.left, q.left)
        && isSameTree(p.right, q.right);
}
```

A tree is symmetric if it's a mirror of itself: "same tree", but comparing a subtree against its **mirror**:

```java
boolean isSymmetric(TreeNode root) {
    if (root == null) return true;
    return isMirror(root.left, root.right);
}

boolean isMirror(TreeNode t1, TreeNode t2) {
    if (t1 == null && t2 == null) return true;
    if (t1 == null || t2 == null) return false;
    return t1.val == t2.val
        && isMirror(t1.left, t2.right)   // outer pair
        && isMirror(t1.right, t2.left);  // inner pair
}
```

### Invert a binary tree (LC 226)

```java
TreeNode invertTree(TreeNode root) {
    if (root == null) return null;
    TreeNode temp = root.left;
    root.left = invertTree(root.right);
    root.right = invertTree(temp);
    return root;
}
```

## Complexity

Each of these visits every node once: **O(n) time**, and **O(h) space** for the recursion, which is O(n) on a skewed tree. The exception is the naive balance check, which calls `height()` at every node: O(n log n) on a balanced tree and O(n²) on a skewed one.

## Variations

### Top-down: count good nodes (LC 1448)

A node is "good" if no node on the path from the root to it has a larger value. The context passed down is the maximum so far:

```java
int goodNodes(TreeNode node, int maxSoFar) {
    if (node == null) return 0;
    int good = node.val >= maxSoFar ? 1 : 0;
    int nextMax = Math.max(maxSoFar, node.val);
    return good + goodNodes(node.left, nextMax) + goodNodes(node.right, nextMax);
}
// call goodNodes(root, Integer.MIN_VALUE)
```

It's top-down (context goes in) and bottom-up (counts come out) at once: most real problems mix the two.

### Returning several values with a record

Instead of a sentinel, return everything the parent needs in a small record (Java 16+):

```java
record Info(int height, boolean balanced) {}

Info check(TreeNode node) {
    if (node == null) return new Info(0, true);
    Info l = check(node.left), r = check(node.right);
    boolean balanced = l.balanced() && r.balanced() && Math.abs(l.height() - r.height()) <= 1;
    return new Info(1 + Math.max(l.height(), r.height()), balanced);
}
```

It reads more clearly than a sentinel, at the cost of a small allocation per node and no early exit. Returning several values per subtree is exactly how [tree DP](lesson:tree-dp) works.

### Max, min and sum of all nodes

```java
int maxValue(TreeNode root) {
    if (root == null) return Integer.MIN_VALUE;
    return Math.max(root.val, Math.max(maxValue(root.left), maxValue(root.right)));
}

int sumOfNodes(TreeNode root) {
    if (root == null) return 0;
    return root.val + sumOfNodes(root.left) + sumOfNodes(root.right);
}
```

## Common mistakes

- **Treating a node with one child as a leaf** in minimum depth: the missing side returns 0 and wins the `min`.
- **Checking the diameter only at the root.** The longest path can sit entirely inside a subtree.
- **Returning the global answer instead of the promised value.** The diameter helper must return a height.
- **Calling `height()` inside another recursion**, which recomputes subtrees: O(n²) on a skewed tree.
- **Mixing node and edge counting** for height: decide whether `null` returns 0 or −1.

## Practice

Maximum Depth of Binary Tree (LC 104), Minimum Depth of Binary Tree (LC 111), Same Tree (LC 100), Symmetric Tree (LC 101), Invert Binary Tree (LC 226), Balanced Binary Tree (LC 110), Diameter of Binary Tree (LC 543), Subtree of Another Tree (LC 572), Count Good Nodes in Binary Tree (LC 1448).

## Key takeaways

- State what the function returns for any node, then combine the children's answers.
- Bottom-up passes results up; top-down passes context down; many problems use both.
- The `null` base case returns the identity of the combination.
- When the parent needs something other than the answer, return what it needs and record the answer in a field.
- One pass per node keeps these O(n); recomputing heights makes them O(n²).

## Knowledge check

```quiz
? A tree is a root 1 with only a left child, 2. What is its minimum depth, and what does the naive `1 + min(minDepth(left), minDepth(right))` return?
+ The minimum depth is 2; the naive version returns 1
- Both give 2
! The missing right child returns 0, which wins the min.
- The minimum depth is 1; the naive version returns 2
! The root isn't a leaf, so the minimum depth is 2.
- Both give 1
! The root has a child, so it isn't a leaf.
> A node with one child isn't a leaf: recurse into the side that exists.

? Why does the diameter helper return a height rather than a diameter?
+ The parent needs the longest single downward branch; each node's best bending path is recorded in a field instead
- Because the diameter always passes through the root
! It can lie entirely inside a subtree.
- Because heights are smaller numbers
! Size isn't the reason.
- To make it top-down
! It's bottom-up either way.
> Return what the parent needs; record the answer as you go.

? The naive balance check calls height() at every node. What's its worst case?
+ O(n²), on a skewed tree
- O(n)
! Each height() call is O(size of the subtree).
- O(log n)
! It touches every node at least once.
- O(n log n) on every tree
! That's the balanced case; a skewed tree is worse.
> Computing height and balance in one pass makes it O(n).

? Which of these is naturally top-down?
+ Counting nodes that are at least as large as every one of their ancestors
- The height of a tree
! Height combines the children's heights: bottom-up.
- Whether a tree is balanced
! Balance combines the children's heights: bottom-up.
- The number of leaves
! The count is summed from the children: bottom-up.
> The maximum so far is context handed down from the root.
```
