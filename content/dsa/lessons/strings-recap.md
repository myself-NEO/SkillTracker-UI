String questions look endlessly varied, but they fall into a handful of families, each with a standard tool. This recap gathers the signals, the edge cases, the practice and the mistakes for the module.

## Recognizing the pattern

| The problem says… | Reach for |
|---|---|
| find a pattern in linear time | [KMP](lesson:kmp) or the [Z-function](lesson:z-function) |
| "repeated pattern", period, the smallest repeating unit | the prefix function: `n − pi[n − 1]` ([KMP](lesson:kmp)) |
| the longest prefix that is also a suffix | the prefix function ([KMP](lesson:kmp)) |
| add characters in front to make a palindrome | `s + "#" + reverse(s)` ([KMP](lesson:kmp)) |
| how far each position matches the start of the string | the [Z-function](lesson:z-function) |
| repeated fixed-length windows, many patterns of one length | a [rolling hash](lesson:rabin-karp) |
| compare many substrings, the longest repeat | prefix hashes with binary search ([hashing](lesson:rabin-karp)) |
| a palindrome after at most one deletion | [two pointers](lesson:palindromes) |
| the longest palindromic substring, or how many there are | [expand around the center](lesson:palindromes); [Manacher](lesson:manacher-and-palindrome-partitioning) for O(n) |
| the fewest cuts into palindromes | center expansion with a DP ([partitioning](lesson:manacher-and-palindrome-partitioning)) |
| distinct substrings, sorted suffixes | a [suffix array](lesson:suffix-arrays) with LCP |
| no repeated characters, anagrams, the minimum window | a [sliding window](lesson:sliding-window) |
| edit distance, LCS, palindromic subsequence | [two-string DP](lesson:two-string-dp) |
| many words, prefixes, many patterns at once | a [trie](lesson:trie-basics), or [Aho–Corasick](lesson:autocomplete-and-aho-corasick) |

## Decision procedure

1. **Name the family.** One pattern in a text? Periods or borders? Many substrings compared? Palindromes? All substrings of one string? Two strings compared? Many words?
2. **Check the constraints.** n up to about 10⁴ allows O(n²): center expansion, a DP table. n up to 10⁵–10⁶ needs O(n) or O(n log n): KMP, Z, Manacher, hashing with binary search, or a suffix array.
3. **Prefer the deterministic tool** when one exists (KMP over Rabin–Karp for a single pattern). Use hashing when you compare many substrings, and verify on equal hashes unless you use two moduli.
4. **Mind Java's costs**: no `+=` in loops, no `substring` in hot loops, `equals` rather than `==`, and escape regex symbols in `split`.
5. **Test the edge cases below** before calling it done.

## Edge cases to test

| Input | What it breaks |
|---|---|
| the empty string | `pi[n − 1]`, the `2n − 1` centers when n = 0, `substring` bounds |
| a single character | borders and periods of length 1; `minCut` must be 0 |
| all characters equal (`"aaaa"`) | the worst case for naive matching and center expansion; overlapping matches |
| a pattern longer than the text | the Rabin–Karp window setup |
| a pattern equal to the text | exactly one match, at 0 |
| a separator that appears in the input | `pattern + "#" + text` tricks give false matches |
| uppercase, digits, Unicode | `int[26]` indexing with `c − 'a'` |
| overlapping matches (`"aa"` in `"aaaa"`) | resetting `k = 0` after a match instead of `pi[k − 1]` |

## Common mistakes

1. **`+=` on a string inside a loop**, which is O(n²). Use `StringBuilder`.
2. **Comparing strings with `==`.**
3. **Splitting on an unescaped regex symbol:** `split(".")` returns an empty array.
4. **Restarting KMP at 0 after a match** instead of `pi[k − 1]`, which loses overlapping matches.
5. **Hashing without `floorMod`**, with a single small modulus over many windows, or without verifying when a wrong answer is unacceptable.
6. **Forgetting even-length palindromes** in center expansion.
7. **Off-by-one errors mapping Manacher's positions back** to the original string.
8. **Calling `substring` in a hot loop** when comparing indexes would do.
9. **Concatenating with a separator that can appear in the input.**
10. **Claiming `indexOf` is linear**, or treating palindromic *substrings* and *subsequences* as one problem.

## Practice ladder

**Warm-up**
- Valid Palindrome (125)
- Find the Index of the First Occurrence in a String (28): naive, then KMP
- Longest Common Prefix (14)
- Valid Palindrome II (680)
- Rotate String (796): `goal` is a rotation of `s` exactly when the lengths match and it occurs in `s + s`

