## The idea

Merging two sorted lists **relinks their existing nodes** behind a dummy and a tail, one smaller head at a time. Splitting a list at its middle and merging the sorted halves is merge sort, the natural way to sort a linked list.

## When to use it

- **Two (or k) sorted lists** to combine into one.
- **"Sort a linked list"**, especially "in O(n log n) time" or "with O(1) memory".
- Any problem where nodes from two runs must be interleaved by value.

## How it works

- **No new nodes.** Merging rewires `next` pointers, so it needs O(1) extra space. Arrays can't do that, which is why merge sort is *the* sort for linked lists.
- **A dummy and a tail** collect the result; at each step the smaller of the two heads is appended.
- **The leftover run is attached in one step**, not node by node: once one list is empty, the rest of the other is already sorted.
- **`<=` makes it stable**: equal keys keep their original order, which matters when nodes carry more than a key.
- **Splitting** uses the *first* middle from [fast and slow pointers](lesson:fast-and-slow-pointers), then cuts after it (`mid.next = null`), so both halves are strictly shorter than the whole.

## Java template

```java
// LC 21: splice the nodes together; no new nodes are created.
public ListNode mergeTwoLists(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(), tail = dummy;
    while (a != null && b != null) {
        if (a.val <= b.val) { tail.next = a; a = a.next; }   // <= keeps equal keys in order (stable)
        else                { tail.next = b; b = b.next; }
        tail = tail.next;
    }
    tail.next = (a != null) ? a : b;                         // attach the leftover run in one step
    return dummy.next;
}
```

## Worked examples

### Merge Two Sorted Lists (LC 21), recursively

The template above is the iterative version. The recursive one is elegant, but uses O(n + m) stack:

```java
public ListNode mergeTwoListsRecursive(ListNode a, ListNode b) {
    if (a == null) return b;
    if (b == null) return a;
    if (a.val <= b.val) {
        a.next = mergeTwoListsRecursive(a.next, b);
        return a;
    }
    b.next = mergeTwoListsRecursive(a, b.next);
    return b;
}
```

### Sort List (LC 148): merge sort, top-down

**Approach.** Split at the **first** middle, sort both halves, merge.

```java
// LC 148: merge sort, O(n log n) time, O(log n) stack.
public ListNode sortList(ListNode head) {
    if (head == null || head.next == null) return head;
    ListNode mid = middleNodeFirst(head);   // FIRST middle: with 2 nodes the halves are 1 + 1
    ListNode right = mid.next;
    mid.next = null;                        // cut the list in two
    return mergeTwoLists(sortList(head), sortList(right));
}
```

**Why not quicksort?** Quicksort needs random access to pick good pivots and swap elements, and on a list a bad pivot gives O(n²). It's also unstable. Merge sort on a list is O(n log n) worst case, stable, and needs no extra array, because the merge just relinks nodes.

## Complexity

| Task | Time | Extra space |
|---|---|---|
| Merge two lists of lengths n and m | O(n + m) | O(1) iterative, O(n + m) recursive |
| Merge k lists, N nodes in total | O(N log k) | O(k) with a heap, O(1) pairwise |
| Sort List, top-down | O(n log n) | O(log n) stack |
| Sort List, bottom-up | O(n log n) | O(1) |

## Variations

### Merge k Sorted Lists (LC 23)

With `N` total nodes across `k` lists, there are two standard O(N log k) answers:

```java
// LC 23: N nodes in total across k lists. Heap of the k current heads: O(N log k).
public ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> heap = new PriorityQueue<>((x, y) -> Integer.compare(x.val, y.val));
    for (ListNode head : lists) if (head != null) heap.offer(head);
    ListNode dummy = new ListNode(), tail = dummy;
    while (!heap.isEmpty()) {
        ListNode smallest = heap.poll();
        tail.next = smallest;
        tail = smallest;
        if (smallest.next != null) heap.offer(smallest.next);   // its successor joins the frontier
    }
    return dummy.next;
}

// Divide and conquer: merge neighbours, then neighbours of neighbours. Also O(N log k), no heap.
// Note: it reuses the 'lists' array as scratch space.
public ListNode mergeKListsPairwise(ListNode[] lists) {
    if (lists.length == 0) return null;
    for (int step = 1; step < lists.length; step *= 2) {
        for (int i = 0; i + step < lists.length; i += 2 * step) {
            lists[i] = mergeTwoLists(lists[i], lists[i + step]);
        }
    }
    return lists[0];
}
```

| Approach | Time | Extra space | Notes |
|---|---|---|---|
| Merge lists one by one into a result | O(N·k) | O(1) | the naive answer: the early nodes are re-walked k times |
| Heap of the k heads | O(N log k) | O(k) | streams well (lists can be iterators) |
| Pairwise (divide and conquer) | O(N log k) | O(1) | every node is merged log k times |

The heap comparator uses `Integer.compare`, never `x.val - y.val`, which overflows for large negative and positive values. The heap version is the [k-way merge](lesson:k-way-merge) pattern.

