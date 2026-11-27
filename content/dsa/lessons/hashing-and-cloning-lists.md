## The idea

Not every linked-list problem must be O(1) space. A hash map often turns a fiddly pointer problem into two simple passes. Give that answer first, then improve it if asked.

## When to use it

- **Unsorted duplicates**: a set of seen values.
- **Arbitrary pointers**, such as a `random` pointer to any node: a map from each original node to its copy.
- **A first answer to cycle or intersection questions**: a set of visited nodes, before the O(1)-space pointer tricks.
- **Running sums along a list**: a map from prefix sum to node, as in [prefix sums](lesson:prefix-sums).

## How it works

`ListNode` and similar classes don't override `equals` or `hashCode`, so a `HashMap<ListNode, …>` compares nodes by **identity**: two nodes with equal values are still different keys. That's exactly what a map from original nodes to their copies needs.

For deep copies, **two passes** do the work: the first creates every copy, so the second can wire any pointer, forwards or backwards, with a map lookup.

## Java template

```java
Map<Node, Node> copyOf = new HashMap<>();   // original node -> its copy (nodes hash by identity)
for (Node cur = head; cur != null; cur = cur.next) copyOf.put(cur, new Node(cur.val));
for (Node cur = head; cur != null; cur = cur.next) {
    // wire the copy's pointers through the map, e.g. copyOf.get(cur).next = copyOf.get(cur.next)
}
return copyOf.get(head);
```

## Worked examples

### Remove duplicates from an unsorted list

```java
// Remove later duplicates from an UNSORTED list: a set of seen values, O(n) time and space.
public ListNode removeDuplicatesUnsorted(ListNode head) {
    Set<Integer> seen = new HashSet<>();
    ListNode dummy = new ListNode(0, head), prev = dummy;
    while (prev.next != null) {
        if (seen.add(prev.next.val)) prev = prev.next;   // first time: keep it
        else prev.next = prev.next.next;                 // seen before: unlink it
    }
    return dummy.next;
}
```

**Follow-up:** with no extra memory, use two loops (for each node, delete later equal nodes), which is O(n²). Or [sort the list](lesson:merging-and-splitting-lists) first and then remove adjacent duplicates, but that changes the order.

### Copy List with Random Pointer (LC 138)

Each node has a `next` and a `random` pointer (to any node, or `null`). Return a deep copy in which no pointer refers to an original node.

```java
class Node {
    int val;
    Node next, random;

    Node(int val) { this.val = val; }
}

// LC 138, version 1: a map from original node to its copy. O(n) time, O(n) space.
public Node copyRandomList(Node head) {
    Map<Node, Node> copyOf = new HashMap<>();
    for (Node cur = head; cur != null; cur = cur.next) copyOf.put(cur, new Node(cur.val));
    for (Node cur = head; cur != null; cur = cur.next) {
        copyOf.get(cur).next = copyOf.get(cur.next);       // get(null) is null: tails just work
        copyOf.get(cur).random = copyOf.get(cur.random);
    }
    return copyOf.get(head);
}
```

**Version 1** is the one to derive live: pass 1 creates every copy, so pass 2 can wire any pointer, forwards or backwards, with a map lookup.

## Complexity

The hashing versions are O(n) time and O(n) extra space. The interleaving version below brings LC 138 down to O(1) extra space, besides the copy itself.

## Variations

### Copy List with Random Pointer in O(1) extra space

```java
// Version 2: interleave the copies into the original list. O(n) time, O(1) extra space.
public Node copyRandomListInterleaved(Node head) {
    if (head == null) return null;
    for (Node cur = head; cur != null; cur = cur.next.next) {   // 1. A -> A' -> B -> B' -> ...
        Node copy = new Node(cur.val);
        copy.next = cur.next;
        cur.next = copy;
    }
    for (Node cur = head; cur != null; cur = cur.next.next) {   // 2. A'.random = A.random's copy
        if (cur.random != null) cur.next.random = cur.random.next;
    }
    Node copyHead = head.next;
    for (Node cur = head; cur != null; cur = cur.next) {        // 3. unweave the two lists
        Node copy = cur.next;
        cur.next = copy.next;
        copy.next = (copy.next != null) ? copy.next.next : null;
    }
    return copyHead;
}
```

