## What it is

`java.util.PriorityQueue` is Java's binary heap: an unbounded, array-backed **min-heap** that orders its elements by their natural order or by a `Comparator` you supply. Its head (`peek`, `poll`) is always the *least* element by that order.

It's **not thread-safe**; the concurrent version is `PriorityBlockingQueue`.

## How it works

Underneath is the array heap from [heap basics](lesson:heap-basics): `offer` sifts up, `poll` moves the last element to the root and sifts down. The only addition is that "smaller" is decided by `compareTo` or your `Comparator`, which is how one class serves as a min-heap, a max-heap, or a heap of objects ordered by any field.

Three consequences of that design shape most of the traps below:
- **Iteration gives the array order, not sorted order.** Only `poll()` hands elements out in order.
- **There's no `decreaseKey`.** The heap can't find an element without scanning, so `remove(Object)` is O(n).
- **The order is fixed at insertion time.** If an element's fields change while it's inside, the heap doesn't know.

## Build it from scratch

A `PriorityQueue` is the integer heap from [heap basics](lesson:heap-basics), generalised with a `Comparator`. Every `<` becomes `cmp.compare(a, b) < 0`:

```java
class Heap<T> {
    private final List<T> items = new ArrayList<>();
    private final Comparator<? super T> cmp;

    Heap(Comparator<? super T> cmp) { this.cmp = cmp; }

    void offer(T x) {
        items.add(x);
        int i = items.size() - 1;
        while (i > 0) {                                   // sift up
            int parent = (i - 1) / 2;
            if (cmp.compare(items.get(i), items.get(parent)) >= 0) break;
            Collections.swap(items, i, parent);
            i = parent;
        }
    }

    T poll() {                                            // assumes the heap isn't empty
        T top = items.get(0);
        T last = items.remove(items.size() - 1);
        if (!items.isEmpty()) {
            items.set(0, last);
            int i = 0;
            while (true) {                                // sift down past the smaller child
                int l = 2 * i + 1, r = l + 1, best = i;
                if (l < items.size() && cmp.compare(items.get(l), items.get(best)) < 0) best = l;
                if (r < items.size() && cmp.compare(items.get(r), items.get(best)) < 0) best = r;
                if (best == i) break;
                Collections.swap(items, i, best);
                i = best;
            }
        }
        return top;
    }
}
```

`new Heap<Integer>(Comparator.reverseOrder())` is a max-heap; `new Heap<int[]>((a, b) -> Integer.compare(a[1], b[1]))` orders arrays by their second field.

## Java API

```java
// Min-heap (DEFAULT in Java — remember this, it trips people constantly)
PriorityQueue<Integer> minHeap = new PriorityQueue<>();

// Max-heap
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
PriorityQueue<Integer> maxHeap2 = new PriorityQueue<>((a, b) -> b - a);    // ⚠ overflow risk

// Custom object by field
PriorityQueue<int[]> byCost = new PriorityQueue<>((a, b) -> Integer.compare(a[1], b[1]));

// Multi-key: by frequency ascending, tie-break alphabetically
PriorityQueue<String> pq = new PriorityQueue<>(
    Comparator.<String>comparingInt(freq::get).thenComparing(Comparator.naturalOrder()));

// O(n) bulk build from a collection
PriorityQueue<Integer> h = new PriorityQueue<>(listOfNumbers);

minHeap.offer(5);      // O(log n)
minHeap.peek();        // O(1), null if empty
minHeap.poll();        // O(log n), null if empty
minHeap.size();
minHeap.remove(x);     // O(n) — scans to find x, then sifts
```

## Operations and complexity

| Operation | Cost |
|---|---|
| `offer`, `poll` | O(log n) |
| `peek`, `size`, `isEmpty` | O(1) |
| `remove(Object)`, `contains` | O(n) |
| `new PriorityQueue<>(collection)` | O(n) |
| Iterating, `toString` | O(n), in array order, not sorted |

## Patterns

### `PriorityQueue` vs `TreeMap`/`TreeSet`

