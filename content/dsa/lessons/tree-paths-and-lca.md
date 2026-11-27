## The idea

Path problems track a running value (a sum, or the path itself) as you move from node to node. What changes between them is the **shape** a valid path can take:

- **Root to leaf**: pass the remaining target down, and check it at the leaves.
- **Any downward path**: it can start below the root, so keep prefix sums of the current root-to-node path.
- **Any path at all**: it can bend at one node, joining a left branch and a right branch.

The **lowest common ancestor** (LCA) of two nodes `p` and `q` is the deepest node that has both as descendants (a node counts as its own descendant). It's where the paths from the root to `p` and to `q` split apart.

## When to use it

- "Root-to-leaf", "path sum", "does a path exist", "return all paths": a top-down DFS carrying the remaining value.
- "A path may start and end anywhere, going downward": prefix sums along the path.
- "Maximum path sum", "longest path between any two nodes": the bend-at-a-node pattern from [diameter](lesson:recursive-tree-patterns).
- "Lowest common ancestor", "distance between two nodes", "where do these two paths meet": LCA. Ask first whether the tree is a BST.

## How it works

- **Top-down with a running value.** Subtract each node's value from the remaining target on the way down. A leaf matches when the remaining target equals its value.
- **Backtracking on a tree.** To return the paths themselves, add each node to a shared list on the way down and remove it on the way back up, so sibling branches don't see stale state: the same [choose and un-choose](lesson:backtracking-template) as any backtracking.
- **Bend at a node.** A path can only continue through a node into **one** child, so a recursive call returns the best *single* branch. But the node itself can be the peak where two branches meet, so it updates the overall answer with both.
- **LCA by search.** Search both subtrees for `p` and `q`. If they turn up on different sides, the current node is the LCA; otherwise, pass up whichever side found something.

## Java template

```java
void dfs(TreeNode node, int remaining, List<Integer> path, List<List<Integer>> result) {
    if (node == null) return;
    path.add(node.val);                                       // choose
    if (node.left == null && node.right == null && remaining == node.val) {
        result.add(new ArrayList<>(path));                    // copy: path keeps changing
    } else {
        dfs(node.left, remaining - node.val, path, result);
        dfs(node.right, remaining - node.val, path, result);
    }
    path.remove(path.size() - 1);                             // un-choose
}
```

## Worked examples

### Path Sum (LC 112): does a root-to-leaf path exist?

```java
boolean hasPathSum(TreeNode root, int targetSum) {
    if (root == null) return false;
    if (root.left == null && root.right == null) {           // leaf check
        return root.val == targetSum;
    }
    return hasPathSum(root.left, targetSum - root.val)
        || hasPathSum(root.right, targetSum - root.val);
}
```

### Path Sum II (LC 113): return all root-to-leaf paths with the sum

This is **backtracking on a tree**, and the template above is exactly its helper: build the path on the way down, record a copy at a matching leaf, and remove the last node on the way back up.

```java
List<List<Integer>> pathSum(TreeNode root, int targetSum) {
    List<List<Integer>> result = new ArrayList<>();
    dfs(root, targetSum, new ArrayList<>(), result);
    return result;
}
```

### Path Sum III (LC 437): any downward path

The path can start and end anywhere, as long as it goes downward. Brute force tries every starting node: O(n²) on a skewed tree. The **prefix-sum trick** brings it to O(n):

```java
public int pathSum(TreeNode root, int targetSum) {
    Map<Long, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0L, 1);                              // empty prefix
    return dfs(root, 0L, targetSum, prefixCount);
}

private int dfs(TreeNode node, long currSum, int target, Map<Long, Integer> prefixCount) {
    if (node == null) return 0;
    currSum += node.val;
    int count = prefixCount.getOrDefault(currSum - target, 0);  // how many prefixes make a valid path ending here?
    prefixCount.merge(currSum, 1, Integer::sum);
    count += dfs(node.left, currSum, target, prefixCount);
    count += dfs(node.right, currSum, target, prefixCount);
    prefixCount.merge(currSum, -1, Integer::sum);        // backtrack -- this prefix no longer exists once we leave this branch
    return count;
}
```
**Why this works:** if `currSum - target` appeared earlier as a prefix sum on this root-to-node path, then the nodes between that point and here sum to exactly `target`. It's the [subarray-sum-equals-k idea](lesson:prefix-sums), walked over a tree instead of an array.

### Binary Tree Maximum Path Sum (LC 124)

The path can start and end at *any* nodes; it needn't pass through the root or reach a leaf. This combines the [diameter](lesson:recursive-tree-patterns) trick with path sums:

```java
class Solution {
    int maxSum = Integer.MIN_VALUE;

    public int maxPathSum(TreeNode root) {
        maxGain(root);
        return maxSum;
    }

    private int maxGain(TreeNode node) {
        if (node == null) return 0;
        int leftGain = Math.max(maxGain(node.left), 0);   // ignore negative contributions
        int rightGain = Math.max(maxGain(node.right), 0);
        maxSum = Math.max(maxSum, node.val + leftGain + rightGain);  // best path THROUGH this node
        return node.val + Math.max(leftGain, rightGain);  // best path a PARENT can extend (only one branch!)
    }
}
```
**The subtlety:** a path can't branch, so the *returned* value adds only the better of the two sides. But the node itself can be a peak where both branches meet, which is why `maxSum` considers `node.val + leftGain + rightGain` even though the return value doesn't.

### LCA in a binary tree (LC 236)

With no ordering to exploit, search both sides:

