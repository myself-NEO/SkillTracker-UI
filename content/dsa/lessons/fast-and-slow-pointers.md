## The idea

`slow` moves one step and `fast` moves two. When `fast` reaches the end, `slow` is at the middle. If there's a cycle, `fast` can never reach the end and laps `slow` instead.

## When to use it

- **The middle of the list**, often as the first step of splitting it in half.
- **Cycle detection**: "is there a loop?", and "where does the cycle begin?".
- **Implicit sequences** where `x → f(x)` must eventually repeat: Happy Number, and the duplicate in an array of values `1..n`.
- Any time you'd count the length first and then walk half of it: fast and slow do it in one pass.

## How it works

**Finding the middle.** `fast` covers twice the distance of `slow`, so when `fast` has walked the whole list, `slow` has walked half of it.

**Detecting a cycle.** Without a cycle, `fast` reaches `null`. With one, both pointers end up inside the cycle, where `fast` gains exactly one node per step on `slow`. The gap can't jump over zero, so they meet within one lap.

**Finding where the cycle begins.** After they meet, restart one pointer at the head and move both at speed 1; they meet at the entrance:

```text
head ----- a ----- E ----- b ----- M        E = cycle entrance, M = meeting point
                   \_______________/        c = cycle length
                    (cycle continues back to E)
```

