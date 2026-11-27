Linked-list questions reward a disciplined process more than clever ideas. This recap maps the wording of a problem to its technique, then gives the checklist, edge cases and mistakes to run through before you say "done".

## Recognizing the pattern

| The problem says… | Reach for |
|---|---|
| remove / insert / partition; "the head may change" | [**dummy node**](lesson:dummy-node) |
| reverse, "in groups of k", "between positions" | [**reversal**](lesson:reversing-linked-lists) |
| middle, cycle, loop, "where does it start", repeated value in `[1, n]` | [**fast & slow**](lesson:fast-and-slow-pointers) |
| "n-th from the end", "last k", rotate | [**fixed gap**](lesson:fixed-gap-pointers) |
| sorted lists, merge, "sort in O(n log n)" | [**merge & split**](lesson:merging-and-splitting-lists) |
| pair the front with the back: reorder, palindrome, twin | [**middle + reverse + weave**](lesson:middle-reverse-weave) |
| numbers as digits, two lists meeting | [**two lists at once**](lesson:two-lists-at-once) |
| random/arbitrary pointers, unsorted duplicates | [**hash map**](lesson:hashing-and-cloning-lists), then optimise |
| O(1) get/put with eviction order | [**HashMap + doubly linked list**](lesson:linked-list-design-problems) |

## Decision procedure

**Step 1: map the wording to a technique**, using the table above.

**Step 2: state the constraints out loud.** Can I modify the list? Do I have to restore it? Is O(n) extra space allowed? Can values repeat? Can the list be empty, or have a cycle?

**Step 3: draw it.** Three or four boxes, the pointers you'll keep (`prev`, `cur`, `next`, `dummy`, `slow`, `fast`), and the state *after one iteration*. Linked-list bugs are visible on paper and invisible in your head.

**Step 4: write the invariant as a comment before the loop**:

```java
// prev is the last node of the finished (reversed) part; cur is the first unprocessed node
// less/more are the tails of the two lists being built; both lists end in null at the end
// lag is exactly n + 1 nodes behind lead
```

**Step 5: walk the code on 0, 1 and 2 nodes**, then on one normal case.

## The pointer-safety checklist

Before you say "done", check every line that writes a `.next`:
1. **Saved before overwritten?** If `x.next` is about to change, is the old value saved if you still need it?
2. **Null-safe?** Every `a.b.c` needs `a != null && a.b != null`. Two-step pointers check `fast != null && fast.next != null`.
3. **Terminated?** When you rebuild lists from existing nodes, the last node's `next` must be set to `null` (partition, odd-even, split). Otherwise you get cycles.
4. **Head returned correctly?** If the head can change, return `dummy.next` or the new head, not the old `head`.
5. **Input restored?** If you reversed part of the caller's list just to inspect it, reverse it back.
6. **Nodes vs values?** Compare nodes with `==` (cycles, intersections), values with `==` on `int` (or `equals` on objects).
7. **Termination of loops?** Each iteration must move some pointer forward, or make the list shorter.

## Edge cases to test

| Case | Why it breaks code |
|---|---|
| empty list (`null`) | `head.next` throws |
| one node | the head is also the tail, the middle and the n-th from the end |
| two nodes | the middle choice matters, and swaps or reversals touch both ends |
| even and odd lengths | middle, reorder, palindrome and odd-even all differ |
| the operation hits the head | needs a dummy or special handling |
| the operation hits the tail | the tail pointer must move, and `next` must become `null` |
| all values equal / duplicates | `<` vs `<=`, and "don't advance after deleting" |
| `k` = 1, `k` = length, `k` > length | k-group, rotate, n-th from the end |
| a cycle in the input (if allowed) | any `while (cur != null)` loop never ends |

## Common mistakes

1. **Losing the rest of the list**: overwriting `cur.next` before saving it.
2. **No dummy node** when the head can change, leading to special-case spaghetti and a missed `head == null` case.
3. **Advancing after a deletion**, which skips the node that just moved up.
4. **Not terminating rebuilt lists** (`tail.next = null`), which creates cycles your tests then loop on forever.
5. **The wrong middle** for splitting: the second middle makes 2-node lists split 2 + 0, and merge sort never terminates.
6. **`fast.next.next` without checking `fast.next`**: a `NullPointerException` on even lengths.
7. **Comparing values instead of nodes** in cycle or intersection problems.
8. **Forgetting the final carry** in Add Two Numbers.
9. **Not maintaining the tail pointer** when deleting the last node (LC 707), or not updating `prev` pointers in doubly linked code.
10. **Leaving the caller's list modified** (palindrome, twin sum) without saying so, or without restoring it.
11. **Recursion on 10⁵ nodes**, causing a `StackOverflowError`. Know the iterative version.
12. **Using `java.util.LinkedList` with `get(i)` in a loop**: O(n²).
13. **Coding before drawing.** Three boxes on paper prevent most of the above.

## Practice ladder

Do these in order. **Rule: implement each one before looking at a solution, and re-solve anything you needed help with three days later.**

**Foundation**
- Design Linked List (707)
- Reverse Linked List (206), iteratively *and* recursively
- Middle of the Linked List (876)
- Merge Two Sorted Lists (21)
- Remove Linked List Elements (203)
- Remove Duplicates from Sorted List (83)
- Linked List Cycle (141)
- Convert Binary Number in a Linked List to Integer (1290)

**Core techniques: do all of these**
- Remove Nth Node From End of List (19)
- Linked List Cycle II (142) ⭐
- Palindrome Linked List (234) ⭐
- Intersection of Two Linked Lists (160)
- Add Two Numbers (2)
- Odd Even Linked List (328)
- Partition List (86)
- Remove Duplicates from Sorted List II (82)
- Swap Nodes in Pairs (24)
- Rotate List (61)
- Delete the Middle Node (2095)
- Maximum Twin Sum (2130)

