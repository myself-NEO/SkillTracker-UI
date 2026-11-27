## What it is

A plain BST degrades to O(n) when its input arrives sorted: every insert goes to the same side, and the tree becomes a [skewed chain](lesson:tree-basics). A **self-balancing** BST restructures itself after every insert and delete, so its height stays O(log n) whatever the insertion order. The two classic designs are **AVL trees** (strictly balanced) and **red-black trees** (loosely balanced, and cheaper to maintain).

## How it works

### Rotations

Both designs rebalance with **rotations**: a local rearrangement of a parent and a child that changes the shape but **keeps the inorder order**, so the tree is still a valid BST.

```
LL Case (left-left heavy) -- single RIGHT rotation:

      z                       y
     / \                    /   \
    y   T4      ==>        x     z
   / \                    / \   / \
  x   T3                T1  T2 T3 T4
 / \
T1 T2

RR Case is the mirror image -- single LEFT rotation.

LR Case (left-right heavy) -- LEFT rotate the left child, then RIGHT rotate the node.
RL Case (right-left heavy) -- RIGHT rotate the right child, then LEFT rotate the node.
```

In the diagram, the inorder order is `T1 x T2 y T3 z T4` both before and after: only the shape changed.

### AVL trees

The **balance factor** of a node is `height(left subtree) − height(right subtree)`. An AVL tree keeps it in `{−1, 0, 1}` at every node. When an insert pushes a node to ±2, one of four cases applies, named by the path from that node down to the new one:

| Case | Where the new node is | Fix |
|---|---|---|
| LL | in the left child's left subtree | rotate the node right |
| RR | in the right child's right subtree | rotate the node left |
| LR | in the left child's right subtree | rotate the left child left, then the node right |
| RL | in the right child's left subtree | rotate the right child right, then the node left |

The strict balance keeps an AVL tree's height below about 1.44 log₂ n.

### Red-black trees

Red-black trees solve the same problem with a looser guarantee, which means **cheaper rebalancing**: fewer rotations per insert and delete. That's why **Java's `TreeMap` and `TreeSet`** and C++'s `std::map` use them rather than AVL trees.

**The five rules:**
1. Every node is coloured **red** or **black**.
2. The root is black.
3. Every leaf (conceptually, the `null` children) is black.
4. A red node can't have a red child (**no two reds in a row**).
5. Every path from a node down to a `null` leaf passes through the **same number of black nodes**.

Together, these guarantee that the longest root-to-leaf path is at most **twice** the shortest, so the height is at most 2 log₂(n + 1): looser than AVL, but still enough to bound every operation at **O(log n)**.

Rebalancing after an insert or delete uses the same left and right rotations as AVL, plus **recolouring**: flipping a node's colour instead of rotating where possible, which is cheaper. The exact case analysis (the uncle's colour, and so on) is a rabbit hole rarely worth memorising for interviews.

## Build it from scratch

An AVL tree: each node stores its height, and every insert updates the heights on the way back up, rotating wherever a balance factor reaches ±2.

```java
class AVLNode {
    int val, height;
    AVLNode left, right;
    AVLNode(int val) {
        this.val = val;
        this.height = 1;
    }
}

int height(AVLNode node) {
    return node == null ? 0 : node.height;
}

int getBalance(AVLNode node) {
    return node == null ? 0 : height(node.left) - height(node.right);
}

AVLNode rightRotate(AVLNode y) {
    AVLNode x = y.left;
    AVLNode T2 = x.right;
    x.right = y;
    y.left = T2;
    y.height = 1 + Math.max(height(y.left), height(y.right));   // update y FIRST -- it's now lower in the tree
    x.height = 1 + Math.max(height(x.left), height(x.right));
    return x;   // x is the new subtree root
}

AVLNode leftRotate(AVLNode x) {
    AVLNode y = x.right;
    AVLNode T2 = y.left;
    y.left = x;
    x.right = T2;
    x.height = 1 + Math.max(height(x.left), height(x.right));
    y.height = 1 + Math.max(height(y.left), height(y.right));
    return y;
}

AVLNode insert(AVLNode node, int val) {
    if (node == null) return new AVLNode(val);
    if (val < node.val) node.left = insert(node.left, val);
    else if (val > node.val) node.right = insert(node.right, val);
    else return node;   // no duplicates

    node.height = 1 + Math.max(height(node.left), height(node.right));
    int balance = getBalance(node);

    if (balance > 1 && val < node.left.val) return rightRotate(node);              // LL
    if (balance < -1 && val > node.right.val) return leftRotate(node);             // RR
    if (balance > 1 && val > node.left.val) {                                      // LR
        node.left = leftRotate(node.left);
        return rightRotate(node);
    }
    if (balance < -1 && val < node.right.val) {                                    // RL
        node.right = rightRotate(node.right);
        return leftRotate(node);
    }
    return node;
}
```

**Interview reality check:** you're very rarely asked to code a full AVL tree under time pressure. What's actually tested: (1) explaining *why* balance matters, (2) recognising which rotation case applies, given a picture, and (3) the balance-factor formula. Know the rotation *concept* solidly; treat memorising this exact code as a bonus.

## Java API

