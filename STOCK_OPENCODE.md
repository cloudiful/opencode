# Stock OpenCode fork

This fork is based on upstream OpenCode `v2.0.20` and keeps the application source-compatible with that release. The adapter is limited to the web shell, its platform URL handling, the CLI app archive build, and the container publication files.

## Web base path

The web build reads `VITE_OPENCODE_BASE_PATH` at build time. It defaults to `/`; the container build sets it to `/ai/`. The resulting path is shared by Vite assets, icons, the web manifest, Solid Router, API and SSE client bases, the service worker, and PWA route persistence.

The Stock gateway must strip the external `/ai/` prefix before forwarding a request to the OpenCode runtime. Runtime API descriptors remain root-relative (`/api/...`); the browser client base makes them external `/ai/api/...` requests. Deep links and `/ai/sw.js` therefore use the same gateway mapping.

## Local checks

Use the upstream Bun version from `package.json` and the existing scripts:

```sh
bun install --frozen-lockfile
bun --cwd packages/app test:unit
bun --cwd packages/app typecheck
VITE_OPENCODE_BASE_PATH=/ai/ bun --cwd packages/app build
```

The default build remains rooted at `/` when the variable is unset.

## Image

`Dockerfile.stock-opencode` builds the embedded UI and CLI with the repository's `packages/cli/script/build.ts`, then produces `linux/amd64` and `linux/arm64` images. The build script selects a target by its `opencode-<os>-<arch>[-musl]` name, so the `--target` values in the Dockerfile keep that prefix. The image is published as:

```text
ghcr.io/<repository-owner>/opencode:<tag>
```

`.github/workflows/stock-opencode-image.yml` is the fork's publication workflow. Every push to `production` publishes `latest`; a tag matching `stock-opencode-v*` publishes the version after the prefix (for example, `stock-opencode-v2.0.20` publishes `2.0.20`). An explicit workflow dispatch remains available and defaults to image tag `2.0.20`. The amd64 and arm64 images build on native `ubuntu-24.04` and `ubuntu-24.04-arm` runners, then an amd64 job assembles the manifest; the workflow does not use QEMU emulation. Images carry `org.opencontainers.image.source`, `org.opencontainers.image.version`, and `org.opencontainers.image.revision` (`GITHUB_SHA` of the built commit). Run the local focused tests and `/ai/` build from the upgrade procedure before intentionally publishing.

## Upgrade procedure

1. Start from the desired upstream release tag and keep `OPENCODE_VERSION` and the package manifests aligned with that release.
2. Reapply the base-path adapter only within its focused source files and keep runtime API paths root-relative.
3. Run the focused platform tests, the web build with `/ai/`, and `git diff --check`.
4. Validate the multi-architecture Docker build before creating an adapter release tag.
