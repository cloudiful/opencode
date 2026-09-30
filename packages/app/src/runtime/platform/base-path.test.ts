import { expect, test } from "bun:test"
import { OpenCode } from "@opencode/client/promise"
import { basePathWithTrailingSlash, joinBasePath, normalizeBasePath, stripBasePath } from "./base-path"

test.each([
  [undefined, "/"],
  ["", "/"],
  ["/", "/"],
  ["/ai", "/ai"],
  ["/ai/", "/ai"],
  ["ai", "/ai"],
])("normalizes %s to %s", (input, expected) => {
  expect(normalizeBasePath(input)).toBe(expected)
})

test("joins and strips paths without changing the root deployment", () => {
  expect(basePathWithTrailingSlash("/")).toBe("/")
  expect(basePathWithTrailingSlash("/ai")).toBe("/ai/")
  expect(joinBasePath("/", "/_assets/app.js")).toBe("/_assets/app.js")
  expect(joinBasePath("/ai/", "/_assets/app.js")).toBe("/ai/_assets/app.js")
  expect(joinBasePath("/ai", "/")).toBe("/ai/")
  expect(stripBasePath("/", "/ai")).toBeUndefined()
  expect(stripBasePath("/ai", "/ai")).toBe("/")
  expect(stripBasePath("/ai/server/session", "/ai")).toBe("/server/session")
  expect(stripBasePath("/aib/server/session", "/ai")).toBeUndefined()
})

test("joins root-relative API and SSE paths to the adapted UI base", async () => {
  const paths: string[] = []
  const fetch = (async (input: RequestInfo | URL) => {
    paths.push(new URL(input instanceof Request ? input.url : input.toString()).pathname)
    if (paths.at(-1) === "/ai/api/event") {
      return new Response("data: {}\n\n", { headers: { "content-type": "text/event-stream" } })
    }
    return Response.json({})
  }) as typeof globalThis.fetch
  const client = OpenCode.make({ baseUrl: "https://example.test/ai/", fetch })

  await client.server.info()
  const events = client.event.subscribe()[Symbol.asyncIterator]()
  await events.next()
  await events.return?.()

  expect(paths).toEqual(["/ai/api/info", "/ai/api/event"])
})
