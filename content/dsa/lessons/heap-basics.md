A heap gives you the best element repeatedly **without** paying for a full sort. Sorting costs O(n log n) once and gives you *all* the order; a heap costs O(log n) per extraction and gives you *just enough* order. If you only need the top 5 of a million items, or the data arrives in a stream, the heap wins.

## What it is

A **binary heap** is a **complete binary tree** that satisfies the **heap property**:

- **Min-heap:** every node ≤ its children. The minimum is at the root.
- **Max-heap:** every node ≥ its children. The maximum is at the root.

Two words, both load-bearing:

- **Complete**: every level is full except possibly the last, which fills left to right. This is what lets you store the tree in a flat array with no pointers and no gaps, and it's what bounds the height at ⌊log₂ n⌋.
- **The heap property is local**: it constrains only parent and child. Siblings are unordered; cousins are unordered. **A heap is *not* sorted.** This is the single most misunderstood fact about heaps: `[1, 5, 2, 8, 6, 3]` is a valid min-heap, and it's obviously not sorted.

That weakness is exactly the strength: maintaining *partial* order costs O(log n) per update, whereas maintaining full order (a sorted array) costs O(n) per insert. It's also a weaker order than a binary search tree's, which is why a heap is faster to build and update.

**Priority queue** is the *abstract type* ("get me the highest-priority element"); **heap** is the usual *implementation*. Interviewers use the words interchangeably; you shouldn't.

## How it works

### The array trick

Store the complete tree level by level in an array. For index `i` (0-based):

```
parent(i)     = (i - 1) / 2
leftChild(i)  = 2 * i + 1
rightChild(i) = 2 * i + 2
```

```
        1(0)
       /    \
    5(1)     2(2)          array: [1, 5, 2, 8, 6, 3]
    /  \     /
  8(3) 6(4) 3(5)
```

No node objects, no pointers, perfect cache locality. This is why heaps are fast in practice.

**Two repair operations; everything else is built from these.**

### siftUp (bubble up): used after inserting at the end

The new element may be smaller than its parent. Swap it upward until the heap property holds.

```java
private void siftUp(int i) {
    while (i > 0) {
        int parent = (i - 1) / 2;
        if (heap[i] >= heap[parent]) break;   // min-heap: stop when parent is smaller
        swap(i, parent);
        i = parent;
    }
}
```

At most one swap per level: **O(log n)**.

### siftDown (bubble down): used after removing the root

Replace the root with the last element, then push it down past its *smaller* child.

```java
private void siftDown(int i) {
    while (true) {
        int left = 2 * i + 1, right = 2 * i + 2, smallest = i;
        if (left  < size && heap[left]  < heap[smallest]) smallest = left;
        if (right < size && heap[right] < heap[smallest]) smallest = right;
        if (smallest == i) break;            // heap property restored
        swap(i, smallest);
        i = smallest;
    }
}
```

**Why the *smaller* child?** If you swapped with the larger child, the new parent would be bigger than its remaining sibling, and you'd break the property immediately. Picking the smaller child guarantees both children end up ≥ the new parent. Interviewers ask this to check that you understand rather than memorised.

## Build it from scratch

**Approach.** Array storage, `siftUp` on insert, `siftDown` on extract. Then add `heapify` for O(n) bulk construction.

