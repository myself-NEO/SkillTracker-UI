## The idea

Don't enumerate paths: track how far you can reach. In Jump Game I, the indexes you can reach always form a prefix `[0, reach]`, so one number replaces a whole table. In Jump Game II, the indexes reachable with exactly k jumps form a contiguous window, so a BFS by layers needs no queue: two numbers mark where the current layer ends and how far the next one reaches.

## When to use it

- "Can you reach the last index?", "what is the minimum number of jumps?"
- Covering a range with the fewest intervals: Video Stitching (LC 1024), Minimum Number of Taps to Open to Water a Garden (LC 1326). Each is Jump Game II on intervals.
- Any one-directional reachability where each position extends the range of positions you can reach.

## How it works

- **Jump Game I:** scan left to right with `reach`, the farthest index reachable so far. If `i > reach`, index i can't be reached, and nothing after it can either. Otherwise extend `reach` to `max(reach, i + nums[i])`.
- **Jump Game II is BFS without a queue.** Layer k is the window of indexes whose fewest jumps is k. While scanning a layer, `farthest` collects the end of the next window; reaching `layerEnd` means the layer is used up, and one more jump is needed.
- **Why the layers are optimal (greedy stays ahead):** after k jumps, the greedy window reaches the farthest index that any k-jump path can reach, so no path gets to the end in fewer jumps.

```text
nums       2   3   1   1   4
index      0   1   2   3   4
layer 0   [0]
layer 1       [1   2]           farthest from layer 0: 0 + 2 = 2
layer 2               [3   4]   farthest from layer 1: 1 + 3 = 4, the end: 2 jumps
```

## Java template

```java
// LC 55 Jump Game: can you reach the last index? Track the farthest reachable index.
public boolean canJump(int[] nums) {
    int reach = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > reach) return false;            // i can't be reached: neither can anything after it
        reach = Math.max(reach, i + nums[i]);
    }
    return true;
}
```

## Worked examples

### Jump Game (LC 55): from DP to greedy

`nums[i]` is the longest jump from index i; starting at index 0, can you reach the last index? The DP is easy to justify: `dp[i]` is true if some reachable `j < i` has `j + nums[j] ≥ i`.

```java
static boolean canJumpDp(int[] nums) {
    int n = nums.length;
    boolean[] dp = new boolean[n];
    dp[0] = true;
    for (int i = 1; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (dp[j] && j + nums[j] >= i) { dp[i] = true; break; }
        }
    }
    return dp[n - 1];
}
```

That's O(n²). Now look at the shape of `dp`: if index i is reachable, so is every index before it, because some jump on the path to i passed over it and could have stopped there instead. The `true` values always form a prefix, so one number, the end of that prefix, describes the whole table. That number is the template's `reach`, and it makes the solution O(n).

Walking from the DP to the greedy like this is a good way to answer "why does the greedy work?" in an interview.

### Jump Game II (LC 45): BFS by layers

