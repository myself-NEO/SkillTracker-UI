## The idea

Greedy needs "the best choice right now" at every step. When the set of options changes as you go (items get combined, new options unlock, earlier choices turn out to be mistakes), a [heap](lesson:heap-basics) keeps that best choice O(log n) away. It comes in two flavours:
- **Take the best, repeatedly:** combine the two cheapest sticks, place the most frequent letter.
- **Regret:** process items in a forced order and commit tentatively, keeping past choices (or skipped options) in a heap. When you hit a wall, undo the worst choice or pull in the best skipped one: the best decision in hindsight.

## When to use it

- "Minimum cost to combine", "maximum result after k operations".
- "Rearrange so that no two equal items are adjacent", or so that equal items are at least k apart.
- Items arrive in a forced order (by deadline, by position, by required capital), and an earlier choice may look wrong once you know more.

## How it works

The regret problems share one shape. Only the order, the heap's contents and the moment you consult it change:

| Problem, in its forced order | The heap holds | When the heap is used |
|---|---|---|
| Course Schedule III (630), by deadline | durations taken (max-heap) | over the deadline: drop the longest course |
| Refueling Stops (871), by position | fuel at the stations passed (max-heap) | out of fuel: refuel at the biggest station passed |
| IPO (502), by required capital | profits now affordable (max-heap) | each round: take the most profitable |
| Furthest Building (1642), building by building | climbs given ladders (min-heap) | more climbs than ladders: pay the smallest with bricks |

Why each one is safe comes with its example below. The common thread: the heap keeps every option seen so far, so each decision is made, or remade, with everything known at that point.

## Java template

The purest regret greedy is Course Schedule III (LC 630): courses `[duration, lastDay]`, one at a time, and you want as many as possible.

```java
// LC 630 Course Schedule III: courses [duration, lastDay]; take as many as possible.
public int scheduleCourse(int[][] courses) {
    int[][] c = courses.clone();
    Arrays.sort(c, Comparator.comparingInt(x -> x[1]));          // earliest deadline first
    // longest on top
    PriorityQueue<Integer> taken = new PriorityQueue<>(Comparator.reverseOrder());
    int time = 0;
    for (int[] course : c) {
        taken.offer(course[0]);
        time += course[0];
        // over the deadline: drop the LONGEST course so far
        if (time > course[1]) time -= taken.poll();
    }
    return taken.size();
}
```

## Worked examples

### Course Schedule III (LC 630): drop the longest

For `[[100,200],[200,1300],[1000,1250],[2000,3200]]`, the deadline order is 200, 1250, 1300, 3200. The first three courses fit, finishing at day 1300. Adding the 2000-day course reaches day 3300, past its deadline of 3200, so the longest course taken, the 2000-day one itself, is dropped: 3 courses.

**Why dropping the longest course is safe:** before the current course was added, the courses taken fitted by the previous deadline, which is no later than the current one. Adding the current course and dropping the longest (which is at least as long) leaves the same count as before with `time` no larger, so everything still fits, and a smaller `time` can only help the courses that come later.

### Minimum Number of Refueling Stops (LC 871): refuel in hindsight

```java
// LC 871 Minimum Number of Refueling Stops: decide on stops only when you run out.
public int minRefuelStops(int target, int startFuel, int[][] stations) {
    // fuel at stations passed
    PriorityQueue<Integer> passed = new PriorityQueue<>(Comparator.reverseOrder());
    long reach = startFuel;                          // the farthest position we can get to
    int stops = 0, i = 0;
    while (reach < target) {
        while (i < stations.length && stations[i][0] <= reach) passed.offer(stations[i++][1]);
        if (passed.isEmpty()) return -1;        // stuck, with nothing left to refuel from
        reach += passed.poll();                 // "retroactively" stop at the biggest one we passed
        stops++;
    }
    return stops;
}
```

**Why refuelling in hindsight is legal:** only *which* stations you stop at matters, not when you decide. So keep driving, and when the tank runs out, pretend you stopped at the biggest station you passed. With `target = 100`, `startFuel = 10` and stations `[[10,60],[20,30],[30,30],[60,40]]`, the first stop takes the 60 (reaching 70) and the second takes the 40 (reaching 110): 2 stops.

### IPO (LC 502): options unlock as capital grows

