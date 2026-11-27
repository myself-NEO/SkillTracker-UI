## The idea

A singly linked list can't walk backwards, so **make the back half walk forwards**:
1. find the first middle;
2. reverse the half after it;
3. walk both halves together.

## When to use it

The problem pairs the i-th node from the front with the i-th node from the back, with O(1) space required:
- **reordering** as `L0 → Ln → L1 → Ln-1 → …`;
- **palindrome** checks;
- **twin sums**, where node i pairs with node n − 1 − i.

## How it works

The technique combines two others: the first middle from [fast and slow pointers](lesson:fast-and-slow-pointers) and the [reversal loop](lesson:reversing-linked-lists).

- After reversing the half that follows the first middle, walking from the head and from the reversed half's head visits the pairs (0, n − 1), (1, n − 2), and so on, in order.
- With the *first* middle, the front half is never shorter than the back half. For odd lengths the extra node stays at the end of the front half, so loops should run while the **back** pointer is non-null.
- Problems that only *inspect* the list (palindrome, twin sum) must **reverse the back half again** before returning. Problems that *rebuild* the list (reorder) cut it at the middle instead.

## Java template

```java
ListNode mid = middleNodeFirst(head);       // fast & slow: the first middle
ListNode back = reverseList(mid.next);      // reverse the back half
// walk p = head and q = back together while q != null: (p, q) are the pairs (i, n - 1 - i)
mid.next = reverseList(back);               // restore the caller's list, if you only inspected it
```

## Worked examples

### Reorder List (LC 143)

```java
// LC 143: L0 -> Ln -> L1 -> Ln-1 -> ...  = find middle + reverse back half + weave.
public void reorderList(ListNode head) {
    if (head == null || head.next == null) return;
    ListNode mid = middleNodeFirst(head);
    ListNode second = reverseList(mid.next);    // reverse the back half ...
    mid.next = null;                            // ... and cut it off
    ListNode first = head;
    while (second != null) {                    // weave: first, second, first, second ...
        ListNode n1 = first.next, n2 = second.next;
        first.next = second;
        second.next = n1;
        first = n1;
        second = n2;
    }
}
```

```text
1 -> 2 -> 3 -> 4 -> 5
first half: 1 -> 2 -> 3      second half reversed: 5 -> 4
weave:      1 -> 5 -> 2 -> 4 -> 3
```

### Palindrome Linked List (LC 234)

```java
// LC 234 in O(1) space, leaving the caller's list exactly as it was.
public boolean isPalindrome(ListNode head) {
    if (head == null || head.next == null) return true;
    ListNode mid = middleNodeFirst(head);
    ListNode secondHalf = reverseList(mid.next);
    boolean palindrome = true;
    for (ListNode p = head, q = secondHalf; q != null; p = p.next, q = q.next) {
        if (p.val != q.val) {
            palindrome = false;
            break;
        }
    }
    mid.next = reverseList(secondHalf);   // restore: never leave an input half-reversed
    return palindrome;
}
```

**Restore the input.** The function reverses the second half back before returning. The caller passed you *their* list, and returning it half-reversed is a silent bug that interviewers notice. It costs one extra O(n) pass. Stating "I'll restore the list" earns points even if you're short on time.

## Complexity

O(n) time and O(1) extra space: one pass to find the middle, one to reverse, one to walk, and one more to restore. The simpler O(n)-space alternatives are to copy the values into an `ArrayList` and use [two pointers](lesson:two-pointers), or to push them on a stack. Mention them first, then optimise.

## Variations

### Maximum Twin Sum (LC 2130)

```java
// LC 2130: even length n; twin of node i is node n - 1 - i. Maximum twin sum.
public int pairSum(ListNode head) {
    ListNode mid = middleNodeFirst(head);
    ListNode second = reverseList(mid.next);
    int best = Integer.MIN_VALUE;
    for (ListNode p = head, q = second; q != null; p = p.next, q = q.next) {
        best = Math.max(best, p.val + q.val);
    }
    mid.next = reverseList(second);
    return best;
}
```

### The O(n)-space versions

When space doesn't matter, copy the values into an array and compare `values[i]` with `values[n − 1 − i]`. It's the fastest version to write correctly, and a good first answer before you optimise.

## Common mistakes

- **Splitting at the second middle**, which leaves the halves misaligned for odd and even lengths.
- **Not cutting the list in Reorder List** (`mid.next = null`), which leaves a cycle after weaving.
- **Leaving the caller's list half-reversed** after a palindrome or twin-sum check.
- **Looping while the front pointer is non-null.** The front half can be one node longer; loop while the back pointer is non-null.

## Practice

Reorder List (LC 143), Palindrome Linked List (LC 234), Maximum Twin Sum of a Linked List (LC 2130).

## Key takeaways

- To pair the front with the back of a singly linked list, reverse the back half so it walks forwards.
- Find the first middle, reverse what follows it, and walk both halves together.
- Loop while the back pointer is non-null: the front half may be one node longer.
- If you only inspect the list, reverse the back half again before returning.
- O(n) time, O(1) space; copying the values into an array is the simpler O(n)-space first answer.

## Knowledge check

```quiz
? Why does Palindrome Linked List reverse the second half instead of walking backwards from the tail?
+ A singly linked list has no backward links, so reversing lets the back half be walked forwards
- Reversing is faster than walking backwards
! Walking backwards isn't possible at all without prev pointers.
- To sort the list
! Reversal doesn't sort anything.
- Because the head might be a palindrome by itself
! The whole list is compared, pair by pair.
> Reversal turns "from the back" into "from the front" in O(1) space.

? Why does isPalindrome reverse the second half a second time before returning?
+ To restore the caller's list, which a check shouldn't modify
- To check the palindrome in the other direction
! One comparison pass is enough.
- To free the memory of the reversed half
! No memory is allocated or freed.
- Because the first reversal was incomplete
! The first reversal reversed the whole back half.
> Returning the input half-reversed is a silent bug.

? For an odd-length list, which half has the extra node after splitting at the first middle?
+ The front half, so loops should run while the back pointer is non-null
- The back half
! With the first middle, the back half is never longer.
- Neither; the middle node is dropped
! The middle node stays at the end of the front half.
- It depends on the values
! The split depends only on the length.
> Driving the loop by the back half avoids touching the unpaired middle node.

? Reorder List weaves the two halves together. What happens if you forget `mid.next = null`?
+ The front half still runs into the back half, and weaving creates a cycle
- The list ends up reversed
! Weaving doesn't reverse the whole list.
- The middle node is lost
! It stays in place; the problem is the old link after it.
- Nothing, because the weave overwrites every link
! The front half's last link isn't rewritten by the weave.
> Cut the list when you rebuild it from its own nodes.
```