**Harder**
- Reverse Linked List II (92) ⭐
- Reorder List (143) ⭐
- Sort List (148) ⭐, top-down then bottom-up
- Add Two Numbers II (445)
- Copy List with Random Pointer (138) ⭐, both versions
- Find the Duplicate Number (287) ⭐
- Happy Number (202)
- Insertion Sort List (147)
- Flatten a Multilevel Doubly Linked List (430)
- Split Linked List in Parts (725)
- Next Greater Node in Linked List (1019) (monotonic stack on a list)
- Remove Zero Sum Consecutive Nodes (1171) (prefix sums + a hash map)

**Hard**
- Reverse Nodes in k-Group (25) ⭐⭐
- Merge k Sorted Lists (23) ⭐⭐
- LRU Cache (146) ⭐⭐
- LFU Cache (460) ⭐
- Design Skiplist (1206)
- All O`one Data Structure (432) (doubly linked list of count buckets)

### A one-week plan

**Day 1: mechanics.** Write `ListNode`, `build`, `show`, `MyLinkedList` and the doubly linked list with sentinels from memory, twice. Reverse a list iteratively until you can do it without thinking, then recursively.

**Days 2–3: the techniques.** Dummy node, fast & slow, fixed gap, merge. Do the Foundation and Core lists. After each problem, write one line in a notebook: *trigger → technique*.

**Days 4–5: combinations.** Reorder, palindrome, sort, k-group, copy with random pointer. These are the problems that combine two or three techniques, and they're the ones that get asked at SDE-2 level.

**Day 6: design.** LRU from scratch in under 15 minutes, then LFU. Explain why each needs a doubly linked list.

**Before every interview:** re-read [the one-page summary](#the-one-page-summary) and [the pointer-safety checklist](#the-pointer-safety-checklist).

## The one-page summary

```text
NODE          class ListNode { int val; ListNode next; }  + build(...) and show(...) helpers for testing
LOOPS         cur != null        -> visit every node
              cur.next != null   -> stop ON the last node / delete cur.next
              fast != null && fast.next != null -> two-step pointers

DUMMY         dummy = new ListNode(0, head) ... return dummy.next      head may change? use it
              delete: stand on the node BEFORE; after unlinking, don't advance
              rebuilding lists from old nodes: terminate with tail.next = null

REVERSE       next = cur.next; cur.next = prev; prev = cur; cur = next;   return prev
              between: front insertion after 'before';  k-group: reverse with prev = groupNext

FAST/SLOW     middle: second = (fast != null && fast.next != null); first = (fast.next && fast.next.next)
              split for sorting: FIRST middle
              cycle: meet -> restart one pointer at head, both speed 1 -> entrance
              implicit lists: x -> f(x) (happy number, find duplicate)

GAP           lead n + 1 ahead of lag (both from dummy) -> lag before the n-th from the end

MERGE         dummy + tail, attach leftover in one step, <= for stability
              k lists: heap of heads or pairwise, O(N log k)
              sort: first middle, cut, sort halves, merge (bottom-up for O(1) space)

WEAVE         first middle -> reverse second half -> walk both -> RESTORE the input

TWO LISTS     add: loop while l1 || l2 || carry;  intersection: switch heads at the end

DESIGN        LRU = HashMap<key, Node> + doubly linked list with sentinels; node stores its key
              LFU = per-frequency LRU lists + minFreq
              skip list = sorted list + random express lanes, expected O(log n)

ALWAYS        draw 3 boxes; test null, 1, 2 nodes, even/odd; check every .next write
```

Print that block. Read it before every mock interview.

## Key takeaways

- Map the wording to one of eight techniques; most questions combine two or three of them.
- Draw three boxes and write the loop invariant before you code.
- Check every `.next` write: saved first, null-safe, terminated, head returned correctly, input restored.
- Test empty, one-node and two-node lists, both parities, and operations that touch the head or tail.
- Know the iterative versions; recursion overflows on long lists.

## Knowledge check

```quiz
? "Remove all nodes with a given value; the first node might be one of them." Which technique removes the special case for the head?
+ A dummy node before the head
- Fast and slow pointers
! They find middles and cycles, not predecessors for deletion.
- Reversal
! Reversing doesn't help remove nodes.
- A fixed gap
! A gap finds positions from the end.
> With a dummy, every real node has a predecessor, including the head.

? "Is the list a palindrome? Use O(1) extra space." Which combination solves it?
+ Find the first middle, reverse the back half, compare both halves, then restore the list
- Copy the values into an array and use two pointers
! That's correct, but it uses O(n) space.
- Fast and slow pointers alone
! They find the middle but can't compare the halves.
- A hash map of values to counts
! Counts can't detect the order a palindrome needs.
> Middle + reverse + weave pairs the front with the back.

? Which question should you ask before reversing part of the caller's list to inspect it?
+ Whether the input may be modified, and if not, plan to restore it
- Whether the list is sorted
! Order doesn't matter for this decision.
- Whether the values are integers
! The type of the values doesn't change it.
- Whether recursion is allowed
! Reversal can be iterative either way.
> Returning the caller's list half-reversed is a silent bug.

? Your partition code passes small tests, then hangs on a longer input. What's the most likely cause?
+ A rebuilt list wasn't terminated with `tail.next = null`, leaving a cycle
- The list is too long for recursion
! Partition is a loop, not a recursion.
- The comparator overflows
! Partition compares values with x directly.
- The dummy node was returned instead of `dummy.next`
! That would return an extra node, not hang.
> Whenever you relink existing nodes, terminate the last one.
```