Find the fewest jumps to the last index (it's guaranteed reachable). The DP `dp[i] = min(dp[j] + 1)` over every j that reaches i is O(n²); the layer scan is O(n):

```java
// LC 45 Jump Game II: the fewest jumps (the end is always reachable). BFS by layers, in O(1) space.
public int jump(int[] nums) {
    int jumps = 0, layerEnd = 0, farthest = 0;     // [.., layerEnd] is reachable with 'jumps' jumps
    for (int i = 0; i < nums.length - 1; i++) {
        farthest = Math.max(farthest, i + nums[i]);
        if (i == layerEnd) {                       // this layer is used up: one more jump
            jumps++;
            layerEnd = farthest;
        }
    }
    return jumps;
}
```

The loop stops at `n − 2`: standing on the last index needs no further jump, and scanning it could count one jump too many. On `[2, 3, 1, 1, 4]` it returns 2 (0 → 1 → 4), as in the layer diagram above.

### Video Stitching (LC 1024): a jump game on intervals

Clips `[start, end]` cover parts of a video of length `time`. Find the fewest clips that cover `[0, time]`, or −1. For each start position, only the clip reaching farthest matters: that turns position s into a jump to `farthestFrom[s]`, and the rest is Jump Game II, plus a check for gaps, because coverage isn't guaranteed.

```java
// LC 1024 Video Stitching: the fewest clips covering [0, time], or -1.
public int videoStitching(int[][] clips, int time) {
    int[] farthestFrom = new int[time + 1];        // the farthest end of a clip starting at s
    for (int[] c : clips) {
        if (c[0] <= time) farthestFrom[c[0]] = Math.max(farthestFrom[c[0]], c[1]);
    }
    int count = 0, layerEnd = 0, farthest = 0;
    for (int i = 0; i < time; i++) {
        farthest = Math.max(farthest, farthestFrom[i]);
        if (i == layerEnd) {                       // the clips taken so far end here: take one more
            if (farthest <= i) return -1;          // nothing reaches past i: a gap
            count++;
            layerEnd = farthest;
        }
    }
    return count;
}
```

For clips `[[0,2],[4,6],[8,10],[1,9],[1,5],[5,9]]` and `time = 10`, it takes `[0,2]`, `[1,9]` and `[8,10]`: 3 clips. Minimum Number of Taps (LC 1326) is the same problem once each tap at i with range r becomes the clip `[i − r, i + r]`, clamped to the garden.

## Complexity

| Problem | Time | Space |
|---|---|---|
| Jump Game, greedy | O(n) | O(1) |
| Jump Game, DP | O(n²) | O(n) |
| Jump Game II | O(n) | O(1) |
| Video Stitching | O(clips + time) | O(time) |

## Variations

- **Jump Game III (LC 1306):** jumps go left *or* right, so reachability is a real graph search: [BFS](lesson:breadth-first-search) or DFS from the start, looking for a zero.
- **Jump Game VI (LC 1696):** maximise a score instead: `dp[i] = nums[i] + max(dp[i − k..i − 1])`, with a [monotonic deque](lesson:monotonic-deque) for the window maximum.
- **Jump Game VII (LC 1871):** you may land only on `'0'`s within a window of jump lengths; a [sliding window](lesson:sliding-window) count of reachable indexes keeps it O(n).
- **Frog Jump (LC 403):** the next jump's length depends on the last one, so the state needs (position, last jump): DP, not greedy.

## Common mistakes

- **Scanning the last index in Jump Game II**, which can add a jump that isn't needed: loop to `n − 2`.
- **Forgetting the gap check** when reaching the end isn't guaranteed (Video Stitching, Taps): if the window can't grow, return −1.
- **Using a real BFS queue**: it works, but it can enqueue O(n²) edges, where the layer window does the same job in O(n).
- **Applying the greedy to two-way jumps**: once jumps can go backwards (Jump Game III), the reachable set is no longer a prefix.

## Practice

Jump Game (LC 55), Jump Game II (LC 45), Video Stitching (LC 1024), Minimum Number of Taps to Open to Water a Garden (LC 1326), Jump Game III (LC 1306), Jump Game VII (LC 1871).

## Key takeaways

- Track the farthest reachable index instead of enumerating paths.
- In Jump Game I, the reachable indexes form a prefix, which is why one number replaces the DP table.
- Jump Game II is BFS by layers with two numbers: where the current layer ends, and how far the next one reaches.
- Interval covering (Video Stitching, Taps) is Jump Game II once you keep the farthest end per start.
- Check for gaps when reaching the end isn't guaranteed.

## Knowledge check

```quiz
? Why can Jump Game I keep a single number instead of a boolean table?
+ The reachable indexes always form a prefix [0, reach], so its end describes the whole table
- Because every index is reachable
! Some inputs, such as [3, 2, 1, 0, 4], have unreachable indexes.
- Because every jump has length 1
! Jumps can be any length up to nums[i].
- Because only the last index matters
! Every index's jump matters while scanning.
> If i is reachable, so is every index before it.

? nums = [2, 3, 1, 1, 4]. What does Jump Game II return?
+ 2: index 0 → 1 → 4
- 1
! From index 0, the farthest jump reaches index 2.
- 3
! 0 → 1 → 4 takes two jumps.
- 4
! That's one jump per step, ignoring the longer jumps.
> The layers are {0}, {1, 2} and {3, 4}.

? Why does Jump Game II's loop stop at n − 2?
+ Standing on the last index needs no further jump; scanning it can count one jump too many
- To avoid an index out of bounds error
! nums[n − 1] is a valid index.
- Because the last element is always 0
! It can be anything.
- It's only an optimisation
! It changes the answer: [1, 1] would return 2 instead of 1.
> When i == layerEnd at the last index, the loop would add a jump.

? In Video Stitching, when does the scan return −1?
+ When it reaches the end of the clips taken so far and no clip reaches past that point
- When two clips overlap
! Overlaps are normal; the scan keeps the farthest end.
- When a clip ends after time
! Clips may run past the end of the video.
- Never: the video can always be covered
! Unlike Jump Game II, coverage isn't guaranteed.
> farthest <= i at the end of a layer means a gap.
```
