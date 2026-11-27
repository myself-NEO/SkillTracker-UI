## The idea

A traversal is the order in which you visit every node. It's the most important tree skill: nearly every tree problem is "pick the right traversal, then add logic".

There are two families:
- **Depth-first (DFS)**: go as deep as possible before backing up. Its three orders, **preorder, inorder and postorder**, differ only in *when* you visit the current node relative to its children.
- **Breadth-first (BFS)**: visit level by level, using a queue.

```
        1
       / \
      2   3
     / \
    4   5
```

- **Preorder** (root → left → right): `1, 2, 4, 5, 3`
- **Inorder** (left → root → right): `4, 2, 5, 1, 3`
- **Postorder** (left → right → root): `4, 5, 2, 3, 1`
- **Level order** (BFS): `1, 2, 3, 4, 5`

## When to use it

| Need | Traversal |
|---|---|
| Sorted output from a BST | Inorder |
| Copy or serialize a tree, evaluate a prefix expression | Preorder |
| Delete a tree, compute values bottom-up (height, diameter) | Postorder |
| Anything "level by level" | Level order (BFS) |
| Inorder, but without O(h) extra space | Morris traversal |

## How it works

All three DFS orders are the same recursion; only the line that visits the node moves. The recursion keeps the path from the root on the call stack. The iterative versions keep that path on an explicit `Deque` instead, which also avoids a `StackOverflowError` on very deep trees.

BFS uses a queue: a node's children join the back of the queue, behind everything already waiting, so nodes come out in order of depth. Reading `queue.size()` at the start of each round tells you exactly how many nodes belong to the current level.

## Java template

```java
void dfs(TreeNode node) {
    if (node == null) return;
    // preorder: visit node here
    dfs(node.left);
    // inorder: visit node here
    dfs(node.right);
    // postorder: visit node here
}
```

```java
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size();          // snapshot: exactly how many nodes are in THIS level
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        result.add(level);
    }
    return result;
}
```

**The key line is `int size = queue.size()`, taken *before* the inner loop.** It freezes the boundary of the current level even as you enqueue the next level's children inside the loop. Forgetting it is the #1 bug in level-order code.

## Worked examples

### Preorder

Process a node *before* its children: copying a tree, serializing it, evaluating a prefix expression.

**Recursive:**
```java
void preorder(TreeNode root, List<Integer> result) {
    if (root == null) return;
    result.add(root.val);
    preorder(root.left, result);
    preorder(root.right, result);
}
```

**Iterative (explicit stack):**
```java
List<Integer> preorderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    if (root == null) return result;
    Deque<TreeNode> stack = new ArrayDeque<>();
    stack.push(root);
    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        result.add(node.val);
        if (node.right != null) stack.push(node.right); // push right FIRST
        if (node.left != null) stack.push(node.left);   // so left pops first
    }
    return result;
}
```
**Why push right before left?** A stack is LIFO: whatever you push last comes out first. We want `left` processed before `right`, so `left` must be on *top*, which means it goes in *last*.

### Inorder

On a **BST**, inorder traversal visits the nodes in **sorted order**: the most useful fact about [binary search trees](lesson:binary-search-trees).

**Recursive:**
```java
void inorder(TreeNode root, List<Integer> result) {
    if (root == null) return;
    inorder(root.left, result);
    result.add(root.val);
    inorder(root.right, result);
}
```

**Iterative:**
```java
List<Integer> inorderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode curr = root;
    while (curr != null || !stack.isEmpty()) {
        while (curr != null) {        // walk all the way left, stacking as you go
            stack.push(curr);
            curr = curr.left;
        }
        curr = stack.pop();           // back up to the last unvisited parent
        result.add(curr.val);
        curr = curr.right;            // then explore its right subtree
    }
    return result;
}
```

### Postorder

Children are processed *before* the parent: deleting a tree (free the children before the node itself), computing height or diameter bottom-up, evaluating a postfix expression.

**Recursive:**
```java
void postorder(TreeNode root, List<Integer> result) {
    if (root == null) return;
    postorder(root.left, result);
    postorder(root.right, result);
    result.add(root.val);
}
```

**Iterative (the elegant trick):**
```java
List<Integer> postorderIterative(TreeNode root) {
    LinkedList<Integer> result = new LinkedList<>();
    if (root == null) return result;
    Deque<TreeNode> stack = new ArrayDeque<>();
    stack.push(root);
    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        result.addFirst(node.val);                      // build the answer backwards
        if (node.left != null) stack.push(node.left);
        if (node.right != null) stack.push(node.right);
    }
    return result;
}
```
**The trick:** this is a modified preorder that visits **root → right → left**, and inserting each value at the *front* of the result reverses that into **left → right → root**: exactly postorder. There's no need to remember the trickier two-stack algorithm.

