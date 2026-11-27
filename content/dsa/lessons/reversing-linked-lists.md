## The idea

Walk the list once with three pointers (`prev`, `cur`, `next`) and flip one link per step. When `cur` falls off the end, `prev` is the old tail, which is the new head.

## When to use it

- The problem says **reverse**: the whole list, a range "between positions", or "in groups of k".
- You need to **read from the end** in O(1) space: palindromes, twin sums, reordering. These reverse half the list as one step (see [middle, reverse, weave](lesson:middle-reverse-weave)).
- Numbers stored most significant digit first, when you're allowed to modify the input.

## How it works

Each step makes `cur` point backwards at `prev`, then moves both pointers one node forward. The order inside the loop is forced: you must **save `next` before overwriting `cur.next`**, or the rest of the list is lost.

**Trace it on paper once, then never again:**

```text
start:   prev = null   cur = 1          1 -> 2 -> 3 -> null
step 1:  next = 2;  1.next = null;  prev = 1;  cur = 2      null <- 1    2 -> 3 -> null
step 2:  next = 3;  2.next = 1;     prev = 2;  cur = 3      null <- 1 <- 2    3 -> null
step 3:  next = null; 3.next = 2;   prev = 3;  cur = null   null <- 1 <- 2 <- 3
return prev = 3
```

The invariant: `prev` is the head of the already-reversed part, and `cur` is the first node of the part not yet touched.

## Java template

```java
public ListNode reverseList(ListNode head) {      // LC 206
    ListNode prev = null, cur = head;
    while (cur != null) {
        ListNode next = cur.next;     // 1. save the rest of the list
        cur.next = prev;              // 2. flip this one link
        prev = cur;                   // 3. step prev ...
        cur = next;                   //    ... and cur forward
    }
    return prev;                      // cur fell off the end; prev is the old tail = new head
}
```

## Worked examples

### Reverse Linked List II (LC 92): reverse positions left..right in one pass

**Approach: front insertion.**
1. Walk `before` to the node just before position `left`.
2. `first = before.next` is the block's first node, and it will end up as the block's **last**.
3. Repeat `right - left` times: take the node right after `first` and move it to the front of the block (right after `before`).

```text
left = 2, right = 4:       1 -> [2 -> 3 -> 4] -> 5
move 3 to the front:       1 -> [3 -> 2 -> 4] -> 5
move 4 to the front:       1 -> [4 -> 3 -> 2] -> 5          'first' (2) stays and slides back
```

```java
// LC 92: reverse positions left..right (1-based) in one pass.
public ListNode reverseBetween(ListNode head, int left, int right) {
    ListNode dummy = new ListNode(0, head);
    ListNode before = dummy;
    for (int i = 1; i < left; i++) before = before.next;   // the node just before position 'left'
    ListNode first = before.next;                          // ends up LAST in the reversed block
    for (int i = 0; i < right - left; i++) {
        ListNode moved = first.next;                       // take the node after 'first' ...
        first.next = moved.next;
        moved.next = before.next;                          // ... and insert it right after 'before'
        before.next = moved;
    }
    return dummy.next;
}
```

The [dummy node](lesson:dummy-node) handles `left = 1`, where the head changes.

### Swap Nodes in Pairs (LC 24)

```java
// LC 24: swap every two adjacent nodes (the nodes themselves, not their values).
public ListNode swapPairs(ListNode head) {
    ListNode dummy = new ListNode(0, head);
    ListNode prev = dummy;
    while (prev.next != null && prev.next.next != null) {
        ListNode a = prev.next, b = a.next;
        a.next = b.next;          // a -> rest
        b.next = a;               // b -> a
        prev.next = b;            // prev -> b
        prev = a;                 // a is now second in the pair: the next pair hangs off it
    }
    return dummy.next;
}
```

**Write the three link updates from the far end inward:** `a.next` first (it holds the link to the rest of the list), then `b.next`, then `prev.next`. Then `a`, now second in its pair, becomes the `prev` for the next pair.

## Complexity

