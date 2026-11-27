## The idea

[Expanding around each center](lesson:palindromes) compares characters it has already compared. **Manacher's algorithm** removes that waste. Inside the palindrome that reaches furthest right, the text is mirrored, so a new center can start from its mirror's answer and only extend past the right edge. That finds the longest palindrome at **every** center in O(n).

**Palindrome partitioning** asks for the fewest cuts that leave every piece a palindrome. Center expansion finds each palindrome, and a small DP over where the pieces end turns them into cuts.

## When to use it

- n up to 10⁵–10⁶, where O(n²) center expansion is too slow: the longest palindromic substring, counting palindromes, or the longest palindrome around every position (LC 1960).
- "The fewest cuts into palindromes" (LC 132), or whether a string splits into a given number of palindromes (LC 1745).
- In interviews: know center expansion cold, and be able to explain Manacher's mirror. Few interviewers expect Manacher written from memory.

## How it works

- **The separators.** Interleave `#` between the characters: `"abba"` becomes `"#a#b#b#a#"`. Every palindrome in this string `t` is odd-length, centered on a single position, and its radius in `t` equals its length in s. The separator may even occur in s: positions compared with each other always have the same parity, so a separator is only ever compared with a separator.
- **The mirror.** Keep the palindrome `[.., right]` that reaches furthest right, with its center. Position i mirrors position `2·center − i`, so it starts with that radius, capped at the right edge, and only extends past `right`.
- **Why it's linear.** `right` only moves right, so all the extending together costs O(n): the same idea as the [Z-function's](lesson:z-function) box.

```text
s         a   b   a   a   b   a
t        # a # b # a # a # b # a #
radius   0 1 0 3 0 1 6 1 0 3 0 1 0       radius 6 at the middle '#': "abaaba"
```

## Java template

```java
// Manacher: the longest palindrome at EVERY center in O(n). Interleave
// separators, "abba" -> "#a#b#b#a#", so that every palindrome has odd
// length. radius[i] is then the length of that palindrome in s.
static int[] manacher(String s) {
    int n = 2 * s.length() + 1;
    char[] t = new char[n];
    for (int i = 0; i < n; i++) t[i] = (i % 2 == 0) ? '#' : s.charAt(i / 2);
    int[] radius = new int[n];
    // [.., right] is the furthest-reaching one
    for (int i = 0, center = 0, right = 0; i < n; i++) {
        // its mirror's radius
        if (i < right) radius[i] = Math.min(right - i, radius[2 * center - i]);
        while (i - radius[i] - 1 >= 0 && i + radius[i] + 1 < n
                && t[i - radius[i] - 1] == t[i + radius[i] + 1]) {
            radius[i]++;
        }
        if (i + radius[i] > right) {
            center = i;
            right = i + radius[i];
        }
    }
    return radius;
}
```

## Worked examples

### The longest palindrome, and counting palindromes

```java
static String longestPalindromeManacher(String s) {
    int[] radius = manacher(s);
    int best = 0;
    for (int i = 1; i < radius.length; i++) {
        if (radius[i] > radius[best]) best = i;
    }
    int start = (best - radius[best]) / 2;           // map the position in t back to s
    return s.substring(start, start + radius[best]);
}

// A center with radius r holds (r + 1) / 2 palindromes: lengths r, r - 2, ... down to 1 or 2.
static long countPalindromes(String s) {
    long count = 0;
    for (int r : manacher(s)) count += (r + 1) / 2;
    return count;
}
```

### Palindrome Partitioning II (LC 132): the fewest cuts

```java
// LC 132 Palindrome Partitioning II: the fewest cuts so every piece
// is a palindrome, in O(n^2). Expand around every center; each
// palindrome s[lo..hi] found offers pieces[hi + 1] = pieces[lo] + 1.
public int minCut(String s) {
    int n = s.length();
    // pieces[i] = the fewest palindromes that make up s[0, i)
    int[] pieces = new int[n + 1];
    for (int i = 0; i <= n; i++) pieces[i] = i;  // the worst case: single characters
    // lo + hi == center, so pieces[lo] is final
    for (int center = 0; center < 2 * n - 1; center++) {
        int lo = center / 2, hi = lo + center % 2;
        while (lo >= 0 && hi < n && s.charAt(lo) == s.charAt(hi)) {
            pieces[hi + 1] = Math.min(pieces[hi + 1], pieces[lo] + 1);
            lo--;
            hi++;
        }
    }
    return pieces[n] - 1;
}
```

