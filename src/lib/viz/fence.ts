// The Markdown forms of an animation:
//
//   ```viz name="hashmap-put" mode="stepper"
//   { "keys": ["cat", "dog", 1, 5] }
//   ```
//
//   ````scrolly name="gc-generations"
//   { }
//   ---
//   Markdown of step 1 (shows frame 1)
//   ---
//   Markdown of step 2 (shows frame 2)
//   ````
//
// A scrolly block's first part is the scene's parameters as JSON; each part after a line of
// just `---` is one step, shown beside the frame with the same number.

export const splitScrolly = (body: string) => {
  const parts = body.replace(/\r\n?/g, '\n').split(/^---[ \t]*$/m);
  return { json: parts[0]?.trim() ?? '', steps: parts.slice(1).map((part) => part.trim()) };
};
