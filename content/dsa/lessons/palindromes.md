## The idea

A palindrome reads the same in both directions, so it mirrors around a **center**. That gives two tools:
- **Two pointers** from the ends check whether one string is a palindrome, in O(n).
- **Expanding around each center** finds the palindromic substrings. Every palindrome has a center, either a character (odd length) or the gap between two characters (even length), so trying all 2n − 1 centers finds them all.

## When to use it

- "Is it a palindrome?", ignoring case and punctuation (LC 125), or after deleting at most one character (LC 680): two pointers.
- "The longest palindromic substring" (LC 5) and "count the palindromic substrings" (LC 647): expand around the centers.
- For n up to about 10⁴, O(n²) center expansion is the expected answer; [Manacher](lesson:manacher-and-palindrome-partitioning) is the O(n) follow-up.
- **Subsequences** (characters not necessarily adjacent) are a different problem: [two-string DP](lesson:two-string-dp).

## How it works

Center `c` runs from 0 to 2n − 2. Even values sit on a character, odd values on the gap after it:

| `center` | `lo, hi` start at | Meaning |
|---|---|---|
| 0 | 0, 0 | character 0 (odd-length palindromes) |
| 1 | 0, 1 | the gap between characters 0 and 1 (even-length palindromes) |
| 2 | 1, 1 | character 1 |
| … | … | … |
| 2n − 2 | n − 1, n − 1 | the last character |

From each center, step outwards while both ends match. Every successful step is one more palindrome, and the first mismatch ends that center: anything wider would contain the mismatched pair.

## Java template

```java
// Expand from one center: lo == hi for odd lengths, hi == lo + 1 for even ones.
// Returns the length of the longest palindrome around that center.
int expand(String s, int lo, int hi) {
    while (lo >= 0 && hi < s.length() && s.charAt(lo) == s.charAt(hi)) {
        lo--;
        hi++;
    }
    return hi - lo - 1;               // the palindrome is s[lo + 1 .. hi - 1]
}
```

## Worked examples

### Valid Palindrome II (LC 680): two pointers, one deletion

```java
// LC 680 Valid Palindrome II: at most one deletion.
// At the first mismatch, try skipping either side.
public boolean validPalindrome(String s) {
    for (int lo = 0, hi = s.length() - 1; lo < hi; lo++, hi--) {
        if (s.charAt(lo) != s.charAt(hi)) {
            return isPalindrome(s, lo + 1, hi) || isPalindrome(s, lo, hi - 1);
        }
    }
    return true;
}

private boolean isPalindrome(String s, int lo, int hi) {
    while (lo < hi) {
        if (s.charAt(lo++) != s.charAt(hi--)) return false;
    }
    return true;
}
```

- **Valid Palindrome (LC 125):** skip characters that fail `Character.isLetterOrDigit`, and compare with `Character.toLowerCase`.
- **One deletion allowed:** at the first mismatch, the deleted character must be one of the two being compared, so try both: O(n).

### Longest Palindromic Substring (LC 5)

```java
// LC 5 Longest Palindromic Substring: every palindrome has a center,
// either a character (odd length) or the gap between two (even
// length). Expand from all 2n - 1 centers: O(n^2) time, O(1) space.
public String longestPalindrome(String s) {
    int bestStart = 0, bestLen = 0;
    for (int center = 0; center < 2 * s.length() - 1; center++) {
        int lo = center / 2, hi = lo + center % 2;   // even center: one char; odd center: a gap
        while (lo >= 0 && hi < s.length() && s.charAt(lo) == s.charAt(hi)) {
            lo--;
            hi++;
        }
        if (hi - lo - 1 > bestLen) {             // the palindrome is s[lo + 1 .. hi - 1]
            bestStart = lo + 1;
            bestLen = hi - lo - 1;
        }
    }
    return s.substring(bestStart, bestStart + bestLen);
}
```

### Palindromic Substrings (LC 647)

The same expansion; every successful step is one more palindrome:

```java
// LC 647 Palindromic Substrings: the same expansion; every successful step is one more palindrome.
public int countSubstrings(String s) {
    int count = 0;
    for (int center = 0; center < 2 * s.length() - 1; center++) {
        int lo = center / 2, hi = lo + center % 2;
        while (lo >= 0 && hi < s.length() && s.charAt(lo) == s.charAt(hi)) {
            count++;
            lo--;
            hi++;
        }
    }
    return count;
}
```

