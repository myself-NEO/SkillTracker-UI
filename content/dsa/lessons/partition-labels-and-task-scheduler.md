## The idea

Two greedy problems where counting replaces search:
- **Partition Labels:** record where every letter appears last, then scan, stretching the current part to the last occurrence of each letter you see. When the scan reaches the stretched end, nothing inside the part appears later, so cut.
- **Task Scheduler:** the most frequent task decides the shape of the schedule, so its length can be counted instead of simulated.

## When to use it

- "Split into as many parts as possible such that…", where each item constrains a range.
- "The most chunks such that sorting each chunk sorts everything": cut where everything up to here belongs here.
- Arranging items under a cooldown or spacing rule, minimising the total length.

## How it works

- **Partition Labels is interval merging in disguise.** Each letter is the interval `[first, last]` of its occurrences, and the parts are the merged groups ([merge intervals](lesson:interval-basics)). The scan never builds the intervals: `end = max(end, last[c])` merges them on the fly.
- **Task Scheduler's frames:** with `max` copies of the most frequent task, you need `max − 1` full frames of `n + 1` slots, plus a last row holding every task tied for the maximum:

```text
tasks A A A B B B, n = 2       max = 3, tied = 2 (A and B)
A B _ | A B _ | A B            (3 - 1) * (2 + 1) + 2 = 8
```

If there are so many different tasks that they overflow the frames, there's no idle time at all, and the answer is simply `tasks.length`. That's what the final `max` in the code handles.

## Java template

The last-occurrence scan:

```java
// LC 763 Partition Labels: split s into as many parts as possible so each letter appears in only one part.
public List<Integer> partitionLabels(String s) {
    int[] last = new int[26];
    for (int i = 0; i < s.length(); i++) last[s.charAt(i) - 'a'] = i;
    List<Integer> sizes = new ArrayList<>();
    int start = 0, end = 0;
    for (int i = 0; i < s.length(); i++) {
        // the part must reach every copy of its letters
        end = Math.max(end, last[s.charAt(i) - 'a']);
        if (i == end) {                                 // nothing in this part appears later: cut
            sizes.add(end - start + 1);
            start = i + 1;
        }
    }
    return sizes;
}
```

## Worked examples

### Partition Labels (LC 763)

`"ababcbacadefegdehijhklij"` splits into `"ababcbaca"`, `"defegde"` and `"hijhklij"`: sizes `[9, 7, 8]`. The first part starts with `a`, whose last copy is at index 8. Every other letter met on the way (b and c) also ends by index 8, so the cut lands there.

### Max Chunks To Make Sorted (LC 769)

`arr` is a permutation of `0..n−1`. Split it into as many chunks as possible so that sorting each chunk sorts the whole array. A chunk can end at index i exactly when the values `0..i` all lie in `arr[0..i]`, which happens when the largest value so far is i: the same "stretch until the scan catches up" shape.

```java
// LC 769 Max Chunks To Make Sorted: arr is a permutation of 0..n-1.
public int maxChunksToSorted(int[] arr) {
    int chunks = 0, maxSoFar = 0;
    for (int i = 0; i < arr.length; i++) {
        maxSoFar = Math.max(maxSoFar, arr[i]);
        if (maxSoFar == i) chunks++;        // 0..i all lie in arr[0..i]: cut here
    }
    return chunks;
}
```

`[1, 0, 2, 3, 4]` gives 4 chunks (`[1, 0]`, `[2]`, `[3]`, `[4]`), and `[4, 3, 2, 1, 0]` gives 1.

### Task Scheduler (LC 621): count, don't simulate

```java
// LC 621 Task Scheduler: the same task needs n idle slots
// between runs. Count frames instead of simulating.
public int leastInterval(char[] tasks, int n) {
    int[] count = new int[26];
    for (char t : tasks) count[t - 'A']++;
    int max = Arrays.stream(count).max().getAsInt();
    int tiedForMax = (int) Arrays.stream(count).filter(c -> c == max).count();
    int framed = (max - 1) * (n + 1) + tiedForMax;   // (max - 1) full frames, then the last row
    return Math.max(framed, tasks.length);           // with enough variety there is no idle time
}
```

The formula gives only the length. **Simulating** also produces the schedule, and it's the version that generalises to [Reorganize String](lesson:greedy-with-a-heap) and to k-distance rearrangements: a max-heap picks the most frequent task allowed to run, and a queue holds the tasks waiting out their cooldown.

