## The idea

`z[i]` is the length of the longest common prefix of s and the suffix starting at i: how far position `i` matches the start of the string.

```text
s     a  a  b  x  a  a  b
i     0  1  2  3  4  5  6
z     7  1  0  0  3  1  0        z[4] = 3: "aab" at position 4 matches the prefix "aab"
```

Like [KMP](lesson:kmp), it avoids comparing the same characters twice. It remembers a **box** `[l, r)`, the rightmost stretch known to equal a prefix of s, and starts each new `z[i]` from what the box already proves.

## When to use it

- **Pattern matching in linear time:** compute Z on `pattern + separator + text`, and look for z-values of at least m.
- **"How far does each suffix match the start?"**: Sum of Scores of Built Strings (LC 2223), and the fewest steps until a string can return to its original (LC 3031).
- **Periods and borders**, as an alternative to the prefix function.

## How it works

- **The box** `[l, r)` is the rightmost segment known to equal a prefix of s. Inside it, position i mirrors position `i − l`, so `z[i]` starts at `min(r − i, z[i − l])` and only has to extend past `r`.
- **Why it's O(n).** Every successful comparison past `r` moves `r` right, and `r` never moves left, so all the extending together costs O(n).
- `z[0]` is set to n by convention: the whole string matches itself.

## Java template

```java
// z[i] = the length of the longest common prefix of s and s[i..] (z[0] = n by
// convention). O(n), using the match box [l, r) that reaches furthest right.
static int[] zFunction(String s) {
    int n = s.length();
    int[] z = new int[n];
    if (n > 0) z[0] = n;
    for (int i = 1, l = 0, r = 0; i < n; i++) {
        if (i < r) z[i] = Math.min(r - i, z[i - l]);            // reuse what the box already proved
        // then extend by comparing
        while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) z[i]++;
        if (i + z[i] > r) {
            l = i;
            r = i + z[i];
        }
    }
    return z;
}
```

## Worked examples

### Pattern matching

```java
// Matching with Z: in pattern + separator + text, a z-value of at least m marks a match.
static List<Integer> zSearch(String text, String pattern) {
    String combined = pattern + '\0' + text;         // a separator that appears in neither string
    int[] z = zFunction(combined);
    int m = pattern.length();
    List<Integer> matches = new ArrayList<>();
    for (int i = m + 1; i < combined.length(); i++) {
        if (z[i] >= m) matches.add(i - m - 1);
    }
    return matches;
}
```

The separator stops any match from running past the pattern, so a z-value in the text part is at most m, and equals m exactly where the pattern occurs.

### Sum of Scores of Built Strings (LC 2223)

The score of each suffix is the length of its longest common prefix with the whole string: its z-value.

```java
// LC 2223 Sum of Scores of Built Strings: each suffix's score is its z-value.
static long sumScores(String s) {
    long total = 0;
    for (int v : zFunction(s)) total += v;
    return total;
}
```

### Minimum Time to Revert Word to Initial State (LC 3031)

Each second removes the first k characters of `word` and appends any k characters. After t seconds, the word can be back to its original only if what's left of it, `word[t·k..]`, matches the start of the word (the appended characters can be chosen freely), or once every original character has been removed:

```java
public int minimumTimeToInitialState(String word, int k) {
    int n = word.length();
    int[] z = zFunction(word);
    int t = 1;
    while (t * k < n && z[t * k] < n - t * k) t++;    // the part left after t steps must match the start
    return t;
}
```

## Complexity

**O(n)** time and O(n) space for the Z-array; matching a pattern of length m in a text of length n is **O(n + m)**.

## Variations

- **KMP or Z?** They answer the same questions, and each array can be converted into the other. Z is often easier to rederive in an interview; the prefix function is what you need for streaming text and for automata.
- **The period from Z:** p is a period of s exactly when `p + z[p] == n`. The smallest such p is the shortest period, and s is a whole repetition when that p is less than n and divides it: Repeated Substring Pattern (LC 459) without a prefix function.
- **The longest border from Z:** the smallest i with `i + z[i] == n` gives the longest prefix that's also a suffix, of length `n − i` (Longest Happy Prefix, LC 1392).

## Common mistakes

- **Forgetting the separator** in `pattern + text`, so z-values run across the boundary, or choosing one that appears in the input.
- **Not moving the box** after extending, or moving it when `i + z[i]` doesn't reach further right.
- **Dropping the `min(r − i, z[i − l])` start**, which re-compares from scratch and makes it O(n²).
- **Mishandling `z[0]`**: it's n by convention; leave it out of searches, but LC 2223 does count it (the whole string scores n).

## Practice

Find the Index of the First Occurrence in a String (LC 28), Sum of Scores of Built Strings (LC 2223), Minimum Time to Revert Word to Initial State I and II (LC 3029, LC 3031), Repeated Substring Pattern (LC 459), Longest Happy Prefix (LC 1392).

## Key takeaways

- `z[i]` is the longest common prefix of s and the suffix starting at i.
- The box `[l, r)` of the rightmost match lets each `z[i]` start at `min(r − i, z[i − l])`; `r` only moves right, so it's O(n).
- Match a pattern by computing Z on `pattern + separator + text`, and look for values of at least m.
- `p + z[p] == n` means p is a period of s.
- KMP and Z answer the same questions: Z is easier to rederive, and KMP suits streams.

## Knowledge check

```quiz
? What is the Z-array of "aaaa"?
+ [4, 3, 2, 1]
- [4, 0, 0, 0]
! Every suffix of "aaaa" matches the start for its whole length.
- [0, 1, 2, 3]
! That's the prefix function of "aaaa".
- [1, 1, 1, 1]
! Each suffix matches more than one character.
> z[0] is n by convention.

? Why is the Z-function O(n) despite the inner while loop?
+ Every comparison past the box's right end moves r right, and r never moves left
- Because the while loop runs at most once
! It can run many times for one i.
- Because z[0] is set to n
! That's only a convention.
- It isn't; it's O(n²)
! The box makes the extending work linear in total.
> Inside the box, the answer is reused rather than recomputed.

? In zSearch, why put a separator between the pattern and the text?
+ It stops a match from running past the pattern, so z-values in the text are at most m and equal m exactly at the matches
- To mark where the text starts for the output
! The index arithmetic does that.
- Because the Z-function needs an odd length
! Any length works.
- It's optional
! Without it, z-values can run across the boundary.
> The separator must not occur in either string.

? A string of length 9 has z[3] = 6. What does that tell you?
+ 3 + 6 = 9, so 3 is a period, and since 9 % 3 == 0, the string is three copies of its first 3 characters
- The string has exactly 3 distinct characters
! Z-values measure matches, not distinct characters.
- The string is a palindrome
! Periods and palindromes are different properties.
- Nothing, without z[1] and z[2]
! z[3] alone shows the period.
> p is a period exactly when p + z[p] == n.
```
