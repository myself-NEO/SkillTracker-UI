## What it is

A raw `ListNode` chain is enough for most interview questions, but a real list is a **class** that owns its nodes and keeps a few facts up to date: where the list starts, where it ends, and how long it is. LeetCode's **LC 707 Design Linked List** asks for exactly that:

- `get(index)`;
- `addAtHead`, `addAtTail`;
- `addAtIndex(index, val)`, which appends if `index == size` and does nothing if it's larger;
- `deleteAtIndex(index)`.

`java.util.LinkedList` is the library's version: a doubly linked list behind the `List` and `Deque` interfaces.

## How it works

Three invariants make the class short and correct:

- a **sentinel** node sits before the first element, so inserting or deleting at index 0 is the same code as anywhere else;
- `tail` always points at the last node (or the sentinel when the list is empty), so appending is O(1);
- `size` is kept up to date, so bounds checks are O(1).

Every operation has to keep all three true. The bugs in list classes are almost always an operation that forgets one of them.

## Build it from scratch

```java
// LC 707 "Design Linked List": a sentinel plus a tail pointer, so appends are O(1).
class MyLinkedList {
    private final ListNode sentinel = new ListNode();   // sentinel.next is the first real node
    private ListNode tail = sentinel;                   // last node (the sentinel when empty)
    private int size;

    public int get(int index) {
        if (index < 0 || index >= size) return -1;
        return nodeBefore(index).next.val;
    }

    public void addAtHead(int val) { addAtIndex(0, val); }

    public void addAtTail(int val) {
        tail.next = new ListNode(val);
        tail = tail.next;
        size++;
    }

    public void addAtIndex(int index, int val) {
        if (index < 0 || index > size) return;
        if (index == size) {                            // appending also moves the tail
            addAtTail(val);
            return;
        }
        ListNode prev = nodeBefore(index);
        prev.next = new ListNode(val, prev.next);
        size++;
    }

    public void deleteAtIndex(int index) {
        if (index < 0 || index >= size) return;
        ListNode prev = nodeBefore(index);
        if (prev.next == tail) tail = prev;             // deleting the last node moves the tail back
        prev.next = prev.next.next;
        size--;
    }

    private ListNode nodeBefore(int index) {            // index steps from the sentinel
        ListNode cur = sentinel;
        for (int i = 0; i < index; i++) cur = cur.next;
        return cur;
    }
}
```

**The non-obvious parts:**
- `nodeBefore(index)` walks `index` steps **from the sentinel**, so it returns the node *before* position `index`. Every operation needs exactly that node.
- Deleting the last node must move `tail` back, or the next `addAtTail` would append to a node that's no longer in the list. **Forgetting to maintain the tail is the most common bug.**
- Appending goes through `addAtTail` so the tail is updated in one place.

## Java API

`java.util.LinkedList` is a **doubly linked list** that implements both `List` and `Deque`.

| Call | Cost | Note |
|---|---|---|
| `addFirst/addLast/removeFirst/removeLast/peekFirst/peekLast` | O(1) | fine, but `ArrayDeque` does the same faster |
| `get(i)`, `set(i, x)`, `add(i, x)`, `remove(i)` | **O(n)** | walks from the nearer end |
| `contains`, `indexOf`, `remove(Object)` | O(n) | |
| `iterator().remove()`, `listIterator().add(x)` | **O(1)** | the only place it beats `ArrayList` |

The one real use is editing **while iterating**:

```java
// ListIterator: O(1) removal and insertion at the iterator's position. The one thing LinkedList is good at.
static List<Integer> editWhileIterating() {
    LinkedList<Integer> list = new LinkedList<>(List.of(1, 2, 3, 4, 5, 6));
    ListIterator<Integer> it = list.listIterator();
    while (it.hasNext()) {
        int x = it.next();
        if (x % 2 == 0) it.remove();      // unlink the node we are standing on
        else it.add(x * 10);              // splice a new node right after it
    }
    return list;                          // [1, 10, 3, 30, 5, 50]
}
```

## Operations and complexity

| `MyLinkedList` operation | Time |
|---|---|
| `addAtHead`, `addAtTail` | O(1) |
| `get(index)`, `addAtIndex`, `deleteAtIndex` | O(index) |
| Space | O(n) |