| Class | Structure | Notes |
|---|---|---|
| `TreeMap`, `TreeSet` | a red-black tree | O(log n) put, get, remove, floor and ceiling; sorted iteration. See [binary search trees](lesson:binary-search-trees) for the navigation methods. |
| `HashMap` | a hash table; crowded buckets become red-black trees | Since Java 8, a bucket that grows past 8 entries (in a table of at least 64 buckets) is "treeified", so even heavy collisions cost O(log n). |
| `ConcurrentSkipListMap` | a skip list, not a tree | The sorted map for concurrent code: see [skip lists](lesson:skip-lists). |

There's no AVL tree in the JDK.

## Operations and complexity

| | AVL tree | Red-black tree |
|---|---|---|
| Height bound | about 1.44 log₂ n | 2 log₂(n + 1) |
| Search | O(log n), slightly faster | O(log n) |
| Insert | O(log n), at most 2 rotations | O(log n), at most 2 rotations |
| Delete | O(log n), up to O(log n) rotations | O(log n), at most 3 rotations |
| Extra data per node | a height (or a balance factor) | one colour bit |

If you're asked "AVL or red-black?": *AVL is more strictly balanced, so lookups are faster but writes do more work. Red-black is more loosely balanced, so lookups are slightly slower but inserts and deletes are cheaper. Red-black suits general-purpose ordered maps with frequent writes; AVL suits workloads dominated by reads.*

## Patterns

### Where balanced trees live

- **Ordered maps and sets**: `TreeMap`, `TreeSet`, `std::map`.
- **The Linux scheduler** keeps runnable tasks in a red-black tree.
- **Databases and file systems** use **B-trees and B+ trees** instead: each node holds hundreds of keys, so a lookup reads only a few disk pages. It's the same balancing idea, tuned for disks.

### Using an ordered map in a problem

In interviews you rarely build a balanced tree; you *use* one. Whenever you need "the nearest key above or below x" while also inserting and deleting, reach for `TreeMap` or `TreeSet`. For example, My Calendar I (LC 729) keeps the accepted bookings in a `TreeMap<start, end>`. A new booking can only clash with its two neighbours, the booking just before it (`floorEntry(start)`) and the one just after it (`ceilingEntry(start)`), so each booking is checked in O(log n). The full solution is in [more interval patterns](lesson:more-interval-patterns).

Other problems with the same shape: Contains Duplicate III (LC 220), with a sliding window kept in a `TreeSet`; and Balance a Binary Search Tree (LC 1382): an inorder walk, then [a sorted array to a BST](lesson:binary-search-trees).

### What interviewers ask

1. Why does balance matter? (Sorted input turns a plain BST into an O(n) chain.)
2. Which rotation case applies, given a picture?
3. What's the balance factor, and when does an AVL tree rebalance?
4. AVL or red-black, and why does Java's `TreeMap` choose red-black?

Coding a full red-black tree in a 45-minute interview essentially never happens.

## Common mistakes

- **Updating heights in the wrong order after a rotation**: update the node that moved down first, then the new subtree root.
- **Mixing up LR and RL.** Name the case by the path from the unbalanced node to the new node: left then right is LR.
- **Saying `TreeMap` is an AVL tree.** It's a red-black tree.
- **Calling `HashMap` a tree.** It's a hash table; only crowded buckets become trees.
- **Trying to code a red-black tree in an interview.** Explain the rules and the trade-off instead.

## Key takeaways

- Self-balancing BSTs keep the height O(log n) under any insertion order, using rotations that preserve the inorder order.
- AVL keeps every balance factor in {−1, 0, 1}; four cases (LL, RR, LR, RL) restore it.
- Red-black trees keep the longest path within twice the shortest, with cheaper rebalancing.
- Java's `TreeMap` and `TreeSet` are red-black trees; databases use B-trees.
- In problems, use an ordered map's floor and ceiling rather than building a tree.

## Knowledge check

```quiz
? Inserting 3, then 2, then 1 into an empty AVL tree unbalances the root. Which case is it, and what fixes it?
+ LL: a single right rotation at 3, making 2 the root
- RR: a single left rotation
! The new node went left, then left again.
- LR: a left rotation at 2, then a right rotation at 3
! LR is left then right; here it's left then left.
- No rotation is needed
! The root's balance factor is +2.
> After the rotation, 2 has children 1 and 3.

? Why is a rotation safe to apply to a BST?
+ It changes the shape but keeps the inorder order of every node and subtree
- It only moves leaves
! It moves internal nodes and whole subtrees.
- It re-sorts the tree afterwards
! Nothing needs re-sorting; the order is never broken.
- It makes the tree perfect
! It restores balance locally, not perfection.
> T1 x T2 y T3 z T4 reads the same before and after.

? Why do Java's TreeMap and C++'s std::map use red-black trees rather than AVL trees?
+ Rebalancing after writes is cheaper, and lookups are only slightly slower
- Red-black trees are more strictly balanced
! AVL trees are stricter.
- AVL trees can't delete nodes
! They can, with rotations.
- Red-black trees never rotate
! They use rotations plus recolouring.
> A general-purpose map sees many writes.

? Which red-black rule, together with "no two reds in a row", keeps the longest path within twice the shortest?
+ Every path from a node down to a null leaf has the same number of black nodes
- The root is black
! That rule alone doesn't bound path lengths.
- Every leaf is black
! The null leaves being black doesn't bound path lengths.
- Every node is red or black
! That only defines the colours.
> The longest path alternates red and black; the shortest is all black.
```
