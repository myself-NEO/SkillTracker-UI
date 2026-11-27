## What it is

A queue has two access points: you add at the **rear** and remove from the **front**.

- `offer(x)` (enqueue) adds at the rear;
- `poll()` (dequeue) removes from the front;
- `peek()` looks at the front.

**FIFO**: First In, First Out. A ticket line, a printer spool, a message broker, a task scheduler.

A **deque** (double-ended queue) supports adding and removing at both ends in O(1). It's a superset: use one end only and it's a stack; add at one end and remove at the other and it's a queue; use both ends cleverly and it's a [monotonic deque](lesson:monotonic-deque). In Java, `ArrayDeque` is the single go-to for all three.

## How it works

**Why queues matter in interviews:** they give you **level structure**. If you enqueue the start of something and then enqueue its neighbours, everything at distance 1 comes out before anything at distance 2. That property *is* [breadth-first search](lesson:breadth-first-search), and BFS *is* shortest path on unweighted graphs. Roughly 80% of queue interview questions are BFS in a costume.

The sentence to say when the interviewer asks "why a queue?":

> *The problem processes items in waves, and I need level or distance ordering.*

Under the hood, a good queue never moves its elements: a **circular buffer** keeps a `head` index and wraps it around the end of an array, so both ends are O(1).

## Build it from scratch

### The circular buffer

**Approach.** The naive array queue removes the front by shifting everything left: O(n) per dequeue. Fix it with a **circular buffer**: keep `head` and `size`, and wrap indexes with modulo. Nothing ever moves.

```java
public class CircularQueue<T> {
    private Object[] data;
    private int head;      // index of the front element
    private int size;      // number of elements

    public CircularQueue(int capacity) {
        data = new Object[Math.max(1, capacity)];
    }

    public void offer(T x) {
        if (size == data.length) resize(data.length * 2);
        int tail = (head + size) % data.length;   // derive tail from head+size
        data[tail] = x;
        size++;
    }

    @SuppressWarnings("unchecked")
    public T poll() {
        if (isEmpty()) throw new java.util.NoSuchElementException();
        T val = (T) data[head];
        data[head] = null;                        // avoid loitering
        head = (head + 1) % data.length;
        size--;
        return val;
    }

    @SuppressWarnings("unchecked")
    public T peek() {
        if (isEmpty()) throw new java.util.NoSuchElementException();
        return (T) data[head];
    }

    public boolean isEmpty() { return size == 0; }
    public int size()        { return size; }

    private void resize(int newCap) {
        Object[] bigger = new Object[newCap];
        for (int i = 0; i < size; i++)
            bigger[i] = data[(head + i) % data.length];   // unroll into linear order
        data = bigger;
        head = 0;
    }
}
```

**The design decisions:**