## Complexity

- Two-pointer checks are **O(n)** time and O(1) space.
- Center expansion is **O(n²)** in the worst case (`"aaaa…"`, where every center expands to the ends), with O(1) extra space.

## Variations

- **Two calls per character.** A common way to write LC 5 calls the template twice at each index, once for each kind of center:

  ```java
  int start = 0, end = 0;
  for (int i = 0; i < s.length(); i++) {
      int len = Math.max(expand(s, i, i), expand(s, i, i + 1));   // odd and even centers at i
      if (len > end - start + 1) {
          start = i - (len - 1) / 2;
          end = i + len / 2;
      }
  }
  return s.substring(start, end + 1);
  ```

  It visits the same 2n − 1 centers.
- **Longest Palindrome (LC 409)** builds a palindrome from a multiset of letters: use every pair, plus one odd letter in the middle. That's counting, not substrings.
- **k deletions (Valid Palindrome III, LC 1216):** s works when n minus its longest palindromic subsequence is at most k, a [two-string DP](lesson:two-string-dp).
- **Palindrome pairs** across a list of words use a [trie of reversed words](lesson:prefix-reversed-and-suffix-tries).
- **O(n) for every center:** [Manacher's algorithm](lesson:manacher-and-palindrome-partitioning).

## Common mistakes

- **Forgetting the even-length centers**, the classic bug: "abba" has no middle character.
- **Confusing substrings with subsequences.** "The longest palindromic subsequence" is a DP, not center expansion.
- **Trying only one side in LC 680.** At the mismatch, either character could be the one to delete.
- **Comparing raw characters in LC 125**, instead of skipping non-alphanumerics and lowercasing.
- **Off-by-one when reading the result:** after the loop, the palindrome is `s[lo + 1 .. hi − 1]`, of length `hi − lo − 1`.

## Practice

Valid Palindrome (LC 125), Valid Palindrome II (LC 680), Longest Palindrome (LC 409), Longest Palindromic Substring (LC 5), Palindromic Substrings (LC 647), Valid Palindrome III (LC 1216).

## Key takeaways

- Check a whole string with two pointers from the ends; with one deletion allowed, try skipping either side at the first mismatch.
- Every palindrome has a center: one of n characters or n − 1 gaps, 2n − 1 in all.
- Expand from each center while both ends match; every step is one more palindrome.
- Center expansion is O(n²) time and O(1) space; Manacher brings it to O(n).
- Palindromic subsequences need DP, not center expansion.

## Knowledge check

```quiz
? How many centers does center expansion try for a string of length n?
+ 2n − 1: n characters and n − 1 gaps between them
- n
! That misses the even-length palindromes.
- 2n
! There are only n − 1 gaps between n characters.
- n²
! That's the number of substrings, not centers.
> Odd-length palindromes center on a character, even-length ones on a gap.

? Which center finds the palindrome "abba"?
+ The gap between the two b's
- The first 'b'
! Expanding from that 'b' compares its neighbours, 'a' and 'b', which differ, so it stops at "b".
- The first 'a'
! Expanding from 'a' fails at once.
- None: "abba" isn't a palindrome
! It reads the same both ways.
> Even-length palindromes have no middle character.

? Valid Palindrome II on "abca": what happens?
+ At the first mismatch (b and c), skipping either one leaves a palindrome, so it returns true
- It returns false: two characters differ
! One deletion is allowed.
- It deletes the first 'a'
! The ends match; only the mismatched pair matters.
- It must try deleting every character
! Only the two mismatched characters are candidates.
> "aca" (delete b) and "aba" (delete c) are both palindromes.

? What input makes center expansion take O(n²) time?
+ A string of one repeated character, like "aaaa…", where every center expands to the edge
- A string with all distinct characters
! Every expansion stops after one step: O(n).
- An empty string
! There's nothing to expand.
- A string that's already a palindrome
! "abcba" expands far only from its middle; every other center stops at once.
> Manacher's mirror trick removes this worst case.
```
