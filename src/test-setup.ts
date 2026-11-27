// Runs before every test file (angular.json → test → setupFiles).
//
// Node 25+ has its own localStorage/sessionStorage globals, which are undefined unless Node is started
// with --localstorage-file. They hide jsdom's storage, so put jsdom's back. Vitest's jsdom environment
// exposes its JSDOM instance as the `jsdom` global. On Node 24 and earlier this does nothing.
const dom = (globalThis as { jsdom?: { window: Window } }).jsdom;
if (dom) {
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    if (globalThis[name] === undefined) {
      Object.defineProperty(globalThis, name, { value: dom.window[name], configurable: true, writable: true });
    }
  }
}
