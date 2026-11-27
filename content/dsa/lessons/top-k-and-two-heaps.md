## The idea

Two heap patterns that answer "which elements are best?" without sorting everything:

- **Top-K:** keep only the K best elements seen so far, in a heap whose root is the *worst* of them, so it's the one you compare against and evict.
- **Two heaps:** split the data into a lower half (a max-heap) and an upper half (a min-heap). Their roots meet at the boundary, so the median is always at hand.

## When to use it

**Top-K:** "k largest", "k smallest", "k most frequent", "k closest", "top k", "the k-th largest", especially when the data arrives as a **stream**.

**Two heaps:** "the median of a stream", "balance two halves", "schedule with a budget on both ends".

## How it works

**The counter-intuitive rule; internalise it:**

> To find the **K largest**, use a **MIN-heap of size K**.
> To find the **K smallest**, use a **MAX-heap of size K**.

**Why:** you keep a bag of the best K seen so far. To decide whether a newcomer belongs, you compare it against the **worst** member of the bag and evict that one. In a bag of the K largest, the worst is the smallest, so a min-heap puts it at the root: O(1) to inspect, O(log k) to evict.

**Two heaps** keep two invariants, worth stating out loud:
1. `max(low) ≤ min(high)`: every element of the lower half is at most every element of the upper half;
2. `low.size() == high.size()` or `low.size() == high.size() + 1`.

Then the median is `low`'s root, or the average of both roots.

## Java template

```java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();   // the k largest so far; root = the worst of them
for (int x : stream) {
    minHeap.offer(x);
    if (minHeap.size() > k) minHeap.poll();               // evict the worst
}
// minHeap.peek() is the k-th largest; the heap holds the k largest
```

## Worked examples

### Kth Largest Element in an Array (LC 215)

```java
public int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();   // size capped at k
    for (int num : nums) {
        minHeap.offer(num);
        if (minHeap.size() > k) minHeap.poll();   // evict the smallest
    }
    return minHeap.peek();                        // the kth largest
}
```

