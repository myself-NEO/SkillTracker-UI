## What it is

A **binary search tree** (BST) adds one ordering rule to a binary tree: for every node, **everything in the left subtree is smaller, and everything in the right subtree is larger** (no duplicates, in the classic definition).

```
          8
        /   \
       3     10
      / \      \
     1   6      14
        / \    /
       4   7  13
```

An inorder traversal of this tree gives `1, 3, 4, 6, 7, 8, 10, 13, 14`: sorted. **This one fact drives almost every BST algorithm.**

## How it works

Each comparison discards a whole subtree, just as each step of [binary search](lesson:binary-search-template) discards half the array. So search, insert and delete follow one root-to-leaf path and cost **O(h)**.

The catch is the height. A random insertion order tends to keep the tree shallow, but sorted input (1, 2, 3, …) builds a chain of height n − 1, and every operation degrades to O(n). [Self-balancing trees](lesson:balanced-trees) prevent that by restructuring after every change.

If duplicates are allowed, choose one side for equal keys (say, the right) and use it consistently in insert, search and validation, or store a count in each node instead.

## Build it from scratch

### Search

```java
TreeNode searchBST(TreeNode root, int val) {
    if (root == null || root.val == val) return root;
    return val < root.val ? searchBST(root.left, val) : searchBST(root.right, val);
}
```
O(h): O(log n) if balanced, O(n) if skewed. Insert and delete below have the same cost.

### Insert

```java
TreeNode insertIntoBST(TreeNode root, int val) {
    if (root == null) return new TreeNode(val);
    if (val < root.val) root.left = insertIntoBST(root.left, val);
    else root.right = insertIntoBST(root.right, val);
    return root;
}
```

### Delete: the trickiest of the three

There are three cases once you find the node to delete:
1. **A leaf**: just remove it.
2. **One child**: replace the node with its child.
3. **Two children**: replace the node's value with its **inorder successor** (the smallest value in its right subtree), then delete that successor from the right subtree.

```java
TreeNode deleteNode(TreeNode root, int key) {
    if (root == null) return null;
    if (key < root.val) {
        root.left = deleteNode(root.left, key);
    } else if (key > root.val) {
        root.right = deleteNode(root.right, key);
    } else {
        // found the node to delete
        if (root.left == null) return root.right;
        if (root.right == null) return root.left;
        TreeNode successor = findMin(root.right);   // smallest in right subtree
        root.val = successor.val;
        root.right = deleteNode(root.right, successor.val);  // remove the duplicate
    }
    return root;
}

TreeNode findMin(TreeNode node) {
    while (node.left != null) node = node.left;
    return node;
}
```
You could equally use the inorder **predecessor**, the largest value in the left subtree. Either works; the successor is the more common convention.

## Java API

You'll rarely hand-write a BST outside interviews: `TreeMap` and `TreeSet` are [red-black trees](lesson:balanced-trees) with guaranteed O(log n) operations, and they expose the ordering through navigation methods:

```java
TreeMap<Integer, String> map = new TreeMap<>(Map.of(10, "a", 20, "b", 30, "c"));
map.floorKey(25);                  // 20: the largest key <= 25
map.ceilingKey(25);                // 30: the smallest key >= 25
map.lowerKey(20);                  // 10: strictly less
map.higherKey(20);                 // 30: strictly greater
map.firstKey();                    // 10
map.headMap(20);                   // {10=a}: the keys < 20
map.subMap(10, true, 20, true);    // {10=a, 20=b}: a live range view
map.pollFirstEntry();              // removes and returns 10=a
```

`TreeSet` has the same methods without values: `floor`, `ceiling`, `lower`, `higher`, `first`, `last`, `headSet`, `tailSet`, `subSet` and `pollFirst`. The navigation methods return `null` when no key qualifies.

## Operations and complexity

| Operation | Hand-written BST, balanced | Hand-written BST, skewed | `TreeMap` / `TreeSet` |
|---|---|---|---|
| Search, insert, delete | O(log n) | O(n) | O(log n) |
| Min, max, floor, ceiling | O(log n) | O(n) | O(log n) |
| Inorder (sorted) walk | O(n) | O(n) | O(n) |
| k-th smallest | O(h + k) | O(n) | O(k), by iterating |

## Patterns

### Validate a BST (LC 98): the classic trap

**The wrong approach (a very common mistake):** checking only `node.val > node.left.val && node.val < node.right.val`. This misses violations by **grandchildren**: a right child's left child can be smaller than the root while still bigger than its own parent.

**The correct approach:** carry a valid `(lower, upper)` range down through the recursion:

```java
boolean isValidBST(TreeNode root) {
    return validate(root, null, null);
}

boolean validate(TreeNode node, Long lower, Long upper) {
    if (node == null) return true;
    if (lower != null && node.val <= lower) return false;
    if (upper != null && node.val >= upper) return false;
    return validate(node.left, lower, (long) node.val)
        && validate(node.right, (long) node.val, upper);
}
```
Nullable `Long` bounds mean "no limit yet", so a node holding `Integer.MIN_VALUE` or `Integer.MAX_VALUE` isn't wrongly rejected, as it would be if those values were used as `int` sentinels.