**The order matters:** every palindrome that ends at `lo − 1` has its center before the current one, so `pieces[lo]` is final by the time it's used. That's what the comment `lo + hi == center` refers to.

## Complexity

- **Manacher:** O(n) time and O(n) space.
- **The fewest cuts:** O(n²) time (every palindrome is visited once), O(n) space.

## Variations

- **Palindrome Partitioning (LC 131)** lists every partition: [backtracking](lesson:backtracking-choices), testing each piece against a precomputed `isPal[i][j]` table.
- **The table version** of the palindrome check: `isPal[i][j] = s[i] == s[j] && (j − i < 2 || isPal[i + 1][j − 1])`, filled with `i` descending. It costs O(n²) memory, against O(n) for the center expansion above, but answers "is `s[i..j]` a palindrome?" in O(1) for any pair, which LC 1745 needs.
- **The longest palindromic subsequence (LC 516)** is a different problem: the LCS of s and reverse(s) ([two-string DP](lesson:two-string-dp)), or an [interval DP](lesson:interval-dp).
- **Hashing instead of Manacher:** with forward and reverse [prefix hashes](lesson:rabin-karp), binary-search the radius at each center, for O(n log n).

## Common mistakes

- **Off-by-one errors mapping positions back** from `t` to s: the start is `(best − radius[best]) / 2`.
- **Skipping the separators**, which leaves even-length palindromes with no single center.
- **Not capping the mirrored radius at `right − i`:** the mirror's palindrome may extend past what the outer palindrome proves.
- **Processing the cut DP in the wrong order**, so `pieces[lo]` is read before it's final.
- **Using the substring algorithms for subsequences**, or the other way round.

## Practice

Longest Palindromic Substring (LC 5) and Palindromic Substrings (LC 647) with Manacher, Palindrome Partitioning (LC 131), Palindrome Partitioning II (LC 132), Palindrome Partitioning IV (LC 1745), Maximum Product of the Length of Two Palindromic Substrings (LC 1960).

## Key takeaways

- Interleave separators so every palindrome is odd-length; a radius in `t` is a length in s.
- Inside the furthest-reaching palindrome, start from the mirror's radius, capped at the right edge, then extend.
- `right` only moves right, so Manacher is O(n): the same trick as the Z-function's box.
- The fewest cuts: expand every center, and relax `pieces[hi + 1]` from `pieces[lo]`, in O(n²).
- Listing every partition is backtracking; palindromic subsequences are DP.

## Knowledge check

```quiz
? Why does Manacher's algorithm insert '#' between the characters?
+ So every palindrome has odd length and one center position, and its radius in the new string equals its length in s
- To mark where words begin
! It has nothing to do with words.
- Because '#' can't appear in s
! It may appear; parity keeps separators compared only with separators.
- To make the string twice as fast to scan
! It makes the string about twice as long.
> Even-length palindromes otherwise have no single center.

? Why is Manacher's algorithm O(n)?
+ Every extension past the right edge moves `right`, which never moves left; everything inside is copied from the mirror
- Because it only checks odd-length palindromes
! The separators turn every palindrome into an odd-length one; it still finds all of them.
- Because palindromes are rare
! The bound holds even for "aaaa…".
- It isn't; it's O(n log n)
! The mirror argument gives O(n).
> It's the same idea as the Z-function's box.

? In t = "#a#b#a#a#b#a#" built from "abaaba", the middle '#' has radius 6. Which palindrome is that?
+ "abaaba", the whole string
- "aa"
! That's centered on the same gap, but the radius is 6.
- "aba"
! That's a radius-3 palindrome centered on a 'b'.
- A palindrome of length 13
! The radius is the length in s, not in t.
> A radius in t is a length in s.

? In the fewest-cuts DP, why is pieces[lo] already final when a palindrome s[lo..hi] uses it?
+ Every palindrome ending at lo − 1 has a center before the current one, and centers are processed in order
- Because lo is always 0
! lo moves left as the expansion grows.
- Because pieces is filled from the right
! It's filled through centers, left to right.
- It isn't; the loop runs twice
! One pass suffices because of the center order.
> lo + hi equals the current center.
```
