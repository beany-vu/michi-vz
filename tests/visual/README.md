# Visual regression (Playwright)

Screenshot diffs for chart curve rendering (Line / Area / Range, SVG + canvas).
These cover the one thing Jest cannot: the canvas renderer (jsdom returns a null
2D context, so the canvas draw routine is never exercised in unit tests).

## Run

- `npm run test:e2e` — assert the current render against committed baselines.
- `npm run test:e2e:update` — regenerate baselines (do this only on purpose).

The `webServer` in `playwright.config.ts` runs `npm run serve-storybook`, which
builds a **static** Storybook and serves it on port 6007. Static build (not
`storybook dev`) keeps screenshots deterministic.

## Browser

Uses Playwright's **bundled, version-pinned Chromium** (`browserName: "chromium"`,
no `channel`). Do not switch to the system `google-chrome` (`channel: "chrome"`):
it auto-updates and its anti-aliasing drift will flap the baselines.

## Host dependency

Ubuntu 24.04 needs `libasound2t64` for Chromium:
`sudo apt-get install -y libasound2t64`.

## Baselines are environment-specific

PNGs under `__screenshots__/` are generated on this WSL2 host (Ubuntu 24.04).
There is no CI today, so this host is the single source of truth. **When CI is
added, switch baseline generation into the official Playwright Docker image**
(Docker is already installed in WSL) so host and CI agree on fonts / AA:

```
docker run --rm -v "$PWD":/work -w /work \
  mcr.microsoft.com/playwright:v<installed-version> \
  npm run test:e2e:update
```

Until then, regenerate locally with `npm run test:e2e:update`.