```java
public class MinHeap {
    private int[] heap;
    private int size;

    public MinHeap() { this(16); }

    public MinHeap(int capacity) { heap = new int[Math.max(1, capacity)]; }

    /** O(n) bulk build — NOT n inserts. */
    public MinHeap(int[] input) {
        heap = Arrays.copyOf(input, Math.max(1, input.length));
        size = input.length;
        for (int i = size / 2 - 1; i >= 0; i--) siftDown(i);   // ← the O(n) loop
    }

    public int peek() {
        if (size == 0) throw new NoSuchElementException("heap is empty");
        return heap[0];
    }

    public void offer(int val) {
        if (size == heap.length) heap = Arrays.copyOf(heap, size * 2);
        heap[size] = val;
        siftUp(size);
        size++;
    }

    public int poll() {
        if (size == 0) throw new NoSuchElementException("heap is empty");
        int min = heap[0];
        heap[0] = heap[--size];    // move last element to the root
        siftDown(0);               // restore the property
        return min;
    }

    public int size()        { return size; }
    public boolean isEmpty() { return size == 0; }

    private void siftUp(int i) {
        while (i > 0) {
            int parent = (i - 1) / 2;
            if (heap[i] >= heap[parent]) break;
            swap(i, parent);
            i = parent;
        }
    }

    private void siftDown(int i) {
        while (true) {
            int left = 2 * i + 1, right = 2 * i + 2, smallest = i;
            if (left  < size && heap[left]  < heap[smallest]) smallest = left;
            if (right < size && heap[right] < heap[smallest]) smallest = right;
            if (smallest == i) break;
            swap(i, smallest);
            i = smallest;
        }
    }

    private void swap(int a, int b) { int t = heap[a]; heap[a] = heap[b]; heap[b] = t; }
}
```

### Why `heapify` is O(n) and not O(n log n) ⭐

A favourite follow-up. The argument in interview-length form:

- Start at index `size/2 - 1`, the last non-leaf node. **Leaves are already valid heaps of size 1**, so half the array needs no work at all. That's the first hint that the bound is better than it looks.
- `siftDown(i)` costs at most the **height of the subtree at i**, not the height of the whole tree. Nodes near the bottom (most of them) have tiny subtrees.
- At height `h` there are at most `n / 2^(h+1)` nodes, each costing O(h). The total work:

```
  Σ (h = 0 to log n)  h · n/2^(h+1)   =   (n/2) · Σ h/2^h   ≤   (n/2) · 2   =   O(n)
```

because `Σ h/2^h` converges to 2.

**The one-sentence version:** *"Most nodes are near the leaves, where sifting down is cheap; only the rare nodes near the root cost log n. The sum converges to a constant times n."*

In contrast, building with n successive `offer` calls uses `siftUp`, where **most nodes are near the leaves and sifting up is expensive**: the geometry is inverted, giving O(n log n).

## Java API

Java's heap is `java.util.PriorityQueue`, a **min-heap by default**:

```java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();                          // min-heap (default)
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder()); // max-heap
```

