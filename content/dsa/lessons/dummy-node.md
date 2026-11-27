## The idea

Create `dummy = new ListNode(0, head)` and work from it. Now every real node has a predecessor, so "delete the first node" and "delete a middle node" are the same code. Return `dummy.next` at the end, because the real head may have changed.

## When to use it

- The **head itself might be removed or replaced**: deleting by value, removing duplicates, reversing a range that can start at the first node.
- You're **building a new list**, appending nodes one at a time behind a tail pointer.
- You're **splitting one list into several** (partitioning), one dummy per output list.

If the head can never change, you don't need one (LC 83 below), but adding one never hurts.

## How it works

Two facts make the dummy node work:

- **Deleting needs the predecessor.** In a singly linked list you remove `x` by rewriting `prev.next`. The head has no predecessor, which is what forces the special case; the dummy gives it one.
- **Appending needs a tail.** A `tail` pointer that starts at the dummy lets you append with `tail.next = node; tail = node;` from the very first node, without checking whether the result list is still empty.

When you rebuild lists out of *existing* nodes, the last node still points wherever it pointed before. Always **terminate** the result with `tail.next = null`.

## Java template

```java
// Deleting: stand on the node BEFORE the one you inspect.
ListNode dummy = new ListNode(0, head);
ListNode cur = dummy;
while (cur.next != null) {
    if (/* cur.next should go */) cur.next = cur.next.next;   // unlink, and don't advance
    else cur = cur.next;
}
return dummy.next;                                             // the head may have changed
```

```java
// Building: append behind a tail pointer.
ListNode dummy = new ListNode(), tail = dummy;
for (/* each node to keep, in order */) {
    tail.next = node;
    tail = node;
}
tail.next = null;          // terminate: the last node may still point into the old list
return dummy.next;
```

## Worked examples

### Remove Linked List Elements (LC 203)

```java
public ListNode removeElements(ListNode head, int val) {
    ListNode dummy = new ListNode(0, head);
    ListNode cur = dummy;
    while (cur.next != null) {
        if (cur.next.val == val) cur.next = cur.next.next;   // unlink, and DON'T advance:
        else cur = cur.next;                                 // the new cur.next may match too
    }
    return dummy.next;
}
```

**The detail people get wrong:** after unlinking, **don't advance**. The node that just moved into `cur.next` hasn't been checked yet. With `[6, 6, 6]` and `val = 6`, advancing would skip every other node.

### Remove Duplicates from Sorted List I and II (LC 83, LC 82)

```java
// LC 83: sorted list, keep one copy of each value. The head never changes: no dummy needed.
public ListNode deleteDuplicates(ListNode head) {
    ListNode cur = head;
    while (cur != null && cur.next != null) {
        if (cur.next.val == cur.val) cur.next = cur.next.next;
        else cur = cur.next;
    }
    return head;
}

// LC 82: sorted list, delete EVERY value that appears more than once. The head may go: dummy.
public ListNode deleteAllDuplicates(ListNode head) {
    ListNode dummy = new ListNode(0, head);
    ListNode prev = dummy;                        // last node we know we keep
    while (prev.next != null) {
        ListNode cur = prev.next;
        if (cur.next != null && cur.next.val == cur.val) {
            int dup = cur.val;
            while (cur != null && cur.val == dup) cur = cur.next;   // skip the whole run
            prev.next = cur;                                         // and don't advance prev
        } else {
            prev = cur;
        }
    }
    return dummy.next;
}
```

**Why the second one needs a dummy and the first doesn't:** in LC 83 the first node of every run survives, so the head never changes. In LC 82, `[1, 1, 2]` loses its head, and `prev` must start somewhere *before* it.

### Partition List (LC 86): two dummies, two lists

**Approach.** Walk once and append each node to one of two lists (`< x` and `≥ x`), each with its own dummy, then glue them. Appending preserves the relative order inside each group.

```java
// LC 86: nodes < x first, then the rest, both groups keeping their original order.
public ListNode partition(ListNode head, int x) {
    ListNode lessDummy = new ListNode(), moreDummy = new ListNode();
    ListNode less = lessDummy, more = moreDummy;
    for (ListNode cur = head; cur != null; cur = cur.next) {
        if (cur.val < x) { less.next = cur; less = cur; }
        else             { more.next = cur; more = cur; }
    }
    more.next = null;               // essential: the old next pointer could close a cycle
    less.next = moreDummy.next;     // glue the two lists
    return lessDummy.next;
}
```

