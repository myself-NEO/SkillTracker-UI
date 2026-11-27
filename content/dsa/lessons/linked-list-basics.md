Linked-list questions are rarely about cleverness. They test whether you can move pointers **without losing a node, creating a cycle, or dereferencing null**, under interview pressure. This lesson covers the structure itself; the rest of the module covers the eight techniques that solve almost every question you'll see. Problem numbers like **LC 206** refer to LeetCode.

## What it is

An array is **one block of memory**: element `i` lives at `base + i × size`, so you can jump anywhere in O(1). A linked list is **a chain of separate objects**, each holding a value and the address of the next one. The only way to reach the 500th node is to follow 499 links.

```text
array:        [ 7 | 3 | 9 | 4 ]          one contiguous block, index = arithmetic

linked list:  head
               |
              [7|*]--->[3|*]--->[9|*]--->[4|null]     nodes anywhere in the heap
```

A list is reached through its **head**, the first node; the last node's `next` is `null`. A list is also a recursive structure: *a list is empty, or a node followed by a list*.

## How it works

Everything you do with a list is a walk along the `next` links, and nearly every off-by-one bug comes from the loop condition. Pick it deliberately:

| Condition | Where `cur` ends | Use it when… |
|---|---|---|
| `while (cur != null)` | `null`, after visiting **every** node | you need to see each node (count, sum, search, print) |
| `while (cur.next != null)` | **on the last node** | you need the tail, or you modify `cur.next` (deletions!) |
| `while (fast != null && fast.next != null)` | — | two-step pointers ([fast & slow](lesson:fast-and-slow-pointers)); check both before `fast.next.next` |

```java
int length(ListNode head) {
    int n = 0;
    for (ListNode cur = head; cur != null; cur = cur.next) n++;
    return n;
}

ListNode nodeAt(ListNode head, int index) {      // 0-based; null if the list is shorter
    ListNode cur = head;
    for (int i = 0; i < index && cur != null; i++) cur = cur.next;
    return cur;
}

ListNode lastNode(ListNode head) {                // stops ON the last node, not after it
    if (head == null) return null;
    ListNode cur = head;
    while (cur.next != null) cur = cur.next;
    return cur;
}
```

**Rule of thumb:** to *delete* a node in a singly linked list you must stand on the node **before** it, because you need to rewrite `prev.next`. That's why deletion loops look at `cur.next`, not at `cur`, and why they start from a [dummy node](lesson:dummy-node).

## Build it from scratch

LeetCode's node class, used throughout this module:

```java
class ListNode {
    int val;
    ListNode next;

    ListNode() { }
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}
```

Before solving anything, write these two helpers. In an interview they take 30 seconds and let you **test on the spot**: build the input in one line, print the output in one line. `show` also refuses to loop forever, so a bug that creates a cycle doesn't hang your test run.

```java
static ListNode build(int... values) {          // build(1, 2, 3) -> 1 -> 2 -> 3
    ListNode dummy = new ListNode();
    ListNode tail = dummy;
    for (int v : values) {
        tail.next = new ListNode(v);
        tail = tail.next;
    }
    return dummy.next;
}

static String show(ListNode head) {              // "[1 -> 2 -> 3]", and it survives cycles
    StringBuilder sb = new StringBuilder("[");
    int steps = 0;
    for (ListNode n = head; n != null; n = n.next) {
        if (steps++ == 1_000) return sb.append(" ... (cycle?)]").toString();
        if (sb.length() > 1) sb.append(" -> ");
        sb.append(n.val);
    }
    return sb.append("]").toString();
}
```

```java
ListNode head = build(1, 2, 3, 4);
System.out.println(show(reverseList(head)));   // [4 -> 3 -> 2 -> 1]
```

A list class that wraps these nodes, with a size and a tail pointer, is the next lesson: [building a linked list](lesson:building-linked-lists).

## Java API