```java
// LC 502 IPO: at most k projects; a project needs capital[i] and adds profits[i].
public int findMaximizedCapital(int k, int w, int[] profits, int[] capital) {
    int n = profits.length;
    Integer[] byCapital = new Integer[n];
    for (int i = 0; i < n; i++) byCapital[i] = i;
    Arrays.sort(byCapital, Comparator.comparingInt(i -> capital[i]));
    PriorityQueue<Integer> affordable = new PriorityQueue<>(Comparator.reverseOrder());
    int next = 0;
    for (int round = 0; round < k; round++) {
        while (next < n && capital[byCapital[next]] <= w) {      // everything affordable so far
            affordable.offer(profits[byCapital[next++]]);
        }
        if (affordable.isEmpty()) break;          // nothing affordable: capital can't grow any more
        w += affordable.poll();                   // the most profitable project we can afford now
    }
    return w;
}
```

Capital only grows, so a project that becomes affordable stays affordable: the sorted pointer unlocks each project once, and the heap always offers the best one unlocked so far. With `k = 2`, `w = 0`, `profits = [1, 2, 3]` and `capital = [0, 1, 1]`, the first round can afford only the project worth 1; then both others unlock, and the second round takes 3: final capital 4.

### Furthest Building You Can Reach (LC 1642): a min-heap of ladder climbs

```java
// LC 1642: ladders cover the biggest climbs, bricks pay for the rest.
public int furthestBuilding(int[] heights, int bricks, int ladders) {
    PriorityQueue<Integer> ladderClimbs = new PriorityQueue<>();   // min-heap: the smallest climb on top
    for (int i = 0; i < heights.length - 1; i++) {
        int climb = heights[i + 1] - heights[i];
        if (climb <= 0) continue;                   // going down or level is free
        ladderClimbs.offer(climb);                  // use a ladder, for now
        if (ladderClimbs.size() > ladders) {        // one ladder too many: pay the smallest climb with bricks
            bricks -= ladderClimbs.poll();
            if (bricks < 0) return i;
        }
    }
    return heights.length - 1;
}
```

Ladders are worth the most on the biggest climbs, so the heap keeps the `ladders` largest climbs seen so far, and every other climb is paid in bricks. For `heights = [4,2,7,6,9,14,12]` with 5 bricks and 1 ladder, the answer is building 4: the climb to 14 can't be paid for.

### Minimum Cost to Connect Sticks (LC 1167): Huffman

```java
public int connectSticks(int[] sticks) {
    PriorityQueue<Integer> heap = new PriorityQueue<>(Arrays.stream(sticks).boxed().toList());
    int cost = 0;
    while (heap.size() > 1) {
        int combined = heap.poll() + heap.poll();   // always join the two cheapest
        cost += combined;
        heap.offer(combined);
    }
    return cost;
}
```

