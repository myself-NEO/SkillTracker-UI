## What it is

- In a **doubly linked list**, each node knows both neighbours: `prev` and `next`.
- In a **circular list**, the last node points back to the first instead of to `null`. A circular list can be singly or doubly linked.

## How it works

### Doubly linked lists and sentinels

A doubly linked node knows both neighbours. Two consequences:
- **Deleting a node you hold is O(1)**: `n.prev.next = n.next; n.next.prev = n.prev`. No walk to find the predecessor.
- Every insert or delete must update **four** pointers instead of two. Writing them in the wrong order is the classic bug.

**Two sentinels** (`head` and `tail` dummy nodes that are never removed) make every real node have non-null neighbours, so there are no special cases at either end:

```text
   head <-> [ 7 ] <-> [ 3 ] <-> [ 9 ] <-> tail        empty list:  head <-> tail
 (sentinel)                              (sentinel)
```

### Circular lists

In a circular list there's no `null` to stop at, so traversal needs a different end condition: stop when you're back at the start.

```java
if (head != null) {
    ListNode cur = head;
    do {
        System.out.println(cur.val);
        cur = cur.next;
    } while (cur != head);           // do-while: visit head once, stop when we return to it
}
```

A single `tail` pointer is enough to reach both ends of a circular list, because `tail.next` is the head.

## Build it from scratch

```java
class DoublyLinkedList {
    static final class Node {
        int val;
        Node prev, next;

        Node(int val) { this.val = val; }
    }

    private final Node head = new Node(0);   // sentinels: never removed, so never null neighbours
    private final Node tail = new Node(0);
    private int size;

    DoublyLinkedList() {
        head.next = tail;
        tail.prev = head;
    }

    Node addFirst(int val) { return insertAfter(head, val); }
    Node addLast(int val)  { return insertAfter(tail.prev, val); }

    Node insertAfter(Node node, int val) {   // O(1): four pointer writes, no special cases
        Node n = new Node(val);
        n.prev = node;
        n.next = node.next;
        node.next.prev = n;
        node.next = n;
        size++;
        return n;
    }

    void remove(Node n) {                    // O(1) given the node: no hunt for the previous node
        n.prev.next = n.next;
        n.next.prev = n.prev;
        n.prev = n.next = null;              // catch accidental reuse early
        size--;
    }

    Integer removeFirst() {
        if (size == 0) return null;
        Node n = head.next;
        remove(n);
        return n.val;
    }

    Integer removeLast() {
        if (size == 0) return null;
        Node n = tail.prev;
        remove(n);
        return n.val;
    }

    int size() { return size; }
}
```

**Write the four pointer updates in this order** when inserting `n` after `node`:
1. `n.prev = node;`
2. `n.next = node.next;` (the new node points outward first: nothing is lost yet);
3. `node.next.prev = n;`
4. `node.next = n;` (overwrite the old link **last**, after it has been used).

## Java API

- `java.util.LinkedList` is a doubly linked list, which is why its `removeLast` is O(1). See [building a linked list](lesson:building-linked-lists) for its costs.
- `LinkedHashMap` threads a doubly linked list through its entries to remember insertion or access order.
- `ArrayDeque` is *not* a linked list: it's a **circular array**, a ring buffer whose head and tail indexes wrap around. It gives the same O(1) operations at both ends with far better memory use.

## Operations and complexity

| Operation | Doubly linked (with sentinels) | Singly linked |
|---|---|---|
| Insert after a node you hold | O(1) | O(1) |
| Remove a node you hold | **O(1)** | O(n): you must find its predecessor |
| Add or remove at either end | O(1) | O(1), except removing the last node: O(n) |
| Access by index, search | O(n) | O(n) |
| Memory per node | value + 2 pointers | value + 1 pointer |

## Patterns

**A hash map that points into a doubly linked list.** This is the backbone of the [LRU and LFU caches](lesson:linked-list-design-problems): the map finds a node in O(1), and the doubly linked list moves or removes that node in O(1), which is exactly the "delete a node you hold" case.

**Circular lists** appear in:
- round-robin scheduling;
- ring buffers drawn as lists;
- the Josephus problem;
- the internals of some queues (a single `tail` pointer suffices, because `tail.next` is the head).