**Version 2** removes the map by storing each copy **right after its original**, so the original's `random.next` *is* the copy of `random`:

```text
original:        A -> B -> C          A.random = C
interleaved:     A -> A' -> B -> B' -> C -> C'
A'.random = A.random.next = C'
unweave:         A -> B -> C          A' -> B' -> C'
```

Step 3 must restore the original list completely, because callers own it.

### Sets instead of pointer tricks

- **Cycle detection** with a `HashSet<ListNode>` of visited nodes: simple, O(n) space; [fast and slow pointers](lesson:fast-and-slow-pointers) do it in O(1).
- **Intersection** with a set of one list's nodes: O(n) space; [switching heads](lesson:two-lists-at-once) does it in O(1).
- **Remove Zero Sum Consecutive Nodes (LC 1171)** maps each prefix sum to the last node where it occurred; two equal prefix sums mean the nodes between them sum to zero.

## Common mistakes

- **Giving a node class value-based `equals` and `hashCode`.** Then two nodes with equal values collide in the map, and copies get wired to the wrong nodes. Nodes should hash by identity.
- **Wiring pointers in the same pass that creates the copies.** A `random` pointer can point forward to a node that has no copy yet; create every copy first.
- **Not restoring the original list** in the interleaving version.
- **Storing values when you need nodes.** A set of values detects equal values, not the same node; cycle detection needs a set of nodes.

## Practice

Copy List with Random Pointer (LC 138), Remove Zero Sum Consecutive Nodes from Linked List (LC 1171), Linked List Cycle (LC 141) with a set, Intersection of Two Linked Lists (LC 160) with a set.

## Key takeaways

- A hash map is a legitimate first answer for list problems: correct, simple, O(n) space.
- Nodes hash by identity, which is exactly what a map from originals to copies needs.
- Deep copies take two passes: create every copy, then wire the pointers through the map.
- Interleaving copies after their originals removes the map: O(1) extra space, but restore the original list.
- Offer the hashing answer first, then optimise to pointer tricks if asked.

## Knowledge check

```quiz
? Copy List with Random Pointer: why create every copy in a first pass before wiring any pointers?
+ A random pointer can point to a later node, whose copy must already exist
- Because maps can't be updated while iterating
! The map isn't iterated; the list is.
- To count the nodes
! Counting isn't needed.
- To sort the nodes by value
! Order must be preserved.
> Two passes make forward and backward pointers equally easy.

? Why is a `HashMap<Node, Node>` safe for mapping originals to copies when nodes have equal values?
+ Nodes don't override equals or hashCode, so the map compares them by identity
- Because HashMap sorts nodes by value
! HashMap doesn't sort.
- Because values are unique in the problem
! Values can repeat.
- It isn't safe; equal values collide
! Only value-based equals would make them collide.
> Identity semantics are exactly what "the same node" means.

? In the interleaved O(1)-space copy, why is `A.random.next` the copy of `A.random`?
+ Every copy was inserted directly after its original
- Because random pointers are sorted
! They can point anywhere.
- Because the copy list is built in reverse
! Copies are interleaved in the original order.
- It isn't; you still need a map
! The interleaving is what removes the map.
> Placing each copy right after its original makes "next" the lookup.

? You detect a cycle with a `HashSet<Integer>` of node values. What goes wrong?
+ Two different nodes with equal values look like a repeat, giving false cycles
- Nothing; values identify nodes
! Values can repeat across distinct nodes.
- The set grows without limit on a cycle
! Detection stops at the first repeat either way.
- Integers can't be stored in a HashSet
! They can; the issue is what they represent.
> Store the nodes themselves to detect a revisit.
```
