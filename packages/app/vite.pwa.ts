import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { VitePWA } from "vite-plugin-pwa"
import { joinBasePath, normalizeBasePath, stripBasePath } from "./src/runtime/platform/base-path"

export function serviceWorker(directory: string, basePath = "/") {
  const base = normalizeBasePath(basePath)
  const navigateFallback = joinBasePath(base, "/index.html")
  return VitePWA({
    strategies: "generateSW",
    registerType: "prompt",
    injectRegister: false,
    manifest: false,
    workbox: {
      // Workbox runs after Sentry's upload and cleanup, so do not publish an unuploaded map.
      sourcemap: false,
      globDirectory: directory,
      clientsClaim: false,
      // Keep each open tab on its complete build until all old clients close.
      skipWaiting: false,
      inlineWorkboxRuntime: true,
      navigateFallback,
      // Pairing links must reach the server so it can set the session cookie.
      navigateFallbackDenylist: [pathPattern(base, ["api", "auth"]), pathPattern(base, ["_assets", "assets"])],
      // Include lazy chunks and non-JS dependencies, not just the startup bundle.
      globPatterns: ["**/*"],
      globIgnores: ["**/*.map", "_headers", "_redirects"],
      maximumFileSizeToCacheInBytes: Number.MAX_SAFE_INTEGER,
      manifestTransforms: [
        async (entries) => ({
          manifest: await Promise.all(
            entries.map(async (entry) => {
              const file = stripBasePath(entry.url, base) ?? entry.url
              return {
                ...entry,
                ...(base === "/" ? {} : { url: joinBasePath(base, entry.url) }),
                // A revision labels a cache entry; integrity rejects mixed deployments
                // and HTML fallback responses instead of installing a broken build.
                integrity: `sha256-${createHash("sha256")
                  .update(await readFile(resolve(directory, file.replace(/^\/+/, ""))))
                  .digest("base64")}`,
              }
            }),
          ),
          warnings: [],
        }),
      ],
    },
  })
}

function pathPattern(basePath: string, names: string[]) {
  const prefix = basePath === "/" ? "/" : `${basePath}/`
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`^${escaped}(?:${names.join("|")})(?:/|$)`)
}
