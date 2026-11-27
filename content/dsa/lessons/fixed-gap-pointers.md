## The idea

Move `lead` k steps ahead, then move `lead` and `lag` together. When `lead` falls off the end, `lag` is exactly k nodes from the end. It takes one pass and needs no length.

## When to use it

- **"n-th from the end"**, "k-th last", "the last k nodes", when you don't know the length.
- **Finding a node at a fixed distance from the end** so you can delete or swap it.
- **Rotation**, where the new tail is a fixed distance from the end (here, counting the length first turns out simpler).

## How it works

The invariant is the gap: `lead` is always exactly k nodes ahead of `lag`. When `lead` steps past the last node onto `null`, that gap means `lag` sits k nodes before the end.

To **delete** the target you need the node *before* it, so make the gap one larger: start both pointers at a [dummy node](lesson:dummy-node) and lead by `n + 1`. Then `lag` stops on the predecessor, and the dummy also covers deleting the head.

## Java template

```java
// k-th node from the end (k >= 1), or null if the list is shorter than k.
public ListNode kthFromEnd(ListNode head, int k) {
    ListNode lead = head;
    for (int i = 0; i < k; i++) {
        if (lead == null) return null;
        lead = lead.next;
    }
    ListNode lag = head;
    while (lead != null) {
        lead = lead.next;
        lag = lag.next;
    }
    return lag;
}
```

## Worked examples

### Remove Nth Node From End of List (LC 19)

```java
// LC 19: remove the n-th node from the end (1 <= n <= length) in one pass.
public ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(0, head);
    ListNode lead = dummy, lag = dummy;
    for (int i = 0; i <= n; i++) lead = lead.next;          // a gap of n + 1 nodes
    while (lead != null) {
        lead = lead.next;
        lag = lag.next;
    }
    lag.next = lag.next.next;                               // lag stopped just BEFORE the target
    return dummy.next;
}
```

**Why a gap of `n + 1` from the dummy:** to delete the target we need the node **before** it. Starting both pointers at the dummy and leading by `n + 1` makes `lag` stop on that predecessor. The dummy also covers removing the head (`n == length`).

### Rotate List (LC 61)

**Approach.** Rotation is "cut and re-attach":
1. One pass to get the length and the tail.
2. `k %= n`, because rotating by `n` is a no-op, and `k` may be 2·10⁹.
3. The new tail is the `(n - k)`-th node: cut after it, and join the old tail to the old head.

```java
// LC 61: rotate right by k: the last k nodes move to the front.
public ListNode rotateRight(ListNode head, int k) {
    if (head == null || head.next == null) return head;
    int n = 1;
    ListNode tail = head;
    while (tail.next != null) {          // one pass for the length and the tail
        tail = tail.next;
        n++;
    }
    k %= n;                              // k can be far larger than n
    if (k == 0) return head;
    ListNode newTail = head;
    for (int i = 1; i < n - k; i++) newTail = newTail.next;   // the (n - k)-th node
    ListNode newHead = newTail.next;
    newTail.next = null;                 // cut ...
    tail.next = head;                    // ... and re-attach the old front behind the old tail
    return newHead;
}
```

A two-pointer gap would also find the new tail, but you need the length for `k %= n` anyway. One counting pass plus one walk is the simplest correct solution.

## Complexity

One pass: O(n) time and O(1) space. Counting the length first and then walking `length − k` steps is also O(n), with two passes; the one-pass version is what the "without knowing the length" wording is asking for.

## Variations

**Swapping Nodes in a Linked List (LC 1721).** Swap the values of the k-th node from the front and the k-th node from the end. Walk `first` k − 1 steps; then a second pointer that starts at the head and moves with a copy of `first` stops k from the end:

```java
// LC 1721: swap the values of the k-th node from the front and the k-th from the end.
public ListNode swapNodes(ListNode head, int k) {
    ListNode first = head;
    for (int i = 1; i < k; i++) first = first.next;       // k-th from the front
    ListNode lead = first, second = head;
    while (lead.next != null) {                            // keep a gap of k - 1 nodes
        lead = lead.next;
        second = second.next;
    }
    int t = first.val;                                     // second is now k-th from the end
    first.val = second.val;
    second.val = t;
    return head;
}
```

**Two passes when they're clearer.** When you need the length anyway (Rotate List, Split Linked List in Parts, LC 725), count first and then walk.

## Common mistakes

- **A gap that's off by one.** Leading by `n` lands `lag` *on* the target; to delete it you need `n + 1` from a dummy.
- **No dummy when the target can be the head**, which leaves `lag` with no predecessor to stand on.
- **Not handling k larger than the list.** Check for `null` while advancing `lead`, or reduce `k` modulo the length.
- **Forgetting `k %= n` in Rotate List**, with `k` up to 2·10⁹: walking k steps times out.
- **Not cutting the list when rotating**, which leaves a cycle.

## Practice

Remove Nth Node From End of List (LC 19), Rotate List (LC 61), Swapping Nodes in a Linked List (LC 1721), Split Linked List in Parts (LC 725).

## Key takeaways

- Keep two pointers a fixed distance apart: when the leader reaches the end, the follower is that far from the end.
- To delete the n-th node from the end, start at a dummy and lead by n + 1, so the follower stops on the predecessor.
- One pass, O(1) space, no length needed.
- When the length is needed anyway (rotation), counting first is simpler.
- Reduce k modulo the length whenever k can exceed it.

## Knowledge check

```quiz
? To delete the n-th node from the end in one pass, how far ahead of `lag` should `lead` start, if both begin at a dummy?
+ n + 1 nodes, so `lag` stops on the node before the target
- n nodes
! lag would stop on the target itself, which you can't unlink without its predecessor.
- n − 1 nodes
! lag would stop after the target.
- It depends on the list's length
! The gap is fixed; that's the point of the technique.
> The extra step puts lag on the predecessor, and the dummy covers deleting the head.

? Why start at a dummy node in Remove Nth Node From End?
+ When n equals the length, the head is removed and needs a predecessor
- To make the list's length even
! The length doesn't need to change.
- Because `lead` must start before `lag`
! Both start at the dummy.
- To avoid counting the list
! The gap avoids counting; the dummy handles the head.
> A dummy gives every node, including the head, a node before it.

? Rotate List: why reduce `k` with `k %= n`?
+ Rotating by n leaves the list unchanged, and k can be as large as 2·10⁹
- Because k must be smaller than n to compile
! It's a runtime issue, not a compile one.
- To make the rotation go left instead of right
! The direction doesn't change.
- Because n is always a power of two
! n is any length.
> Without it, walking k steps can take billions of iterations.

? What does the fixed-gap technique save compared with counting the length first?
+ A second pass over the list
- Asymptotic time: it turns O(n²) into O(n)
! Both approaches are O(n).
- Memory: counting needs O(n) space
! Counting needs one integer.
- Nothing; they're identical
! Counting needs two passes; the gap needs one.
> Both are O(n) time and O(1) space; the gap does it in a single pass.
```
