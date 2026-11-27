## What it is

String algorithms answer questions about **patterns inside text**: where a pattern occurs, which parts of a string repeat, which substrings are palindromes, how many distinct substrings there are. In Java they work on `String`, an immutable sequence of `char`s. The basics (immutability, `StringBuilder`, `equals` versus `==`) are in [arrays and strings in Java](lesson:arrays-and-strings-in-java); this module builds on them.

One idea ties the matching algorithms together: **reuse what you've already matched.** The naive algorithm forgets everything after a mismatch. [KMP](lesson:kmp) remembers borders, the [Z-function](lesson:z-function) remembers a box, and [hashing](lesson:rabin-karp) remembers a number.

## How it works

Immutability decides what string operations cost: anything that "changes" a string, or takes a piece of it, builds a new string and copies characters. So the costs aren't always what they look like:

| Operation | Cost | Watch out for |
|---|---|---|
| `charAt(i)`, `length()` | O(1) | — |
| `substring(a, b)` | O(b − a): it copies | calling it inside a loop that only needs indexes |
| `s1 + s2`, `+=` | O(total length) | `+=` in a loop is O(n²): use `StringBuilder` |
| `equals`, `compareTo` | O(length) | `==` compares references, not contents |
| `indexOf(pattern)` | O(n · m) in the worst case | it's the naive algorithm below, not KMP |
| `split(regex)` | O(n), plus compiling the regex | `.`, `\|`, `+`, `*` are regex symbols: escape them |
| `hashCode()` | O(n) the first time, then cached | — |

## Build it from scratch

The naive matcher tries every alignment of the pattern against the text:

```java
// Brute-force matching: try every alignment. O(n * m)
// in the worst case, e.g. "aaaa...a" against "aaab".
static int naiveIndexOf(String text, String pattern) {
    int n = text.length(), m = pattern.length();
    for (int i = 0; i + m <= n; i++) {
        int j = 0;
        while (j < m && text.charAt(i + j) == pattern.charAt(j)) j++;
        if (j == m) return i;
    }
    return -1;
}
```

```text
text      a a a a a a a a b
pattern   a a a b
          a a a x              3 matches, then a mismatch at alignment 0
            a a a x            slide by one and compare the same a's again
              a a a x          ... O(n * m) comparisons in total
```

`String.indexOf` works this way too. It's fine for short patterns, and many interviewers accept it for LC 28 unless they ask for linear time. If they do, use KMP or the Z-function, and don't claim `indexOf` is O(n + m).

## Java API

```java
static void javaStrings() {
    String s = "interview";
    char c = s.charAt(0);                      // 'i'
    int idx = c - 'a';                         // 8: the letter's slot in an int[26] count
    char back = (char) ('a' + idx);            // 'i' again
    String sub = s.substring(2, 5);            // "ter": [begin, end), a NEW string, O(length)
    boolean same = sub.equals("ter");          // true. == compares references: never use it here
    int order = "apple".compareTo("banana");   // < 0: lexicographic order
    String joined = String.join(",", List.of("a", "b", "c"));   // "a,b,c"
    String[] parts = "a.b.c".split("\\.");     // split takes a REGEX: a bare "." matches everything
    String repeated = "ab".repeat(3);          // "ababab" (Java 11+)
    boolean region = s.regionMatches(2, "term", 0, 3);   // compares "ter" in place, with no copy
    char[] chars = s.toCharArray();            // a mutable copy; sorted, it's an anagram key
    Arrays.sort(chars);
    String key = new String(chars);            // "eeiinrtvw"
    StringBuilder sb = new StringBuilder();    // build strings in loops with this, never with +=
    for (int i = 0; i < 3; i++) sb.append(i);
    String built = sb.reverse().toString();    // "210"
}
```

`indexOf`, `contains` and `split` are fine for short inputs and simple jobs. The algorithms in this module exist for linear-time guarantees, and for questions the API can't answer at all: periods, palindromes, repeated substrings.

## Operations and complexity

The algorithm map for the rest of the module:

| Algorithm | Answers | Time |
|---|---|---|
| naive matching | the first or every occurrence | O(n · m) worst case |
| [KMP](lesson:kmp) (prefix function) | every occurrence, borders, periods | O(n + m) |
| [Z-function](lesson:z-function) | every occurrence, how far each position matches the prefix | O(n + m) |
| [Rabin–Karp](lesson:rabin-karp) | occurrences; many patterns of one length | O(n + m) expected |
| [prefix hashes](lesson:rabin-karp) | compare any two substrings | O(n) setup, O(1) per query |
| [Manacher](lesson:manacher-and-palindrome-partitioning) | the longest palindrome at every center | O(n) |
| [suffix array + LCP](lesson:suffix-arrays) | sorted suffixes, distinct substrings, longest repeat | O(n log² n) + O(n) |

## Patterns

Where string questions live:

| Family | Typical problems | Where |
|---|---|---|
| windows and counts | longest substring without repeats, minimum window, anagrams | [sliding window](lesson:sliding-window) |
| matching and periodicity | find a pattern, repeated patterns, borders | [KMP](lesson:kmp), [Z-function](lesson:z-function) |
| comparing many substrings | repeated windows, the longest repeat | [Rabin–Karp and hashing](lesson:rabin-karp) |
| palindromes | longest, count, partition, fix with deletions | [palindromes](lesson:palindromes), [Manacher](lesson:manacher-and-palindrome-partitioning) |
| all substrings of one string | distinct substrings, the longest repeat | [suffix arrays](lesson:suffix-arrays) |
| comparing two strings | edit distance, LCS, interleaving | [two-string DP](lesson:two-string-dp) |
| many words or patterns | autocomplete, word search, many patterns in one text | [tries](lesson:trie-basics), [Aho–Corasick](lesson:autocomplete-and-aho-corasick) |

## Common mistakes

- **Claiming `indexOf` is linear.** It's the naive algorithm: O(n · m) in the worst case.
- **`+=` on a string inside a loop**, which is O(n²) in total: use a `StringBuilder`.
- **Comparing strings with `==`**, which compares references, not contents.
- **Splitting on an unescaped regex symbol:** `"a.b.c".split(".")` returns an empty array.
- **Calling `substring` in a hot loop** when comparing indexes (or `regionMatches`) would do: each call copies.
- **`c - 'a'` on input that isn't lowercase letters**: uppercase, digits and Unicode fall outside an `int[26]`.

## Key takeaways

- Strings are immutable: `substring` and `+` copy, so build with `StringBuilder` and compare by index when you can.
- `indexOf` is the naive O(n · m) matcher; KMP, the Z-function and hashing guarantee linear time.
- The matching algorithms all reuse what's already matched: borders, a box, or a hash.
- Classify the question first: one pattern, periods, many substrings, palindromes, all substrings, two strings, or many words.

## Knowledge check

```quiz
? What is the worst-case cost of text.indexOf(pattern), for a text of length n and a pattern of length m?
+ O(n · m): it's the naive algorithm
- O(n + m)
! That's KMP's guarantee, not indexOf's.
- O(n log m)
! No version of indexOf works that way.
- O(1)
! It must scan the text.
> Text "aaaa…ab" with pattern "aa…ab" is the slow case.

? Why does "a.b.c".split(".") return an empty array?
+ split takes a regex, and "." matches every character, so every piece is empty and trailing empty pieces are dropped
- Because "." isn't in the string
! It is; but as a regex it means "any character".
- Because split needs at least two characters
! Single-character separators are fine when escaped: "\\.".
- It returns ["a", "b", "c"]
! That needs split("\\.").
> Escape regex symbols, or use Pattern.quote.

? Which approach finds the edit distance between two strings?
+ Two-string dynamic programming
- KMP
! KMP finds occurrences of one string inside another.
- A suffix array
! It indexes the substrings of one string.
- Rabin–Karp
! Hashing compares substrings; it doesn't count edits.
> Comparing two whole strings is a DP family of its own.

? Why is naive matching slow on the text "aaaaaaaab" with the pattern "aaab"?
+ Each alignment matches several a's before failing, then slides by one and compares the same characters again
- Because 'b' is rare
! Rarity isn't the issue; the repeated comparisons are.
- Because the pattern is longer than the text
! It's shorter.
- It isn't slow: the first alignment matches
! The match is at the end of the text.
> KMP remembers those a's instead of re-reading them.
```
