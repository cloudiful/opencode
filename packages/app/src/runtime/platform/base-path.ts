export const DEFAULT_BASE_PATH = "/"

export function normalizeBasePath(value: string | null | undefined = DEFAULT_BASE_PATH) {
  const raw = value?.trim()
  if (!raw || raw === "." || raw === "./") return DEFAULT_BASE_PATH
  const path = raw.startsWith("/") ? raw : `/${raw}`
  return path.replace(/\/+$/, "") || DEFAULT_BASE_PATH
}

export function basePathWithTrailingSlash(value: string | null | undefined) {
  const path = normalizeBasePath(value)
  return path === DEFAULT_BASE_PATH ? DEFAULT_BASE_PATH : `${path}/`
}

export function joinBasePath(basePath: string | null | undefined, path: string) {
  const base = normalizeBasePath(basePath)
  const suffix = path.replace(/^\/+/, "")
  if (!suffix) return basePathWithTrailingSlash(base)
  return base === DEFAULT_BASE_PATH ? `/${suffix}` : `${base}/${suffix}`
}

export function stripBasePath(pathname: string, basePath: string | null | undefined) {
  const base = normalizeBasePath(basePath)
  if (base === DEFAULT_BASE_PATH) return pathname || DEFAULT_BASE_PATH
  if (pathname === base || pathname === `${base}/`) return DEFAULT_BASE_PATH
  if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length) || DEFAULT_BASE_PATH
  return undefined
}
