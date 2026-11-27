## The idea

Maintain a "window" `[left, right]` over the array or string and slide it forward, expanding and shrinking it based on a condition. The brute force recomputes a fresh subarray sum or count from every starting index, which costs O(n²) or worse; the window reuses all but the element that enters and the one that leaves.

## When to use it

- The answer is about a **contiguous** subarray or substring: the longest, the shortest, the maximum sum, or the number of windows that satisfy a condition.
- The window size is **fixed** (`k` is given), or the condition is **monotonic**: if a window is valid, every smaller window inside it is valid too (for "longest"), or every larger one is (for "shortest").
- Typical conditions: at most k distinct characters, no repeated character, a sum of **non-negative** numbers within a bound, character counts that match a pattern.

Negative numbers usually break a sum-based window: adding an element can lower the sum, so there's no rule for when to shrink. "Subarray sum equals k" with negatives needs [prefix sums](lesson:prefix-sums) instead.

## How it works

### Fixed-size window

The window size `k` is given directly. Build the first window, then slide it one step at a time: add the element that enters and subtract the one that leaves. That costs O(n) instead of the brute-force O(n·k).

Step through it, or try your own array and `k`:

```viz name="sliding-window"
{ "array": [2, 1, 5, 1, 3, 2], "k": 3 }
```

### Variable-size window

The window grows and shrinks based on a validity condition; this is the pattern most people mean when they say "sliding window". Expand `right` one step at a time. Whenever the window becomes invalid, shrink it from `left` until it's valid again. Then update the answer.

Each element is added once and removed at most once, so this is O(n) even though it looks like nested loops: `left` only ever moves forward, never resets, across the whole outer loop.

## Java template

Fixed-size window:

```java
public int maxSumSubarray(int[] arr, int k) {
    int windowSum = 0;
    for (int i = 0; i < k; i++) windowSum += arr[i];   // build first window
    int best = windowSum;
    for (int i = k; i < arr.length; i++) {
        windowSum += arr[i] - arr[i - k];   // slide: add new, remove old
        best = Math.max(best, windowSum);
    }
    return best;
}
```

Variable-size window:

```java
int left = 0;
for (int right = 0; right < n; right++) {
    // 1. add arr[right] into the window's running state
    while (/* window state violates the condition */) {
        // 2. remove arr[left] from the window's state
        left++;
    }
    // 3. window [left, right] is now valid — update the answer here
}
```

## Worked examples

**Longest Substring Without Repeating Characters (LC 3).** Expand `right` one character at a time. If the new character is already in the window, shrink from `left` until it isn't. Track the largest window seen.

