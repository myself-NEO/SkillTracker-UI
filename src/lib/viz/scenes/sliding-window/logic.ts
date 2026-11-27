import type { Frame } from '@lib/viz/types';

// sliding-window: the fixed-size window of the Sliding Window lesson (maximum sum of k
// consecutive elements), traced line by line through SLIDING_WINDOW_CODE.

export interface SlidingWindowParams {
  array: number[];
  k: number;
}

export const SLIDING_WINDOW_DEFAULTS: SlidingWindowParams = { array: [2, 1, 5, 1, 3, 2], k: 3 };

/** The code the frames point into (line numbers are 1-based). Same as the lesson's example. */
export const SLIDING_WINDOW_CODE = `public int maxSumSubarray(int[] arr, int k) {
    int windowSum = 0;
    for (int i = 0; i < k; i++) windowSum += arr[i];   // build first window
    int best = windowSum;
    for (int i = k; i < arr.length; i++) {
        windowSum += arr[i] - arr[i - k];   // slide: add new, remove old
        best = Math.max(best, windowSum);
    }
    return best;
}`;

export interface SlidingWindowState {
  array: number[];
  /** The window, inclusive; left > right before the first element is added. */
  left: number;
  right: number;
  windowSum: number;
  best?: number;
  /** The best window so far. */
  bestRange?: [number, number];
  adding?: number;
  removing?: number;
  done?: boolean;
}

export const buildSlidingWindow = ({ array, k }: SlidingWindowParams): Frame<SlidingWindowState>[] => {
  const frames: Frame<SlidingWindowState>[] = [];
  const push = (line: number, caption: string, state: Omit<SlidingWindowState, 'array'>) =>
    frames.push({ line, caption, state: { array, ...state } });

  let windowSum = 0;
  push(2, `Start with an empty window: windowSum = 0. We want the largest sum of ${k} consecutive elements.`, {
    left: 0,
    right: -1,
    windowSum,
  });
  for (let i = 0; i < k; i++) {
    windowSum += array[i];
    push(3, `Build the first window: add arr[${i}] = ${array[i]}, so windowSum = ${windowSum}.`, {
      left: 0,
      right: i,
      windowSum,
      adding: i,
    });
  }
  let best = windowSum;
  let bestRange: [number, number] = [0, k - 1];
  push(4, `The first window [0..${k - 1}] sums to ${windowSum}; it is the best so far.`, {
    left: 0,
    right: k - 1,
    windowSum,
    best,
    bestRange,
  });
  for (let i = k; i < array.length; i++) {
    const added = array[i];
    const removed = array[i - k];
    windowSum += added - removed;
    push(
      6,
      `Slide right: add arr[${i}] = ${added}, drop arr[${i - k}] = ${removed}. windowSum = ${windowSum} without re-adding the middle.`,
      { left: i - k + 1, right: i, windowSum, best, bestRange, adding: i, removing: i - k },
    );
    const previous = best;
    const improved = windowSum > previous;
    if (improved) {
      best = windowSum;
      bestRange = [i - k + 1, i];
    }
    push(
      7,
      improved
        ? `${windowSum} beats ${previous}: best = ${best}, window [${i - k + 1}..${i}].`
        : `${windowSum} doesn't beat ${best}: best stays ${best}.`,
      { left: i - k + 1, right: i, windowSum, best, bestRange },
    );
  }
  push(9, `Every element was added once and dropped at most once: O(n). The answer is ${best}.`, {
    left: bestRange[0],
    right: bestRange[1],
    windowSum,
    best,
    bestRange,
    done: true,
  });
  return frames;
};
