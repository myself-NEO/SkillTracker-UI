## What it is

A **suffix array** lists the starting positions of a string's suffixes in sorted order. Every substring is a prefix of some suffix, so sorting the suffixes puts equal substrings next to each other, and the lengths they share become a single array: the **LCP array** (longest common prefix of each suffix and the one before it).

```text
s = banana
i    sa[i]   suffix     lcp[i]
0    5       a          0
1    3       ana        1        shares "a" with the previous suffix
2    1       anana      3        shares "ana": the longest repeat
3    0       banana     0
4    4       na         0
5    2       nana       2
distinct substrings = 6 * 7 / 2 - (1 + 3 + 0 + 0 + 2) = 21 - 6 = 15
```

## How it works

- **Prefix doubling.** After the round with step k, the suffixes are sorted by their first 2k characters. A suffix's key for the next round is the pair (the rank of its first k characters, the rank of the k after them), and both ranks are already known from the previous round. That's log n rounds of sorting: O(n log² n) with a comparison sort. Radix-sorting the pairs gives O(n log n), and SA-IS gives O(n), which is contest material.
- **Kasai's LCP.** Visit the suffixes in *text* order. From one suffix to the next, the LCP with the sorted predecessor drops by at most 1, so the running match length `h` never restarts from 0: O(n) in total.

## Build it from scratch

```java
// Suffix array by prefix doubling: sort the suffixes by their first 1, 2, 4, 8, ... characters,
// reusing the previous round's ranks as sort keys. O(n log^2 n) with a comparison sort.
static int[] suffixArray(String s) {
    int n = s.length();
    if (n == 0) return new int[0];
    Integer[] sa = new Integer[n];
    int[] rank = new int[n], next = new int[n];
    for (int i = 0; i < n; i++) {
        sa[i] = i;
        rank[i] = s.charAt(i);
    }
    for (int k = 1; ; k <<= 1) {
        final int half = k;
        Comparator<Integer> byPair = (a, b) -> {  // (rank of the first k chars, rank of the next k)
            if (rank[a] != rank[b]) return Integer.compare(rank[a], rank[b]);
            int ra = a + half < n ? rank[a + half] : -1, rb = b + half < n ? rank[b + half] : -1;
            return Integer.compare(ra, rb);       // a suffix that runs out sorts first
        };
        Arrays.sort(sa, byPair);
        next[sa[0]] = 0;
        for (int i = 1; i < n; i++) {
            next[sa[i]] = next[sa[i - 1]] + (byPair.compare(sa[i - 1], sa[i]) < 0 ? 1 : 0);
        }
        System.arraycopy(next, 0, rank, 0, n);
        if (rank[sa[n - 1]] == n - 1) break;         // every rank distinct: the order is final
    }
    int[] result = new int[n];
    for (int i = 0; i < n; i++) result[i] = sa[i];
    return result;
}

// Kasai: lcp[i] = the longest common prefix of the
// suffixes at sa[i - 1] and sa[i] (lcp[0] = 0). O(n).
static int[] lcpArray(String s, int[] sa) {
    int n = s.length();
    int[] rank = new int[n], lcp = new int[n];
    for (int i = 0; i < n; i++) rank[sa[i]] = i;
    for (int i = 0, h = 0; i < n; i++) {    // suffixes in TEXT order: h drops by at most 1 per step
        if (rank[i] == 0) {
            h = 0;
            continue;
        }
        int j = sa[rank[i] - 1];                    // the suffix just before s[i..] in sorted order
        while (i + h < n && j + h < n && s.charAt(i + h) == s.charAt(j + h)) h++;
        lcp[rank[i]] = h;
        if (h > 0) h--;
    }
    return lcp;
}
```

## Java API

The JDK has no suffix array. The code above leans on `Arrays.sort` with a `Comparator<Integer>`, which boxes the indexes: fine for interview-sized inputs (around 10⁵), and the first thing to replace (with a radix sort over `int[]`) when speed matters. Sorting the suffix *strings* directly, `Arrays.sort` over `s.substring(i)`, is O(n² log n) time and O(n²) memory: only for tiny inputs.

## Operations and complexity

| Operation | Time |
|---|---|
| Build, prefix doubling with a comparison sort | O(n log² n) |
| Build, with radix sort, or SA-IS | O(n log n), or O(n) |
| LCP array (Kasai) | O(n) |
| Find a pattern of length m | O(m log n), by binary search over `sa` |
| Distinct substrings, the longest repeat | O(n), once both arrays exist |

## Patterns

### Counting distinct substrings

Each suffix, in sorted order, brings its length in prefixes, minus the LCP it shares with the previous suffix, which were already counted:

```java
// Every substring is a prefix of some suffix. In sorted order, each suffix brings its length
// in prefixes, minus the lcp it shares with the previous suffix (those were already counted).
static long distinctSubstrings(String s) {
    int[] sa = suffixArray(s), lcp = lcpArray(s, sa);
    long n = s.length(), total = n * (n + 1) / 2;
    for (int v : lcp) total -= v;
    return total;
}
```

### The longest repeated substring

Two occurrences of a repeated substring start two suffixes that share it, and the longest shared prefix of any two suffixes is shared by two *neighbours* in sorted order. So the answer is the largest LCP value: Longest Duplicate Substring (LC 1044), deterministically.

```java
static String longestRepeat(String s) {
    int[] sa = suffixArray(s), lcp = lcpArray(s, sa);
    int best = 0, at = 0;
    for (int i = 1; i < lcp.length; i++) {
        if (lcp[i] > best) {
            best = lcp[i];
            at = sa[i];
        }
    }
    return s.substring(at, at + best);
}
```

### More from the same two arrays

- **The longest common substring of A and B:** build the arrays on `A + "#" + B`, and take the largest LCP between neighbouring suffixes that start on different sides of `#`.
- **Pattern search:** the suffixes that start with a pattern form one contiguous block of `sa`, so binary search finds it in O(m log n).

### Choosing a structure

| You need | Use | Where |
|---|---|---|
| prefixes of many words, autocomplete | trie | [tries](lesson:trie-basics) |
| many patterns found in one text | Aho–Corasick | [Aho–Corasick](lesson:autocomplete-and-aho-corasick) |
| all substrings of one string, offline | suffix array + LCP | this lesson |
| substring occurrence counts, online | suffix automaton or suffix tree | name it; rarely coded in interviews |
| comparisons between arbitrary substrings | prefix hashes | [substring hashing](lesson:rabin-karp) |

## Common mistakes

- **Sorting the suffix strings directly**, which is O(n² log n) time and O(n²) memory.
- **Forgetting that a suffix which runs out sorts first** when comparing rank pairs (the `-1` above).
- **Stopping the doubling too early**: only when every rank is distinct is the order final.
- **Mixing up the two rank arrays in Kasai**: `rank[i]` is the sorted position of the suffix starting at i, while `sa[r]` is the start of the suffix in position r.
- **Using a separator that occurs in A or B** for the longest common substring.

## Key takeaways

- A suffix array is the starting positions of the suffixes in sorted order; the LCP array holds what neighbours share.
- Prefix doubling sorts by rank pairs in O(n log² n); Kasai builds the LCP array in O(n).
- Distinct substrings = `n(n + 1)/2 − Σ lcp`; the longest repeat is `max(lcp)`.
- Suffixes starting with a pattern form one block of `sa`: binary search finds it.
- Know when to reach for a trie, Aho–Corasick, prefix hashes or a suffix automaton instead.

## Knowledge check

```quiz
? For s = "banana", what does the LCP array's maximum, 3, tell you?
+ The longest repeated substring has length 3: "ana"
- s has 3 distinct characters
! That's a coincidence; the LCP measures shared prefixes.
- The suffix array has 3 entries
! It has one entry per suffix: 6.
- "banana" has period 3
! Periods come from the prefix function or the Z-function.
> Two neighbouring suffixes, "ana" and "anana", share "ana".

? How many distinct substrings does "banana" have?
+ 15: 6 · 7 / 2 = 21 prefixes of suffixes, minus the LCP sum of 6
- 21
! That counts repeats more than once.
- 6
! That's the number of suffixes.
- 36
! That's n², not a count of substrings.
> Each suffix adds its length minus what it shares with the previous one.

? Why does Kasai's algorithm build the LCP array in O(n)?
+ Visiting suffixes in text order, the match length drops by at most 1 per step, so it never restarts from 0
- Because the suffix array is already sorted
! Sorting alone doesn't bound the comparisons.
- Because it compares only the first character
! It compares as far as the suffixes agree.
- It's O(n log n)
! The amortized argument gives O(n).
> h decreases by at most 1 between consecutive text positions.

? Why is building the suffix array by sorting the suffix strings a bad idea for n = 10⁵?
+ The substrings take O(n²) memory, and each comparison can cost O(n), for O(n² log n) time
- Because Java can't sort strings
! It can; the cost is the problem.
- Because the result would be wrong
! It's correct, just far too slow and large.
- Because the suffixes aren't unique
! All suffixes of a string are distinct.
> Prefix doubling sorts by rank pairs instead.
```
