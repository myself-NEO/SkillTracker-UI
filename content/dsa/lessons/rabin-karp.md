## The idea

Read a window of m characters as a number in base `B`, modulo a large prime: its **hash**. Sliding the window one step is O(1): remove the leaving character's term, multiply by `B`, and add the new character. Compare the characters themselves only when the hashes agree.

```text
hash("abc") = a*B^2 + b*B + c
slide to "bcd":  (hash - a*B^2) * B + d  =  b*B^2 + c*B + d
```

## When to use it

- **Many patterns of the same length** in one text: put their hashes in a set.
- **Repeated fixed-length windows**, such as Repeated DNA Sequences (LC 187).
- **Comparing many substrings** of one string: prefix hashes give any substring's hash in O(1).
- **Binary search over a length** with an O(n) check: the longest duplicate substring (LC 1044).
- **2D matching**: hash each row, then hash the column of row hashes.

For a single pattern, [KMP](lesson:kmp) is deterministic and just as fast.

## How it works

- **Always verify on a hash match** (`regionMatches`). Then the algorithm is never wrong, only occasionally slower: a Las Vegas algorithm. Skipping the check makes it Monte Carlo, which is acceptable only with a strong hash (two moduli, below).
- **O(n + m) expected.** An adversary who knows a fixed base can force collisions, so contest code picks a random base at startup.
- **Keep the numbers in range.** With M ≈ 10⁹ and B = 131, every intermediate product fits in a `long`. Subtraction can go negative, and Java's `%` keeps the sign, so add M back, or use `Math.floorMod`.

## Java template

```java
static final long MOD = 1_000_000_007L, BASE = 131;

// Rabin-Karp: slide a window hash along the text; compare characters only when the hashes agree.
static List<Integer> rabinKarp(String text, String pattern) {
    int n = text.length(), m = pattern.length();
    List<Integer> matches = new ArrayList<>();
    if (m == 0 || m > n) return matches;
    long highPow = 1;                       // BASE^(m-1): the weight of the char leaving the window
    for (int i = 1; i < m; i++) highPow = highPow * BASE % MOD;
    long target = 0, window = 0;
    for (int i = 0; i < m; i++) {
        target = (target * BASE + pattern.charAt(i)) % MOD;
        window = (window * BASE + text.charAt(i)) % MOD;
    }
    for (int i = 0; ; i++) {
        // equal hashes don't prove equal strings: check the characters
        if (window == target && text.regionMatches(i, pattern, 0, m)) matches.add(i);
        if (i + m == n) break;
        window = (window - text.charAt(i) * highPow % MOD + MOD) % MOD;    // remove text[i]
        window = (window * BASE + text.charAt(i + m)) % MOD;              // append text[i + m]
    }
    return matches;
}
```

## Worked examples

### Repeated DNA Sequences (LC 187): a hash with no collisions

When the alphabet is tiny and the window short, the window can be its own hash, with no collisions at all:

```java
// LC 187 Repeated DNA Sequences: a rolling "hash" with NO collisions.
// 2 bits per letter, so a window of 10 letters is a 20-bit int.
public List<String> findRepeatedDnaSequences(String s) {
    int[] code = new int[128];                   // 'A' = 0
    code['C'] = 1;
    code['G'] = 2;
    code['T'] = 3;
    Set<Integer> seen = new HashSet<>(), reported = new HashSet<>();
    List<String> result = new ArrayList<>();
    int window = 0, mask = (1 << 20) - 1;
    for (int i = 0; i < s.length(); i++) {
        window = ((window << 2) | code[s.charAt(i)]) & mask;   // shift in 2 bits, drop the oldest 2
        if (i >= 9 && !seen.add(window) && reported.add(window)) {  // seen before, not yet reported
            result.add(s.substring(i - 9, i + 1));
        }
    }
    return result;
}
```

With 2 bits per letter, a `long` holds a window of up to 32 letters exactly. Packing values into bits like this is the same move as a [bitmask](lesson:bit-patterns) standing for a set.

### Substring hashing

Store the hash of every prefix, and the hash of any substring follows in O(1):

```text
h[i] = hash of s[0, i)
hash(s[l, r)) = h[r] - h[l] * B^(r - l)      (mod M)
```

```java
// Prefix hashes: after O(n) setup, the hash of ANY substring costs O(1).
// Two independent moduli make an accidental collision roughly a 1-in-10^18 event.
class StringHash {
    private static final long M1 = 1_000_000_007L, M2 = 998_244_353L, B = 131;
    private final long[] h1, h2, p1, p2;

    StringHash(String s) {
        int n = s.length();
        h1 = new long[n + 1];
        h2 = new long[n + 1];
        p1 = new long[n + 1];
        p2 = new long[n + 1];
        p1[0] = 1;
        p2[0] = 1;
        for (int i = 0; i < n; i++) {
            h1[i + 1] = (h1[i] * B + s.charAt(i)) % M1;     // h[i] = hash of s[0, i)
            h2[i + 1] = (h2[i] * B + s.charAt(i)) % M2;
            p1[i + 1] = p1[i] * B % M1;
            p2[i + 1] = p2[i] * B % M2;
        }
    }

    // The hash of s[l, r): h[r] - h[l] * B^(r - l), for both moduli, packed into one long.
    long get(int l, int r) {
        long a = Math.floorMod(h1[r] - h1[l] * p1[r - l], M1);
        long b = Math.floorMod(h2[r] - h2[l] * p2[r - l], M2);
        return a << 32 | b;
    }
}
```