**Why it's correct:** every stick's length is paid again in each later join it takes part in, so short sticks should be joined early (they'll be paid for more often) and long ones late. This is exactly **Huffman coding**: it's worth saying the name. For `[2, 4, 3]`: join 2 + 3 for 5, then 5 + 4 for 9, a total of 14.

### Reorganize String (LC 767): hold the last letter back

Rearrange s so that no two adjacent letters are equal, or return `""`.

```java
public String reorganizeString(String s) {
    int[] counts = new int[26];
    for (char c : s.toCharArray()) counts[c - 'a']++;

    PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(b[1], a[1]));
    for (int i = 0; i < 26; i++)
        if (counts[i] > 0) {
            if (counts[i] > (s.length() + 1) / 2) return "";   // impossible
            heap.offer(new int[]{i, counts[i]});
        }

    StringBuilder sb = new StringBuilder();
    int[] prev = null;                          // held back for exactly one round
    while (!heap.isEmpty()) {
        int[] cur = heap.poll();
        sb.append((char) ('a' + cur[0]));
        cur[1]--;
        if (prev != null && prev[1] > 0) heap.offer(prev);   // now safe to reuse
        prev = cur;
    }
    return sb.length() == s.length() ? sb.toString() : "";
}
```

**Holding the previous letter back for one round** is the whole trick. The most frequent available letter is always placed next, and the letter just placed is barred for exactly one step, so no two adjacent letters can match. `"aab"` becomes `"aba"`.

**The feasibility check** is worth deriving out loud: the most frequent letter needs a different letter after each of its copies except the last, so it can fill at most ⌈n/2⌉ positions. More than `(n + 1) / 2` copies is impossible.

## Complexity

| Problem | Time | Space |
|---|---|---|
| Course Schedule III | O(n log n) | O(n) |
| Refueling Stops | O(n log n) | O(n) |
| IPO | O(n log n + k log n) | O(n) |
| Furthest Building | O(n log L), for L ladders | O(L) |
| Connect Sticks | O(n log n) | O(n) |
| Reorganize String | O(n): the heap holds at most 26 letters | O(1) beyond the output |

## Variations

- **[Task Scheduler](lesson:partition-labels-and-task-scheduler)** is Reorganize String with a cooldown of n slots.
- **Rearrange String k Distance Apart (LC 358)** and **Distant Barcodes (LC 1054)** use the same "most frequent allowed item first".
- **Maximum Performance of a Team (LC 1383):** sort by efficiency, descending, and keep the k fastest speeds in a min-heap.
- **Maximum Average Pass Ratio (LC 1792):** a max-heap ordered by the gain from adding one more student to each class.
- **Single-Threaded CPU (LC 1834):** tasks unlock by enqueue time, as projects do in IPO, and a heap picks the shortest available one.

## Common mistakes

- **The wrong heap direction**: Course Schedule III drops the *longest* course (a max-heap), while Furthest Building pays the *smallest* climb with bricks (a min-heap).
- **`(a, b) -> b - a` as a max-heap comparator**: it can overflow; use `Comparator.reverseOrder()`.
- **Skipping the sort into the forced order**: regret only works when items arrive by deadline, position or capital.
- **Polling an empty heap**: `poll()` returns `null`, and unboxing it throws. Check `isEmpty()` first, as Refueling Stops and IPO do.
- **Indexing letters with the wrong base**: LC 767's input is lowercase, so the index is `c - 'a'`; `c - 'A'` lands far outside a 26-slot array.

## Practice

Course Schedule III (LC 630), Minimum Number of Refueling Stops (LC 871), IPO (LC 502), Furthest Building You Can Reach (LC 1642), Minimum Cost to Connect Sticks (LC 1167), Reorganize String (LC 767), Maximum Performance of a Team (LC 1383).

## Key takeaways

- A heap gives greedy "the best choice right now" in O(log n) while the options change.
- Regret: commit tentatively in the forced order, and undo the worst choice when you hit a wall.
- Course Schedule III drops the longest course; Refueling Stops refuels at the biggest station passed.
- Joining the two cheapest items, repeatedly, is Huffman coding.
- Hold the last item used back for one round to keep equal items apart.

## Knowledge check

```quiz
? In Course Schedule III, the running time passes the current course's deadline. What happens?
+ The longest course taken so far is dropped, which may be the current one
- The current course is dropped
! Dropping the longest course frees at least as much time.
- The course with the earliest deadline is dropped
! Its deadline was met; length is what matters.
- The scan stops: no more courses fit
! A later short course may still fit once a long one is dropped.
> A max-heap of durations finds the longest.

? Why can Refueling Stops choose its stops only after running out of fuel?
+ Only which stations you stop at matters, not when you decide, so choosing the biggest station passed is still legal
- Because stations can be visited twice
! Each station is passed once.
- Because fuel can be borrowed
! It can't.
- Because the stations are sorted by fuel
! They're sorted by position.
> Refuel "in hindsight" at the biggest station passed.

? sticks = [2, 4, 3], and joining two sticks costs their total length. What is the minimum cost to join them all?
+ 14: join 2 + 3 for 5, then 5 + 4 for 9
- 9
! That's only the last join.
- 15
! Joining 2 + 4 first costs 6, then 6 + 3 costs 9: 15, which is worse.
- 16
! Joining 4 + 3 first costs 7, then 7 + 2 costs 9: 16.
> Join the two cheapest every time: Huffman coding.

? In Reorganize String, why is the letter just placed held back for one round?
+ So that the next letter placed can't be the same one, while the most frequent other letter still goes first
- To sort the letters
! The heap does the ordering.
- To count the letters
! They're counted beforehand.
- To make the algorithm stable
! Stability isn't the concern.
> It goes back into the heap after one other letter is placed.
```
