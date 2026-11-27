## The idea

These problems all start from the [level-order BFS](lesson:tree-traversals) skeleton (a queue, plus a snapshot of `queue.size()` to mark where each level ends) and add one small twist per level: which end to add a value to, which node to keep, or which pointer to set.

## When to use it

The problem talks about **levels**, **rows** or **depth**: "level by level", "zigzag", "what you'd see from the right", "the average of each level", "connect each node to the next one on its level", "vertical columns", "width". BFS also reaches the **shallowest** leaf first, so a minimum-depth search can stop early.

## How it works

BFS dequeues nodes in order of depth, and the size snapshot splits that stream into levels. Per-level work goes before the inner loop (start a list), inside it (each node, knowing its position `i` within the level), or after it (record the level). When each node needs extra information, such as its column or its position, that information travels alongside the node: in a parallel queue, or in a small record.

## Java template

```java
void levels(TreeNode root) {
    if (root == null) return;
    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size();                 // the nodes of this level
        // before the level: start a list, reset a "previous" pointer…
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            // the node at position i of this level
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        // after the level: record it
    }
}
```

## Worked examples

### Zigzag level order (LC 103)

Alternate the direction on each level. Use a `LinkedList` for the level, so values can be added at either end:

```java
List<List<Integer>> zigzagLevelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    boolean leftToRight = true;
    while (!queue.isEmpty()) {
        int size = queue.size();
        LinkedList<Integer> level = new LinkedList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            if (leftToRight) level.addLast(node.val);
            else level.addFirst(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        result.add(level);
        leftToRight = !leftToRight;
    }
    return result;
}
```

### Right side view (LC 199)

What you'd see standing to the right of the tree: the last node processed on each level.

```java
List<Integer> rightSideView(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    if (root == null) return result;
    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            if (i == size - 1) result.add(node.val);   // last node at this level
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
    }
    return result;
}
```

### Vertical order (LC 314)

Track each node's horizontal **column** (the root is 0, a left child is `col - 1`, a right child is `col + 1`), group nodes by column, and use a `TreeMap` so the columns come out sorted from left to right:

```java
List<List<Integer>> verticalOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    TreeMap<Integer, List<Integer>> columnMap = new TreeMap<>();
    Queue<TreeNode> nodeQueue = new ArrayDeque<>();
    Queue<Integer> colQueue = new ArrayDeque<>();
    nodeQueue.offer(root);
    colQueue.offer(0);
    while (!nodeQueue.isEmpty()) {
        TreeNode node = nodeQueue.poll();
        int col = colQueue.poll();
        columnMap.computeIfAbsent(col, k -> new ArrayList<>()).add(node.val);
        if (node.left != null) {
            nodeQueue.offer(node.left);
            colQueue.offer(col - 1);
        }
        if (node.right != null) {
            nodeQueue.offer(node.right);
            colQueue.offer(col + 1);
        }
    }
    for (List<Integer> col : columnMap.values()) result.add(col);
    return result;
}
```
Running two parallel queues avoids needing a `Pair` class: a small trick worth remembering under interview time pressure. Within a column, this gives BFS order, as LC 314 asks. Vertical Order Traversal (LC 987) adds a tie-break: nodes that share both a row and a column must be sorted by value, so record `(row, col, value)` for every node and sort.

### Populate next right pointers (LC 116, LC 117)

Connect each node to the next node on the same level:

```java
class Node {
    int val;
    Node left, right, next;
}

Node connect(Node root) {
    if (root == null) return root;
    Queue<Node> queue = new ArrayDeque<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size();
        Node prev = null;
        for (int i = 0; i < size; i++) {
            Node node = queue.poll();
            if (prev != null) prev.next = node;
            prev = node;
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
    }
    return root;
}
```
The follow-up you'll likely get is "can you do this in O(1) extra space, without a queue?": see the variation below.

## Complexity

Every node is enqueued and dequeued once: **O(n) time**. The queue holds at most one level plus part of the next: **O(w) space**, where w is the widest level, about n/2 for a perfect tree. Vertical order adds a `TreeMap` over c columns, for O(n log c) time; tracking the smallest and largest column with a `HashMap` makes it O(n).

## Variations

### N-ary trees

An **N-ary tree** allows any number of children per node: file systems, org charts, category trees, the DOM.

```java
class Node {
    int val;
    List<Node> children;

    Node(int val) {
        this.val = val;
        children = new ArrayList<>();
    }
}
```

The traversals generalize directly: replace "recurse on left, then right" with "recurse on each child in order".