**`more.next = null` is not optional.** The last node appended to `more` still points to whatever followed it in the original list, possibly a node that's now in `less`. That creates a **cycle**. Whenever you rebuild lists out of existing nodes, terminate the last one.

## Complexity

Every example here is one pass: O(n) time and O(1) extra space. The dummy itself is one extra node.

## Variations

**Odd Even Linked List (LC 328).** The same "build two lists" idea without dummies: the odd and even lists already have natural heads.

```java
// LC 328: nodes at odd positions first, then even positions. O(1) extra space.
public ListNode oddEvenList(ListNode head) {
    if (head == null) return null;
    ListNode odd = head, even = head.next, evenHead = even;
    while (even != null && even.next != null) {
        odd.next = even.next;     // link the next odd node
        odd = odd.next;
        even.next = odd.next;     // link the next even node
        even = even.next;
    }
    odd.next = evenHead;          // odd list, then even list
    return head;
}
```

**Loop condition:** `even != null && even.next != null` covers both even and odd lengths: we stop when there's no next odd node to link.

**Elsewhere in the module**, the dummy appears as the start of every merged list in [merging and splitting](lesson:merging-and-splitting-lists), as the "node before the block" in [reversing a range](lesson:reversing-linked-lists), and as a permanent sentinel in a [list class](lesson:building-linked-lists).

## Common mistakes

- **Advancing after a deletion**, which skips the node that just moved into `cur.next`.
- **Not terminating a rebuilt list.** Forgetting `tail.next = null` (here, `more.next = null`) leaves a cycle that hangs your tests.
- **Returning `head` instead of `dummy.next`.** If the original head was removed, `head` still points at it.
- **Special-casing the head anyway.** With a dummy in place, code like `if (head.val == val) head = head.next` is redundant, and an easy place for bugs.

## Practice

Remove Linked List Elements (LC 203), Remove Duplicates from Sorted List (LC 83), Remove Duplicates from Sorted List II (LC 82), Partition List (LC 86), Odd Even Linked List (LC 328), Merge Two Sorted Lists (LC 21).

## Key takeaways

- A dummy node before the head gives every real node a predecessor, so the head stops being a special case.
- Return `dummy.next`: the original head may be gone.
- After unlinking `cur.next`, don't advance: check the node that moved up.
- Build new lists behind a `tail` pointer that starts at a dummy.
- When relinking existing nodes, always end with `tail.next = null`, or you can create a cycle.

## Knowledge check

```quiz
? In Remove Linked List Elements, why must `cur` stay put after `cur.next = cur.next.next`?
+ The node that just became `cur.next` hasn't been checked yet
- To avoid a NullPointerException
! Advancing is safe; it's just wrong.
- Because the dummy node must be visited twice
! The dummy is never compared against val.
- It doesn't matter whether you advance
! With [6, 6, 6] and val = 6, advancing skips every other node.
> Advance only when you keep cur.next.

? Why does LC 82 (delete every duplicated value) need a dummy node, but LC 83 (keep one copy) doesn't?
+ In LC 82 the first node can be deleted, so the loop must start before the head
- LC 82 isn't sorted
! Both lists are sorted.
- LC 83 creates new nodes
! Neither problem creates nodes.
- LC 82 needs to count the duplicates
! It skips runs; it doesn't count them.
> In LC 83 the first node of every run survives, so the head never changes.

? Partition List builds two lists and glues them. What happens without `more.next = null`?
+ The last node of the second list may still point into the first list, creating a cycle
- The second list loses its last node
! The node is still there; its next pointer is wrong.
- The order inside each group changes
! Appending preserves order either way.
- Nothing, because the original list ended with null
! Only the original last node pointed at null.
> Whenever you rebuild lists from existing nodes, terminate the last one.

? A function removes nodes using a dummy, then returns `head`. When is that wrong?
+ When the original first node was removed: `head` still points at it
- Always, because `head` is null
! head is only null for an empty list.
- Never, because the dummy points at the head
! The dummy's next changes when the first node is removed.
- Only when the list has one node
! Any removal of the first node breaks it.
> Always return dummy.next.
```