### Build a tree from preorder and inorder (LC 105)

**The insight:** preorder's first element is always the root. Find that value's position in inorder: everything to its left is the left subtree, and everything to its right is the right subtree. Recurse. (This needs distinct values, which LC 105 promises.)

```java
class Solution {
    Map<Integer, Integer> inorderIndex = new HashMap<>();
    int preIdx = 0;

    public TreeNode buildTree(int[] preorder, int[] inorder) {
        for (int i = 0; i < inorder.length; i++) inorderIndex.put(inorder[i], i);
        return build(preorder, 0, inorder.length - 1);
    }

    TreeNode build(int[] preorder, int inLeft, int inRight) {
        if (inLeft > inRight) return null;
        int rootVal = preorder[preIdx++];
        TreeNode root = new TreeNode(rootVal);
        int mid = inorderIndex.get(rootVal);
        root.left = build(preorder, inLeft, mid - 1);    // must build left before right --
        root.right = build(preorder, mid + 1, inRight);  // preIdx is shared, order matters!
        return root;
    }
}
```
The `HashMap` turns "find rootVal's index in inorder" from O(n) into O(1), taking the whole algorithm from O(n²) to O(n). Building **left before right** is required: `preIdx` advances as a side effect, and preorder always lists a node's whole left subtree before its right subtree.

### Serialize and deserialize a binary tree (LC 297)

**The idea:** a preorder traversal that records `null`s as placeholders. That's enough information to rebuild the exact tree shape, not just some tree with those values.

```java
public class Codec {

    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        serializeHelper(root, sb);
        return sb.toString();
    }

    private void serializeHelper(TreeNode node, StringBuilder sb) {
        if (node == null) {
            sb.append("null,");
            return;
        }
        sb.append(node.val).append(",");
        serializeHelper(node.left, sb);
        serializeHelper(node.right, sb);
    }

    public TreeNode deserialize(String data) {
        Queue<String> queue = new LinkedList<>(Arrays.asList(data.split(",")));
        return deserializeHelper(queue);
    }

    private TreeNode deserializeHelper(Queue<String> queue) {
        String val = queue.poll();
        if (val.equals("null")) return null;
        TreeNode node = new TreeNode(Integer.parseInt(val));
        node.left = deserializeHelper(queue);
        node.right = deserializeHelper(queue);
        return node;
    }
}
```
**Why preorder works on its own here:** preorder with explicit nulls encodes the tree's *shape*, not just the order of its values. Plain inorder without nulls is ambiguous: many different shapes produce the same inorder sequence.

## Complexity

Every traversal visits each node once: **O(n) time**. The space is what differs:

| Traversal | Space | Worst case |
|---|---|---|
| Recursive DFS (any order) | O(h) call stack | O(n), for a skewed tree |
| Iterative DFS (explicit stack) | O(h) | O(n), for a skewed tree |
| Level order (BFS) | O(w), w = the widest level | about n/2, for a perfect tree's last level |
| Morris | O(1) | O(1) |

Rebuilding from preorder and inorder is O(n) time with the index map (O(n²) without it) and O(n) space. Serializing and deserializing are both O(n).

## Variations

### Morris traversal: O(1) space

All the traversals above use O(h) space: the call stack or an explicit stack. **Morris traversal** does inorder in **O(1) extra space** by temporarily pointing unused `right` pointers back up the tree ("threading"), then removing those links again.

```java
List<Integer> morrisInorder(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    TreeNode curr = root;
    while (curr != null) {
        if (curr.left == null) {
            result.add(curr.val);
            curr = curr.right;
        } else {
            // find the inorder predecessor: rightmost node in the left subtree
            TreeNode pred = curr.left;
            while (pred.right != null && pred.right != curr) {
                pred = pred.right;
            }
            if (pred.right == null) {
                pred.right = curr;   // create a temporary thread back to curr
                curr = curr.left;
            } else {
                pred.right = null;   // thread already exists -- remove it (restore tree)
                result.add(curr.val);
                curr = curr.right;
            }
        }
    }
    return result;
}
```
It's still O(n) time: each edge is walked a constant number of times. **Interview note:** Morris traversal is asked far more often as a follow-up ("can you do this in O(1) space?") than as an opening question. Know that it exists and the core idea (thread the predecessor's right pointer), but the recursive and iterative versions solve almost every problem.

### Inorder and postorder (LC 106)