```java
void preorderNary(Node root, List<Integer> result) {
    if (root == null) return;
    result.add(root.val);
    for (Node child : root.children) {
        preorderNary(child, result);
    }
}

List<List<Integer>> levelOrderNary(Node root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    Queue<Node> queue = new ArrayDeque<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size();
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            Node node = queue.poll();
            level.add(node.val);
            for (Node child : node.children) queue.offer(child);
        }
        result.add(level);
    }
    return result;
}
```
There's no natural inorder for an N-ary tree: inorder relies on exactly two children to split "before" and "after". Postorder generalizes: recurse on all the children, then visit the node. A binary tree is just an N-ary tree with at most two children, so [the recursive patterns](lesson:recursive-tree-patterns) carry over unchanged.

### Next pointers in O(1) space

In a **perfect** binary tree (LC 116), level `i` is already linked through `.next` by the time you reach it, so you can walk it like a linked list to connect level `i + 1`, with no queue:

```java
Node connect(Node root) {
    Node leftmost = root;
    while (leftmost != null && leftmost.left != null) {
        for (Node node = leftmost; node != null; node = node.next) {
            node.left.next = node.right;                            // siblings
            if (node.next != null) node.right.next = node.next.left;  // across parents
        }
        leftmost = leftmost.left;
    }
    return root;
}
```

### More level tricks

- **Right side view by DFS:** visit the right child first, and record the first node you reach at each depth (`if (depth == result.size()) result.add(node.val)`).
- **Maximum width (LC 662):** number the positions like a heap (the children of position `p` are `2p` and `2p + 1`), and take `last − first + 1` on each level. Re-base each level's positions to start from 0, or they overflow on deep trees.
- **Minimum depth by BFS:** return the level number at the first leaf you dequeue.

## Common mistakes

- **Reading `queue.size()` in the loop condition**: it changes as children are enqueued, so the levels blur together.
- **Reversing the child order for zigzag.** Keep enqueuing left then right; reverse only how each level's values are recorded.
- **Enqueuing `null` children into an `ArrayDeque`**, which throws; check for `null` first.
- **Ignoring the tie-break in LC 987**, where nodes sharing a row and a column must be sorted by value.
- **Letting position numbers overflow** in width problems: re-base them on each level.

## Practice

Binary Tree Level Order Traversal (LC 102), Binary Tree Zigzag Level Order Traversal (LC 103), Binary Tree Right Side View (LC 199), Average of Levels in Binary Tree (LC 637), Populating Next Right Pointers in Each Node (LC 116) and its sequel (LC 117), Maximum Width of Binary Tree (LC 662), Vertical Order Traversal of a Binary Tree (LC 987), N-ary Tree Level Order Traversal (LC 429).

## Key takeaways

- Snapshot `queue.size()` to process one level at a time; per-level work goes before, inside or after the inner loop.
- Zigzag changes where values are recorded, not the order in which children are enqueued.
- The right side view is the last node of each level.
- Extra per-node information (a column, a position) travels in a parallel queue or a record.
- N-ary trees use the same traversals with a loop over the children; they have no inorder.

## Knowledge check

```quiz
? Right side view: which node of each level does the BFS version keep?
+ The last node dequeued on that level (i == size − 1)
- The first node dequeued on that level
! That's the left side view.
- The node with the largest value
! Values don't matter; position does.
- Every right child
! A left child is visible when nothing on its level lies to its right.
> Left-to-right BFS means the last node of a level is the rightmost.

? How does zigzag order alternate direction without changing the BFS?
+ It keeps enqueuing left then right, and adds each value to the front or the back of the level's list
- It enqueues right before left on odd levels
! Changing the enqueue order scrambles the following levels.
- It sorts each level
! Sorting by value isn't zigzag order.
- It uses a stack instead of a queue
! A two-stack version exists, but this one keeps the queue.
> Only the recording direction flips.

? Why must the size snapshot be taken before the inner loop?
+ The loop enqueues the next level's children, so queue.size() changes while it runs
- Because queue.size() is O(n)
! It's O(1) for ArrayDeque and LinkedList.
- To skip null children
! The null checks handle that.
- It needn't be; checking it on every iteration is equivalent
! The boundary between the levels would move.
> The snapshot freezes the current level's boundary.

? What does the queue hold at most during a level-order traversal of a perfect binary tree with n nodes?
+ About n/2 nodes: its last level
- About log n nodes
! That's the height, which bounds a DFS stack, not the BFS queue.
- Exactly 2 nodes
! Each level doubles.
- All n nodes
! The earlier levels have left the queue by then.
> BFS space is the width, not the height.
```