| | `PriorityQueue` | `TreeMap`/`TreeSet` |
|---|---|---|
| min/max | O(1) `peek`, of the min only | O(log n) `firstKey()` **and** `lastKey()` |
| insert / delete-min | O(log n) | O(log n) |
| delete arbitrary | O(n) | **O(log n)** |
| find/contains | O(n) | **O(log n)** |
| range queries (`floor`, `ceiling`) | ✗ | **✓** |
| duplicates | ✓ | `TreeSet` ✗ (use `TreeMap<K, count>`) |
| constant factor | **lower** | higher |

**Rule:** if you only ever remove the extreme, use a heap. The moment you need to remove *arbitrary* elements or query ranges, switch to `TreeMap`. This comes up in sliding-window median and calendar-booking problems.

### Updating priorities without `decreaseKey`

- **Lazy deletion:** push the updated entry as a *new* element, and skip stale entries when polling (check them against a `dist[]` or `visited[]` array). This is what you do in [Dijkstra](lesson:shortest-paths).
- **An index map:** keep your own `HashMap<element, index>` inside a custom heap so you can sift a specific position. That's a true decrease-key, which keeps one entry per node; mention it if you're asked to bound the heap's size.

## Common mistakes

The five traps:

1. **`PriorityQueue` is a MIN-heap by default.** Java's default is the *opposite* of C++'s `priority_queue`. If your "top K largest" answer is wrong, check this first.
2. **`(a, b) -> b - a` overflows.** With `a = -2_000_000_000` and `b = 2_000_000_000` the subtraction wraps, and your comparator returns the wrong sign, silently corrupting the heap. **Always use `Integer.compare(b, a)`** or `Comparator.reverseOrder()`. This is a real interview red flag.
3. **Iteration order is unspecified.** `for (int x : pq)` and `pq.toString()` give you the *array* order, not sorted order. To drain in order you must `poll()` repeatedly. Printing a priority queue to debug and concluding it's broken is a rite of passage.
4. **`remove(Object)` is O(n), and there's no `decreaseKey`.** Use lazy deletion or an index map (see above); calling `remove` in a loop makes the whole thing O(n²).
5. **Mutating an object after inserting it breaks the heap.** The heap ordered it by the old value and has no idea the field changed. Remove it, change it, re-insert it.

## Key takeaways

- `PriorityQueue` is an array-backed binary min-heap; pass `Comparator.reverseOrder()` for a max-heap.
- Write comparators with `Integer.compare`, never subtraction, which can overflow.
- Only `poll()` gives elements in order; iteration and `toString` show the array.
- `remove(Object)` and `contains` are O(n), and there's no decrease-key: use lazy deletion.
- Use a `TreeMap` or `TreeSet` when you need arbitrary removal or range queries.

## Knowledge check

```quiz
? You put 5, 1 and 3 into `new PriorityQueue<Integer>()`. What does `poll()` return first?
+ 1, because Java's PriorityQueue is a min-heap by default
- 5, because PriorityQueue is a max-heap by default
! That's C++'s default, not Java's.
- 5, because it was inserted first
! Insertion order doesn't decide; priority does.
- 3, the middle value
! The head is the least element.
> Pass Comparator.reverseOrder() for a max-heap.

? Why is `(a, b) -> b - a` a dangerous comparator?
+ The subtraction can overflow for large values of opposite sign and return the wrong sign
- It sorts in ascending order
! It's meant to give descending order, and it does when there's no overflow.
- Lambdas can't be used as comparators
! They can; the problem is the arithmetic.
- It's slower than Integer.compare
! Speed isn't the issue; correctness is.
> Integer.compare(b, a) never overflows.

? You print a PriorityQueue and the numbers aren't sorted. What's going on?
+ toString shows the internal array order; only repeated poll() gives sorted order
- The heap is corrupted
! A valid heap isn't sorted either.
- The comparator was ignored
! The comparator is used, but only the head is guaranteed.
- PriorityQueue sorts lazily on the first poll
! It never sorts the whole array.
> A heap guarantees only that the root is the least element.

? A problem needs the minimum, the maximum, and removal of arbitrary elements, each in O(log n). Which structure fits?
+ A TreeMap (or TreeSet), which supports first, last and arbitrary removal in O(log n)
- A single PriorityQueue
! Removing an arbitrary element is O(n), and the maximum isn't at hand.
- Two PriorityQueues without any extra bookkeeping
! Arbitrary removal would still be O(n).
- A HashMap
! A HashMap has no order at all.
> Heaps are for removing the extreme only.
```