- When they meet, `slow` has walked `a + b` steps (it can't complete a lap first: once both are inside the cycle, the gap closes by one per step, so they meet within one lap).
- `fast` has walked twice as far: `2(a + b) = a + b + k·c` for some whole number of laps `k`.
- So `a + b = k·c`, which means `a = (k - 1)·c + (c - b)`.
- Walking `a` steps from `M` therefore goes `c - b` steps to reach `E`, plus some full laps, and ends **at `E`**.
- Walking `a` steps from `head` also ends at `E`. Two pointers at speed 1, one from each place, meet exactly there.

## Java template

```java
ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {   // check both before fast.next.next
    slow = slow.next;
    fast = fast.next.next;
    // cycle detection: if (slow == fast) ... they met inside a cycle
}
// no cycle: slow is the (second) middle
```

## Worked examples

### Middle of the list (LC 876), and which middle you want

```java
// LC 876: the SECOND middle for even lengths: [1, 2, 3, 4] -> 3.
public ListNode middleNode(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}

// The FIRST middle for even lengths: [1, 2, 3, 4] -> 2. The one you want before cutting in half.
public ListNode middleNodeFirst(ListNode head) {
    if (head == null) return null;
    ListNode slow = head, fast = head;
    while (fast.next != null && fast.next.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}
```

| Length | `middleNode` (second middle) | `middleNodeFirst` (first middle) |
|---|---|---|
| 5: `1 2 3 4 5` | 3 | 3 |
| 4: `1 2 3 4` | **3** | **2** |

**Which one to use:** to **cut a list into two halves** (merge sort, reorder, palindrome), use the *first* middle and cut after it. With the second middle, a 2-node list "splits" into 2 + 0, and merge sort recurses forever.

### Linked List Cycle I and II (LC 141, LC 142)

```java
// LC 141
public boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;    // compare nodes (==), never values
    }
    return false;                         // fast reached the end: there is an end, so no cycle
}

// LC 142: the node where the cycle begins, or null.
public ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {                          // phase 1: they met inside the cycle
            ListNode finder = head;
            while (finder != slow) {                 // phase 2: both at speed 1
                finder = finder.next;
                slow = slow.next;
            }
            return finder;                           // they meet exactly at the entrance
        }
    }
    return null;
}
```

**Why compare nodes, not values:** two different nodes may hold equal values. `slow == fast` compares references, which is what "the same node" means.

## Complexity

O(n) time and O(1) space for the middle, cycle detection and the cycle entrance. The alternative, a `HashSet<ListNode>` of visited nodes, is O(n) space but perfectly acceptable as a first answer (see [hashing and cloning](lesson:hashing-and-cloning-lists)).

## Variations

### The length of the cycle

Once the pointers meet, walk once around the cycle and count:

```java
public int cycleLength(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {                          // inside the cycle: walk once around it
            int length = 1;
            for (ListNode p = slow.next; p != slow; p = p.next) length++;
            return length;
        }
    }
    return 0;
}
```

### Delete the Middle Node (LC 2095)

```java
// LC 2095: delete node floor(n / 2) (0-based). Start fast one step further so slow stops BEFORE it.
public ListNode deleteMiddle(ListNode head) {
    if (head == null || head.next == null) return null;
    ListNode slow = head, fast = head.next.next;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    slow.next = slow.next.next;
    return head;
}
```

To delete a node, `slow` must stop one node **before** it. Starting `fast` two steps ahead does exactly that, with no extra `prev` pointer.

### Implicit lists: Happy Number (LC 202) and Find the Duplicate Number (LC 287)

Floyd's algorithm works on any sequence `x, f(x), f(f(x)), …` over a finite set. Such a sequence must eventually repeat, which means it has a cycle, even though no `ListNode` exists.

```java
// LC 202: the "list" is n -> digitSquareSum(n) -> ...; it either reaches 1 or loops forever.
public boolean isHappy(int n) {
    int slow = n, fast = digitSquareSum(n);
    while (fast != 1 && slow != fast) {
        slow = digitSquareSum(slow);
        fast = digitSquareSum(digitSquareSum(fast));
    }
    return fast == 1;
}

private int digitSquareSum(int n) {
    int sum = 0;
    while (n > 0) {
        int d = n % 10;
        sum += d * d;
        n /= 10;
    }
    return sum;
}
```

```java
// LC 287: n + 1 values in [1, n], exactly one repeated. Read-only array, O(1) space.
// Treat i -> nums[i] as a next pointer: the repeated value is where two pointers merge = a cycle entrance.
public int findDuplicate(int[] nums) {
    int slow = nums[0], fast = nums[0];
    do {                                   // phase 1: meet inside the cycle
        slow = nums[slow];
        fast = nums[nums[fast]];
    } while (slow != fast);
    slow = nums[0];                        // phase 2: same speed from the start
    while (slow != fast) {
        slow = nums[slow];
        fast = nums[fast];
    }
    return slow;                           // the cycle entrance = the duplicate value
}
```

**Why the duplicate is the cycle entrance:** index `i` "points to" `nums[i]`. Values are in `[1, n]`, so nobody points at index 0, which makes 0 the head of the chain, never part of a cycle. The repeated value is pointed to by **two** different indexes. That's exactly the node where the tail joins the cycle: the entrance. It runs in O(n) time, O(1) space, and never modifies the array, which is why it beats sorting or marking the array in place when the problem forbids those.

## Common mistakes

- **`fast.next.next` without checking `fast.next`**, which throws on even-length lists. The loop condition must check `fast != null && fast.next != null`.
- **Comparing values instead of nodes** in cycle detection: equal values in different nodes would look like a meeting.
- **Splitting at the second middle**, so a 2-node list splits into 2 + 0 and merge sort never terminates.
- **Starting the pointers at different nodes** without adjusting the logic: it changes which middle you get. Start both at `head` unless you mean to shift the result (as LC 2095 does deliberately).

## Practice

Middle of the Linked List (LC 876), Linked List Cycle (LC 141), Linked List Cycle II (LC 142), Delete the Middle Node of a Linked List (LC 2095), Happy Number (LC 202), Find the Duplicate Number (LC 287), Palindrome Linked List (LC 234).

## Key takeaways

- Fast moves two steps, slow one: when fast reaches the end, slow is at the middle.
- A cycle makes fast lap slow; they meet within one lap, so detection is O(n) time and O(1) space.
- To find the cycle's start, restart one pointer at the head and move both one step at a time.
- Use the first middle to split a list in half; the second middle breaks merge sort on two nodes.
- The same algorithm finds repeats in implicit sequences such as `x → f(x)`.

## Knowledge check

```quiz
? Why do fast and slow pointers always meet when the list has a cycle?
+ Inside the cycle, fast gains exactly one node per step, so the gap shrinks to zero
- Because fast moves exactly twice as fast, they meet at the head
! They usually meet somewhere inside the cycle, not at the head.
- Because the cycle length is always even
! The cycle can have any length.
- They don't always meet; fast can jump over slow
! A gap that shrinks by one each step can't skip zero.
> That's why detection takes O(n) time and O(1) space.

? After fast and slow meet inside a cycle, how do you find the node where the cycle begins?
+ Start one pointer at the head, keep one at the meeting point, and move both one step at a time
- Return the meeting point
! The meeting point is usually not the entrance.
- Move fast three steps at a time until it meets slow again
! The speeds that find the entrance are 1 and 1.
- Count the cycle length and walk that many steps from the head
! That count alone doesn't give the distance to the entrance.
> Algebra shows the distance from the head to the entrance equals the distance from the meeting point onward, modulo laps.

? You're splitting a list for merge sort. Which middle should you cut after, and why?
+ The first middle, so a 2-node list splits into 1 + 1
- The second middle, so the left half is bigger
! A 2-node list would split into 2 + 0, and the recursion never ends.
- Either; merge sort doesn't care
! The 2-node case breaks with the second middle.
- The last node, so the right half is empty
! An empty half makes no progress.
> Splitting must always make both halves smaller.

? In LC 287, values are in [1, n] and one repeats. Why is the duplicate the entrance of a cycle?
+ Two different indexes point to the repeated value, which is exactly where the tail joins the cycle
- Because the array is sorted
! The array isn't sorted, and must not be modified.
- Because index 0 is part of the cycle
! No value is 0, so nothing points at index 0: it's the start of the chain.
- Because the duplicate is the largest value
! It can be any value from 1 to n.
> Treating i → nums[i] as next pointers turns the array into a linked list with a cycle.
```
