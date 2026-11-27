## The idea

Pair a **hash map** with a **doubly linked list**, and point the map *into* the list. The map finds any node in O(1); the list keeps nodes in order and moves or removes the node you hold in O(1). Together they give O(1) operations with an ordering policy, which neither structure can do alone.

## When to use it

- **O(1) `get` and `put` with an eviction order**: least recently used (LRU), least frequently used (LFU).
- **A history with a cursor**: browser back and forward, undo and redo.
- **Restructuring nested lists in place**, such as flattening a multilevel list.
- Any design question where you must find an item by key *and* reorder it quickly.

## How it works

For LRU (**LC 146**: `get(key)` and `put(key, value)` in O(1); when full, evict the **least recently used** key), you need two things at once:
- **find a key in O(1)**, which means a `HashMap<Integer, Node>`;
- **order keys by recency and move any key to the front in O(1)**, which means a doubly linked list.

The map points *into* the list. That's precisely the "delete a node you hold" case where a [doubly linked list](lesson:doubly-and-circular-lists) is O(1).

```text
map:  { 1 -> n1, 3 -> n3, 7 -> n7 }

head <-> [7] <-> [1] <-> [3] <-> tail
 (most recently used)        (least recently used: evicted next)
```

Each node stores its **key** as well as its value: eviction finds the node through the list, and must also remove it from the map.

## Java template

```java
private final Map<Integer, Node> map = new HashMap<>();
private final Node head = new Node(0, 0), tail = new Node(0, 0);   // sentinels; link head <-> tail in the constructor

private void addFront(Node n) {         // O(1)
    n.prev = head;
    n.next = head.next;
    head.next.prev = n;
    head.next = n;
}

private void unlink(Node n) {           // O(1): the node knows both neighbours
    n.prev.next = n.next;
    n.next.prev = n.prev;
}
```

## Worked examples

### LRU Cache (LC 146) ⭐⭐

This is one of the most asked design questions at every level.

```java
// LC 146: HashMap for O(1) lookup + doubly linked list for O(1) "move to front" and "evict oldest".
class LRUCache {
    private static final class Node {
        int key, value;
        Node prev, next;

        Node(int key, int value) { this.key = key; this.value = value; }
    }

    private final int capacity;
    private final Map<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(0, 0);   // sentinel on the most-recently-used side
    private final Node tail = new Node(0, 0);   // sentinel on the least-recently-used side

    public LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        Node node = map.get(key);
        if (node == null) return -1;
        moveToFront(node);                      // a read counts as a use
        return node.value;
    }

    public void put(int key, int value) {
        Node node = map.get(key);
        if (node != null) {                     // update: never evicts
            node.value = value;
            moveToFront(node);
            return;
        }
        if (map.size() == capacity) {
            Node lru = tail.prev;
            unlink(lru);
            map.remove(lru.key);                // this is why the node stores its key
        }
        node = new Node(key, value);
        map.put(key, node);
        addFront(node);
    }

    private void addFront(Node n) {
        n.prev = head;
        n.next = head.next;
        head.next.prev = n;
        head.next = n;
    }

    private void unlink(Node n) {
        n.prev.next = n.next;
        n.next.prev = n.prev;
    }

    private void moveToFront(Node n) {
        unlink(n);
        addFront(n);
    }
}
```

**The details interviewers check:**
- `get` also counts as a use, so it moves the node to the front;
- `put` on an existing key **updates** the value and moves the node, and never evicts;
- the node stores its **key**, because eviction finds the node via the list but must also remove it from the map;
- sentinels remove every null check.

**In real Java code**, `LinkedHashMap` is the same HashMap-plus-doubly-linked-list design, built in. With `accessOrder = true` and an overridden `removeEldestEntry`, it's an LRU cache:

```java
class LruCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    LruCache(int capacity) {
        super(16, 0.75f, true);                // accessOrder = true: get() moves an entry to the end
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;              // evict the least recently used entry
    }
}
```

Mention it after writing the manual version. For production caches, use a library such as Caffeine.

### Browser History (LC 1472)

`visit(url)` clears the forward history, and `back(steps)`/`forward(steps)` move at most that far. It's a doubly linked list with a cursor.