O(n) time and O(1) extra space for every iterative version here. The recursive reversal is O(n) time but uses O(n) stack (see [recursion on lists](lesson:linked-list-basics#recursion-on-lists)), which overflows on long lists.

## Variations

### Reverse Nodes in k-Group (LC 25) ⭐: the hard one

**Approach.** For each group:
1. find its k-th node (if there aren't k nodes left, stop);
2. reverse the group with the standard loop, but start `prev` at `groupNext`, so the group's new tail automatically points at the next group;
3. reconnect the previous part (`groupPrev.next = kth`) and move `groupPrev` to the group's new tail (the old first node).

```java
// LC 25: reverse each group of k nodes; a final group shorter than k stays as it is. O(1) space.
public ListNode reverseKGroup(ListNode head, int k) {
    ListNode dummy = new ListNode(0, head);
    ListNode groupPrev = dummy;
    while (true) {
        ListNode kth = groupPrev;
        for (int i = 0; i < k && kth != null; i++) kth = kth.next;   // last node of this group
        if (kth == null) break;                                      // fewer than k nodes left
        ListNode groupNext = kth.next;
        ListNode prev = groupNext, cur = groupPrev.next;   // reverse the group, pointing its new
        while (cur != groupNext) {                         // tail straight at the next group
            ListNode next = cur.next;
            cur.next = prev;
            prev = cur;
            cur = next;
        }
        ListNode oldFirst = groupPrev.next;                // now the group's tail
        groupPrev.next = kth;                              // kth is the group's new head
        groupPrev = oldFirst;
    }
    return dummy.next;
}
```

**Complexity:** O(n) time, since every node is visited twice (count, reverse), and **O(1) space**. The recursive version is shorter but uses O(n/k) stack. If the interviewer asks for constant space, this is the answer.

### Reversal as a building block

- **Reverse half, then compare or weave:** Palindrome Linked List (LC 234) and Reorder List (LC 143), in [middle, reverse, weave](lesson:middle-reverse-weave).
- **Reverse, then add:** for numbers stored most significant digit first (LC 445), reverse both lists so the digits line up from the end; see [two lists at once](lesson:two-lists-at-once).

## Common mistakes

- **Overwriting `cur.next` before saving it**, which cuts off the rest of the list.
- **Returning `cur` instead of `prev`.** When the loop ends, `cur` is `null`; `prev` is the new head.
- **No dummy when the reversed range can start at the head** (LC 92 with `left = 1`).
- **Reversing a final short group in LC 25.** Count k nodes first; a group shorter than k stays as it is.
- **Recursing on a long list**, which overflows the call stack. Prefer the iterative loop.

## Practice

Reverse Linked List (LC 206), iteratively and recursively; Reverse Linked List II (LC 92); Swap Nodes in Pairs (LC 24); Reverse Nodes in k-Group (LC 25); Palindrome Linked List (LC 234); Reorder List (LC 143).

## Key takeaways

- Reversal is three pointers and four lines: save `next`, flip `cur.next`, then advance `prev` and `cur`.
- When `cur` falls off the end, `prev` is the new head.
- Reverse a range by front insertion after the node just before it, with a dummy for when the range starts at the head.
- For k-groups, start `prev` at the next group so the reversed group connects itself.
- Iterative reversal is O(1) space; recursion costs O(n) stack.

## Knowledge check

```quiz
? Inside the reversal loop, why must `next = cur.next` come first?
+ The next line overwrites `cur.next`, and without the saved link the rest of the list is lost
- Because Java evaluates assignments right to left
! Evaluation order isn't the issue; the overwrite is.
- To make the loop terminate
! Termination depends on cur reaching null.
- It doesn't matter where it goes
! Any later placement reads the already-flipped link.
> Save before you overwrite: the classic list-pointer rule.

? The reversal loop ends with `cur == null`. What should the function return?
+ `prev`, the old tail and new head
- `cur`
! cur is null when the loop ends.
- `head`
! The old head is now the tail.
- `head.next`
! The old head's next is null after the reversal.
> prev always heads the reversed part.

? Reverse Linked List II with `left = 1`. Why is a dummy node needed?
+ The head changes, and the algorithm needs a node before position `left` to insert after
- To store the length of the range
! The dummy holds no data.
- Because `right` might be past the end
! The constraints guarantee right is within the list.
- It isn't needed for left = 1
! Without it there's no 'before' node for the first position.
> The dummy gives position 1 a predecessor.

? In Reverse Nodes in k-Group, why is `prev` initialised to `groupNext` instead of `null`?
+ So the reversed group's new tail already points at the next group, with no extra fix-up
- To mark the end of the whole list
! groupNext is the start of the next group, not the end.
- Because `null` would create a cycle
! null would cut the list, not create a cycle.
- So the group is reversed twice
! Each group is reversed once.
> Starting prev at the next group stitches the pieces together as you reverse.
```
