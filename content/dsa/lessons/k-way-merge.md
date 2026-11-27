## The idea

Hold **one candidate from each list** in a heap of size k. Poll the global minimum, then push the *next* element from the list it came from. The heap always holds the **frontier**: the smallest unprocessed element of every list.

## When to use it

- **"Merge k sorted lists / arrays / streams."**
- **"The smallest range covering elements from all k lists."**
- **"The k-th smallest element in a sorted matrix"** (each row is a sorted list).
- **"Find the k pairs with the smallest sums"** across two sorted arrays.

## How it works

Each list is sorted, so the smallest element still unprocessed overall must be the head of some list. The heap holds exactly those heads; its root is the global minimum. After you take it, the only new candidate is the next element of the same list, so you push just that one.

The heap never holds more than k elements, one per list, which is why every operation costs `log k`, not `log N`.

## Java template

```java
// lists: k sorted lists. Heap entries: {value, list index, position in that list}.
PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
for (int i = 0; i < lists.size(); i++)
    if (!lists.get(i).isEmpty()) heap.offer(new int[] {lists.get(i).get(0), i, 0});   // seed the heads
while (!heap.isEmpty()) {
    int[] cur = heap.poll();                          // the global minimum of the frontier
    // ... use cur[0] ...
    int list = cur[1], next = cur[2] + 1;
    if (next < lists.get(list).size())
        heap.offer(new int[] {lists.get(list).get(next), list, next});   // refill from the same list
}
```

## Worked examples

### Merge k Sorted Lists (LC 23)

```java
public ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> heap =
        new PriorityQueue<>((a, b) -> Integer.compare(a.val, b.val));

    for (ListNode node : lists)
        if (node != null) heap.offer(node);      // ← seed with the head of each list

    ListNode dummy = new ListNode(0), tail = dummy;
    while (!heap.isEmpty()) {
        ListNode min = heap.poll();
        tail.next = min;
        tail = min;
        if (min.next != null) heap.offer(min.next);   // ← refill from the same list
    }
    tail.next = null;
    return dummy.next;
}
```

The [dummy node](lesson:dummy-node) avoids special-casing the first append.

### Smallest Range Covering Elements from K Lists (LC 632)

The same frontier idea; track the current maximum while polling the minimum:

```java
public int[] smallestRange(List<List<Integer>> nums) {
    PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    int max = Integer.MIN_VALUE;
    for (int i = 0; i < nums.size(); i++) {
        int v = nums.get(i).get(0);
        heap.offer(new int[]{v, i, 0});
        max = Math.max(max, v);
    }

    int[] best = {0, Integer.MAX_VALUE};
    while (heap.size() == nums.size()) {          // must still cover every list
        int[] cur = heap.poll();
        int min = cur[0], list = cur[1], idx = cur[2];
        if (max - min < best[1] - best[0]) best = new int[]{min, max};
        if (idx + 1 < nums.get(list).size()) {
            int next = nums.get(list).get(idx + 1);
            heap.offer(new int[]{next, list, idx + 1});
            max = Math.max(max, next);
        }
    }
    return best;
}
```

**The loop condition `heap.size() == nums.size()`** encodes "the window still touches every list". The moment one list is exhausted, no valid range remains.

## Complexity

O(N log k) time, where N is the total number of elements and k the number of lists; O(k) space for the heap. Merging the lists one by one into a growing result is O(N·k).

## Variations

### Kth Smallest Element in a Sorted Matrix (LC 378)

```java
public int kthSmallest(int[][] matrix, int k) {
    int n = matrix.length;
    // {value, row, col}, min-heap by value
    PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    for (int r = 0; r < Math.min(n, k); r++) heap.offer(new int[]{matrix[r][0], r, 0});

    int result = 0;
    for (int i = 0; i < k; i++) {
        int[] cur = heap.poll();
        result = cur[0];
        int r = cur[1], c = cur[2];
        if (c + 1 < n) heap.offer(new int[]{matrix[r][c + 1], r, c + 1});   // next in this row
    }
    return result;
}
```

O(k log k). **The better follow-up answer is binary search on the value range**: O(n log(max − min)), counting how many elements are ≤ mid with a staircase walk from the bottom-left. Know that it exists; [binary search on the answer](lesson:binary-search-on-the-answer) is a top-tier pattern.

### Other frontier problems

- **Find K Pairs with Smallest Sums (LC 373):** each element of the first array starts a sorted "list" of pairs with the second array; seed the heap with `(i, 0)` and refill with `(i, j + 1)`.
- **Ugly Number II (LC 264):** three sorted streams (multiples by 2, 3 and 5) merged without duplicates.
- **Divide and conquer.** Merging the lists in pairs is also O(N log k), with O(1) extra space: see [merging and splitting lists](lesson:merging-and-splitting-lists). The heap is easier to write; pairwise merging avoids the heap's memory.

## Common mistakes

- **Seeding the heap with empty lists or null heads**, which throws or compares nothing.
- **Forgetting to refill from the same list**, so the merge stops after k elements.
- **Pushing every element into the heap at once**, which makes each operation O(log N) instead of O(log k).
- **A subtracting comparator** that can overflow; use `Integer.compare`.
- **Continuing Smallest Range after a list runs out**: every candidate range must still cover all k lists.

## Practice

Merge k Sorted Lists (LC 23), Kth Smallest Element in a Sorted Matrix (LC 378), Find K Pairs with Smallest Sums (LC 373), Smallest Range Covering Elements from K Lists (LC 632), Ugly Number II (LC 264).

## Key takeaways

- Keep one candidate per list in a heap: the root is the global minimum of the frontier.
- After polling, push the next element of the same list.
- The heap never exceeds k entries, so the cost is O(N log k).
- Smallest Range tracks the frontier's maximum too, and stops as soon as any list runs out.
- For a sorted matrix, binary search on the value range is often the better follow-up.

## Knowledge check

```quiz
? Why does merging k sorted lists with a heap cost O(N log k) rather than O(N log N)?
+ The heap holds at most one element per list, so it never exceeds k entries
- Because the lists are already sorted, so the heap needs no comparisons
! Every offer and poll still compares elements.
- Because only k elements are ever merged
! All N elements pass through the heap.
- It doesn't; it's O(N log N)
! Pushing everything at once would be, but the frontier is only k wide.
> N polls and offers, each on a heap of size k.

? After polling the minimum from the heap, which element do you push next?
+ The next element of the list the minimum came from
- The next element of every list
! The other lists' candidates are still in the heap.
- The largest remaining element overall
! The frontier needs each list's smallest unprocessed element.
- Nothing, until the heap is empty
! The heap must be refilled to keep one candidate per list.
> Only that list's frontier has changed.

? In Smallest Range Covering Elements from K Lists, why does the loop stop when the heap holds fewer than k entries?
+ One list has run out, so no later range can include an element from every list
- Because the heap must always be full to compute a range
! The range needs one element per list; a short heap means a list is missing.
- To avoid an empty heap
! The heap still has elements when the loop stops.
- Because the best range has been found
! It may have been found earlier; the stop is about validity.
> Every candidate range must touch all k lists.

? Merging k lists one after another into a growing result costs O(N·k). Why?
+ The elements merged early are walked again in every later merge
- Because each merge sorts the result again
! Merging two sorted lists is linear; it doesn't sort.
- Because the lists have different lengths
! Lengths don't cause the k factor.
- It doesn't; it's also O(N log k)
! Sequential merging re-walks the growing result up to k times.
> A heap or pairwise merging brings it down to O(N log k).
```