```java
// LC 1472: a doubly linked list of pages; visiting a new page drops the forward history in O(1).
class BrowserHistory {
    private static final class Page {
        final String url;
        Page prev, next;

        Page(String url) { this.url = url; }
    }

    private Page current;

    public BrowserHistory(String homepage) { current = new Page(homepage); }

    public void visit(String url) {
        Page page = new Page(url);
        current.next = page;           // the old forward chain becomes unreachable: GC'd
        page.prev = current;
        current = page;
    }

    public String back(int steps) {
        while (steps-- > 0 && current.prev != null) current = current.prev;
        return current.url;
    }

    public String forward(int steps) {
        while (steps-- > 0 && current.next != null) current = current.next;
        return current.url;
    }
}
```

`visit` simply overwrites `current.next`: the whole forward chain becomes unreachable and is garbage-collected. That's O(1) "clear forward history". An `ArrayList` plus an index plus a "logical end" is an equally good answer, with O(1) per step for `back`/`forward` instead of O(steps).

## Complexity

| Design | Time per operation | Space |
|---|---|---|
| LRU cache | O(1) for `get` and `put` | O(capacity) |
| LFU cache | O(1) for `get` and `put` | O(capacity) |
| Browser history | O(1) `visit`; O(steps) `back` and `forward` | O(pages visited) |
| Flatten a multilevel list | O(n) in total | O(depth) for the stack |

## Variations

### LFU Cache (LC 460)

Evict the **least frequently used** key; ties go to the **least recently used** among them. Everything O(1).

**Approach.**
- Each frequency gets its own LRU list (`freq → NodeList`).
- `minFreq` tracks the lowest frequency currently present.
- A hit moves the node from list `f` to list `f + 1`. If list `f` was the minimum and is now empty, `minFreq` becomes `f + 1`.
- A new key always starts at frequency 1, so `minFreq = 1`.

```text
minFreq = 1
freq 1:  head <-> [9] <-> [4] <-> tail       <- evict from here, oldest first (4)
freq 3:  head <-> [2] <-> tail
nodes: { 9 -> ..., 4 -> ..., 2 -> ... }
```

```java
// LC 460: evict the least FREQUENTLY used key; ties go to the least recently used. Everything O(1).
class LFUCache {
    private static final class Node {
        int key, value, freq = 1;
        Node prev, next;

        Node(int key, int value) { this.key = key; this.value = value; }
    }

    private static final class NodeList {                 // sentinel-based list; most recent at the front
        final Node head = new Node(0, 0), tail = new Node(0, 0);
        int size;

        NodeList() {
            head.next = tail;
            tail.prev = head;
        }

        void addFront(Node n) {
            n.prev = head;
            n.next = head.next;
            head.next.prev = n;
            head.next = n;
            size++;
        }

        void remove(Node n) {
            n.prev.next = n.next;
            n.next.prev = n.prev;
            size--;
        }

        Node removeLast() {
            Node n = tail.prev;
            remove(n);
            return n;
        }
    }

    private final int capacity;
    private final Map<Integer, Node> nodes = new HashMap<>();
    private final Map<Integer, NodeList> byFreq = new HashMap<>();   // frequency -> its own LRU list
    private int minFreq;

    public LFUCache(int capacity) { this.capacity = capacity; }

    public int get(int key) {
        Node node = nodes.get(key);
        if (node == null) return -1;
        touch(node);
        return node.value;
    }

    public void put(int key, int value) {
        if (capacity == 0) return;
        Node node = nodes.get(key);
        if (node != null) {
            node.value = value;
            touch(node);
            return;
        }
        if (nodes.size() == capacity) {
            Node evicted = byFreq.get(minFreq).removeLast();   // lowest frequency, oldest among ties
            nodes.remove(evicted.key);
        }
        node = new Node(key, value);
        nodes.put(key, node);
        byFreq.computeIfAbsent(1, f -> new NodeList()).addFront(node);
        minFreq = 1;                                           // a new key always has the lowest count
    }

    private void touch(Node node) {                            // move from list freq to list freq + 1
        NodeList list = byFreq.get(node.freq);
        list.remove(node);
        if (node.freq == minFreq && list.size == 0) minFreq++;
        node.freq++;
        byFreq.computeIfAbsent(node.freq, f -> new NodeList()).addFront(node);
    }
}
```

