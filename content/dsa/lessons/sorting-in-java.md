Sorting and binary search belong together: sorting *creates* order, and binary search *exploits* it. This module covers sorting, and the next covers binary search.

## The idea

**Sorting buys structure.** Once data is sorted:
- equal items sit next to each other: grouping, deduplication, counting runs;
- every "pair that sums to x" question becomes [two pointers](lesson:two-pointers);
- every "where would x go?" question becomes [binary search](lesson:binary-search-template);
- interval and scheduling problems become a single sweep (see [interval basics](lesson:interval-basics));
- the k-th smallest is just index `k - 1`.

The price is O(n log n), and for comparison sorts that's a hard floor: there are `n!` possible orders, and each comparison gives one bit of information, so you need `log₂(n!) ≈ n log n` comparisons. Beating it requires *not comparing*: the [linear-time sorts](lesson:linear-time-sorts), which exploit the range of values.

**Binary search exploits monotonic structure.** It doesn't really need a sorted *array*. It needs a question whose answers look like this:

```text
index / value:   0     1     2     3     4     5     6
predicate:      false false false true  true  true  true
                                  ^ binary search finds this boundary in O(log n)
```

## When to use it

- The problem asks about **pairs, triplets or closest sums**, **duplicates**, **groups**, **intervals**, or **the k-th smallest**, and O(n log n) fits the budget.
- The answer doesn't depend on the original order. Subarray and substring problems usually do, so sorting destroys them.
- You need a canonical form, such as a word's sorted letters for anagrams.

The sentence to say in an interview:

> *Sorting costs O(n log n) once, and turns this into a linear scan or two pointers.*

## How it works

Java picks a different algorithm for primitives and for objects:

| Call | Algorithm | Stable? | Complexity |
|---|---|---|---|
| `Arrays.sort(int[])` (any primitive array) | dual-pivot quicksort, with insertion sort for tiny ranges | no (irrelevant for primitives) | O(n log n); modern JDKs fall back to heapsort, so the worst case is too |
| `Arrays.sort(T[])`, `Arrays.sort(T[], cmp)` | **TimSort** (adaptive merge sort) | **yes** | O(n log n) worst, **O(n)** on already sorted input |
| `Collections.sort(list)`, `list.sort(cmp)` | TimSort (copies into an array) | yes | same |
| `Arrays.parallelSort` | parallel merge sort (Fork/Join) | yes for objects | helps beyond roughly 10⁵–10⁶ elements |

**Stability.** A sort is **stable** if equal keys keep their original relative order. That matters whenever records carry more than the key: sort employees by department, and within a department they stay in the order they were in (for example by hire date, if they were sorted by that first). Primitives have no identity beyond their value, so stability is irrelevant for them; for objects it matters, which is why Java uses TimSort there.

## Java template

```java
static void javaSortingApi() {
    int[] nums = { 5, 2, 9, 1 };
    Arrays.sort(nums);                             // [1, 2, 5, 9]  primitives: dual-pivot quicksort

    Integer[] boxed = { 5, 2, 9, 1 };
    Arrays.sort(boxed, Collections.reverseOrder());        // [9, 5, 2, 1]  objects: TimSort, stable

    int[][] intervals = { { 3, 5 }, { 1, 4 }, { 1, 2 } };
    Arrays.sort(intervals, (a, b) -> a[0] != b[0]
            ? Integer.compare(a[0], b[0])
            : Integer.compare(a[1], b[1]));
    // [[1, 2], [1, 4], [3, 5]]  by start, then by end

    List<String> words = new ArrayList<>(List.of("pear", "fig", "apple", "kiwi"));
    words.sort(Comparator.comparingInt(String::length).thenComparing(Comparator.reverseOrder()));
    // [fig, pear, kiwi, apple]  by length, then reverse alphabetical

    int[] descending = Arrays.stream(nums).boxed()
            .sorted(Comparator.reverseOrder())
            .mapToInt(Integer::intValue)
            .toArray();
    // [9, 5, 2, 1]  int[] has no comparator overload:
    // box it, or sort ascending and reverse in place
}
```

## Worked examples

**Sorting an `int[]` in descending order without boxing.** `int[]` has no comparator overload, so sort ascending and reverse in place with two pointers:

```java
Arrays.sort(nums);
for (int l = 0, r = nums.length - 1; l < r; l++, r--) {
    int t = nums[l]; nums[l] = nums[r]; nums[r] = t;
}
```

