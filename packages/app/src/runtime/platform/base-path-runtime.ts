import { basePathWithTrailingSlash, joinBasePath, normalizeBasePath } from "./base-path"

export const webBasePath = normalizeBasePath(import.meta.env.BASE_URL)

export function webPath(path: string) {
  return joinBasePath(webBasePath, path)
}

export function webBaseUrl(origin: string) {
  if (webBasePath === "/") return origin
  return new URL(basePathWithTrailingSlash(webBasePath), origin).toString()
}