**Why `minFreq` never needs a search:** it can only change in two ways.
- `touch` raises one node's frequency by exactly one, so the minimum rises by at most one, and only if its list emptied.
- `put` of a new key sets the minimum to 1.

Eviction happens only right before inserting a new key, so after an eviction `minFreq` is reset to 1 anyway.

### Flatten a Multilevel Doubly Linked List (LC 430)

Nodes may have a `child` list, recursively. Flatten everything into one level, in depth-first order: a child list comes right after its parent, before the parent's `next`.

```java
class Node {
    int val;
    Node prev, next, child;

    Node(int val) { this.val = val; }
}

// LC 430: depth-first flattening; a stack remembers where to resume after each child list.
public Node flatten(Node head) {
    Deque<Node> resume = new ArrayDeque<>();
    for (Node cur = head; cur != null; cur = cur.next) {
        if (cur.child != null) {
            if (cur.next != null) resume.push(cur.next);   // come back here later
            cur.next = cur.child;
            cur.child.prev = cur;
            cur.child = null;
        } else if (cur.next == null && !resume.isEmpty()) {
            Node back = resume.pop();                      // end of a child list: resume the parent
            cur.next = back;
            back.prev = cur;
        }
    }
    return head;
}
```

**Approach.** Walk the list. On a node with a child:
1. remember its `next` on a stack;
2. splice the child list in, fixing `prev` pointers and clearing `child`.

When you reach the end of any list and the stack isn't empty, splice the remembered node back in. The stack replaces recursion, so deep nesting can't overflow the call stack.

## Common mistakes

- **Not counting `get` as a use** in LRU: a read must move the node to the front.
- **Evicting on an update.** `put` for an existing key changes the value and recency, and never evicts.
- **Not storing the key in the node**, which leaves eviction unable to remove the map entry.
- **Forgetting to update `minFreq`** in LFU when the lowest-frequency list empties, or when a new key arrives.
- **Leaving `child` pointers set** after flattening, or forgetting the `prev` pointers in a doubly linked result.

## Practice

LRU Cache (LC 146), LFU Cache (LC 460), Design Browser History (LC 1472), Flatten a Multilevel Doubly Linked List (LC 430), All O`one Data Structure (LC 432).

## Key takeaways

- A hash map that points into a doubly linked list gives O(1) lookup and O(1) reordering.
- LRU: move to the front on every get and put; evict from the back; store the key in the node.
- `LinkedHashMap` with access order and `removeEldestEntry` is the same design, built into Java.
- LFU keeps one LRU list per frequency and a `minFreq` that only ever rises by one or resets to 1.
- Overwriting a `next` pointer can drop a whole chain in O(1), as Browser History does with forward pages.

## Knowledge check

```quiz
? Why does an LRU cache need a doubly linked list rather than a singly linked one?
+ Moving or evicting a node you found through the map must be O(1), which needs its predecessor
- Doubly linked lists keep keys sorted
! The order is recency, not key order.
- A singly linked list can't hold key–value pairs
! Any node can hold a key and a value.
- To make lookups by key faster
! Lookups go through the map.
> The map finds the node; prev pointers let you unlink it without a search.

? Why does each LRU node store its key, not just its value?
+ Eviction finds the node through the list, and needs its key to remove the map entry
- So the list can be sorted by key
! The list is ordered by recency.
- To detect duplicate values
! Duplicates are found through the map.
- Java requires it for HashMap entries
! The map stores the key itself; the node needs its own copy.
> Without the key, the evicted node would stay reachable from the map.

? `put(key, value)` is called for a key that's already in a full LRU cache. What should happen?
+ Update the value and move the node to the front, without evicting anything
- Evict the least recently used key first
! The cache isn't growing, so nothing needs to go.
- Ignore the call, because the key exists
! The value must be updated.
- Remove the old node and insert a new one at the back
! The updated key is now the most recently used.
> Updates change recency; only new keys can trigger eviction.

? In the LFU cache, why can `minFreq` be maintained without searching?
+ It only changes by rising one when its list empties during a touch, or by resetting to 1 for a new key
- Because frequencies are stored in a heap
! The design uses a map of lists, not a heap.
- Because it's recomputed on every get
! Recomputing would need a search; it's updated incrementally.
- Because evictions always remove every key with that frequency
! An eviction removes one key, the oldest at that frequency.
> Both changes are O(1), so every operation stays O(1).
```
