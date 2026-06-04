# Device support

This table summarises the results of the automated end-to-end test suite across all tested devices.
Device models listed here are emulated; real-device results will be added in a future revision.

**Legend**

| Symbol | Meaning |
|--------|---------|
| ✅ | Supported |
| ⚠️ | Partially supported |
| ❌ | Unsupported |
| — | Not applicable |

---

## Desktop browsers

| Device / Browser | App Bootstrap | Canvas Interactions | Plug Connections | Web Audio API | MIDI |
|-----------------|:-------------:|:-------------------:|:----------------:|:-------------:|:----:|
| Desktop Firefox | ✅ | ✅ | ✅ | ❌ | ❌ |
| Desktop Safari (WebKit) | ✅ | ✅ | ✅ | ✅ | ❌ |

¹ The `AudioContext reaches running state` test is intentionally skipped on Firefox headless — Firefox does not reliably grant user activation to the Web Audio API in CI.

---

## iOS (emulated)

| Device | Engine | App Bootstrap | Canvas Interactions | Plug Connections | Web Audio API | MIDI |
|--------|--------|:-------------:|:-------------------:|:----------------:|:-------------:|:----:|
| iPhone SE (emulated) | WebKit | ✅ | ✅ | ✅ | ✅ | ❌ |
| iPhone 12 (emulated) | WebKit | ✅ | ✅ | ✅ | ✅ | ❌ |
| iPad (gen 7) (emulated) | WebKit | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## Android Chrome (emulated)

| Device | Chrome version | App Bootstrap | Canvas Interactions | Plug Connections | Web Audio API | MIDI |
|--------|:--------------:|:-------------:|:-------------------:|:----------------:|:-------------:|:----:|
| Moto G4 (emulated) | 55 | ✅ | ✅ | ✅ | ✅ | ❌ |
| Galaxy S8 (emulated) | 63 | ✅ | ✅ | ✅ | ✅ | ❌ |
| Nexus 6P (emulated) | 70 | ✅ | ✅ | ✅ | ✅ | ❌ |
| Pixel 4 (emulated) | 79 | ✅ | ✅ | ✅ | ✅ | ❌ |
| Galaxy Tab S4 (emulated) | 86 | ✅ | ✅ | ✅ | ✅ | ❌ |
| Pixel 5 (emulated) | 96 | ✅ | ✅ | ✅ | ✅ | ❌ |
| Galaxy S9+ (emulated) | 107 | ✅ | ✅ | ✅ | ✅ | ❌ |
| Galaxy Tab S9 (emulated) | 116 | ✅ | ✅ | ✅ | ✅ | ❌ |
| Galaxy A55 (emulated) | 124 | ✅ | ✅ | ✅ | ✅ | ❌ |
| Pixel 7 (emulated) | latest | ✅ | ✅ | ✅ | ✅ | ❌ |

