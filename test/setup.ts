// Suppress the "Listening on http://..." server-start announcement that Nitro
// prints via console.log when @nuxt/test-utils spins up the fixture server.
// All other console output is passed through unchanged.
const _origLog = console.log
console.log = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && /^Listening on\b/.test(args[0])) return
  _origLog.apply(console, args)
}