**Alternative:** do an inorder traversal and check that the output is strictly increasing. It's simpler to reason about, with the same O(n) cost.

### K-th smallest element (LC 230)

Inorder traversal visits the nodes in sorted order, so stop as soon as you've counted `k` of them:

```java
int kthSmallest(TreeNode root, int k) {
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode curr = root;
    while (curr != null || !stack.isEmpty()) {
        while (curr != null) {
            stack.push(curr);
            curr = curr.left;
        }
        curr = stack.pop();
        if (--k == 0) return curr.val;
        curr = curr.right;
    }
    return -1;  // k was out of range
}
```

### Range sum of a BST (LC 938): prune with the ordering

When a node is below the range, its whole left subtree is too; when it's above, so is its whole right subtree. Skip those subtrees without visiting them:

```java
int rangeSumBST(TreeNode node, int low, int high) {
    if (node == null) return 0;
    if (node.val < low) return rangeSumBST(node.right, low, high);    // the left side is all too small
    if (node.val > high) return rangeSumBST(node.left, low, high);    // the right side is all too large
    return node.val + rangeSumBST(node.left, low, high) + rangeSumBST(node.right, low, high);
}
```

### Sorted array to a balanced BST (LC 108)

Picking the middle element as the root guarantees balance:

```java
TreeNode sortedArrayToBST(int[] nums) {
    return build(nums, 0, nums.length - 1);
}

TreeNode build(int[] nums, int left, int right) {
    if (left > right) return null;
    int mid = left + (right - left) / 2;
    TreeNode node = new TreeNode(nums[mid]);
    node.left = build(nums, left, mid - 1);
    node.right = build(nums, mid + 1, right);
    return node;
}
```

### More that use the sorted order

- **Two Sum IV (LC 653):** an inorder walk gives a sorted list; then use [two pointers](lesson:two-pointers).
- **Recover a BST (LC 99):** two nodes were swapped; an inorder walk finds the one or two places where the order drops.
- **Inorder successor (LC 285):** the smallest value larger than the target. Walk down from the root, remembering the last node where you went left.

## Common mistakes

- **Validating against the children only**: a grandchild can violate an ancestor's bound.
- **`int` sentinels for the bounds**, which wrongly reject `Integer.MIN_VALUE` or `Integer.MAX_VALUE`; use nullable `Long` bounds.
- **Not deciding how duplicates are handled** before writing insert and validate.
- **Assuming O(log n)** for a hand-written BST: sorted input makes it a chain, and recursive code on a chain can overflow the stack.
- **Unboxing a missing key**: `int k = map.floorKey(x);` throws `NullPointerException` when no key qualifies.

## Key takeaways

- Left smaller, right larger, at every node: so an inorder walk is sorted.
- Search, insert and delete follow one path: O(h), which is O(log n) only when the tree is balanced.
- Delete a node with two children by copying its inorder successor's value, then deleting the successor.
- Validate with bounds passed down, not by comparing parents with children.
- In Java, use `TreeMap` and `TreeSet`: guaranteed O(log n), with floor, ceiling and range views.

## Knowledge check

```quiz
? A validator checks only that each node is greater than its left child and less than its right child. Which tree fools it?
+ 5 with right child 6, whose left child is 4
- 2 with left child 1 and right child 3
! That's a valid BST, and the check correctly accepts it.
- A single node
! A single node is a valid BST.
- 3 with left child 1, whose right child is 2
! 2 is in 3's left subtree and smaller than 3, so this tree really is valid.
> 4 is in 5's right subtree but smaller than 5; only bounds passed down catch it.

? Deleting a node with two children, what value replaces it?
+ Its inorder successor: the smallest value in its right subtree
- Its left child's value
! That can break the ordering in the left child's right subtree.
- The root's value
! The root isn't involved.
- The largest value in its right subtree
! That would be larger than the other values left in the right subtree.
> The inorder predecessor (the largest value in the left subtree) works too.

? `TreeMap<Integer, String> map` holds the keys 10, 20 and 30. What does `map.floorKey(5)` return?
+ null, because no key is ≤ 5
- 10
! 10 is the ceiling of 5, not its floor.
- 0
! A missing key is null, not 0.
- It throws NoSuchElementException
! floorKey returns null; it's firstKey on an empty map that throws.
> Unboxing that null into an int throws NullPointerException.

? Why can Range Sum of BST skip a node's whole left subtree when node.val < low?
+ Everything in the left subtree is smaller than node.val, so it's below low too
- Because the left subtree has fewer nodes
! Size isn't the point; the values are.
- Because inorder visits it later
! Inorder visits the left subtree first.
- It can't; every node must be checked
! The ordering proves those nodes are out of range.
> Using the order to prune is what makes BST algorithms fast.
```