**The interview flow for this exact question (it's asked constantly):**
1. "Sorting gives O(n log n): correct, but not optimal."
2. "A min-heap of size k gives O(n log k), and works on a stream."
3. "**Quickselect** gives O(n) on average and O(n²) in the worst case: the best choice if all the data is in memory and I can modify the array." Then offer to code it.

```java
// Quickselect — O(n) average
public int findKthLargestQuickselect(int[] nums, int k) {
    int target = nums.length - k;        // kth largest == index (n-k) when sorted ascending
    int lo = 0, hi = nums.length - 1;
    Random rand = new Random();
    while (lo < hi) {
        int p = lo + rand.nextInt(hi - lo + 1);   // ← randomise to dodge the O(n²) worst case
        swap(nums, p, hi);
        int pivotIdx = partition(nums, lo, hi);
        if (pivotIdx == target) return nums[pivotIdx];
        if (pivotIdx < target) lo = pivotIdx + 1;
        else hi = pivotIdx - 1;
    }
    return nums[lo];
}

private int partition(int[] a, int lo, int hi) {
    int pivot = a[hi], store = lo;
    for (int i = lo; i < hi; i++)
        if (a[i] < pivot) swap(a, i, store++);
    swap(a, store, hi);
    return store;
}

private void swap(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }
```

**The randomised pivot is the whole point.** Without it, a sorted input gives O(n²). Say "a random pivot, or median-of-medians for a deterministic O(n)" and you've covered it. Partitioning is covered in depth in [quicksort and quickselect](lesson:quicksort-and-quickselect).

### Top K Frequent Elements (LC 347)

```java
public int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int n : nums) freq.merge(n, 1, Integer::sum);

    PriorityQueue<Map.Entry<Integer, Integer>> minHeap =
        new PriorityQueue<>(Map.Entry.comparingByValue());   // min by frequency

    for (Map.Entry<Integer, Integer> e : freq.entrySet()) {
        minHeap.offer(e);
        if (minHeap.size() > k) minHeap.poll();
    }

    int[] res = new int[k];
    for (int i = k - 1; i >= 0; i--) res[i] = minHeap.poll().getKey();  // fill backwards for desc
    return res;
}
```

### Find Median from Data Stream (LC 295)

```java
class MedianFinder {
    // lower half, largest at top
    private final PriorityQueue<Integer> low  = new PriorityQueue<>(Comparator.reverseOrder());
    // upper half, smallest at top
    private final PriorityQueue<Integer> high = new PriorityQueue<>();

    public void addNum(int num) {
        low.offer(num);                 // 1. always add to low
        high.offer(low.poll());         // 2. move low's max to high (keeps order correct)
        if (high.size() > low.size())   // 3. rebalance so low.size() >= high.size()
            low.offer(high.poll());
    }

    public double findMedian() {
        if (low.size() > high.size()) return low.peek();
        return (low.peek() + high.peek()) / 2.0;
    }
}
```

**Why the three-step dance:** adding straight to whichever heap is smaller would break the ordering (a huge number could land in `low`). Routing every number *through* `low`, then handing its maximum to `high`, guarantees every element in `low` is ≤ every element in `high`. Step 3 keeps the sizes within 1, so the median is always at the roots.

## Complexity

| Problem | Time | Space |
|---|---|---|
| Top K with a size-k heap | O(n log k) | O(k) |
| Kth largest by quickselect | O(n) average, O(n²) worst | O(1) |
| Top K frequent with buckets | O(n) | O(n) |
| Median from a stream | O(log n) per insert, **O(1)** per query | O(n) |

The heap's O(n log k) beats sorting's O(n log n) when k ≪ n, and crucially it works on a **stream** where n is unbounded.

## Variations

### Top K Frequent in O(n): bucket sort

Frequencies are bounded by `n`, so make `n + 1` buckets indexed by frequency and scan from the top:

```java
public int[] topKFrequentBuckets(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int n : nums) freq.merge(n, 1, Integer::sum);

    List<Integer>[] buckets = new List[nums.length + 1];
    for (Map.Entry<Integer, Integer> e : freq.entrySet()) {
        int f = e.getValue();
        if (buckets[f] == null) buckets[f] = new ArrayList<>();
        buckets[f].add(e.getKey());
    }

    int[] res = new int[k];
    int idx = 0;
    for (int f = buckets.length - 1; f >= 1 && idx < k; f--) {
        if (buckets[f] == null) continue;
        for (int val : buckets[f]) {
            res[idx++] = val;
            if (idx == k) break;
        }
    }
    return res;
}
```

**"When the range of the key is bounded, bucket it instead of sorting it"** is a transferable idea: it's the same reasoning behind [counting sort and radix sort](lesson:linear-time-sorts).

### K Closest Points to Origin (LC 973)

```java
public int[][] kClosest(int[][] points, int k) {
    // MAX-heap by squared distance, capped at k → we evict the farthest
    PriorityQueue<int[]> maxHeap = new PriorityQueue<>(
        (a, b) -> Long.compare(dist(b), dist(a)));

    for (int[] p : points) {
        maxHeap.offer(p);
        if (maxHeap.size() > k) maxHeap.poll();
    }
    return maxHeap.toArray(new int[0][]);
}

private long dist(int[] p) { return (long) p[0] * p[0] + (long) p[1] * p[1]; }
```

**Two details worth points:** skip `Math.sqrt` (it's monotonic, so squared distances sort identically and avoid floating point), and cast to `long` before squaring to avoid `int` overflow when coordinates are large.

### Sliding Window Median, and more two-heap problems

**The median of a sliding window (LC 480)** needs arbitrary deletion, which is O(n) in a `PriorityQueue`. Two answers: **lazy deletion** (a `HashMap` of pending removals, purged whenever an expired element surfaces at a root) or **two `TreeMap`s** (exact O(log n) removal). Naming lazy deletion here is a strong signal.

**The same pattern** appears in IPO (LC 502: a max-heap of affordable profits plus a min-heap of capital requirements) and Finding MK Average.

## Common mistakes

- **A max-heap for "k largest"**: it grows to n elements instead of staying at k, losing the O(n log k) bound.
- **A subtracting comparator** such as `(a, b) -> b - a`, which can overflow; use `Integer.compare` or `Long.compare`.
- **`Math.sqrt` and `int` overflow** in distance problems: compare squared distances as `long`s.
- **Quickselect without a random pivot**, which is O(n²) on sorted input.
- **Integer division in the median**: `(a + b) / 2` truncates; divide by `2.0`.
- **Adding to whichever heap is smaller** without routing through the other, which breaks `max(low) ≤ min(high)`.

## Practice

Kth Largest Element in an Array (LC 215), Kth Largest Element in a Stream (LC 703), Top K Frequent Elements (LC 347), Sort Characters By Frequency (LC 451), K Closest Points to Origin (LC 973), Find Median from Data Stream (LC 295), Sliding Window Median (LC 480), IPO (LC 502).

## Key takeaways

- For the K largest, keep a min-heap of size K: its root is the worst of the best, the one to compare against and evict.
- O(n log k) time and O(k) space, and it works on streams; quickselect is O(n) on average for in-memory arrays.
- When the keys are bounded (frequencies ≤ n), bucket them for O(n).
- A running median uses a max-heap for the lower half and a min-heap for the upper half, balanced within one element.
- Route every number through one heap before rebalancing, so the two halves never overlap.

## Knowledge check

```quiz
? To keep the 10 largest numbers of a stream, which heap do you use, and why?
+ A min-heap of size 10, because its root is the smallest of the 10, the one to compare against and evict
- A max-heap of size 10
! Its root is the largest, which you'd never want to evict.
- A max-heap of every number seen
! That's O(n) space and O(n log n) time.
- A min-heap of every number seen
! The heap must be capped at k to stay O(n log k).
> The heap type is the opposite of what you're collecting.

? Quickselect finds the k-th largest in O(n) on average. Why pick the pivot at random?
+ A fixed pivot gives O(n²) on sorted or adversarial input; a random one makes that vanishingly unlikely
- To make the result random
! The result is the same; only the running time changes.
- Because Java's partition needs a random index
! Partitioning works with any pivot.
- To keep the algorithm stable
! Quickselect isn't stable either way.
> Median-of-medians gives a deterministic O(n), at a higher constant.

? In MedianFinder, why does `addNum` push every number into `low` first and then move `low`'s maximum to `high`?
+ It guarantees every element of `low` is at most every element of `high`, wherever the number belongs
- Because `low` must always be larger
! The sizes are fixed by step 3, not step 1.
- To sort both heaps
! Heaps stay partially ordered.
- It's only a style choice
! Adding directly to the smaller heap can break the ordering.
> Step 3 then rebalances the sizes to within one.

? K Closest Points: why compare squared distances as `long` instead of calling `Math.sqrt`?
+ Squaring preserves the order, avoids floating point, and long avoids int overflow for large coordinates
- Because `Math.sqrt` is not allowed in Java comparators
! It's allowed; it's just unnecessary and imprecise.
- Because squared distances are always smaller
! They're larger; what matters is that the order is the same.
- To make the heap a max-heap
! The comparator's argument order does that.
> x² + y² overflows an int once both coordinates pass about 32,768.
```