```java
public int lengthOfLongestSubstring(String s) {
    Set<Character> window = new HashSet<>();
    int left = 0, maxLen = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        while (window.contains(c)) {
            window.remove(s.charAt(left));
            left++;
        }
        window.add(c);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

**Minimum Window Substring (LC 76)** is the canonical "hard" variable-window problem. It introduces the idea of shrinking *while the window is still valid*, rather than until it becomes valid: you're minimising, so you shrink as far as possible while the condition holds. That's the mirror image of the template above.

```java
public String minWindow(String s, String t) {
    if (s.length() < t.length()) return "";
    Map<Character, Integer> need = new HashMap<>();
    for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);

    Map<Character, Integer> window = new HashMap<>();
    int left = 0, required = need.size(), formed = 0;
    int bestLen = Integer.MAX_VALUE, bestLeft = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        window.merge(c, 1, Integer::sum);
        if (need.containsKey(c) && window.get(c).intValue() == need.get(c).intValue()) formed++;

        while (formed == required) {                 // window is currently valid — try to shrink
            if (right - left + 1 < bestLen) {
                bestLen = right - left + 1;
                bestLeft = left;
            }
            char lc = s.charAt(left);
            window.put(lc, window.get(lc) - 1);
            if (need.containsKey(lc) && window.get(lc) < need.get(lc)) formed--;
            left++;
        }
    }
    return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestLeft, bestLeft + bestLen);
}
```

Note the `.intValue()` calls: comparing two `Integer`s with `==` compares references, which fails for counts above 127.

**Permutation in String (LC 567).** Does `s2` contain a permutation of `s1` as a contiguous substring? A fixed-size window of length `s1.length()`, with character counts in `int[26]` arrays:

```java
public boolean checkInclusion(String s1, String s2) {
    if (s1.length() > s2.length()) return false;
    int[] need = new int[26], window = new int[26];
    for (char c : s1.toCharArray()) need[c - 'a']++;

    int left = 0;
    for (int right = 0; right < s2.length(); right++) {
        window[s2.charAt(right) - 'a']++;
        if (right - left + 1 > s1.length()) window[s2.charAt(left++) - 'a']--;
        if (Arrays.equals(need, window)) return true;
    }
    return false;
}
```

This is a fixed-size window combined with the frequency-array idiom from [Arrays & Strings in Java](lesson:arrays-and-strings-in-java). Recognising that combination is often the whole battle.

## Complexity

- **Time:** O(n). Every element enters the window once and leaves at most once. LC 76 is O(|s| + |t|), and LC 567 is O(26 · n) because of the array comparison, which is still linear.
- **Space:** O(1) for a running sum; O(alphabet) or O(min(n, alphabet)) for character counts.

## Variations

- **At most K distinct.** Fruit Into Baskets (LC 904) is "the longest window with at most 2 distinct values": keep a count map and shrink while it has more than K keys.
- **Exactly K, by subtraction.** "Exactly K" isn't monotonic, but "at most K" is, so `exactly(K) = atMost(K) − atMost(K − 1)`. Subarrays with K Different Integers (LC 992) uses this.
- **Counting windows.** When every window inside a valid window is also valid, each `right` adds `right − left + 1` new valid subarrays ending at `right`. Subarray Product Less Than K (LC 713) uses this.
- **Maximum or minimum in every window.** Keep a deque of candidates in decreasing order: see [monotonic deque](lesson:monotonic-deque).

## Common mistakes

- **Shrinking on the wrong condition.** Decide up front whether you're **minimising** (shrink while still valid) or **finding the longest valid window** (shrink until valid again); `while (invalid)` and `while (valid)` give different answers.
- **Updating the answer in the wrong place.** Usually *after* the inner while loop for "longest", and *inside* it for "shortest".
- **Using a window when values can be negative**, for a sum-based condition. Use prefix sums instead.
- **Using a `HashMap` when a fixed `int[26]` array would be simpler and faster**, for lowercase-letter-only problems.

## Practice

Longest Substring Without Repeating Characters (LC 3), Minimum Size Subarray Sum (LC 209), Longest Repeating Character Replacement (LC 424), Permutation in String (LC 567), Find All Anagrams in a String (LC 438), Minimum Window Substring (LC 76), Fruit Into Baskets (LC 904), Max Consecutive Ones III (LC 1004), Subarray Product Less Than K (LC 713).

## Key takeaways

- A sliding window turns "recompute every subarray" into "add the element that enters, drop the one that leaves": O(n).
- It needs contiguity and a monotonic condition. Negative numbers usually break sum-based windows, so reach for prefix sums.
- Expand on the right; shrink on the left. `left` never moves back, which is why the nested loop is still linear.
- For "longest", shrink until valid and update after; for "shortest", shrink while valid and update inside.
- "Exactly K" is `atMost(K) − atMost(K − 1)`.

## Knowledge check

```quiz
? The variable-size window has a loop inside a loop. Why is it still O(n)?
+ `left` only moves forward, so each element is added once and removed at most once
- Because the inner loop runs at most k times
! There's no fixed bound per iteration; the bound is over the whole run.
- Because the JIT removes the inner loop
! Compilers don't change the algorithm's complexity.
- It isn't; it's O(n²) in the worst case
! The total number of removals can't exceed n.
> Across the whole run, the inner loop does at most n removals in total.

? "Find the shortest subarray with sum ≥ target." The values can be negative. Does a plain sliding window work?
+ No: adding an element can lower the sum, so a valid window can become invalid as it grows
- Yes, if you shrink while the sum is at least the target
! With negatives, shrinking from the left can also raise the sum, so the rule breaks.
- Yes, if you sort the array first
! Sorting destroys contiguity.
- Only if the target is positive
! The sign of the target isn't the problem; the negative values are.
> Windows need a monotonic condition. With negatives, use prefix sums (with a monotonic deque for this exact problem, LC 862).

? You're minimising the window (Minimum Window Substring). Where do you update the answer?
+ Inside the shrinking loop, while the window is still valid
- After the shrinking loop finishes
! By then the window is invalid, one step too small.
- Before adding `s[right]`
! The window that includes s[right] hasn't been checked yet.
- Only once, at the end
! The best window can appear at any point in the scan.
> When minimising, every valid window you shrink through is a candidate.

? How do you count subarrays with exactly K distinct integers?
+ atMost(K) − atMost(K − 1), each counted with a sliding window
- A single window that shrinks whenever there are more than K distinct values
! That counts windows with at most K distinct values, not exactly K.
- Sort the array and use two pointers
! Sorting breaks contiguity.
- A prefix sum of distinct counts
! Distinct counts don't subtract like sums do.
> "At most K" is monotonic, so it suits a window; the difference of two such counts is "exactly K".
```