Rebuilding from postorder and inorder works the same way, except you read `postorder` from the **end** and build the **right** subtree before the left, because postorder read backwards is root, right, left:

```java
TreeNode build(int[] postorder, int inLeft, int inRight) {
    if (inLeft > inRight) return null;
    TreeNode root = new TreeNode(postorder[postIdx--]);   // postIdx starts at n - 1
    int mid = inorderIndex.get(root.val);
    root.right = build(postorder, mid + 1, inRight);      // right first
    root.left = build(postorder, inLeft, mid - 1);
    return root;
}
```

### A BST iterator (LC 173)

The iterative inorder loop, paused between nodes: keep the stack in a field, and let each `next()` pop one node and push the left spine of its right child. It uses O(h) memory and O(1) amortized time per call.

```java
class BSTIterator {
    private final Deque<TreeNode> stack = new ArrayDeque<>();

    BSTIterator(TreeNode root) { pushLeft(root); }

    public int next() {
        TreeNode node = stack.pop();
        pushLeft(node.right);
        return node.val;
    }

    public boolean hasNext() { return !stack.isEmpty(); }

    private void pushLeft(TreeNode node) {
        for (; node != null; node = node.left) stack.push(node);
    }
}
```

### N-ary trees

With any number of children, recurse on each child in order instead of left then right. Preorder, postorder and level order carry over; inorder doesn't, because it needs exactly two children to split "before" and "after". See [N-ary trees](lesson:level-order-patterns).

## Common mistakes

- **Pushing left before right in iterative preorder.** The stack is LIFO, so the child pushed last is visited first.
- **Reading `queue.size()` in the loop condition** instead of snapshotting it: the level boundary moves as children are enqueued.
- **Building the right subtree first from preorder** (or the left first from postorder): the shared index must follow the order in which the traversal lists the subtrees.
- **Serializing without null markers.** Values alone don't fix the shape: many trees share the same preorder or inorder.
- **Enqueuing `null` children into an `ArrayDeque`**, which throws `NullPointerException`. Check for `null` before offering, or use a `LinkedList` for a BFS that enqueues nulls on purpose.

## Practice

Binary Tree Preorder Traversal (LC 144), Binary Tree Inorder Traversal (LC 94), Binary Tree Postorder Traversal (LC 145), Binary Tree Level Order Traversal (LC 102), Construct Binary Tree from Preorder and Inorder Traversal (LC 105), Construct Binary Tree from Inorder and Postorder Traversal (LC 106), Binary Search Tree Iterator (LC 173), Serialize and Deserialize Binary Tree (LC 297).

## Key takeaways

- Preorder, inorder and postorder are one recursion with the visit line in three places; BFS uses a queue.
- Inorder on a BST is sorted order; postorder computes bottom-up; preorder copies and serializes.
- DFS uses O(h) space and BFS O(w); Morris inorder uses O(1) by threading and unthreading right pointers.
- Snapshot `queue.size()` before each level's loop.
- Preorder (or postorder) plus inorder rebuilds a tree; preorder with null markers serializes one on its own.

## Knowledge check

```quiz
? For the tree in this lesson (1 at the root, children 2 and 3, and 4 and 5 below 2), what does postorder visit?
+ 4, 5, 2, 3, 1
- 1, 2, 4, 5, 3
! That's preorder.
- 4, 2, 5, 1, 3
! That's inorder.
- 1, 2, 3, 4, 5
! That's level order.
> Postorder visits both children before the node.

? Iterative preorder pushes the right child before the left. Why?
+ The stack is last-in, first-out, so the left child, pushed last, is popped and visited first
- To visit the right subtree first
! Preorder visits left before right; pushing right first achieves that.
- Because the right child is always larger
! Traversal order has nothing to do with values.
- To make it run in O(1) space
! The stack is still O(h).
> Whatever goes in last comes out first.

? Rebuilding a tree from preorder and inorder, why must the left subtree be built before the right?
+ The shared preorder index advances as nodes are consumed, and preorder lists the whole left subtree before the right
- Because the left subtree is smaller
! Size doesn't matter; the order of consumption does.
- Because inorder starts with the leftmost node
! The inorder positions only split the range.
- It doesn't matter, as long as the index map is used
! Building right first would hand the left subtree's values to the right side.
> With postorder, read from the end, it's the right subtree first.

? How much space does level-order traversal need?
+ O(w), where w is the widest level: up to about n/2 for a perfect tree
- O(h), like DFS
! The queue holds a whole level, not a path.
- O(1)
! The queue grows with the level's width.
- O(log n) always
! The width can be about n/2.
> A skewed tree is cheap for BFS; a perfect tree is the worst case.
```
