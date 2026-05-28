# Testing Strategy

Synt uses a three-layer test pyramid: **unit**, **integration**, and **end-to-end (E2E)**. Unit and integration tests run with [Jest](https://jestjs.io/); E2E tests run with [Playwright](https://playwright.dev/).

---

## Layer 1 – Unit tests (`tests/unit/`)

**Runner:** Jest (`npm test`)
**Transpiler:** `ts-jest` with TypeScript diagnostics disabled (fast iteration).

Unit tests cover individual module classes in isolation. Real source classes are imported directly; no browser environment is required because the modules under test are pure signal-processing logic with no DOM/Web Audio dependencies.

### Mocking

- **Tone.js** is mocked globally via `tests/__mocks__/tone.ts`. It exports `jest.fn()` factories so classes that `import … from 'tone'` receive lightweight fakes that expose `connect`, `disconnect`, and `dispose` spies — no real audio graph is created.
- Jest is configured with `clearMocks: true` and `restoreMocks: true`, so spy state never leaks between tests.
- Time-dependent tests (e.g. `Arpeggiator`) use `jest.useFakeTimers()` / `jest.advanceTimersByTime()` in `beforeEach` / `afterEach`.

---

## Layer 2 – Integration tests (`tests/integration/`)

**Runner:** Jest (same `npm test` invocation as unit tests)

Integration tests wire two or more real module instances together through the plug system, verifying that `plug()` / `snatch()` correctly wires and unwires the Tone.js audio graph. Assertions check node-level `connect()` and `disconnect()` calls on the right audio nodes, and module-specific tests also verify CV mapping behaviour (for example, knob-driven parameter updates).

### Helper fixtures

Each oscillator-integration file imports a `TestOscillator` (defined alongside the tests) that extends the real oscillator class and overrides `createOutputNode()` with a lightweight stub node exposing `connect`, `disconnect`, `dispose`, and a `frequency` value. This keeps tests fast while exercising the real `plug()` / `snatch()` topology.

---

## Layer 3 – E2E tests (`tests/e2e/`)

**Runner:** Playwright (`npm run test:e2e`)
**Server:** Vite production build served by `vite preview` on port 8080.

`npm run test:e2e` runs `npm run build` first, guaranteeing the `dist/` folder exists before Playwright starts.

### Test fixture

All E2E specs share a helper `gotoTestRack(page)` ([tests/e2e/helpers/fixtures.ts](tests/e2e/helpers/fixtures.ts)) that:

1. Navigates to `/`.
2. Waits for `networkidle`.
3. Calls `window.synt.importRack(yaml)` with the contents of `public/test.synt.yaml`, loading a deterministic rack layout for every test.

### Input helpers

- **`helpers/drag.ts`** – `dragDrop(page, from, to, { isMobile })`: uses `page.mouse` on desktop; dispatches raw `TouchEvent` sequences (with a `MouseEvent` fallback for WebKit's missing `Touch` constructor) on mobile.
- **`helpers/click.ts`** – `clickOrTap(locator, { position, isMobile })`: routes to Playwright's `click()` or `tap()` accordingly.

---

## Browser matrix

Playwright runs the E2E suite across a broad matrix of browsers and devices.

### Static projects (always available)

| Project | Engine |
|---|---|
| `firefox` | Desktop Firefox (with autoplay policy disabled for Web Audio) |
| `webkit` | Desktop Safari |
| `iPhone SE` | Mobile Safari |
| `iPhone 12` | Mobile Safari |
| `iPad (gen 7)` | Mobile Safari |

### Dynamic Chrome projects (require `npm run setup:chrome`)

`chrome-versions.json` lists ten historical Chrome versions paired with Android devices. `playwright.config.ts` reads a local binary manifest (`.chrome-bins/manifest.json`) and creates one Playwright project per downloaded binary. Versions not yet downloaded are silently skipped.

| Chrome version | Device |
|---|---|
| 55 | Moto G4 |
| 63 | Galaxy S8 |
| 70 | Nexus 6P |
| 79 | Pixel 4 |
| 86 | Galaxy Tab S4 |
| 96 | Pixel 5 |
| 107 | Galaxy S9+ |
| 116 | Galaxy Tab S9 |
| 124 | Galaxy A55 |
| latest | Pixel 7 |
