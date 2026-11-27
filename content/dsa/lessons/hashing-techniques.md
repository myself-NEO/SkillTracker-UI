## The idea

Trade O(n) extra space for O(1) average-case lookups. A hash set or map turns the question "does this exist elsewhere in the array?" from an O(n) scan into one lookup, so an O(n²) algorithm becomes O(n) overall.

## When to use it

- **"Have I seen this before?"**: duplicates, cycles, visited states.
- **Complements**: for each `x`, look up `target − x` (Two Sum), or `x − k`.
- **Counting**: frequencies of elements, characters or words; anything about "how many times".
- **Grouping by a computed key**: anagrams (sorted letters), shifted strings, rows with the same pattern.
- **O(1) existence checks inside a loop**, such as walking consecutive numbers.

Reach for something else when you need **order**: a `TreeMap` or `TreeSet` gives sorted keys and floor/ceiling queries in O(log n). When the keys are **small integers or characters**, a plain array (`int[26]`) is faster than any map.

## How it works

A `HashMap` stores entries in an array of buckets: the key's `hashCode()` picks a bucket, and `equals()` finds the key within it. With a good spread of hash codes, `get`, `put` and `contains` are O(1) on average. Two keys must agree on both methods: equal keys must have equal hash codes. Java's `String`, `Integer` and records do this for you. [HashMap internals](/java/hashmap-internals) has the details, including how a resize splits each chain.

The worst case is O(n) per operation, when many keys land in one bucket. Since Java 8, a bucket that grows past 8 entries is turned into a balanced tree, which bounds that worst case at O(log n) for comparable keys. In interview problems you can treat lookups as O(1).

## Java template

```java
// Frequency map
Map<Integer, Integer> count = new HashMap<>();
for (int x : nums) count.merge(x, 1, Integer::sum);

// "Seen before?": add() returns false if the element was already there
Set<Integer> seen = new HashSet<>();
for (int x : nums) {
    if (!seen.add(x)) { /* x is a duplicate */ }
}

// Grouping by a computed key
Map<String, List<String>> groups = new HashMap<>();
for (String s : words) {
    groups.computeIfAbsent(keyOf(s), k -> new ArrayList<>()).add(s);
}
```

## Worked examples

**Two Sum (LC 1).** For each number, look up its complement among the numbers already seen; store each number's index after checking, so an element never pairs with itself.

```java
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> indexOf = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        Integer j = indexOf.get(target - nums[i]);
        if (j != null) return new int[] {j, i};
        indexOf.put(nums[i], i);
    }
    return new int[] {-1, -1};
}
```

**Longest Consecutive Sequence (LC 128).** A `HashSet` gives O(1) existence checks. The trick that makes this O(n) instead of O(n log n) (sorting) is only starting a count from a number that has **no predecessor** in the set. That guarantees each number is visited by exactly one run across the whole algorithm.

```java
public int longestConsecutive(int[] nums) {
    Set<Integer> set = new HashSet<>();
    for (int num : nums) set.add(num);
    int longest = 0;
    for (int num : set) {
        if (!set.contains(num - 1)) {          // only start counting at the beginning of a run
            int length = 1;
            while (set.contains(num + length)) length++;
            longest = Math.max(longest, length);
        }
    }
    return longest;
}
```

**Group Anagrams (LC 49).** Sort each word's characters to get a canonical key; words with the same key are anagrams of each other.

```java
public List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> map = new HashMap<>();
    for (String s : strs) {
        char[] chars = s.toCharArray();
        Arrays.sort(chars);
        map.computeIfAbsent(new String(chars), k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(map.values());
}
```

## Complexity

| Problem | Time | Space |
|---|---|---|
| Two Sum, duplicates, frequency counts | O(n) average | O(n) |
| Longest Consecutive Sequence | O(n) average | O(n) |
| Group Anagrams, sorted keys | O(n · k log k) for n words of length k | O(n · k) |
| Group Anagrams, count keys | O(n · k) | O(n · k) |

## Variations

