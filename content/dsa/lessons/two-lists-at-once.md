## The idea

Walk two lists in step and keep a little state as you go: a **carry** when the lists are numbers, or a **switch to the other list** when you need the two walks to line up.

## When to use it

- **Numbers stored as linked lists of digits**: add, subtract or compare them.
- **Two lists that may share a tail**: find the node where they meet.
- **Combining two lists node by node**, as [merging two sorted lists](lesson:merging-and-splitting-lists) does.

## How it works

**Adding.** When digits are stored least significant first, walking both lists from the head is exactly column addition by hand. Keep going while **either list or the carry** remains; a list that has run out simply contributes 0.

**Lining up two walks.** Two lists of different lengths can't be walked in step from their heads. If each pointer walks its own list and then the *other* list, both cover the same total distance, `lenA + lenB`. That lines them up at the first shared node.

## Java template

```java
ListNode dummy = new ListNode(), tail = dummy;
int carry = 0;
while (a != null || b != null || carry != 0) {
    int x = (a != null) ? a.val : 0, y = (b != null) ? b.val : 0;   // a missing node counts as 0
    int sum = x + y + carry;
    tail.next = new ListNode(sum % 10);
    tail = tail.next;
    carry = sum / 10;
    if (a != null) a = a.next;
    if (b != null) b = b.next;
}
return dummy.next;
```

## Worked examples

### Add Two Numbers (LC 2)

**Approach.** Digits are stored least significant first, the same order you add by hand. So walk both lists together with a carry, and keep going while **either list or the carry** remains.

```java
// LC 2: digits stored least significant first; return the sum in the same form.
public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(), tail = dummy;
    int carry = 0;
    while (l1 != null || l2 != null || carry != 0) {   // 'carry != 0' handles 5 + 5 = 10
        int sum = carry;
        if (l1 != null) { sum += l1.val; l1 = l1.next; }
        if (l2 != null) { sum += l2.val; l2 = l2.next; }
        tail.next = new ListNode(sum % 10);
        tail = tail.next;
        carry = sum / 10;
    }
    return dummy.next;
}
```

**The `carry != 0` in the loop condition** handles the final carry: `5 + 5` must produce `0 -> 1`. Lists of different lengths need no special code: a missing digit is a 0.

### Intersection of Two Linked Lists (LC 160)

**Approach.** Two pointers walk their own list, then **switch to the other list's head**. Both end up walking `lenA + lenB` nodes, which lines them up at the shared part.

```java
// LC 160: the first shared node, or null. O(n + m) time, O(1) space, no length counting.
public ListNode getIntersectionNode(ListNode headA, ListNode headB) {
    ListNode a = headA, b = headB;
    while (a != b) {
        a = (a == null) ? headB : a.next;   // at the end of A, continue at the start of B
        b = (b == null) ? headA : b.next;   // and vice versa
    }
    return a;                               // the meeting node, or null (both ended together)
}
```

**Why it works:** say list A has `a` unique nodes, B has `b`, and they share a tail of `c` nodes.
- Pointer A walks `a + c`, switches, then walks `b` more: it reaches the first shared node after `a + c + b` steps.
- Pointer B walks `b + c + a`: the same number of steps.
- If there's no shared tail (`c = 0`), both become `null` after `a + b` steps, at the same time, and the loop ends with `null`.

## Complexity

- Add Two Numbers: O(max(m, n)) time; O(1) extra space besides the result.
- Intersection: O(a + b + c) time, O(1) space.

## Variations

### Add Two Numbers II (LC 445): most significant digit first

**Approach.** You can't add from the left. Either [reverse](lesson:reversing-linked-lists) both lists (and restore them), or push the digits onto stacks so they pop least significant first. Build the result by **prepending**, since the digits come out in reverse.

```java
// LC 445: most significant digit first, inputs must not be modified. Stacks reverse the order.
public ListNode addTwoNumbersII(ListNode l1, ListNode l2) {
    Deque<Integer> s1 = new ArrayDeque<>(), s2 = new ArrayDeque<>();
    for (ListNode p = l1; p != null; p = p.next) s1.push(p.val);
    for (ListNode p = l2; p != null; p = p.next) s2.push(p.val);
    ListNode head = null;
    int carry = 0;
    while (!s1.isEmpty() || !s2.isEmpty() || carry != 0) {
        int sum = carry + (s1.isEmpty() ? 0 : s1.pop()) + (s2.isEmpty() ? 0 : s2.pop());
        head = new ListNode(sum % 10, head);   // PREPEND: digits come out least significant first
        carry = sum / 10;
    }
    return head;
}
```

### Intersection by lengths

The "compute both lengths, advance the longer list by the difference, then walk together" approach is equally good, and easier to explain if you blank on the switching trick. A `HashSet` of one list's nodes also works, in O(n) space.

## Common mistakes

- **Forgetting the final carry**, so `5 + 5` returns `0` instead of `0 -> 1`.
- **Special-casing lists of different lengths** in addition: a missing node is just a 0.
- **Comparing values instead of nodes** when looking for an intersection: different nodes can hold equal values. Compare references.
- **Modifying the inputs** in LC 445 when the problem says not to; use stacks, or restore the lists.

## Practice

Add Two Numbers (LC 2), Add Two Numbers II (LC 445), Intersection of Two Linked Lists (LC 160), Merge Two Sorted Lists (LC 21).

## Key takeaways

- Digits stored least significant first add like column addition: loop while either list or the carry remains.
- A list that has run out contributes 0; no special cases are needed.
- To find where two lists meet, switch each pointer to the other list's head at the end: both walk lenA + lenB.
- Most-significant-first digits need reversal or stacks, and prepending to build the result.
- Compare nodes by reference when looking for a shared node.

## Knowledge check

```quiz
? Add Two Numbers: why is `carry != 0` part of the loop condition?
+ So a final carry, as in 5 + 5, still produces its own node
- To handle lists of different lengths
! The null checks inside the loop handle different lengths.
- To avoid an infinite loop
! The condition adds iterations; it doesn't prevent loops.
- Because digits can be negative
! Digits are 0–9 here.
> Without it, 5 + 5 returns 0 instead of 0 → 1.

? In Intersection of Two Linked Lists, why does each pointer switch to the other list's head?
+ So both walk lenA + lenB nodes and arrive at the shared part at the same step
- To check every pair of nodes
! That would be O(n·m); each pointer walks each list once.
- Because the lists are sorted
! Order plays no part.
- To detect a cycle
! The lists here have no cycles.
> Equal total distances line the pointers up without counting lengths.

? Two lists don't intersect. What does the switching loop return, and why does it stop?
+ null: both pointers reach the end of their second list at the same time, so `a == b` (both null)
- It never stops
! Both pointers walk exactly lenA + lenB steps and become null together.
- The last node of the longer list
! Neither pointer stops on a real node, since none is shared.
- A NullPointerException is thrown
! Null pointers are switched or compared, never dereferenced.
> With no shared tail, null is the "meeting point".

? Add Two Numbers II stores the most significant digit first. Why push the digits onto stacks?
+ So they pop least significant first, the order addition needs, without modifying the inputs
- To sort the digits
! The digit order is reversed, not sorted.
- Because stacks use less memory than lists
! The stacks add O(n) space; the point is the order.
- To remove leading zeros
! Leading zeros aren't the problem being solved.
> Then build the result by prepending, since the sum's digits come out in reverse.
```