**LC 1823 Find the Winner of the Circular Game (Josephus).** `n` friends sit in a circle; counting starts at friend 1, and every `k`-th friend leaves. Who's last?

```java
// LC 1823: n friends in a circle, every k-th one leaves; who is left? Simulated on a circular list.
public int findTheWinner(int n, int k) {
    ListNode tail = new ListNode(n);
    ListNode head = tail;
    for (int i = n - 1; i >= 1; i--) head = new ListNode(i, head);   // 1 -> 2 -> ... -> n
    tail.next = head;                                                 // close the ring
    ListNode prev = tail;                       // the node BEFORE the one we start counting from
    while (prev.next != prev) {                 // more than one friend left
        for (int i = 1; i < k; i++) prev = prev.next;
        prev.next = prev.next.next;             // the k-th friend leaves
    }
    return prev.val;
}

// Same answer from the recurrence J(1) = 0, J(n) = (J(n - 1) + k) % n: O(n) time, O(1) space.
public int findTheWinnerMath(int n, int k) {
    int winner = 0;
    for (int size = 2; size <= n; size++) winner = (winner + k) % size;
    return winner + 1;
}
```

**Why keep `prev` instead of `cur`?** Removing a node from a singly linked circle needs its predecessor, so the loop always stands one node behind the one being counted. The simulation is O(n·k). The recurrence gives O(n) and is worth mentioning as the follow-up: after the first removal, the remaining `n - 1` friends form the same game, shifted by `k`.

## Common mistakes

- **Writing the four pointers in the wrong order.** Overwriting `node.next` before `node.next.prev` is updated loses the old neighbour.
- **Forgetting the `prev` side.** Code that only updates `next` pointers leaves a list that's correct forwards and broken backwards.
- **A `while (cur != null)` loop on a circular list**, which never ends. Stop when you return to the start.
- **Removing from a singly linked circle while standing on the node itself**: you need its predecessor, as in Josephus.
- **Reusing a removed node** that still points into the list. Clearing its pointers on removal makes the bug fail fast.

## Key takeaways

- Doubly linked nodes make "remove the node I hold" O(1), at the cost of a second pointer and four writes per change.
- Two sentinels give every real node non-null neighbours, so there are no special cases at either end.
- Insert by pointing the new node outward first, and overwrite the old link last.
- A circular list has no `null`: stop when you're back at the start, and keep a pointer to the predecessor when removing.
- A hash map pointing into a doubly linked list is the design behind LRU and LFU caches.

## Knowledge check

```quiz
? Why can a doubly linked list remove a node you hold in O(1) while a singly linked list can't?
+ The node knows its predecessor, so you can relink both neighbours without searching
- Doubly linked lists are always sorted
! Order has nothing to do with it.
- Doubly linked lists keep an index of every node
! There's no index; there's a prev pointer.
- A singly linked list can, if it has a tail pointer
! A tail pointer doesn't give you the predecessor of an arbitrary node.
> Removal rewrites the predecessor's next; prev pointers make the predecessor free to reach.

? You insert `n` after `node`. Which pointer must be overwritten last?
+ `node.next`, because the other updates still need its old value
- `n.prev`
! n is new; its pointers can be set first safely.
- `n.next`
! That's set early, from node.next, before anything is lost.
- `node.next.prev`
! It must be updated while node.next still points at the old neighbour.
> Point the new node outward first, then fix the neighbours, and overwrite node.next last.

? What do the two sentinel nodes in a doubly linked list guarantee?
+ Every real node has non-null neighbours, so inserting or removing at the ends needs no special case
- The list never becomes empty
! It can be empty: then head and tail point at each other.
- The list stays sorted
! Sentinels don't impose order.
- Faster access by index
! Access by index is still a walk.
> No null checks at either end means shorter, safer code.

? How do you know a traversal of a circular list is finished?
+ When you're back at the node you started from
- When you reach a null `next`
! A circular list has no null next.
- After size + 1 steps
! You'd revisit the first node; and the size may not be known.
- When two pointers meet
! That's cycle detection, not traversal.
> Use a do-while loop so the start node is visited once.
```
