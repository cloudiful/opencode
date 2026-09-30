import { useLocation } from "@solidjs/router"
import { createEffect } from "solid-js"
import { joinBasePath, stripBasePath } from "./base-path"
import { webBasePath } from "./base-path-runtime"

const LAST_ROUTE_KEY = "opencode.pwa.last-route"

export function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true)
  )
}

export function restorePwaRoute() {
  const current = stripBasePath(location.pathname, webBasePath)
  if (current !== "/" || location.search || location.hash) return
  try {
    const value = localStorage.getItem(LAST_ROUTE_KEY)
    if (!value) return
    const url = new URL(value, location.origin)
    if (url.origin !== location.origin || url.searchParams.has("auth_token")) return
    const route = stripBasePath(url.pathname, webBasePath) ?? url.pathname
    if (!isPwaRoute(route)) return
    history.replaceState(history.state, "", joinBasePath(webBasePath, route) + url.search + url.hash)
  } catch {
    // Storage may be unavailable; keep the launch URL in that case.
  }
}

export function PwaRoutePersistence() {
  const location = useLocation()
  createEffect(() => {
    const pathname = stripBasePath(location.pathname, webBasePath) ?? location.pathname
    const value = pathname + location.search + location.hash
    try {
      localStorage.setItem(LAST_ROUTE_KEY, value)
    } catch {
      // Navigation must still work when storage is unavailable or full.
    }
  })
  return null
}

function isPwaRoute(pathname: string) {
  return pathname === "/" || pathname === "/new-session" || /^\/server\/[^/]+\/session\/[^/]+$/.test(pathname)
}
