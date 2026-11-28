// JSON Merge Patch (RFC 7396), as the backend applies it to the learner's state documents
// (StateService): an object in the patch is merged into the target key by key, null removes a key,
// and anything else (a string, a number, an array) replaces the value.
//
// The app never accumulates patches: what to send is always the difference between the document
// as the server last had it and the document now (mergePatchDiff), so a save that is lost or sent
// twice does no harm.

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** `target` with `patch` applied. Neither argument is changed. */
export function applyMergePatch<T>(target: T, patch: unknown): T {
  if (!isObject(patch)) return patch as T;
  const result: JsonObject = isObject(target) ? { ...target } : {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete result[key];
    else if (value !== undefined) result[key] = applyMergePatch(result[key], value);
  }
  return result as T;
}

/** Whether two JSON values are the same (key order aside). */
const sameJson = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, i) => sameJson(item, b[i]));
  if (isObject(a) && isObject(b)) {
    const keys = Object.keys(a).filter((key) => a[key] !== undefined);
    return (
      keys.length === Object.keys(b).filter((key) => b[key] !== undefined).length &&
      keys.every((key) => sameJson(a[key], b[key]))
    );
  }
  return false;
};

/**
 * The merge patch that turns the document `from` into `to`, or null when they are the same. Objects
 * are compared key by key (a key that is gone becomes null); other values are sent whole.
 * Properties whose value is undefined count as absent, as in JSON.
 */
export function mergePatchDiff(from: unknown, to: unknown): JsonObject | null {
  if (!isObject(from) || !isObject(to)) throw new Error('mergePatchDiff compares two objects');
  const patch: JsonObject = {};
  for (const [key, before] of Object.entries(from)) {
    if (before !== undefined && to[key] === undefined) patch[key] = null;
  }
  for (const [key, after] of Object.entries(to)) {
    if (after === undefined) continue;
    const before = from[key];
    if (before === undefined) {
      patch[key] = after;
    } else if (isObject(before) && isObject(after)) {
      const inner = mergePatchDiff(before, after);
      if (inner) patch[key] = inner;
    } else if (!sameJson(before, after)) {
      patch[key] = after;
    }
  }
  return Object.keys(patch).length > 0 ? patch : null;
}
