// Suppress the "Listening on http://..." line that Nitro's node-server preset
// prints via console.log in the server.listen callback.  The plugin runs
// synchronously inside useNitroApp(), which completes before the async
// listen-callback fires, so the patched console.log is in place in time.
export default defineNitroPlugin(() => {
  const orig = console.log.bind(console)
  console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && /^Listening on\b/.test(args[0])) return
    orig(...args)
  }
})