- **A count key instead of sorting.** For Group Anagrams, build the key from a word's `int[26]` letter counts (for example `Arrays.toString(counts)`): O(k) per word instead of O(k log k).
- **A frequency array instead of a map**, when the alphabet is small and known: see [Arrays & Strings in Java](lesson:arrays-and-strings-in-java).
- **Prefix sums plus a map** count subarrays with a given sum: see [prefix sums](lesson:prefix-sums).
- **Counts inside a window** power the anagram and "at most k distinct" windows: see [sliding window](lesson:sliding-window).
- **Ordered maps.** Use `LinkedHashMap` to keep insertion order (it's also the basis of an LRU cache), and `TreeMap` when you need the nearest key below or above a value.

## Common mistakes

- **Comparing boxed counts with `==`.** `map.get(a) == map.get(b)` compares `Integer` references, which happens to work for values from −128 to 127 (they're cached) and fails above. Use `.equals()` or compare `intValue()`s.
- **Using an array as a key.** `int[]` and `char[]` use identity `hashCode()` and `equals()`, so two arrays with the same contents are different keys. Convert to a `String` or a `List<Integer>` first.
- **Changing a key after inserting it.** A mutable key whose hash code changes is lost in the wrong bucket.
- **Relying on `HashMap` iteration order.** It's unspecified; use `LinkedHashMap` or `TreeMap` when order matters.
- **Modifying a map while iterating over it**, which throws `ConcurrentModificationException`. Iterate over a copy, or use the iterator's `remove()`.

## Practice

Two Sum (LC 1), Contains Duplicate (LC 217), Contains Duplicate II (LC 219), Valid Anagram (LC 242), Group Anagrams (LC 49), Longest Consecutive Sequence (LC 128), Isomorphic Strings (LC 205), Top K Frequent Elements (LC 347).

## Key takeaways

- Hashing buys O(1) average lookups with O(n) memory, turning "search the rest of the array" into one lookup.
- The core moves: seen-before sets, complement lookups, frequency counts, and grouping by a canonical key.
- Keys need consistent `hashCode()` and `equals()`. Arrays don't have them; strings, boxed numbers and records do.
- Compare boxed `Integer`s with `.equals()`, never `==`.
- Use `TreeMap` when you need order, and a plain array when keys are small integers or characters.

## Knowledge check

```quiz
? In Two Sum with a hash map, why store `nums[i]`'s index only after looking up its complement?
+ So an element never pairs with itself, and the earlier index is always the one stored
- Because `put` is slower than `get`
! Both are O(1); the order is about correctness.
- To keep the map sorted
! HashMap isn't sorted at all.
- It doesn't matter; either order works
! Storing first lets target = 2 × nums[i] match nums[i] with itself.
> Look up first, then insert: the map only ever holds earlier elements.

? Longest Consecutive Sequence: why only start counting at numbers with no predecessor in the set?
+ Each run is then walked exactly once, so the total work is O(n)
- To avoid counting negative numbers
! Negative numbers are handled like any others.
- Because a HashSet can't be iterated in order
! The fix isn't about order; it's about not repeating work.
- To find the smallest number first
! Any start of a run will do.
> Starting from the middle of a run would re-walk it many times, which is O(n²) on a long sequence.

? `Map<Character, Integer> a, b` hold letter counts. Why is `a.get('x') == b.get('x')` dangerous?
+ It compares Integer references, which only matches reliably for values from −128 to 127
- Because `get` might return a primitive
! Map values are always objects.
- Because characters can't be keys
! Character keys are fine.
- It's not dangerous; == compares values for Integer
! == compares references for any object.
> Use .equals() or intValue() when comparing boxed numbers.

? You want to group words that are anagrams. What makes a good key?
+ The word's letters sorted, or its letter counts as a string
- The word's `hashCode()`
! Anagrams like "ab" and "ba" have different hash codes.
- The `char[]` of the word
! Arrays use identity equals, so equal contents give different keys.
- The word's length
! Different words of the same length would be grouped together.
> A canonical form is the same for every anagram and different for anything else.
```