- O(n) setup, then O(1) to compare any two substrings.
- **One modulus isn't enough at scale.** With 10⁵ windows there are about 5 × 10⁹ pairs, so with M ≈ 10⁹ you should *expect* a few collisions (the birthday bound). Two independent moduli, or a single modulus near 2⁶¹, make that negligible.
- Subtraction can go negative: wrap it with `Math.floorMod`.

### Longest Duplicate Substring (LC 1044): binary search plus hashing

```java
// LC 1044 Longest Duplicate Substring. If some length L repeats, so does L - 1 (drop a character),
// so binary search for the first length that does NOT repeat. Each check hashes every window: O(n).
public String longestDupSubstring(String s) {
    StringHash hash = new StringHash(s);
    int lo = 1, hi = s.length();                // length n never repeats, so the search always ends
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (findRepeat(s, hash, mid) < 0) hi = mid;
        else lo = mid + 1;
    }
    int len = lo - 1;                            // the longest length that does repeat
    if (len == 0) return "";
    int start = findRepeat(s, hash, len);
    return s.substring(start, start + len);
}

// The start of a window of this length that appeared
// earlier, or -1. Equal hashes are double-checked.
private int findRepeat(String s, StringHash hash, int len) {
    Map<Long, Integer> firstStart = new HashMap<>();
    for (int i = 0; i + len <= s.length(); i++) {
        Integer j = firstStart.putIfAbsent(hash.get(i, i + len), i);
        if (j != null && s.regionMatches(i, s, j, len)) return i;
    }
    return -1;
}
```

- **Why binary search works:** if a substring of length L appears twice, dropping its last character gives a substring of length L − 1 that also appears twice. So "has a repeat of length L" is monotone, and the first length *without* a repeat is found with the standard [binary search on the answer](lesson:binary-search-on-the-answer).
- A [suffix array](lesson:suffix-arrays) gives the same answer deterministically: the maximum LCP value.

## Complexity

| Use | Time |
|---|---|
| Rabin–Karp search | O(n + m) expected; O(n · m) if every window collided |
| Prefix hashes | O(n) setup, O(1) per substring hash |
| Longest duplicate substring | O(n log n) expected |

## Variations

- **Palindromes in O(1):** with a second hash table built on reverse(s), you can test whether any substring is a palindrome in O(1).
- **The longest common prefix of two suffixes:** binary search on the length, comparing hashes: O(log n).
- **The same pattern elsewhere:** "binary search on the length, plus an O(n) hash check" solves Longest Repeating Substring (LC 1062), Longest Common Subpath (LC 1923), and the longest common substring of two strings. Distinct Echo Substrings (LC 1316) enumerates the lengths and compares halves with hashes.
- **A 61-bit modulus:** one modulus near 2⁶¹ is as strong as two, but products overflow 64 bits, so multiply with `Math.multiplyHigh` or 128-bit tricks.

## Common mistakes

- **Not verifying on a hash match** when a wrong answer is unacceptable.
- **One small modulus over many windows**: with 10⁵ windows and M ≈ 10⁹, expect collisions.
- **Negative values after subtraction**: Java's `%` keeps the sign; use `Math.floorMod`, or add M before taking the remainder.
- **Recomputing each window's hash from scratch**: O(n · m), the very thing rolling avoids.
- **Forgetting that `highPow` is B^(m−1)**, not B^m: the leaving character has weight B^(m−1).

## Practice

Repeated DNA Sequences (LC 187), Find the Index of the First Occurrence in a String (LC 28) with Rabin–Karp, Longest Duplicate Substring (LC 1044), Longest Repeating Substring (LC 1062), Distinct Echo Substrings (LC 1316), Longest Common Subpath (LC 1923).

## Key takeaways

- A rolling hash reads a window as a base-B number mod M, and slides it in O(1).
- Verify the characters on a hash match: then Rabin–Karp is never wrong, only occasionally slower.
- Prefix hashes give any substring's hash in O(1): `h[r] − h[l] · B^(r − l)`.
- Use two moduli (or one near 2⁶¹) when there are many comparisons, and `Math.floorMod` after subtracting.
- "Binary search on the length plus a hash check" finds the longest repeated substring in O(n log n).

## Knowledge check

```quiz
? Why does Rabin–Karp compare the characters when two hashes are equal?
+ Different strings can share a hash; checking makes the answer always correct, at worst a little slower
- Because the hash only covers the first character
! It covers the whole window.
- To compute the next window's hash
! The rolling update doesn't need the comparison.
- It doesn't need to; equal hashes mean equal strings
! Hashes can collide.
> That makes it a Las Vegas algorithm.

? You compare 10⁵ windows using a single modulus near 10⁹. What should you expect?
+ A few collisions: about 5 × 10⁹ pairs share only 10⁹ possible values
- No collisions: 10⁵ is far less than 10⁹
! The birthday bound counts pairs, not windows.
- Every window collides
! Most pairs still differ.
- An overflow error
! The values fit in a long.
> Two moduli, or one near 2⁶¹, make collisions negligible.

? Why can Longest Duplicate Substring binary-search on the length?
+ If a length L repeats, dropping a character shows that L − 1 repeats too, so "has a repeat" is monotone
- Because the string is sorted
! The string isn't sorted.
- Because hashes are sorted
! Hash values have no useful order.
- Because every length repeats
! Length n never repeats.
> Binary search for the first length that doesn't repeat.

? Why does Repeated DNA Sequences never need to verify a match?
+ 2 bits per letter make a 10-letter window an exact 20-bit number: different windows always get different values
- Because DNA strings are short
! The input can be long; the windows are short.
- Because it uses a HashSet
! A set of hashes would still need verifying if hashes could collide.
- It does verify, with substring
! substring only builds the output.
> When the encoding is exact, the "hash" is the window itself.
```