### Bottom-up merge sort: O(1) extra space

The top-down version uses O(log n) recursion stack. When the problem insists on **O(1) extra space**, sort bottom-up: merge runs of size 1, then 2, then 4…, relinking in place. It uses `length` from [linked list basics](lesson:linked-list-basics):

```java
// Bottom-up merge sort: merge runs of size 1, 2, 4, ... in place. O(n log n) time, O(1) space.
public ListNode sortListBottomUp(ListNode head) {
    int n = length(head);
    ListNode dummy = new ListNode(0, head);
    for (int size = 1; size < n; size *= 2) {
        ListNode tail = dummy, cur = dummy.next;
        while (cur != null) {
            ListNode left = cur;
            ListNode right = split(left, size);     // left = the first 'size' nodes
            cur = split(right, size);               // right = the next 'size', cur = the rest
            tail.next = mergeTwoLists(left, right);
            while (tail.next != null) tail = tail.next;
        }
    }
    return dummy.next;
}

// Cut the list after 'size' nodes and return the head of the remainder (or null).
private ListNode split(ListNode head, int size) {
    for (int i = 1; head != null && i < size; i++) head = head.next;
    if (head == null) return null;
    ListNode rest = head.next;
    head.next = null;
    return rest;
}
```

### Insertion Sort List (LC 147)

```java
// LC 147: O(n^2), but stable, in place, and great on nearly sorted input.
public ListNode insertionSortList(ListNode head) {
    ListNode dummy = new ListNode();                 // the sorted list grows behind this
    ListNode cur = head;
    while (cur != null) {
        ListNode next = cur.next;
        ListNode prev = dummy;
        while (prev.next != null && prev.next.val <= cur.val) prev = prev.next;   // <= : stable
        cur.next = prev.next;
        prev.next = cur;
        cur = next;
    }
    return dummy.next;
}
```

It's O(n²), but in place, stable and adaptive: nearly sorted input is fast. That's also why `Arrays.sort`/TimSort uses insertion sort for tiny runs. Prefer merge sort for anything large.

## Common mistakes

- **Splitting at the second middle**, so a 2-node list splits into 2 + 0 and the recursion never ends.
- **Forgetting to cut** (`mid.next = null`), so the "left half" still runs into the right half.
- **Attaching the leftover node by node** instead of in one step: correct, but slower and longer.
- **`x.val - y.val` as a comparator**, which overflows for large values of opposite sign. Use `Integer.compare`.
- **Merging k lists one after another**, which is O(N·k): the early nodes are re-walked k times.

## Practice

Merge Two Sorted Lists (LC 21), Merge k Sorted Lists (LC 23), Sort List (LC 148), Insertion Sort List (LC 147), Merge In Between Linked Lists (LC 1669).

## Key takeaways

- Merging relinks existing nodes behind a dummy and a tail: O(n + m) time, O(1) extra space.
- Attach the leftover run in one step, and use `<=` to keep the merge stable.
- Merge sort is the sort for linked lists: split at the first middle, cut, sort both halves, merge.
- Merge k lists with a heap of heads or pairwise merging: O(N log k).
- Bottom-up merge sort reaches O(1) extra space; insertion sort is O(n²) but fine for nearly sorted lists.

## Knowledge check

```quiz
? Why does merging two sorted linked lists need only O(1) extra space?
+ It relinks the existing nodes instead of copying values into a new structure
- Because linked lists are already sorted
! The inputs are sorted runs; the merge still has to interleave them.
- Because the recursion is tail-recursive
! The iterative version uses no recursion at all.
- It doesn't; it needs O(n + m) space for the result
! The result reuses the input nodes.
> Rewiring next pointers is what arrays can't do, which is why merge sort suits lists.

? Merge sort on a 2-node list recurses forever. What's the likely bug?
+ It splits at the second middle, giving halves of 2 and 0 nodes
- The merge uses `<` instead of `<=`
! That affects stability, not termination.
- The base case checks `head == null` only
! A one-node list still returns; the 2-node split is what loops.
- The heap comparator overflows
! Merge sort here uses no heap.
> Split at the first middle so both halves are strictly smaller.

? What's the time to merge k sorted lists with N nodes in total, by merging them one at a time into a growing result?
+ O(N·k), because the early nodes are walked again in every merge
- O(N log k)
! That's the heap or pairwise approach.
- O(N)
! A single pass can't handle k lists without a heap.
- O(k log N)
! The cost depends on all N nodes, k times.
> Pairwise merging or a heap of the k heads brings it down to O(N log k).

? Why is `(x, y) -> x.val - y.val` a risky comparator for the heap?
+ The subtraction overflows for large values of opposite sign, giving the wrong order
- It sorts in descending order
! For small values it sorts ascending; the problem is overflow.
- Comparators can't read node fields
! They can read any accessible field.
- It makes the heap unstable
! Heaps are unstable either way; the issue is correctness.
> Integer.compare(x.val, y.val) never overflows.
```
