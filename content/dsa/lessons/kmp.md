## The idea

When a match fails partway, you've already read part of the text, and it equals a prefix of the pattern. KMP (Knuth–Morris–Pratt) uses that. Instead of moving the text pointer back, it falls back to the longest **border** of what matched and keeps going.

A **border** of a string is a proper prefix that is also a suffix: "aba" is a border of "ababa". The **prefix function** stores, for every position, the length of the longest border of the string up to there:

```text
s     a  b  a  b  a  c  a  b  a
i     0  1  2  3  4  5  6  7  8
pi    0  0  1  2  3  0  1  2  3       pi[4] = 3: "aba" is both a prefix and a suffix of "ababa"
```

## When to use it

- Find every occurrence of a pattern in **guaranteed** linear time (LC 28, when the interviewer asks for better than `indexOf`).
- **Periods and repetition**: "is s a repeated block?", "the smallest repeating unit".
- **Borders**: the longest prefix that's also a suffix.
- **Palindromic prefixes**, through `s + "#" + reverse(s)`.
- **Streaming text**: KMP never moves the text pointer back, so it works on characters as they arrive.

## How it works

- **The fallback.** If the border of length k can't be extended by `s[i]`, the next candidate is the longest border *of that border*, `pi[k − 1]`, because the borders of a border are exactly the shorter borders.
- **Why it's O(n).** `k` grows by at most 1 per step, and every fallback shrinks it, so there are at most n fallbacks in total.
- **Search is the same loop, run over the text.** `k` is how much of the pattern matches the text ending at `i`. On a mismatch, KMP falls back along the *pattern's* borders, and the text pointer never moves backwards.

## Java template

```java
// pi[i] = the length of the longest PROPER prefix of
// s[0..i] that is also a suffix of s[0..i]. O(n).
static int[] prefixFunction(String s) {
    int n = s.length();
    int[] pi = new int[n];
    for (int i = 1; i < n; i++) {
        // try to extend the previous border
        int k = pi[i - 1];
        // fall back to the next shorter border
        while (k > 0 && s.charAt(i) != s.charAt(k)) k = pi[k - 1];
        if (s.charAt(i) == s.charAt(k)) k++;
        pi[i] = k;
    }
    return pi;
}
```

## Worked examples

### KMP search (LC 28)

```java
// KMP: every start index of a non-empty pattern in
// text, O(n + m). The text pointer never moves back.
static List<Integer> kmpSearch(String text, String pattern) {
    int[] pi = prefixFunction(pattern);
    List<Integer> matches = new ArrayList<>();
    int k = 0;                                       // how many pattern characters match right now
    for (int i = 0; i < text.length(); i++) {
        while (k > 0 && text.charAt(i) != pattern.charAt(k)) k = pi[k - 1];
        if (text.charAt(i) == pattern.charAt(k)) k++;
        if (k == pattern.length()) {                 // a full match ends at i
            matches.add(i - k + 1);
            k = pi[k - 1];                           // keep going: matches may overlap
        }
    }
    return matches;
}
```

- After a full match, continue from `pi[k − 1]`, not from 0, or overlapping matches ("aa" in "aaa") are lost.
- **LC 28 Find the Index of the First Occurrence** returns the first match, or −1.

### Repeated Substring Pattern (LC 459): the period

The shortest period of s is `p = n − pi[n − 1]`, meaning `s[i] = s[i + p]` wherever both exist. The string is a whole number of repetitions exactly when p divides n:

```text
s = abcabcabc    pi[n-1] = 6    period = 9 - 6 = 3    9 % 3 == 0  -> "abc" three times
s = abcabcab     pi[n-1] = 5    period = 8 - 5 = 3    8 % 3 != 0  -> not a whole repetition
```

```java
// LC 459 Repeated Substring Pattern: the shortest period of s is n - pi[n-1]. s is a repetition of
// a block exactly when that period is shorter than s and divides its length.
public boolean repeatedSubstringPattern(String s) {
    int n = s.length(), period = n - prefixFunction(s)[n - 1];
    return period < n && n % period == 0;
}
```

### Longest Happy Prefix (LC 1392)

```java
// LC 1392 Longest Happy Prefix: the longest proper
// prefix that is also a suffix is pi[n-1] by definition.
public String longestPrefix(String s) {
    return s.substring(0, prefixFunction(s)[s.length() - 1]);
}
```

### Shortest Palindrome (LC 214)

Add the fewest characters **in front** of s to make it a palindrome. Keep the longest palindromic prefix of s, and put the rest, reversed, in front. In `s + "#" + reverse(s)`, the final `pi` value is the longest prefix of s that equals a suffix of reverse(s): exactly the longest palindromic prefix.

```java
// LC 214 Shortest Palindrome: add the fewest characters IN FRONT. Keep the
// longest palindromic prefix, which is the longest prefix of s that is also a
// suffix of reverse(s). '#' stops a border that would run across the middle.
public String shortestPalindrome(String s) {
    String rev = new StringBuilder(s).reverse().toString();
    int[] pi = prefixFunction(s + "#" + rev);
    int keep = pi[pi.length - 1];                // s[0, keep) is a palindrome
    return rev.substring(0, s.length() - keep) + s;
}
```