A singly linked list can append in O(1) with a tail pointer, but **removing** the last node is O(n), because finding the new tail means walking from the front. That's what doubly linked lists fix: see [doubly linked and circular lists](lesson:doubly-and-circular-lists).

## Patterns

**Pick the right Java collection.** `java.util.LinkedList` is rarely the right choice:

1. **Memory**: each element costs a `Node` object: a 12-byte header and three 4-byte references, so 24 bytes, plus the boxed `Integer` (16 bytes). That's about **40 bytes per int**, versus about 20 in an `ArrayList<Integer>` and 4 in an `int[]`.
2. **Speed**: traversal chases pointers all over the heap, missing the CPU cache, so even an O(n) scan is several times slower than over an `ArrayList`.
3. **The O(n²) trap**: `for (int i = 0; i < list.size(); i++) list.get(i)` is quadratic on a `LinkedList`.

So: `ArrayList` for sequences, `ArrayDeque` for [stacks](lesson:stack-basics) and [queues](lesson:queue-basics), and `LinkedList` only when you edit through a `ListIterator`. In interviews, linked-list questions use a hand-written `ListNode`.

**Sentinels everywhere.** The sentinel trick in `MyLinkedList` is the same idea as the [dummy node](lesson:dummy-node) in individual problems: give the first element a predecessor, and the special cases disappear.

## Common mistakes

- **Not moving the tail** when the last node is deleted, so later appends go to a detached node.
- **Off-by-one in `addAtIndex`.** `index == size` must append; only `index > size` is ignored.
- **Letting `size` drift.** Every insert and delete must update it, including the ones that go through helper methods.
- **Calling `get(i)` in a loop on a `java.util.LinkedList`**, which makes the loop O(n²). Iterate with a for-each loop or an iterator instead.
- **Using `LinkedList` as a stack or queue** when `ArrayDeque` does the same job faster and with less memory.

## Key takeaways

- A list class keeps three invariants: a sentinel before the first node, a tail pointer, and a size.
- With a tail pointer, appending is O(1); removing the last node of a singly linked list is still O(n).
- Deleting the last node must move the tail back: that's the classic bug.
- `java.util.LinkedList` costs about 40 bytes per `int` and is slow to traverse; its one strength is O(1) edits through a `ListIterator`.
- Use `ArrayList` for sequences and `ArrayDeque` for stacks and queues.

## Knowledge check

```quiz
? In `MyLinkedList`, what goes wrong if `deleteAtIndex` removes the last node but leaves `tail` alone?
+ The next `addAtTail` attaches the new node to a node that's no longer in the list
- `get` returns the wrong value for every index
! get walks from the sentinel and never uses tail.
- The list develops a cycle
! Nothing points back; the new node is simply lost.
- Nothing, because `size` is updated
! size is right, but the list and the tail disagree.
> Every operation must keep the sentinel, tail and size invariants together.

? What does the sentinel node buy you?
+ Index 0 has a predecessor, so inserting or deleting at the front is the same code as anywhere else
- Faster lookups by index
! Lookups still walk from the front.
- It stores the list's size
! The size is a separate field.
- It prevents the list from being empty
! The list can still be empty; the sentinel isn't an element.
> Like a dummy node, a sentinel removes the special case for the head.

? Why is `for (int i = 0; i < list.size(); i++) list.get(i)` slow on a `java.util.LinkedList`?
+ Each `get(i)` walks from the nearer end, so the loop is O(n²)
- Because `size()` is O(n)
! LinkedList keeps its size; size() is O(1).
- Because of autoboxing
! Boxing costs a little; the walk per get is the real cost.
- It isn't slow; LinkedList.get is O(1)
! Only ArrayList.get is O(1).
> Iterate with for-each or an iterator, which moves one link per step.

? When is `java.util.LinkedList` the better choice over `ArrayList`?
+ When you insert or remove elements while iterating with a `ListIterator`
- When you need fast access by index
! That's ArrayList's strength.
- When you need a stack or a queue
! ArrayDeque is faster for both.
- When you want to save memory
! A LinkedList uses about twice the memory of an ArrayList<Integer>.
> Its O(1) edits at the iterator's position are the one thing it does better.
```