- **Storing `head` + `size` instead of `head` + `tail`** removes the classic ambiguity where `head == tail` could mean either empty or full. (The alternative fix, leaving one slot always empty, is what you'd mention if the interviewer bans the extra field.)
- **`(head + i) % length`** is the whole trick: modulo wraps the index around the end of the array. If you're micro-optimising, keep the capacity a power of two and use `& (length - 1)` instead of `%`: a good detail to drop.
- **Resizing must unroll**, not `arraycopy` in one block: the live elements may be split across the wrap point, so copy them out in logical order and reset `head = 0`.

**LeetCode's Design Circular Queue (LC 622)** is exactly this with a fixed capacity: no resize, and `enQueue` returns `false` when full.

### A linked-list queue

```java
public class LinkedQueue<T> {
    private static class Node<T> { T val; Node<T> next; Node(T v) { val = v; } }
    private Node<T> head, tail;
    private int size;

    public void offer(T x) {
        Node<T> n = new Node<>(x);
        if (tail == null) head = tail = n;
        else { tail.next = n; tail = n; }
        size++;
    }

    public T poll() {
        if (head == null) throw new java.util.NoSuchElementException();
        T val = head.val;
        head = head.next;
        if (head == null) tail = null;     // ← the bug everyone forgets
        size--;
        return val;
    }

    public T peek() { if (head == null) throw new java.util.NoSuchElementException(); return head.val; }
    public boolean isEmpty() { return head == null; }
    public int size() { return size; }
}
```

**The forgotten line is `tail = null` when the queue empties.** Miss it and `tail` dangles at a removed node; the next `offer` appends to a detached node, and the queue silently loses data. Interviewers watch for this specific line.

## Java API

```java
Queue<Integer> q = new ArrayDeque<>();   // ✅ preferred
q.offer(1);        // add at rear; returns false if capacity-bounded and full
q.add(1);          // same, but throws IllegalStateException instead
int head = q.peek();  // front, null if empty
int out  = q.poll();  // remove front, null if empty
q.isEmpty(); q.size();
```

**Throwing vs returning a special value: know both columns:**

| Operation | Throws an exception | Returns a special value |
|---|---|---|
| Insert | `add(e)` | `offer(e)` → `false` |
| Remove | `remove()` | `poll()` → `null` |
| Examine | `element()` | `peek()` → `null` |

Use `offer`/`poll`/`peek` in interview code: the null-returning versions make the empty case explicit instead of exceptional.

**The full `Deque` surface (worth knowing by name):**

```java
Deque<Integer> d = new ArrayDeque<>();
d.offerFirst(x); d.offerLast(x);
d.pollFirst();   d.pollLast();
d.peekFirst();   d.peekLast();
// stack aliases: push == offerFirst, pop == pollFirst(throwing), peek == peekFirst
```

**Which implementation?**

| Class | Use when |
|---|---|
| `ArrayDeque` | the default for a stack, queue or deque; fastest; no nulls allowed |
| `LinkedList` | you need `null` elements or `List` indexing too; otherwise slower |
| `PriorityQueue` | ordering by priority, not arrival (see [Java's PriorityQueue](lesson:java-priorityqueue)) |
| `ArrayBlockingQueue` / `LinkedBlockingQueue` | producer–consumer across threads, with blocking `put`/`take` |
| `ConcurrentLinkedQueue` | lock-free, many producers and consumers |
| `DelayQueue` | elements become available only after a delay (schedulers) |

The concurrent ones rarely show up in DSA rounds but *do* show up in Java and system-design rounds: for a backend engineer, being able to say "a bounded `ArrayBlockingQueue` gives you backpressure; an unbounded `LinkedBlockingQueue` will run out of memory under load" is worth real points.

## Operations and complexity

| Operation | Circular buffer (`ArrayDeque`) | Linked queue |
|---|---|---|
| `offer` | amortised O(1) (O(n) on a resize) | O(1) |
| `poll`, `peek` | O(1) | O(1) |
| Space | O(n), contiguous | O(n) plus a node per element |

## Patterns

- **[Breadth-first search](lesson:breadth-first-search)**: shortest paths on unweighted graphs and grids, level by level.
- **[Multi-source and 0-1 BFS](lesson:multi-source-and-0-1-bfs)**: many starting points at once, and edges that cost 0 or 1.
- **[Monotonic deque](lesson:monotonic-deque)**: the maximum or minimum of every sliding window in O(n).

### Queue and stack conversions

Classic "do you understand the structures?" questions.

**A queue using two stacks (LC 232), amortised O(1).** `in` receives pushes; `out` serves pops. Only transfer `in → out` when `out` is empty: reversing once puts the oldest element on top.

```java
class MyQueue {
    private final Deque<Integer> in  = new ArrayDeque<>();
    private final Deque<Integer> out = new ArrayDeque<>();

    public void push(int x) { in.push(x); }

    public int pop() { shift(); return out.pop(); }

    public int peek() { shift(); return out.peek(); }

    public boolean empty() { return in.isEmpty() && out.isEmpty(); }

    private void shift() {
        if (out.isEmpty())                          // ← only when empty!
            while (!in.isEmpty()) out.push(in.pop());
    }
}
```

**The amortised argument** (say this; it's the point of the question): every element is pushed to `in` once, moved to `out` once and popped once: 3 operations over its lifetime. So n operations cost O(n) in total, **O(1) amortised**, even though one individual `pop` can be O(n). **The critical bug:** transferring whenever `in` is non-empty (instead of only when `out` is empty) breaks correctness *and* the amortised bound.

**A stack using a queue (LC 225).** The push-costly version (`push` O(n), `pop` O(1)) is usually the preferred answer:

```java
class MyStack {
    private Queue<Integer> q = new ArrayDeque<>();

    public void push(int x) {
        q.offer(x);
        for (int i = 0; i < q.size() - 1; i++) q.offer(q.poll());  // rotate x to the front
    }
    public int pop()    { return q.poll(); }
    public int top()    { return q.peek(); }
    public boolean empty() { return q.isEmpty(); }
}
```

Only one queue is needed: the rotation does the work. Mention the pop-costly alternative (move n−1 elements to a second queue on each pop), and that you chose push-costly because reads are usually more frequent.

## Common mistakes

- **Shifting an array on every dequeue**, which makes `poll` O(n). Use a circular buffer.
- **`head == tail` meaning both "empty" and "full"** in a circular buffer. Keep a `size` field, or leave one slot empty.
- **Forgetting `tail = null`** when a linked queue becomes empty.
- **Resizing a wrapped buffer with one block copy**, which scrambles the order. Unroll from `head`.
- **Transferring between the two stacks too often** in the two-stack queue; only refill `out` when it's empty.

## Key takeaways

- A queue gives the least recently added element first (FIFO), with O(1) `offer`, `poll` and `peek`.
- Queues give level structure: everything at distance 1 comes out before anything at distance 2. That's BFS.
- In Java use `ArrayDeque` for stacks, queues and deques, with `offer`, `poll` and `peek`.
- A circular buffer keeps `head` and `size` and wraps indexes with modulo; resizing must unroll the elements.
- Two stacks make a queue with amortised O(1) operations, if you only refill `out` when it's empty.

## Knowledge check

```quiz
? In a circular buffer that stores `head` and `tail`, why is `head == tail` ambiguous?
+ It happens both when the queue is empty and when it's completely full
- It means the buffer must be resized
! Resizing is decided by the size, which is what's ambiguous.
- It means an element was lost
! Nothing is lost; the state is just unclear.
- It can never happen
! It happens at both extremes.
> Keeping a size field, or leaving one slot empty, resolves it.

? A linked-list queue empties, and the next `offer` seems to vanish. What's the bug?
+ `poll` didn't set `tail = null`, so the new node was appended to a detached node
- `offer` forgot to increment the size
! The size would be wrong, but the node would still be reachable.
- `head` wasn't updated in `poll`
! Then poll would return the same element repeatedly.
- The queue needs a sentinel node
! A sentinel is one fix, but the cause is the stale tail.
> When the queue becomes empty, both head and tail must be null.

? In the two-stack queue, why transfer from `in` to `out` only when `out` is empty?
+ Transferring onto a non-empty `out` would put newer elements above older ones and break FIFO order
- Because transferring is O(1)
! Each transfer moves many elements; the amortised cost is what's O(1).
- To keep `in` sorted
! Neither stack is sorted.
- It's only a performance optimisation
! It's needed for correctness too.
> Each element moves once, which is also what makes the operations amortised O(1).

? Which Java method removes the front of a queue and returns `null` instead of throwing when the queue is empty?
+ `poll()`
- `remove()`
! remove() throws NoSuchElementException on an empty queue.
- `pop()`
! pop() is the stack alias, and it throws on an empty deque.
- `element()`
! element() examines the front without removing it, and throws.
> offer, poll and peek return special values; add, remove and element throw.
```