```text
s = aacecaaa     reverse = aaacecaa     longest palindromic prefix = aacecaa (7 characters)
answer = reverse[0, 8 - 7) + s = "a" + "aacecaaa" = "aaacecaaa"
```

### Repeated String Match (LC 686)

How many copies of a must be joined so that b occurs inside? An occurrence of b can always be shifted to start inside the first copy of a, so `q = ⌈|b| / |a|⌉` copies are needed and `q + 1` copies always suffice. Search once in q + 1 copies, and check where the first match ends:

```java
// LC 686 Repeated String Match: q = ceil(|b| / |a|) copies are needed; q + 1 copies always suffice.
public int repeatedStringMatch(String a, String b) {
    int q = (b.length() + a.length() - 1) / a.length();
    List<Integer> hits = kmpSearch(a.repeat(q + 1), b);
    if (hits.isEmpty()) return -1;
    return hits.get(0) + b.length() <= q * a.length() ? q : q + 1;
}
```

## Complexity

The prefix function is O(m) for a pattern of length m, and the search is O(n) over a text of length n: **O(n + m)** in total, with O(m) extra space. The period and border questions are O(n).

## Variations

- **One combined string:** compute `prefixFunction(pattern + "#" + text)`; every position where `pi` equals m is the end of a match. The separator must not occur in either string.
- **The "LPS array" spelling.** Many references call `pi` the LPS array (longest proper prefix that's also a suffix) and write the search as a two-pointer loop that advances `i` and `j` separately. It's the same algorithm.
- **The KMP automaton:** precompute `next[state][c]` for every state and letter, so each text character costs exactly one table lookup. [Aho–Corasick](lesson:autocomplete-and-aho-corasick) generalises this to many patterns at once.
- **Rotate String (LC 796):** `goal` is a rotation of `s` exactly when the lengths match and `goal` occurs in `s + s`, which KMP checks in linear time.
- **[Rabin–Karp](lesson:rabin-karp)** finds the same matches with a rolling hash. It's easier to extend to many patterns of one length, but its linear time is only expected, not guaranteed.

## Common mistakes

- **Restarting at 0 after a full match** instead of `pi[k − 1]`, which loses overlapping matches ("aa" in "aaa").
- **Falling back with `pi[k]` instead of `pi[k − 1]`:** `k` is a length, so the border's last character is at `k − 1`.
- **Using `if` instead of `while` for the fallback:** one step back isn't always enough.
- **A separator that can occur in the input**, in the combined-string trick.
- **Reading `pi[n − 1]` for an empty string**: guard n = 0 (LC 459 and LC 1392 promise n ≥ 1).

## Practice

Find the Index of the First Occurrence in a String (LC 28), Repeated Substring Pattern (LC 459), Longest Happy Prefix (LC 1392), Shortest Palindrome (LC 214), Repeated String Match (LC 686), Rotate String (LC 796).

## Key takeaways

- A border is a proper prefix that's also a suffix; `pi[i]` is the longest border of `s[0..i]`.
- On a mismatch, fall back to the border of the border, `pi[k − 1]`, with a `while` loop: O(n) in total.
- KMP runs the same loop over the text, never moving the text pointer back: O(n + m).
- The shortest period is `n − pi[n − 1]`; s is a whole repetition when that period divides n.
- `prefixFunction(s + "#" + reverse(s))` gives the longest palindromic prefix.

## Knowledge check

```quiz
? After a full match, why does KMP continue from k = pi[k − 1] rather than k = 0?
+ So that overlapping matches are found: the matched text's longest border may already be the start of the next match
- To save memory
! Memory isn't affected.
- Because pi[k − 1] is always 0
! It's often larger; that's the point.
- It makes no difference
! Searching for "aa" in "aaa" finds one match instead of two with k = 0.
> The text pointer never moves back, so the border must carry over.

? For s = "abcabcabc", pi[n − 1] = 6. What's the shortest period, and is s a whole repetition?
+ 3, and yes: 9 % 3 == 0, so s is "abc" three times
- 6, and no
! The period is n − pi[n − 1] = 3.
- 3, but no
! 3 divides 9.
- 9, and no
! A period shorter than n exists.
> The shortest period is n − pi[n − 1].

? The prefix function has a while loop inside a for loop. Why is it still O(n)?
+ k grows by at most 1 per step, and every fallback shrinks it, so there are at most n fallbacks in total
- Because the while loop runs at most once per step
! It can run several times in one step.
- Because strings are short
! The bound holds for any length.
- It isn't; it's O(n²)
! The total number of fallbacks is bounded.
> An amortized argument: k can't fall more than it has risen.

? Why does Shortest Palindrome compute the prefix function of s + "#" + reverse(s)?
+ Its last value is the longest prefix of s that equals a suffix of reverse(s), which is the longest palindromic prefix
- To find every palindrome in s
! It finds only the longest palindromic prefix.
- To reverse s in linear time
! Reversing is done with StringBuilder.
- Because '#' sorts before letters
! The '#' only stops a border from running across the middle.
> Put the rest of s, reversed, in front of it.
```