Its comparators, its traps, and when to use a `TreeMap` instead are in [Java's PriorityQueue](lesson:java-priorityqueue).

## Operations and complexity

| Operation | Cost | Note |
|---|---|---|
| `peek` (find min/max) | **O(1)** | it's just index 0 |
| `offer` (insert) | **O(log n)** | sift up |
| `poll` (extract min/max) | **O(log n)** | swap, shrink, sift down |
| build from n elements | **O(n)** | ⭐ not O(n log n): see heapify above |
| search for an arbitrary element | **O(n)** | no ordering to exploit |
| delete an arbitrary element | **O(n)** | O(n) to find + O(log n) to fix |
| heapsort | O(n log n) | in place, not stable |

**"Find min is O(1), but find max is O(n) in a min-heap"**: say this when asked why you'd need two heaps for a median.

## Patterns

How to answer "why a heap?" in an interview:

> *I repeatedly need the extreme element from a set that keeps changing, and I don't need full sorted order.*

**The k-th largest element: a min-heap of size k.** The smallest element in that heap is always the k-th largest overall:

```java
int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();
    for (int num : nums) {
        minHeap.offer(num);
        if (minHeap.size() > k) minHeap.poll();   // evict the smallest once we exceed size k
    }
    return minHeap.peek();
}
```

O(n log k): better than sorting the whole array (O(n log n)) when `k` is small. The full pattern, and the quickselect alternative, are in [top-k and two heaps](lesson:top-k-and-two-heaps).

The other heap patterns: [k-way merge](lesson:k-way-merge) (one candidate per sorted list), [two heaps](lesson:top-k-and-two-heaps) for a running median, [greedy with a heap](lesson:greedy-with-a-heap) for scheduling, and [Dijkstra's shortest paths](lesson:shortest-paths).

### Heapsort (worth knowing, rarely required)

```java
public static void heapSort(int[] a) {
    int n = a.length;
    for (int i = n / 2 - 1; i >= 0; i--) siftDownMax(a, i, n);    // build a MAX-heap, O(n)
    for (int end = n - 1; end > 0; end--) {
        int t = a[0]; a[0] = a[end]; a[end] = t;   // largest goes to its final position
        siftDownMax(a, 0, end);                    // shrink the heap by one
    }
}

private static void siftDownMax(int[] a, int i, int n) {
    while (true) {
        int l = 2*i + 1, r = 2*i + 2, largest = i;
        if (l < n && a[l] > a[largest]) largest = l;
        if (r < n && a[r] > a[largest]) largest = r;
        if (largest == i) break;
        int t = a[i]; a[i] = a[largest]; a[largest] = t;
        i = largest;
    }
}
```

**Use a max-heap to sort ascending**: each extracted maximum is parked at the end of the array, which shrinks the heap and grows the sorted suffix in place.

**Properties:** O(n log n) worst case, *guaranteed* (unlike quicksort's O(n²) worst case), and O(1) extra space, but **not stable**, and poorer cache behaviour than quicksort or merge sort in practice. That's why library sorts use TimSort or introsort, not heapsort.

## Common mistakes

- **Assuming a heap is sorted.** Only the root is guaranteed; iterating a heap's array gives no particular order.
- **Sifting down past the larger child**, which breaks the heap property at once.
- **Building with n inserts** (O(n log n)) when `heapify` builds the same heap in O(n).
- **Mixing up the index formulas.** With 0-based arrays the parent is `(i − 1) / 2` and the children `2i + 1` and `2i + 2`; the 1-based formulas (`i / 2`, `2i`, `2i + 1`) are different.
- **Sorting ascending in place with a min-heap.** Use a max-heap and park each maximum at the end.

## Key takeaways

- A binary heap is a complete tree with a local order: each parent beats its children. It's not sorted.
- The complete shape lets it live in an array: parent `(i − 1) / 2`, children `2i + 1` and `2i + 2`.
- `siftUp` after inserting at the end, `siftDown` past the smaller child after replacing the root: O(log n) each.
- `peek` is O(1); building from n elements with `heapify` is O(n), not O(n log n).
- Use a heap when you need the extreme element repeatedly, but not the full order.

## Knowledge check

```quiz
? Is `[1, 5, 2, 8, 6, 3]` a valid min-heap?
+ Yes: every parent is smaller than its children, even though the array isn't sorted
- No, because the array isn't sorted
! A heap only orders parents against their children.
- No, because 5 is larger than its sibling 2
! Siblings are unordered in a heap.
- Only if it's also a binary search tree
! A heap has a weaker order than a BST.
> Check each parent against its children: 1 ≤ 5, 2; 5 ≤ 8, 6; 2 ≤ 3.

? After removing the root, why does siftDown swap with the smaller child?
+ The smaller child can become the parent of the other child without breaking the heap property
- Because the smaller child is always on the left
! Either child can be the smaller.
- To keep the tree complete
! Completeness comes from moving the last element to the root.
- It doesn't matter which child you pick
! Swapping with the larger child leaves a parent bigger than the other child.
> Both children must end up at least as large as their new parent.

? Why is building a heap with heapify O(n) rather than O(n log n)?
+ Most nodes are near the leaves, where sifting down is cheap; the costs sum to a constant times n
- Because heapify skips half the elements entirely
! Leaves need no work, but that alone doesn't give the bound.
- Because the array is already sorted
! heapify works on any array.
- It isn't; heapify is O(n log n)
! The sum of subtree heights converges to O(n).
> n successive inserts, in contrast, cost O(n log n).

? In a min-heap of n elements, what does finding the maximum cost?
+ O(n): the maximum can be any leaf, and nothing orders the leaves
- O(1), it's the last element of the array
! The last element is just the most recently placed leaf.
- O(log n), by walking down the tree
! There's no path that leads to the maximum.
- O(1), it's always the root's right child
! Children are only ordered against their parent.
> That's why a running median uses a max-heap and a min-heap.
```