**Core**
- Longest Palindromic Substring (5)
- Palindromic Substrings (647)
- Repeated Substring Pattern (459)
- Shortest Palindrome (214)
- Longest Happy Prefix (1392)
- Repeated String Match (686)
- Repeated DNA Sequences (187)
- Palindrome Partitioning (131)

**Hard**
- Palindrome Partitioning II (132)
- Longest Duplicate Substring (1044)
- Sum of Scores of Built Strings (2223)
- Distinct Echo Substrings (1316)
- Longest Common Subpath (1923)
- Palindrome Pairs (336) and Stream of Characters (1032), in the [tries](lesson:prefix-reversed-and-suffix-tries) module

## The one-page summary

```text
JAVA          immutable; += in a loop is O(n^2) -> StringBuilder; equals not ==; substring copies
              split takes a regex; indexOf is naive O(n*m)

BORDERS       pi[i] = longest proper prefix of s[0..i] that is also its suffix
              k = pi[i-1]; while (k > 0 && s[i] != s[k]) k = pi[k-1]; if (s[i] == s[k]) k++
KMP           same loop over the text; on a full match record it and set k = pi[k-1]
PERIOD        p = n - pi[n-1]; whole repetition iff p < n && n % p == 0
SHORTEST PAL  pi of s + "#" + reverse(s) -> longest palindromic prefix; prepend the rest reversed
Z             z[i] = lcp(s, s[i..]); box [l, r): z[i] = min(r - i, z[i - l]), then extend
              search: pattern + sep + text, z >= m

ROLLING HASH  window = (window - out * B^(m-1)) * B + in   (mod M); verify on a match
SUBSTRINGS    h[r] - h[l] * B^(r-l); two moduli; floorMod; binary search on the length

PALINDROMES   two pointers; one deletion: try skipping either side
EXPAND        2n - 1 centers: lo = c / 2, hi = lo + c % 2; O(n^2), O(1) space
MANACHER      "#a#b#a#", radius = length in s; mirror 2*center - i inside the right edge; O(n)
MIN CUT       expand every center; pieces[hi + 1] = min(pieces[hi + 1], pieces[lo] + 1)

SUFFIX ARRAY  prefix doubling with rank pairs, O(n log^2 n); Kasai LCP, O(n)
              distinct substrings = n(n+1)/2 - sum(lcp); longest repeat = max(lcp)
```

## Key takeaways

- Name the family first: one pattern, periods, many substrings, palindromes, all substrings, two strings, or many words.
- The constraints pick the complexity: O(n²) up to about 10⁴, O(n) or O(n log n) beyond.
- KMP and Z are deterministic and linear; hashing is the flexible tool for comparing many substrings.
- Palindromes: two pointers to check, centers to find, Manacher for O(n), DP for subsequences.
- Java's string costs (copies, regexes, references) cause as many bugs as the algorithms do.

## Knowledge check

```quiz
? "Is s made of one block repeated several times?" Which tool answers it in O(n)?
+ The prefix function: s is a repetition when the period n − pi[n − 1] is less than n and divides it
- Expand around the center
! That finds palindromes, not repetitions.
- A sliding window
! Windows count characters; they don't find periods.
- Two-string DP
! That's quadratic, for comparing two strings.
> The Z-function works too: the smallest p with p + z[p] == n.

? n = 2 · 10⁵, and you need the longest palindromic substring. What's the safe choice?
+ Manacher's algorithm, O(n)
- Expanding around every center
! That's O(n²) in the worst case: too slow at this size.
- Checking every substring with two pointers
! That's O(n³).
- KMP of s against reverse(s)
! That matches whole strings, not palindromic substrings.
> Center expansion is fine up to about 10⁴.

? Your Rabin–Karp solution fails on one hidden test with a long input. What's the most likely cause?
+ A hash collision accepted without verification, with a single modulus over many windows
- KMP would have the same bug
! KMP compares characters; it can't collide.
- The text contains uppercase letters
! The hash works on any char values.
- Rolling hashes can't handle long inputs
! They can, with two moduli or verification.
> Verify on equal hashes, or use two moduli.

? "Find the edit distance between two words." Which family is it?
+ Comparing two strings: two-string DP
- Pattern matching: KMP
! KMP finds a pattern inside a text.
- All substrings of one string: a suffix array
! It indexes one string's substrings.
- Many words: a trie
! A trie stores a dictionary of words.
> LCS, edit distance and interleaving all live there.
```
