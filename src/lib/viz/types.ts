// The animation engine's data types, free of any UI framework. A scene is a pure function from its
// parameters to a list of frames (scenes/*/logic.ts); the player in the app draws one frame at a
// time and animates the change to the next, so stepping back is just showing an earlier frame.

export interface Frame<S> {
  state: S;
  /** What this frame shows, in a sentence; read out by screen readers. */
  caption: string;
  /** Line of the scene's code to highlight (1-based). */
  line?: number;
}

export type VizMode = 'stepper' | 'loop' | 'scrolly';

/** A token of highlighted code: its text and the CSS variables Shiki gives it for both themes. */
export interface CodeToken {
  content: string;
  style?: Record<string, string>;
}

export interface SceneCode {
  /** Shown above the code, e.g. "SlidingWindow.java". */
  label: string;
  lines: CodeToken[][];
}