```java
TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);
    if (left != null && right != null) return root;   // p and q found on different sides -- root is the LCA
    return left != null ? left : right;                // otherwise bubble up whichever side found something
}
```

### LCA in a BST (LC 235)

The ordering tells you which side both nodes are on, so you walk a single path:

```java
TreeNode lowestCommonAncestorBST(TreeNode root, TreeNode p, TreeNode q) {
    TreeNode curr = root;
    while (curr != null) {
        if (p.val < curr.val && q.val < curr.val) curr = curr.left;
        else if (p.val > curr.val && q.val > curr.val) curr = curr.right;
        else return curr;   // p and q split here (or one equals curr) -- found it
    }
    return null;
}
```
It's **iterative, with O(1) extra space**: a good follow-up to mention even if you first write it recursively. Always ask "is this a BST?" before choosing an LCA approach: the general algorithm works on a BST, but wastes the ordering.

## Complexity

| Problem | Time | Space |
|---|---|---|
| Path Sum | O(n) | O(h) |
| Path Sum II | O(n · h): each matching leaf copies a path of length up to h | O(h), plus the output |
| Path Sum III | O(n) | O(h) for the recursion, O(n) for the prefix map |
| Maximum Path Sum | O(n) | O(h) |
| LCA, binary tree | O(n) | O(h) |
| LCA, BST | O(h) | O(1), iteratively |

## Variations

- **Sum Root to Leaf Numbers (LC 129):** pass `current * 10 + node.val` down, and add up the values at the leaves.
- **Distance between two nodes:** the number of edges from `p` to `q` is `depth(p) + depth(q) − 2 · depth(lca)`.
- **All Nodes Distance K (LC 863):** record each node's parent in a map, then run a [BFS](lesson:breadth-first-search) outwards from the target, treating the tree as an undirected graph.
- **Parent pointers (LC 1650):** with a `parent` field, walk up from both nodes, and switch each pointer to the other start when it passes the root. They meet at the LCA, exactly like [finding where two linked lists intersect](lesson:two-lists-at-once).
- **p or q may be missing (LC 1644):** the version above assumes both exist. If they might not, count how many the search actually found.
- **Many LCA queries:** binary lifting stores each node's 2ᵏ-th ancestor, built in O(n log n), and then answers each query in O(log n). It's the same doubling idea as a [sparse table](lesson:sparse-table-and-sqrt-decomposition).

## Common mistakes

- **Adding the live path to the results** instead of a copy, or forgetting to remove the node on the way back up.
- **Forgetting to undo the prefix count** in Path Sum III: a prefix from a finished branch then pairs with nodes in another branch, and the two aren't on one path.
- **Using `int` for running sums** when the values can add up past 2³¹ − 1: Path Sum III uses `long` for that reason.
- **Returning both branches from the maximum-path helper.** A parent can extend only one of them.
- **Starting the maximum at 0** instead of `Integer.MIN_VALUE`: in a tree of all-negative values, the answer is negative.
- **Pruning when the remaining sum goes negative.** Values can be negative, so a later node can bring the sum back.

## Practice

Path Sum (LC 112), Path Sum II (LC 113), Sum Root to Leaf Numbers (LC 129), Path Sum III (LC 437), Binary Tree Maximum Path Sum (LC 124), Lowest Common Ancestor of a Binary Tree (LC 236), Lowest Common Ancestor of a Binary Search Tree (LC 235), All Nodes Distance K in Binary Tree (LC 863).

## Key takeaways

- Decide the path's shape first: root to leaf, any downward path, or a path that bends at one node.
- Pass the remaining target down; copy the path at a match, and remove the node on the way back up.
- For any downward path, keep prefix sums along the current root-to-node path, and undo them when leaving a branch.
- A bending path returns one branch to its parent but records both branches at the peak.
- The LCA is where `p` and `q` turn up on different sides; in a BST, where their values split.

## Knowledge check

```quiz
? In Binary Tree Maximum Path Sum, why does the helper return node.val + max(leftGain, rightGain) rather than both gains?
+ A parent can only extend the path into one child; the path that uses both branches is recorded at the node itself
- Because the right branch is always smaller
! Either branch can be larger.
- To avoid integer overflow
! Overflow isn't the reason.
- Because paths must end at a leaf
! These paths can end anywhere.
> The peak uses both branches; everything above it sees only one.

? Path Sum III decrements a prefix's count when leaving a node. What goes wrong without it?
+ A prefix sum from one branch pairs with nodes in a sibling branch, counting paths that don't exist
- Nothing; the counts only ever grow
! Leftover prefixes from finished branches cause false matches.
- The recursion never ends
! The recursion still ends; the count is just wrong.
- It throws ConcurrentModificationException
! Nothing is iterating over the map.
> The map must describe only the current root-to-node path.

? Searching a binary tree for the LCA of p and q, the left subtree returns p and the right subtree returns q. What's the LCA?
+ The current node
- p
! p is in the left subtree only.
- q
! q is in the right subtree only.
- The root of the whole tree
! The split happens at the current node, wherever it is.
> They're on different sides, so the current node is the deepest common ancestor.

? Why can the BST version of LCA run in O(h) time and O(1) space?
+ Comparing values tells you which side both nodes are on, so it walks one path without recursion
- Because a BST is always balanced
! A BST can be skewed; it's still O(h).
- Because it uses a hash map of parents
! It needs no extra structure.
- Because the LCA in a BST is always the root
! Only when p and q are on different sides of the root.
> Ask "is it a BST?" before choosing an LCA approach.
```