```java
// LC 621 by simulation: a max-heap of remaining counts, plus a queue of tasks cooling down.
public int leastIntervalBySimulation(char[] tasks, int n) {
    int[] counts = new int[26];
    for (char t : tasks) counts[t - 'A']++;

    PriorityQueue<Integer> heap = new PriorityQueue<>(Comparator.reverseOrder());
    for (int c : counts) if (c > 0) heap.offer(c);

    Queue<int[]> cooldown = new ArrayDeque<>();   // {remainingCount, timeAvailableAgain}
    int time = 0;

    while (!heap.isEmpty() || !cooldown.isEmpty()) {
        time++;
        if (!heap.isEmpty()) {
            int remaining = heap.poll() - 1;
            if (remaining > 0) cooldown.offer(new int[]{remaining, time + n});
        }
        // release anything whose cooldown expired
        if (!cooldown.isEmpty() && cooldown.peek()[1] == time)
            heap.offer(cooldown.poll()[0]);
    }
    return time;
}
```

Every cooldown has the same length, so tasks leave the queue in the order they ran, and a plain FIFO queue is enough. This "ready set plus waiting set" shape is how real schedulers work.

## Complexity

| Problem | Time | Space |
|---|---|---|
| Partition Labels | O(n) | O(1): 26 last positions |
| Max Chunks To Make Sorted | O(n) | O(1) |
| Task Scheduler, by counting | O(T) for T tasks | O(1) |
| Task Scheduler, by simulation | O(L), for a schedule of length L | O(1): at most 26 counts |

## Variations

- **Max Chunks To Make Sorted II (LC 768):** values can repeat, so cut where the prefix maximum is at most the suffix minimum, or use a [monotonic stack](lesson:monotonic-stack).
- **Rearrange String k Distance Apart (LC 358):** the simulation with no idle slots allowed: if the heap runs dry while tasks are still cooling down, there's no answer.
- **Task Scheduler II (LC 2365):** the tasks must run in the given order. Remember each task type's last day, and skip forward whenever the gap is too short.

## Common mistakes

- **Cutting at a letter's first occurrence** instead of stretching to its last.
- **Forgetting the tie count** in the frame formula: every task tied for the maximum appears in the last row.
- **Forgetting `max(framed, tasks.length)`**: with many distinct tasks, the frames overflow and there's no idle time.
- **Off-by-one cooldowns** in the simulation: a task run at time t is available again at time t + n + 1.

## Practice

Partition Labels (LC 763), Max Chunks To Make Sorted (LC 769), Max Chunks To Make Sorted II (LC 768), Task Scheduler (LC 621), Rearrange String k Distance Apart (LC 358), Task Scheduler II (LC 2365).

## Key takeaways

- Partition Labels stretches the current part to each letter's last occurrence and cuts when the scan reaches the end.
- That scan is interval merging without building the intervals.
- Max Chunks To Make Sorted cuts where the prefix maximum equals the index.
- Task Scheduler: `max((max − 1) · (n + 1) + tied, tasks.length)`.
- Simulate with a heap and a cooldown queue when you need the schedule itself.

## Knowledge check

```quiz
? In Partition Labels, when can the current part be cut at index i?
+ When i equals the furthest last occurrence of any letter seen in the part
- When the letter at i appears for the last time
! Another letter in the part may appear later still.
- When the part holds 26 letters
! Size isn't the condition.
- At every change of letter
! Letters can reappear later.
> end = max(end, last[c]); cut when i == end.

? tasks = A A A B B B, n = 2. What is the shortest schedule?
+ 8: A B _ A B _ A B
- 6
! Each A needs two other slots before the next A.
- 7
! The last row holds both A and B.
- 9
! The last frame needs no idle slot.
> (3 − 1) · (2 + 1) + 2 = 8.

? tasks = A A B B C C D D, n = 1. What does the formula return?
+ 8: the frames overflow, so there's no idle time and the answer is tasks.length
- 6
! That's the frame count; the max with tasks.length raises it to 8.
- 10
! Every slot can be filled, so there's no idle time.
- 16
! There are only eight tasks, and no idle slots are needed.
> With enough variety, the schedule has no idle slots.

? In the simulation, why is a plain queue enough for the tasks cooling down?
+ Every cooldown has the same length, so tasks become available in the order they ran
- Because a queue is faster than a heap
! The reason is order, not speed.
- Because only one task cools down at a time
! Many can wait at once.
- It isn't: a second heap is needed
! Equal cooldowns keep the FIFO order correct.
> FIFO order matches release order.
```