Interview questions about linked lists use a hand-written `ListNode` like the one above, never `java.util.LinkedList`. The library class is a doubly linked list that implements `List` and `Deque`, and it's rarely the right choice in real code either; [building a linked list](lesson:building-linked-lists) explains why, and what it's good for.

## Operations and complexity

The one difference between contiguous memory and a chain of objects produces the whole trade-off table:

| Operation | Array / `ArrayList` | Singly linked list | Doubly linked list |
|---|---|---|---|
| Access element `i` | **O(1)** | O(n) | O(n) |
| Search by value | O(n) | O(n) | O(n) |
| Insert/delete at the front | O(n) (shift everything) | **O(1)** | **O(1)** |
| Insert/delete at the back | amortised O(1) | O(1) with a tail pointer (delete: O(n)) | **O(1)** |
| Insert after a node you hold | O(n) | **O(1)** | **O(1)** |
| Delete a node you hold | O(n) | O(n) (you need its predecessor) | **O(1)** |
| Memory per element | value only | value + 1 pointer + object header | value + 2 pointers + header |
| CPU-cache friendliness | excellent | poor (pointer chasing) | poor |

**When a linked list actually wins:**
- you hold a **reference to a node** and need O(1) insert/remove *there*: LRU caches, schedulers, undo lists;
- you need to **splice** whole chains in O(1): merging, concatenating, moving a block;
- elements must **never move** in memory (references stay valid, no resize pauses);
- the structure is **persistent**: functional languages share list tails between versions.

For "just store a sequence", an `ArrayList`/`ArrayDeque` wins almost every time in Java, because contiguous memory is so much faster to traverse.

The sentence to say when the interviewer asks "why a linked list?":

> *I need O(1) insertion and removal at positions I already hold a reference to, and I never need random access by index.*

## Patterns

**Why interviewers love linked lists anyway:** the problems are short, need O(1) extra space, and expose sloppiness instantly. There are only a few moving parts, and every pointer write can break the structure. Almost every question is a combination of these eight techniques, each with its own lesson:

| # | Technique | One-line idea | Typical triggers |
|---|---|---|---|
| 1 | [Dummy node](lesson:dummy-node) | a fake node before the head removes every "is this the first node?" case | remove, insert, partition, "head may change" |
| 2 | [Reversal](lesson:reversing-linked-lists) | `prev / cur / next`, flip one link per step | reverse, palindrome, k-group, "from the end" |
| 3 | [Fast & slow](lesson:fast-and-slow-pointers) | one pointer at speed 2, one at speed 1 | middle, cycle, "is there a loop", duplicate number |
| 4 | [Fixed gap](lesson:fixed-gap-pointers) | two pointers k apart, moved together | n-th from the end, rotate |
| 5 | [Merge & split](lesson:merging-and-splitting-lists) | relink nodes from two sorted runs; cut at the middle | merge, sort, k sorted lists |
| 6 | [Middle + reverse + weave](lesson:middle-reverse-weave) | combine 3 and 2, then interleave | reorder, palindrome, twin sum |
| 7 | [Two lists at once](lesson:two-lists-at-once) | walk both, keep a carry or switch lists | add numbers, intersection |
| 8 | [Hashing](lesson:hashing-and-cloning-lists) | trade O(n) space for simplicity | copy with random pointer, dedupe unsorted |

### Recursion on lists

Because a list is *empty, or a node followed by a list*, many list algorithms have three-line recursive forms:

```java
// Reverse recursively: reverse everything after head, then hook head on at the end.
public ListNode reverseListRecursive(ListNode head) {
    if (head == null || head.next == null) return head;   // empty or last node: the new head
    ListNode newHead = reverseListRecursive(head.next);   // the rest, already reversed
    head.next.next = head;                                 // the node after head now points back to it
    head.next = null;                                      // head becomes the tail
    return newHead;
}

// Visit values in reverse without modifying the list: the call stack does the reversing.
void collectReversed(ListNode node, List<Integer> out) {
    if (node == null) return;
    collectReversed(node.next, out);
    out.add(node.val);
}
```

