import server from "./dist/server/server.js"

export default {
  async fetch(req) {
    const url = new URL(req.url)
    const path = url.pathname
    if (
      path.startsWith("/assets/") ||
      path === "/hero.png" ||
      path === "/favicon.ico" ||
      path === "/manifest.json"
    ) {
      const file = Bun.file(`./dist/client${path}`)
      if (await file.exists()) return new Response(file)
    }
    return server.fetch(req)
  }
}
