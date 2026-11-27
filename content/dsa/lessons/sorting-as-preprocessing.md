## The idea

Many "hard-looking" problems are easy once the input is sorted: sort first (O(n log n)), and the rest becomes a linear scan, two pointers, a sweep or a greedy match. Sometimes the work is in choosing the right **order**: a custom comparator that encodes exactly what the problem means by "before".

## When to use it

Recognise these "sort first" signals:
- **pairs, triplets, closest sum** → sort, then [two pointers](lesson:two-pointers) (3Sum, 3Sum Closest);
- **intervals, meetings, overlaps** → sort by start or end, then sweep (see [interval basics](lesson:interval-basics));
- **anagrams, grouping by canonical form** → sort each word as its key;
- **minimise the maximum difference / assign in order** → sort both sides, then match greedily;
- **dedupe without extra memory** → sort, then skip equal neighbours.

Don't sort when the answer depends on the **original order**, as in subarray and substring problems.

## How it works

Sorting turns relations between arbitrary pairs into relations between **neighbours**: equal items become adjacent, overlapping intervals become consecutive, and "the closest value" is next door. A single pass can then compare each item with the previous one, or with the last item kept.

When the natural order isn't the one the problem needs, write a comparator for it. A comparator must be **transitive** for the sort to be valid; if it isn't, Java's TimSort may throw `IllegalArgumentException`.

## Java template

```java
Arrays.sort(items, comparator);            // O(n log n): the order the problem needs
List<Item> result = new ArrayList<>();
for (Item item : items) {                  // one pass: compare each item with the last one kept
    if (result.isEmpty() || /* item doesn't interact with the last kept item */) result.add(item);
    else { /* combine item into the last kept item */ }
}
```

## Worked examples

### Merge Intervals (LC 56)

Sort by start time; then a linear scan merges any interval whose start is ≤ the end of the current merged interval.

```java
public int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    List<int[]> result = new ArrayList<>();
    for (int[] interval : intervals) {
        if (result.isEmpty() || result.get(result.size() - 1)[1] < interval[0]) {
            result.add(interval);
        } else {
            result.get(result.size() - 1)[1] = Math.max(result.get(result.size() - 1)[1], interval[1]);
        }
    }
    return result.toArray(new int[result.size()][]);
}
```

### Largest Number (LC 179): a custom order

Arrange numbers to form the largest concatenation. Neither numeric order nor string order works (`[3, 30]` must give `"330"`). Compare by **which concatenation is bigger**:

```java
// LC 179: arrange numbers to form the largest number. Order a before b if a+b > b+a as strings.
public String largestNumber(int[] nums) {
    String[] s = Arrays.stream(nums).mapToObj(String::valueOf).toArray(String[]::new);
    Arrays.sort(s, (a, b) -> (b + a).compareTo(a + b));
    if (s[0].equals("0")) return "0";                // all zeros: "000" -> "0"
    return String.join("", s);
}
```

This comparator is transitive, which can be proved by treating the strings as numbers in base 10, so it's a valid sort order. Mention the all-zeros case: `[0, 0]` must return `"0"`, not `"00"`.

## Complexity

O(n log n) for the sort, plus O(n) for the scan. For Largest Number each comparison builds strings of length up to 2L, so the sort is O(n log n · L) for numbers of L digits.

## Variations

### Counting instead of a comparator

**Custom Sort String (LC 791):** order characters by a given ranking. With a small alphabet, counting beats a comparator, at O(n):

```java
// LC 791: reorder s so that characters follow 'order'; others anywhere. Counting, O(n).
public String customSortString(String order, String s) {
    int[] count = new int[26];
    for (char ch : s.toCharArray()) count[ch - 'a']++;
    StringBuilder out = new StringBuilder();
    for (char ch : order.toCharArray()) {            // the custom order first ...
        for (; count[ch - 'a'] > 0; count[ch - 'a']--) out.append(ch);
    }
    for (int c = 0; c < 26; c++) {                   // ... then everything else
        for (; count[c] > 0; count[c]--) out.append((char) ('a' + c));
    }
    return out.toString();
}
```

### Sorting by counting: H-Index (LC 274)

The largest `h` such that `h` papers have at least `h` citations each. Sort descending and scan, or, since `h ≤ n`, use counting sort for O(n):

```java
// LC 274: the largest h such that h papers have at least h citations. Counting sort, O(n).
public int hIndex(int[] citations) {
    int n = citations.length;
    int[] count = new int[n + 1];                    // counts above n are capped: h can't exceed n
    for (int c : citations) count[Math.min(c, n)]++;
    int papers = 0;
    for (int h = n; h >= 0; h--) {
        papers += count[h];                          // papers with at least h citations
        if (papers >= h) return h;
    }
    return 0;
}
```

### Partitioning instead of sorting

When only *part* of the order matters, such as three colours or the k smallest elements, a partition does the job in O(n) without a full sort: see [quicksort and quickselect](lesson:quicksort-and-quickselect).

## Common mistakes

- **Subtracting comparators** such as `(a, b) -> a[0] - b[0]`, which overflow for large values; use `Integer.compare`.
- **A non-transitive comparator**, which makes the sort's result undefined (and may throw).
- **Sorting when the original order matters**, as in subarray problems.
- **Missing the edge cases a custom order creates**, such as all zeros in Largest Number.
- **Sorting inside a loop** when one sort before the loop would do.

## Practice

Merge Intervals (LC 56), Insert Interval (LC 57), Non-overlapping Intervals (LC 435), Largest Number (LC 179), Custom Sort String (LC 791), H-Index (LC 274), 3Sum (LC 15).

## Key takeaways

- Sorting first turns pair, group and interval problems into neighbour comparisons: O(n log n) plus a scan.
- Choose the order the problem needs; a custom comparator must be transitive.
- Write comparators with `Integer.compare`, not subtraction.
- With small alphabets or bounded values, counting replaces the comparator and gives O(n).
- If only part of the order matters, partition instead of sorting.

## Knowledge check

```quiz
? Why does Merge Intervals sort by start time first?
+ Then any interval that overlaps the current merged interval comes right after it, so one pass merges everything
- To find the longest interval
! Length isn't what the sort exposes.
- Because intervals must be merged in order of their end times
! Sorting by start is what makes overlaps adjacent.
- It doesn't need to sort
! Without sorting, overlapping intervals can be far apart.
> After the sort, each interval only needs comparing with the last merged one.

? Largest Number sorts strings with `(a, b) -> (b + a).compareTo(a + b)`. Why not plain string order?
+ String order puts "30" before "3", but "330" beats "303": the right order depends on the concatenation
- Plain string order is descending
! The direction isn't the problem; the comparison is.
- Because the inputs are integers
! They're converted to strings either way.
- Because string comparison is slow
! Speed isn't the issue.
> Comparing a + b with b + a captures which order gives the bigger number.

? What should Largest Number return for [0, 0, 0]?
+ "0"
- "000"
! Leading zeros make "000" an invalid representation.
- An empty string
! The answer is the number zero.
- null
! There's always an answer.
> If the largest element sorts first and is "0", every element is "0".

? When is sorting the wrong first step?
+ When the answer depends on the original order, as with subarrays or substrings
- When the array has duplicates
! Duplicates are often easier after sorting.
- When the array is small
! Small arrays sort cheaply.
- When the values are negative
! Negative values sort like any others.
> Sorting destroys contiguity and positions.
```
