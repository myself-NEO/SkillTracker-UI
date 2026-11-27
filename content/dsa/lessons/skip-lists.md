## What it is

A sorted linked list has O(n) search, because you can't jump to the middle. A **skip list** adds "express lanes" on top of it:
- every node is on level 0;
- about half are also on level 1, a quarter on level 2, and so on (decided by coin flips).

The result behaves like a balanced binary search tree, with expected O(log n) search, insert and delete, but it's built from nothing more than linked lists.

## How it works

Search starts at the top level, runs right while the next value is smaller, and drops down one level when it would overshoot:

```text
level 2:  head ---------------------------> 30 ----------------------> null
level 1:  head ----------> 12 ------------> 30 ----------> 47 -------> null
level 0:  head --> 5 ----> 12 --> 19 -----> 30 --> 41 ---> 47 --> 52 -> null
search 41: level 2 to 30, level 1 (47 is too big) drop, level 0: 41
```

Each level skips about half the nodes of the level below, so a search crosses O(log n) levels and takes a few steps on each: O(log n) expected in total. Inserting and deleting first record the last node before the target on every level (the `update` array below), then splice the node in or out of each level it lives on.

There's no rebalancing, unlike AVL or red-black trees: randomness keeps the structure balanced in expectation.

## Build it from scratch

**LC 1206 Design Skiplist:**

```java
// LC 1206: a sorted linked list with "express lanes". Expected O(log n) search, add and erase.
class Skiplist {
    private static final int MAX_LEVEL = 16;

    private static final class Node {
        final int val;
        final Node[] next;                      // next[i] = successor on level i

        Node(int val, int levels) {
            this.val = val;
            this.next = new Node[levels];
        }
    }

    private final Node head = new Node(Integer.MIN_VALUE, MAX_LEVEL);   // sentinel on every level
    private final Random random;
    private int levels = 1;                     // levels currently in use

    public Skiplist() { this(new Random()); }

    Skiplist(Random random) { this.random = random; }   // inject a seeded Random in tests

    public boolean search(int target) {
        Node cur = head;
        for (int lv = levels - 1; lv >= 0; lv--) {       // run right while the next value is
            while (cur.next[lv] != null && cur.next[lv].val < target) cur = cur.next[lv];
        }                                                // smaller, then drop a level
        cur = cur.next[0];
        return cur != null && cur.val == target;
    }

    public void add(int num) {
        Node[] update = predecessors(num);
        int height = randomHeight();
        if (height > levels) {
            for (int lv = levels; lv < height; lv++) update[lv] = head;
            levels = height;
        }
        Node node = new Node(num, height);
        for (int lv = 0; lv < height; lv++) {            // splice into each of its levels
            node.next[lv] = update[lv].next[lv];
            update[lv].next[lv] = node;
        }
    }

    public boolean erase(int num) {
        Node[] update = predecessors(num);
        Node target = update[0].next[0];
        if (target == null || target.val != num) return false;
        for (int lv = 0; lv < levels && update[lv].next[lv] == target; lv++) {
            update[lv].next[lv] = target.next[lv];       // unlink from every level it is on
        }
        while (levels > 1 && head.next[levels - 1] == null) levels--;
        return true;
    }

    private Node[] predecessors(int num) {               // last node < num on every level
        Node[] update = new Node[MAX_LEVEL];
        Node cur = head;
        for (int lv = levels - 1; lv >= 0; lv--) {
            while (cur.next[lv] != null && cur.next[lv].val < num) cur = cur.next[lv];
            update[lv] = cur;
        }
        return update;
    }

    private int randomHeight() {                         // height h with probability 1 / 2^h
        int h = 1;
        while (h < MAX_LEVEL && random.nextBoolean()) h++;
        return h;
    }
}
```

## Java API

**`ConcurrentSkipListMap`** and **`ConcurrentSkipListSet`** are Java's skip lists: sorted, thread-safe maps and sets. Skip lists suit concurrency because an update changes individual links, which can be done with compare-and-swap; a lock-free balanced tree is far harder to write. Single-threaded code uses `TreeMap`, a red-black tree.

Knowing where the rest of the standard library uses linked nodes makes for strong follow-up answers:

