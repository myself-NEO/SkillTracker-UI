## The idea

Use two indices moving through the array (or string) instead of nested loops, exploiting some structure, usually sortedness, to eliminate one loop entirely.

There are two distinct sub-patterns; don't conflate them:

- **Converging (opposite-direction) pointers** start at both ends and move toward each other.
- **Same-direction (read/write, or fast/slow) pointers** both move forward: one scans ahead while the other marks a boundary.

## When to use it

- The array is **sorted** (or can be sorted without losing what the answer needs), and you're looking for a **pair or triplet** that matches a target sum or difference.
- Something is **symmetric from both ends**: checking a palindrome, reversing in place, two lines that bound a container.
- You must work **in place with O(1) extra space**: removing duplicates, moving zeros, compacting an array.
- You're **partitioning** an array into regions, as in the Dutch national flag problem.

If the input isn't sorted and sorting would lose information the answer needs, such as the original indices in Two Sum (LC 1), use a [hash map](lesson:hashing-techniques) instead.

## How it works

**Converging pointers** rest on an elimination argument. Take a sorted array and a target sum, with `left` at the start and `right` at the end:

- If `arr[left] + arr[right] < target`, then `arr[left]` plus *any* element up to `arr[right]` is also too small, because the array is sorted. So `arr[left]` can't be in any answer, and you discard it: `left++`.
- If the sum is too large, the same argument discards `arr[right]`: `right--`.

Every step rules out one element for good, so the scan is O(n) instead of the O(n²) of checking every pair.

**Same-direction pointers** keep an invariant. `slow` (or `write`) marks the end of the region you've already decided to keep, and `fast` (or `read`) explores ahead. An element is copied to the kept region only when it passes the test, so everything before `slow` is always a correct partial answer.

## Java template

```java
// Converging: one pointer at each end
int left = 0, right = arr.length - 1;
while (left < right) {
    // look at arr[left] and arr[right]
    if (/* need a larger value */) left++;
    else if (/* need a smaller value */) right--;
    else { /* record an answer */ left++; right--; }
}
```

```java
// Same direction: write keeps what read accepts
int write = 0;
for (int read = 0; read < arr.length; read++) {
    if (/* arr[read] should be kept */) arr[write++] = arr[read];
}
// arr[0..write) is the result
```

## Worked examples

**Two Sum II, sorted input (LC 167).** The elimination argument above, as code:

```java
public int[] twoSumSorted(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left < right) {
        int sum = arr[left] + arr[right];
        if (sum == target) return new int[]{left, right};
        else if (sum < target) left++;   // need a bigger sum → move left up
        else right--;                     // need a smaller sum → move right down
    }
    return new int[]{-1, -1};
}
```

**Container With Most Water (LC 11).** Given heights, find two lines that, together with the x-axis, hold the most water.

*Approach:* start with the widest possible container (both ends). The water level is capped by the **shorter** line. Moving the taller line inward can only make the container narrower without raising that cap, so it can never improve the result. Moving the shorter line is the only move that could help, so it's always correct to move it.

```java
public int maxArea(int[] height) {
    int left = 0, right = height.length - 1, best = 0;
    while (left < right) {
        int width = right - left;
        int h = Math.min(height[left], height[right]);
        best = Math.max(best, width * h);
        if (height[left] < height[right]) left++;
        else right--;
    }
    return best;
}
```

**Remove Duplicates from Sorted Array (LC 26).** Same-direction pointers:

```java
public int removeDuplicates(int[] nums) {
    if (nums.length == 0) return 0;
    int slow = 0;
    for (int fast = 1; fast < nums.length; fast++) {
        if (nums[fast] != nums[slow]) {
            slow++;
            nums[slow] = nums[fast];
        }
    }
    return slow + 1; // new length
}
```

`slow` always points at the last confirmed-unique element; `fast` explores ahead and only "commits" a new value when it differs from what `slow` holds.

## Complexity

| Pattern | Time | Extra space |
|---|---|---|
| Converging or same-direction scan | O(n) | O(1) |
| Sort first, then scan | O(n log n) | O(1) to O(n), depending on the sort |
| 3Sum (sort, then a converging scan per element) | O(n²) | O(1) besides the output |

Each improves on the brute force by one polynomial degree: O(n²) for pairs, O(n³) for triplets.

## Variations

**3Sum (LC 15).** Sort, fix the first element, and run converging pointers over the rest. The duplicates are the hard part: skip a first element equal to the previous one, and after recording a triplet, skip repeated second elements.