**How the recursive reversal works**, for `1 -> 2 -> 3`:
1. The call on `1` recurses on `2`, which recurses on `3`.
2. `3` has no next, so it's returned as `newHead`.
3. Back in the call on `2`: `head.next.next = head` makes `3 -> 2`, and `head.next = null` cuts `2 -> 3`.
4. Back in the call on `1`: `2 -> 1`, and `1 -> null`.

Every frame returns the same `newHead`. The iterative version, which you should know cold, is in [reversing linked lists](lesson:reversing-linked-lists).

## Common mistakes

- **Dereferencing null.** `head.next` on an empty list, or `fast.next.next` without checking `fast.next`, throws a `NullPointerException`. Check the empty list first.
- **Losing the rest of the list.** Overwriting `cur.next` before saving the old value makes every node after it unreachable.
- **The wrong loop condition.** `while (cur != null)` walks off the end; `while (cur.next != null)` stops on the last node. Choose by whether you need to modify `cur.next`.
- **Trying to delete the node you're standing on.** In a singly linked list you need its predecessor, so stand one node earlier.
- **Recursion on long lists.** Recursion uses one stack frame per node. Java's default thread stack (typically 512 KB–1 MB) holds somewhere around 10,000–20,000 such frames, depending on frame size and platform, so lists of 10⁵ nodes, which are common in test data, throw `StackOverflowError`. Say so in an interview: *"recursive is O(n) space for the call stack; I'll write the iterative version for production."* The recursive forms are still great for explaining an idea quickly.

## Key takeaways

- A linked list is a chain of separate nodes: O(1) to insert or remove where you hold a node, O(n) to reach position i.
- Choose the loop condition on purpose: `cur != null` visits every node, `cur.next != null` stops on the last one.
- To delete a node in a singly linked list, stand on the node before it.
- Write `build` and `show` helpers first, so you can test in seconds.
- Recursion on lists is elegant but uses O(n) stack; know the iterative versions for long lists.

## Knowledge check

```quiz
? Why is reaching the i-th element of a linked list O(n)?
+ The nodes are separate objects, so the only way to the i-th one is to follow i links
- Because Java checks every index for bounds
! Bounds checks are O(1); the walk is the cost.
- Because the list must be sorted first
! Order doesn't matter; there's no address arithmetic to jump with.
- It isn't; `get(i)` is O(1) on any list
! It's O(1) on ArrayList, not on a linked list.
> Without contiguous memory there's no base + i × size shortcut.

? You need the last node of a non-empty list. Which loop condition stops on it?
+ `while (cur.next != null) cur = cur.next;`
- `while (cur != null) cur = cur.next;`
! That walks past the last node and ends on null.
- `while (cur.next.next != null) cur = cur.next;`
! That stops one node early, and fails on a one-node list.
- `for (int i = 0; i < size; i++) cur = cur.next;`
! Starting at the head, size steps walk off the end.
> Stop when the next node doesn't exist: you're standing on the tail.

? In a singly linked list, why must a deletion loop look at `cur.next` instead of `cur`?
+ Deleting a node means rewriting its predecessor's `next`, so you must stand on the node before it
- Because `cur` might be null
! The reason is structural: you need the predecessor.
- Because Java can't delete the current object
! Nodes aren't deleted explicitly; they're unlinked.
- It doesn't matter which one you look at
! Standing on the node itself leaves no way to reach its predecessor.
> That's also why deletion code starts from a dummy node before the head.

? A recursive reversal works on small tests but fails on a list of 100,000 nodes. Why?
+ Each node adds a stack frame, and about 10⁴–2 × 10⁴ frames overflow Java's default stack
- Recursion can't reverse lists longer than 2¹⁶ nodes
! There's no fixed limit; the stack size is what runs out.
- The list contains a cycle
! A cycle would fail on any size, and the test passed on small lists.
- Recursion is O(n²) on lists
! It's O(n) time; the problem is O(n) stack space.
> Use the iterative three-pointer reversal for long lists.
```