| Class | How it uses linked nodes |
|---|---|
| `HashMap` | each bucket is a singly linked chain of entries. A chain of 8+ entries (once the table has 64+ buckets) becomes a red-black tree, and turns back into a chain when a resize leaves it with 6 or fewer |
| `LinkedHashMap` | a `HashMap` plus a **doubly linked list** through all entries: insertion or access order, and LRU via `removeEldestEntry` |
| `LinkedList` | a [doubly linked list](lesson:doubly-and-circular-lists) |
| `LinkedBlockingQueue` | linked nodes with two locks (one for put, one for take), so producers and consumers don't contend |
| `ConcurrentLinkedQueue` | the Michael–Scott **lock-free** linked queue: links are updated with CAS |
| `AbstractQueuedSynchronizer` | waiting threads form a doubly linked (CLH-style) queue. That's what `ReentrantLock`, `Semaphore` and `CountDownLatch` park on |
| `ConcurrentSkipListMap` | a skip list |

The Java topic covers several of these in depth: [HashMap internals](/java/hashmap-internals), [LinkedHashMap](/java/hashset-and-linkedhashmap) and [LinkedList vs ArrayDeque](/java/linkedlist-vector-stack).

## Operations and complexity

| Operation | Skip list (expected) | Sorted linked list | Balanced BST (worst case) |
|---|---|---|---|
| Search | O(log n) | O(n) | O(log n) |
| Insert, delete | O(log n) | O(n) | O(log n) |
| Space | O(n): about 2n pointers with p = 1/2 | O(n) | O(n) |

The bounds are *expected*: a run of unlucky coin flips can make one operation slow, but the probability of that falls off very quickly.

## Patterns

Where you meet skip lists:
- **Redis sorted sets** (`ZADD`/`ZRANGE`), where the skip list also makes range queries a simple walk along level 0;
- **LevelDB and RocksDB memtables**, the in-memory sorted buffer of an LSM tree;
- **`ConcurrentSkipListMap`**, whenever you need a sorted map shared between threads.

In an interview, a skip list is the answer to "design a sorted structure with O(log n) operations, without the rebalancing logic of a tree", and a good follow-up when a red-black tree comes up.

## Common mistakes

- **Not updating every level** on insert or erase, so a higher level still points at a removed node.
- **Forgetting to grow `update` for new levels**: when a node is taller than the current list, the head is its predecessor on the new levels.
- **No cap on the height.** Without `MAX_LEVEL`, a long run of heads would allocate an enormous array.
- **Testing with an unseeded random generator**, which makes failures hard to reproduce. Inject a seeded `Random`, as the constructor above allows.

## Key takeaways

- A skip list is a sorted linked list with random express lanes: each level holds about half the nodes of the one below.
- Search runs right while the next value is smaller, and drops a level when it would overshoot: expected O(log n).
- Insert and erase splice the node into or out of every level it lives on, using the predecessors found by a search.
- Randomness replaces rebalancing, which makes skip lists easy to write and well suited to concurrent updates.
- `ConcurrentSkipListMap`, Redis sorted sets and LSM-tree memtables all use them.

## Knowledge check

```quiz
? How does a skip list keep search at O(log n) without rebalancing?
+ Random levels make each level hold about half the nodes of the level below, in expectation
- It rebalances lazily during searches
! There's no rebalancing at all.
- It keeps the nodes in a binary tree as well
! It's built only from linked lists.
- It sorts the list after every insert
! Inserts splice into place; nothing is re-sorted.
> Coin flips give the same shape as a balanced tree, on average.

? During a search, when do you drop down a level?
+ When the next node on the current level is not smaller than the target
- After a fixed number of steps on each level
! The number of steps depends on the values.
- When you reach the end of level 0
! Search starts at the top and ends on level 0.
- Whenever the current node's value is even
! Values don't decide the level changes.
> Run right while the next value is smaller; drop down when you'd overshoot.

? Why is a skip list a popular choice for a concurrent sorted map?
+ Updates change individual links, which can be done with compare-and-swap instead of locking a tree
- It never needs to allocate memory
! Every insert allocates a node.
- It has O(1) worst-case search
! Search is O(log n) expected.
- It stores elements in an array
! It's made of linked nodes.
> A lock-free balanced tree is far harder to get right.

? What happens if insert forgets to splice the new node into its upper levels?
+ Searches still find it on level 0, but the express lanes skip over it, so later operations slow down
- The node becomes unreachable
! It's still on level 0, so a walk can reach it.
- Every search returns false
! Level 0 still holds every node.
- The list develops a cycle
! Missing links don't create cycles.
> Correctness relies on level 0; performance relies on the upper levels.
```