**Reversing only one key.** `reversed()` applies to the whole chain built so far, so place it right after the key you want reversed:

```java
record Person(String name, int age) { }

// Oldest first; within an age, by name A–Z.
people.sort(Comparator.comparingInt(Person::age).reversed().thenComparing(Person::name));
```

Writing `comparingInt(Person::age).thenComparing(Person::name).reversed()` instead would also put the names in Z–A order.

## Complexity

- Comparison sorts: O(n log n), the lower bound for any algorithm that only compares elements.
- TimSort is O(n) on already sorted input, and fast on input made of a few sorted runs.
- Extra space: about O(log n) for `Arrays.sort(int[])`; up to O(n) for TimSort's merge buffer.

## Variations

- **Sorting by several keys with stable sorts.** Sorting stably by the least significant key first, then by each more significant key in turn, gives the same result as one multi-key comparator. [Radix sort](lesson:linear-time-sorts) is exactly this idea applied to digits. In Java you'd normally just write one comparator with `thenComparing`.
- **Part of an array:** `Arrays.sort(a, from, to)` sorts the range `[from, to)`.
- **Large arrays:** `Arrays.parallelSort` splits the work across cores, and only pays off for large inputs.

## Common mistakes

Comparator rules that cost people points:
1. **Never `(a, b) -> a - b`.** It overflows for large or negative values and returns the wrong sign. Use `Integer.compare(a, b)`, `Comparator.comparingInt(...)` or `Long.compare`.
2. **`reversed()` applies to the whole chain built so far.** `comparing(A).thenComparing(B).reversed()` reverses both keys. To reverse only one, reverse it before chaining, or pass a reversed comparator to that step.
3. **A comparator must be consistent**: transitive, and `compare(a, b) == -compare(b, a)`. TimSort detects violations and throws `IllegalArgumentException: Comparison method violates its general contract!`.
4. **`int[]` has no comparator overload.** Either box it, or sort ascending and reverse in place, which avoids boxing.

## Practice

Sort an Array (LC 912), Valid Anagram (LC 242), Relative Sort Array (LC 1122), Sort Array by Increasing Frequency (LC 1636), Sort Characters By Frequency (LC 451).

## Key takeaways

- Sorting buys structure: neighbours group, pairs become two pointers, lookups become binary search.
- Comparison sorts can't beat O(n log n); only non-comparison sorts can.
- `Arrays.sort` uses dual-pivot quicksort for primitives and stable TimSort for objects.
- Write comparators with `Integer.compare` or `Comparator.comparingInt`, never subtraction.
- `reversed()` reverses the whole chain built so far; `int[]` can't take a comparator.

## Knowledge check

```quiz
? Why can't any comparison sort beat O(n log n) in the worst case?
+ There are n! possible orders and each comparison gives one bit, so about log₂(n!) ≈ n log n comparisons are needed
- Because memory access is O(log n)
! The bound counts comparisons, not memory operations.
- Because Java's sorts are recursive
! The bound holds for any comparison sort, recursive or not.
- It can, with a good pivot
! A good pivot reaches the bound; it can't beat it.
> Counting and radix sorts beat it by not comparing.

? Why does Java use TimSort for `Arrays.sort(Object[])` but quicksort for `int[]`?
+ Objects need a stable sort, since equal keys can still be different records; primitives don't
- Quicksort can't sort objects
! It can; it just isn't stable.
- TimSort is always faster
! For primitives, dual-pivot quicksort is faster.
- Objects can't be compared with <
! They're compared with compareTo or a Comparator; that's not the reason.
> Stability keeps equal records in their previous order.

? What does `Comparator.comparingInt(Person::age).thenComparing(Person::name).reversed()` sort by?
+ Age descending, and within an age, name Z–A: reversed() reverses the whole chain
- Age descending, then name A–Z
! That needs reversed() right after the age key.
- Age ascending, then name Z–A
! reversed() applies to both keys built so far.
- Name first, then age
! The keys keep their order; only the direction flips.
> Reverse a single key before chaining the next one.

? Why is `(a, b) -> a - b` a risky comparator?
+ The subtraction overflows for large values of opposite sign, giving the wrong sign
- It sorts in descending order
! It sorts ascending when there's no overflow.
- It isn't transitive for equal values
! Equal values give 0, which is correct.
- Lambdas are slower than method references
! Speed isn't the issue.
> Use Integer.compare(a, b).
```
