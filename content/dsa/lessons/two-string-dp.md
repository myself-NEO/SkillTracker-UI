## The idea

Two-string DP compares two sequences with one table: `dp[i][j]` is the answer for the first `i` characters of one string and the first `j` of the other. The last decision is about the two **last characters**: do they match, and if not, which string's pointer moves back? The same table shape answers questions with every combinator: max (longest common subsequence), min (edit distance), sum (distinct subsequences) and OR (interleaving).

## When to use it

- "The longest common subsequence", "how similar are these two strings?"
- "The minimum edits (insert, delete, replace) to turn one word into another."
- "How many times does t appear as a subsequence of s?"
- "Can s3 be formed by interleaving s1 and s2?"
- One string compared with **itself**, as ranges: palindromic subsequences, with a range-shaped table.

## How it works

- **The base row and column** describe empty prefixes: an empty string shares nothing with anything, needs j insertions to become j characters, and so on.
- **Match:** when `a[i−1] == b[j−1]`, both last characters can be used together, so look diagonally: `dp[i−1][j−1]`.
- **Mismatch:** at least one last character can't be used in this alignment, so look up (`dp[i−1][j]`, drop a's character) or left (`dp[i][j−1]`, drop b's), or diagonally for a substitution, and combine.
- **Order:** row by row; **space:** a rolling row, sized by the shorter string.

## Java template

```java
int[][] dp = new int[m + 1][n + 1];          // row 0 and column 0: empty prefixes
// set the base row and column for this problem
for (int i = 1; i <= m; i++) {
    for (int j = 1; j <= n; j++) {
        if (a.charAt(i - 1) == b.charAt(j - 1)) dp[i][j] = /* from dp[i-1][j-1] */;
        else dp[i][j] = /* combine dp[i-1][j], dp[i][j-1] (and dp[i-1][j-1]) */;
    }
}
return dp[m][n];
```

## Worked examples

### Longest Common Subsequence (LC 1143)

```java
static int longestCommonSubsequence(String text1, String text2) {
    int m = text1.length(), n = text2.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1.charAt(i - 1) == text2.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp[m][n];
}
```

`"abcde"` and `"ace"` give 3 (`"ace"`). This is the foundation of the family; the problems below are this table with a different recurrence. To reconstruct the subsequence itself, walk back from `dp[m][n]`: diagonally on a match, otherwise towards the larger neighbour.

### Edit Distance (LC 72)

The minimum insertions, deletions or substitutions turning `word1` into `word2`. On a match, nothing is needed: `dp[i−1][j−1]`. Otherwise one operation is unavoidable; take the cheapest: **substitute** (`dp[i−1][j−1]`, both pointers move), **delete** from word1 (`dp[i−1][j]`), or **insert** into word1 (`dp[i][j−1]`), plus 1. The base cases: `dp[i][0] = i` (delete everything) and `dp[0][j] = j` (insert everything).

```java
static int minDistance(String word1, String word2) {
    int m = word1.length(), n = word2.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
            }
        }
    }
    return dp[m][n];
}
```

`"horse"` → `"ros"` takes 3 (substitute h→r, delete r, delete e). Be ready to justify why each of the three options is exactly one edit and one pointer movement: it's one of the most-asked DP problems precisely because that has to be derived, not memorised.

### Longest Palindromic Subsequence (LC 516): one string, as ranges

Here `i` and `j` are the two ends of a range in the **same** string, so the fill order changes.

- *State:* `dp[i][j]` = the longest palindromic subsequence within `s[i..j]`.
- *Recurrence:* matching ends wrap whatever's palindromic inside: `dp[i+1][j−1] + 2`; otherwise drop one end: `max(dp[i+1][j], dp[i][j−1])`. Base case: `dp[i][i] = 1`.
- *Order:* by increasing range length: i from the end backwards, j forwards from i + 1.

```java
static int longestPalindromeSubseq(String s) {
    int n = s.length();
    int[][] dp = new int[n][n];
    for (int i = 0; i < n; i++) dp[i][i] = 1;
    for (int i = n - 2; i >= 0; i--) {
        for (int j = i + 1; j < n; j++) {
            if (s.charAt(i) == s.charAt(j)) {
                dp[i][j] = (i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0) + 2;
            } else {
                dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp[0][n - 1];
}
```

`"bbbab"` gives 4 (`"bbbb"`). Equivalently, it's the LCS of s and reverse(s). Don't confuse it with the longest palindromic **substring** (contiguous), which is [center expansion](lesson:palindromes). This range shape previews [interval DP](lesson:interval-dp).

### Distinct Subsequences (LC 115): counting

How many ways do the first i characters of s form the first j of t? On a match there are two independent ways forward, use this character or skip it: `dp[i−1][j−1] + dp[i−1][j]`; on a mismatch it can only be skipped: `dp[i−1][j]`. The base case `dp[i][0] = 1`: one way to form an empty t, choose nothing.

```java
static int numDistinct(String s, String t) {
    int m = s.length(), n = t.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 0; i <= m; i++) dp[i][0] = 1;
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s.charAt(i - 1) == t.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1] + dp[i - 1][j];
            } else {
                dp[i][j] = dp[i - 1][j];
            }
        }
    }
    return dp[m][n];
}
```

`"rabbbit"` contains `"rabbit"` 3 ways (which of the three b's to leave out). Counts grow fast: outside LeetCode's guarantee, use `long` or a modulus.

### Interleaving String (LC 97): reachability

Can `s3` be formed by interleaving `s1` and `s2`, keeping each one's order? The last character of `s3[0, i + j)` came from s1 (needs `dp[i−1][j]` and a match) or from s2 (needs `dp[i][j−1]` and a match):

```java
static boolean isInterleave(String s1, String s2, String s3) {
    int m = s1.length(), n = s2.length();
    if (m + n != s3.length()) return false;
    boolean[][] dp = new boolean[m + 1][n + 1];
    dp[0][0] = true;
    for (int i = 1; i <= m; i++) dp[i][0] = dp[i - 1][0] && s1.charAt(i - 1) == s3.charAt(i - 1);
    for (int j = 1; j <= n; j++) dp[0][j] = dp[0][j - 1] && s2.charAt(j - 1) == s3.charAt(j - 1);
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            dp[i][j] = (dp[i - 1][j] && s1.charAt(i - 1) == s3.charAt(i + j - 1))
                    || (dp[i][j - 1] && s2.charAt(j - 1) == s3.charAt(i + j - 1));
        }
    }
    return dp[m][n];
}
```

The length check up front is a cheap, easy-to-forget early exit. With LCS (max), Edit Distance (min) and Distinct Subsequences (sum), this rounds out all four combinators on one table shape.

## Complexity

All of these are **O(m · n)** time (O(n²) for the palindromic subsequence). Space is O(m · n), or O(min(m, n)) with a rolling row; the range-shaped LPS keeps O(n²) in its simple form.

## Variations

- **Minimum ASCII Delete Sum (LC 712):** Edit Distance's shape, where each deletion costs the character's ASCII value instead of 1.
- **Maximum Length of Repeated Subarray (LC 718):** looks like LCS, but the match must be **contiguous**, so a mismatch resets `dp[i][j]` to 0 and the answer is the maximum anywhere in the table.
- **Shortest Common Supersequence (LC 1092):** its length is m + n − LCS; rebuild it by walking back through the LCS table.
- **Pattern matching with `?` and `*`** (Wildcard Matching, LC 44; Regular Expression Matching, LC 10): the same table, where `*` can match nothing (`dp[i][j−1]`) or one more character (`dp[i−1][j]`).

## Common mistakes

- **Off-by-one between `dp` indexes and string indexes:** `dp[i][j]` looks at `charAt(i − 1)` and `charAt(j − 1)`.
- **Wrong base cases:** Edit Distance's first row and column are i and j, not 0; Distinct Subsequences' first column is 1.
- **Row-by-row order for the palindromic subsequence**, which reads rows that aren't filled yet.
- **Confusing subsequences with substrings**: contiguity changes the recurrence (LC 718 versus LCS).
- **Forgetting the length check** in Interleaving String.

## Practice

Longest Common Subsequence (LC 1143), Edit Distance (LC 72), Longest Palindromic Subsequence (LC 516), Distinct Subsequences (LC 115), Interleaving String (LC 97), Minimum ASCII Delete Sum for Two Strings (LC 712), Maximum Length of Repeated Subarray (LC 718), Wildcard Matching (LC 44).

## Key takeaways

- `dp[i][j]` covers prefixes of length i and j; row and column 0 are empty prefixes.
- A match looks diagonally; a mismatch drops one last character (or substitutes).
- One table shape serves every combinator: LCS max, Edit Distance min, Distinct Subsequences sum, Interleaving OR.
- Ranges of one string (palindromic subsequences) need an increasing-length fill order.
- Subsequence and substring versions differ: contiguity resets the count on a mismatch.

## Knowledge check

```quiz
? Edit Distance from "horse" to "ros": what's the answer?
+ 3: substitute h→r, delete r, delete e
- 2
! At least three characters must change or go.
- 8
! That deletes all five letters and inserts three; editing in place is cheaper.
- 4
! One edit fewer is enough.
> dp[i][j] = 1 + min(substitute, delete, insert) on a mismatch.

? In Edit Distance, which neighbour corresponds to deleting a character from word1?
+ dp[i−1][j]: word1's pointer moves back, word2's stays
- dp[i][j−1]
! That's inserting into word1.
- dp[i−1][j−1]
! That's a substitution, or a free match.
- dp[i][j]
! That's the cell being computed.
> Each option is one edit and one pointer movement.

? Why can't Longest Palindromic Subsequence be filled row by row from i = 0?
+ dp[i][j] reads dp[i+1][…], a row that wouldn't be filled yet
- Because the string has only one row
! The table is n × n.
- Because palindromes are symmetric
! Symmetry doesn't fix the order.
- It can; the order doesn't matter
! Row 0 would read row 1 before it exists.
> Fill by increasing range length: i backwards.

? "Maximum Length of Repeated Subarray" looks like LCS. What changes?
+ The match must be contiguous, so a mismatch resets dp[i][j] to 0 and the answer is the table's maximum
- Nothing; it's the same code
! LCS allows gaps; this problem doesn't.
- The base cases become 1
! An empty prefix still matches nothing.
- It needs a 3-D table
! It's still two indexes.
> Subsequence versus subarray changes the recurrence.
```