```java
public List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> result = new ArrayList<>();
    for (int i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;       // same first value, same triplets
        int left = i + 1, right = nums.length - 1;
        while (left < right) {
            int sum = nums[i] + nums[left] + nums[right];
            if (sum < 0) left++;
            else if (sum > 0) right--;
            else {
                result.add(List.of(nums[i], nums[left], nums[right]));
                left++;
                right--;
                while (left < right && nums[left] == nums[left - 1]) left++;   // skip repeats
            }
        }
    }
    return result;
}
```

**Fast and slow at different speeds.** One pointer moves twice as fast as the other: that's Floyd's cycle detection (tortoise and hare), used mostly on linked lists. See [fast and slow pointers](lesson:fast-and-slow-pointers).

**Three pointers for partitioning.** Sort Colors (LC 75) splits an array into three regions in one pass; it's the partition step of [quicksort](lesson:quicksort-and-quickselect).

**Both ends of a string.** Checking and building palindromes is converging pointers on characters; see [palindromes](lesson:palindromes).

**Trapping Rain Water (LC 42)** can be solved with converging pointers that track the highest wall seen from each side, as well as with a [monotonic stack](lesson:monotonic-stack).

## Common mistakes

- **Forgetting that converging pointers need sorted input.** The elimination argument relies on monotonicity; on unsorted data it discards elements that could be in the answer.
- **Using `while (left <= right)` for pairs.** For pair-finding you almost always want strict `<`: a pointer shouldn't pair with itself.
- **Not handling duplicates when the problem wants unique pairs or triplets.** 3Sum needs explicit skipping, such as `while (left < right && nums[left] == nums[left - 1]) left++;`.
- **Moving both pointers when only one should move.** After a match you may move both; otherwise move exactly the one the comparison rules out.

## Practice

Two Sum II (LC 167), 3Sum (LC 15), 3Sum Closest (LC 16), Container With Most Water (LC 11), Trapping Rain Water (LC 42), Valid Palindrome (LC 125), Sort Colors (LC 75), Remove Duplicates from Sorted Array (LC 26), Move Zeroes (LC 283).

## Key takeaways

- Two pointers replace a nested loop with a single scan, using structure, usually sortedness, to discard one element per step.
- Converging pointers find pairs in sorted data; same-direction pointers compact or partition in place.
- Each step must rule an element out for good; that elimination argument is what makes the scan correct.
- Sorting first costs O(n log n) and loses the original order; when you need the original indices, use a hash map instead.
- For unique triplets or pairs, skip duplicates explicitly.

## Knowledge check

```quiz
? In Two Sum II, the array is sorted and `arr[left] + arr[right]` is smaller than the target. What do you do, and why?
+ Move `left` up: `arr[left]` plus anything up to `arr[right]` is too small, so it can't be in any answer
- Move `right` down
! That would make the sum smaller still.
- Move both pointers inward
! You'd skip a pair that could still be the answer.
- Restart from the next pair
! Restarting is the O(n²) brute force that two pointers avoid.
> Each step discards one element for good, which is why the scan is linear.

? Container With Most Water: why is moving the shorter line always safe?
+ The water level is capped by the shorter line, so moving the taller one can only shrink the container
- Because the array is sorted
! Heights aren't sorted; the argument is about the cap, not order.
- Because the shorter line is always part of the best answer
! It isn't; that's exactly why it's discarded.
- It isn't safe; you must try both moves
! Trying both turns the scan back into O(n²).
> Narrowing the container without raising its cap can never help.

? Two Sum (LC 1) gives an unsorted array and asks for the original indices. Why are two pointers a poor fit?
+ Sorting would scramble the indices you need to return; a hash map of seen values solves it in O(n)
- Two pointers can't handle negative numbers
! Negatives are fine once the array is sorted.
- Two pointers need the array to have an even length
! There's no such requirement.
- The answer might use the same element twice
! The problem forbids reusing an element; that's not the issue.
> Two pointers need sorted data; when sorting loses information, use hashing.

? What does the same-direction (read/write) pattern guarantee at every step?
+ Everything before the write pointer is part of a correct answer so far
- The array is sorted
! Compaction doesn't sort anything.
- The two pointers are always adjacent
! The gap grows as elements are skipped.
- The read pointer never passes the write pointer
! It's the other way round: read is always at or ahead of write.
> The kept region grows only with elements that pass the test.
```
